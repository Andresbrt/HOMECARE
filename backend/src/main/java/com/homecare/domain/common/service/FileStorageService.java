package com.homecare.domain.common.service;

import com.homecare.dto.FileUploadDTO;
import com.homecare.common.exception.FileStorageException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.model.Archivo;
import com.homecare.model.Archivo.EstadoArchivo;
import com.homecare.model.Archivo.TipoArchivo;
import com.homecare.domain.user.model.Usuario;
import com.homecare.common.exception.NotFoundException;
import com.homecare.domain.common.repository.ArchivoRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
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
    private final SolicitudRepository solicitudRepository;
    private final ServicioAceptadoRepository servicioAceptadoRepository;
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

    public List<FileUploadDTO.Response> getFilesBySolicitud(Long solicitudId, Long usuarioId) {
        validarAccesoSolicitud(solicitudId, usuarioId);
        return archivoRepository.findBySolicitudIdAndEstado(solicitudId, EstadoArchivo.ACTIVO)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FileUploadDTO.Response> getFilesByServicio(Long servicioId, Long usuarioId) {
        validarAccesoServicio(servicioId, usuarioId);
        return archivoRepository.findByServicioIdAndEstado(servicioId, EstadoArchivo.ACTIVO)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void validarAccesoSolicitud(Long solicitudId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        boolean esAdmin = usuario.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getNombre()));
        if (esAdmin) return;

        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada con ID: " + solicitudId));

        boolean esCliente = solicitud.getCliente().getId().equals(usuarioId);
        boolean esProveedorConOferta = solicitud.getOfertas() != null && solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(usuarioId));

        if (!esCliente && !esProveedorConOferta) {
            throw new UnauthorizedException("No tiene permisos para consultar los archivos de esta solicitud");
        }
    }

    private void validarAccesoServicio(Long servicioId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        boolean esAdmin = usuario.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getNombre()));
        if (esAdmin) return;

        ServicioAceptado servicio = servicioAceptadoRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado con ID: " + servicioId));

        boolean esCliente = servicio.getCliente().getId().equals(usuarioId);
        boolean esProveedor = servicio.getProveedor().getId().equals(usuarioId);

        if (!esCliente && !esProveedor) {
            throw new UnauthorizedException("No tiene permisos para consultar los archivos de este servicio");
        }
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

    /**
     * Guarda un archivo en formato Base64 en S3.
     * @param base64Data El string base64 completo (con o sin prefijo data:)
     * @param folder Carpeta de destino (ej: "verificacion")
     * @param fileNamePrefix Prefijo para el nombre del archivo
     * @return La URL pública del archivo guardado
     */
    public String saveBase64(String base64Data, String folder, String fileNamePrefix) {
        if (base64Data == null || base64Data.isEmpty()) return null;

        try {
            // Limpiar prefijo data:image/xxx;base64, si existe
            String pureBase64 = base64Data;
            String extension = ".jpg";
            if (base64Data.contains(",")) {
                String header = base64Data.split(",")[0];
                if (header.contains("png")) extension = ".png";
                if (header.contains("pdf")) extension = ".pdf";
                pureBase64 = base64Data.split(",")[1];
            }

            byte[] decodedBytes = Base64.getDecoder().decode(pureBase64);
            String fileName = fileNamePrefix + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            String s3Key = folder + "/" + fileName;

            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(extension.equals(".pdf") ? "application/pdf" : "image/jpeg")
                    .build(),
                    RequestBody.fromBytes(decodedBytes));

            String url = buildPublicUrl(s3Key);
            log.info("Archivo base64 guardado exitosamente en S3: {}", s3Key);
            return url;
        } catch (Exception e) {
            log.error("Error al guardar archivo base64 en S3: {}", e.getMessage());
            return null; // En registro, preferimos continuar aunque falle una foto no crítica
        }
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

