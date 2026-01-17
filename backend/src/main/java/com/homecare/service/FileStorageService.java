package com.homecare.service;

import com.homecare.dto.FileUploadDTO;
import com.homecare.exception.FileStorageException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.Archivo;
import com.homecare.model.Archivo.EstadoArchivo;
import com.homecare.model.Archivo.TipoArchivo;
import com.homecare.model.Usuario;
import com.homecare.repository.ArchivoRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final ArchivoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${file.max-size:10485760}") // 10MB por defecto
    private Long maxFileSize;

    @Value("${file.allowed-types:image/jpeg,image/png,image/jpg,application/pdf}")
    private String allowedTypes;

    private static final Long MAX_STORAGE_PER_USER = 104857600L; // 100MB

    @Transactional
    public FileUploadDTO.Response uploadFile(MultipartFile file, TipoArchivo tipoArchivo,
                                             Long usuarioId, Long solicitudId, Long servicioId) {
        
        validateFile(file);
        validateStorageQuota(usuarioId, file.getSize());

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new FileStorageException("Usuario no encontrado"));

        if (tipoArchivo == TipoArchivo.FOTO_PERFIL) {
            archivoRepository.softDeleteByUsuarioAndTipo(usuarioId, TipoArchivo.FOTO_PERFIL);
        }

        String nombreAlmacenado = generateUniqueFileName(file.getOriginalFilename());
        String s3Key = buildS3Key(usuarioId, tipoArchivo, nombreAlmacenado);

        try {
            uploadToS3(file, s3Key);

            Archivo archivo = new Archivo();
            archivo.setNombreOriginal(file.getOriginalFilename());
            archivo.setNombreAlmacenado(nombreAlmacenado);
            archivo.setRutaS3(s3Key);
            archivo.setUrlPublica(buildPublicUrl(s3Key));
            archivo.setMimeType(file.getContentType());
            archivo.setTamanioBytes(file.getSize());
            archivo.setTipoArchivo(tipoArchivo);
            archivo.setUsuario(usuario);
            archivo.setSolicitudId(solicitudId);
            archivo.setServicioId(servicioId);
            archivo.setEstado(EstadoArchivo.ACTIVO);

            archivo = archivoRepository.save(archivo);

            log.info("Archivo subido exitosamente: {} por usuario {}", nombreAlmacenado, usuarioId);

            return mapToResponse(archivo);

        } catch (Exception e) {
            log.error("Error al subir archivo: {}", e.getMessage(), e);
            throw new FileStorageException("Error al subir el archivo: " + e.getMessage());
        }
    }

    @Transactional
    public FileUploadDTO.BatchResponse uploadMultiple(List<MultipartFile> files, TipoArchivo tipoArchivo,
                                                       Long usuarioId, Long solicitudId, Long servicioId) {
        
        List<FileUploadDTO.Response> exitosos = new ArrayList<>();
        List<String> errores = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                FileUploadDTO.Response response = uploadFile(file, tipoArchivo, usuarioId, solicitudId, servicioId);
                exitosos.add(response);
            } catch (Exception e) {
                errores.add(file.getOriginalFilename() + ": " + e.getMessage());
                log.error("Error al subir archivo {}: {}", file.getOriginalFilename(), e.getMessage());
            }
        }

        return new FileUploadDTO.BatchResponse(
                exitosos,
                exitosos.size(),
                errores.size(),
                errores
        );
    }

    @Transactional
    public void deleteFile(Long archivoId, Long usuarioId) {
        Archivo archivo = archivoRepository.findById(archivoId)
                .orElseThrow(() -> new FileStorageException("Archivo no encontrado"));

        if (!archivo.getUsuario().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permisos para eliminar este archivo");
        }

        try {
            deleteFromS3(archivo.getRutaS3());
            archivoRepository.softDelete(archivoId);
            log.info("Archivo eliminado: {} por usuario {}", archivo.getNombreAlmacenado(), usuarioId);
        } catch (Exception e) {
            log.error("Error al eliminar archivo: {}", e.getMessage(), e);
            throw new FileStorageException("Error al eliminar el archivo");
        }
    }

    public List<FileUploadDTO.Response> getFilesByUsuario(Long usuarioId) {
        return archivoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoArchivo.ACTIVO)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FileUploadDTO.Response> getFilesBySolicitud(Long solicitudId) {
        return archivoRepository.findBySolicitudIdAndEstado(solicitudId, EstadoArchivo.ACTIVO)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FileUploadDTO.Response> getFilesByServicio(Long servicioId) {
        return archivoRepository.findByServicioIdAndEstado(servicioId, EstadoArchivo.ACTIVO)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public String getPresignedUrl(Long archivoId, Long usuarioId) {
        Archivo archivo = archivoRepository.findById(archivoId)
                .orElseThrow(() -> new FileStorageException("Archivo no encontrado"));

        if (!archivo.getUsuario().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No tiene permisos para acceder a este archivo");
        }

        try {
            // Validar existencia del archivo
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(archivo.getRutaS3())
                    .build();
            
            s3Client.headObject(headRequest);

            return s3Client.utilities()
                    .getUrl(builder -> builder.bucket(bucketName).key(archivo.getRutaS3()))
                    .toString();
        } catch (Exception e) {
            log.error("Error al generar URL firmada: {}", e.getMessage(), e);
            throw new FileStorageException("Error al generar URL de descarga");
        }
    }

    @Scheduled(cron = "0 0 2 * * ?") // Ejecutar a las 2 AM diariamente
    @Transactional
    public void cleanupTemporaryFiles() {
        LocalDateTime expirationDate = LocalDateTime.now().minusHours(24);
        List<Archivo> archivosExpirados = archivoRepository.findArchivoTemporalesExpirados(expirationDate);

        for (Archivo archivo : archivosExpirados) {
            try {
                deleteFromS3(archivo.getRutaS3());
                archivoRepository.softDelete(archivo.getId());
                log.info("Archivo temporal eliminado: {}", archivo.getNombreAlmacenado());
            } catch (Exception e) {
                log.error("Error al eliminar archivo temporal {}: {}", archivo.getId(), e.getMessage());
            }
        }

        log.info("Limpieza de archivos temporales completada. Archivos eliminados: {}", archivosExpirados.size());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("El archivo está vacío");
        }

        if (file.getSize() > maxFileSize) {
            throw new FileStorageException(
                    String.format("El archivo excede el tamaño máximo permitido (%d MB)",
                            maxFileSize / 1048576)
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !Arrays.asList(allowedTypes.split(",")).contains(contentType)) {
            throw new FileStorageException(
                    "Tipo de archivo no permitido. Tipos permitidos: " + allowedTypes
            );
        }
    }

    private void validateStorageQuota(Long usuarioId, Long fileSize) {
        Long currentStorage = archivoRepository.getTotalStorageByUsuario(usuarioId);
        if (currentStorage == null) currentStorage = 0L;

        if (currentStorage + fileSize > MAX_STORAGE_PER_USER) {
            throw new FileStorageException(
                    String.format("Límite de almacenamiento excedido. Máximo: %d MB",
                            MAX_STORAGE_PER_USER / 1048576)
            );
        }
    }

    private String generateUniqueFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    private String buildS3Key(Long usuarioId, TipoArchivo tipoArchivo, String nombreAlmacenado) {
        return String.format("usuarios/%d/%s/%s",
                usuarioId,
                tipoArchivo.name().toLowerCase(),
                nombreAlmacenado
        );
    }

    private String buildPublicUrl(String s3Key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName, region, s3Key);
    }

    private void uploadToS3(MultipartFile file, String s3Key) throws IOException {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
    }

    private void deleteFromS3(String s3Key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    private FileUploadDTO.Response mapToResponse(Archivo archivo) {
        return new FileUploadDTO.Response(
                archivo.getId(),
                archivo.getNombreOriginal(),
                archivo.getNombreAlmacenado(),
                archivo.getUrlPublica(),
                archivo.getMimeType(),
                archivo.getTamanioBytes(),
                archivo.getTipoArchivo(),
                archivo.getCreatedAt()
        );
    }
}
