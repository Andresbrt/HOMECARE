package com.homecare.domain.report.service;

import com.homecare.dto.ReportDTO;

import com.homecare.domain.payment.repository.PagoRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ServicioAceptadoRepository servicioRepository;
    private final PagoRepository pagoRepository;
    @SuppressWarnings("unused")
    private final UsuarioRepository usuarioRepository;

    public byte[] generarReporteServicios(LocalDate fechaInicio, LocalDate fechaFin,
                                          String formato) throws IOException {
        List<ReportDTO.ServicioReporte> servicios = 
                servicioRepository.findServiciosParaReporte(fechaInicio, fechaFin);

        if ("excel".equalsIgnoreCase(formato)) {
            return generarExcelServicios(servicios, fechaInicio, fechaFin);
        } else {
            return generarPdfServicios(servicios, fechaInicio, fechaFin);
        }
    }

    public byte[] generarReporteProveedores(LocalDate fechaInicio, LocalDate fechaFin,
                                           String formato) throws IOException {
        List<ReportDTO.ProveedorReporte> proveedores = 
                servicioRepository.findProveedoresParaReporte(fechaInicio, fechaFin);

        if ("excel".equalsIgnoreCase(formato)) {
            return generarExcelProveedores(proveedores, fechaInicio, fechaFin);
        } else {
            return generarPdfProveedores(proveedores, fechaInicio, fechaFin);
        }
    }

    public byte[] generarReportePagos(LocalDate fechaInicio, LocalDate fechaFin,
                                     String formato) throws IOException {
        List<ReportDTO.PagoReporte> pagos = 
                pagoRepository.findPagosParaReporte(fechaInicio, fechaFin);

        if ("excel".equalsIgnoreCase(formato)) {
            return generarExcelPagos(pagos, fechaInicio, fechaFin);
        } else {
            return generarPdfPagos(pagos, fechaInicio, fechaFin);
        }
    }

    private byte[] generarExcelServicios(List<ReportDTO.ServicioReporte> servicios,
                                        LocalDate inicio, LocalDate fin) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Servicios");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Fecha", "Cliente", "Proveedor", "Tipo", "Estado", "Precio"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            int rowNum = 1;
            for (ReportDTO.ServicioReporte servicio : servicios) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(servicio.getServicioId());
                row.createCell(1).setCellValue(servicio.getFechaServicio().format(DateTimeFormatter.ISO_DATE));
                row.createCell(2).setCellValue(servicio.getClienteNombre());
                row.createCell(3).setCellValue(servicio.getProveedorNombre());
                row.createCell(4).setCellValue(servicio.getTipoLimpieza());
                row.createCell(5).setCellValue(servicio.getEstado());
                row.createCell(6).setCellValue(servicio.getMonto());
                row.createCell(7).setCellValue(servicio.getCalificacion() != null ? servicio.getCalificacion() : 0);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            log.info("Reporte Excel de servicios generado: {} registros", servicios.size());
            return out.toByteArray();
        }
    }

    private byte[] generarPdfServicios(List<ReportDTO.ServicioReporte> servicios,
                                      LocalDate inicio, LocalDate fin) throws IOException {
        // Placeholder - ImplementaciÃ³n real requiere iText library
        return "PDF Report Placeholder".getBytes();
    }

    private byte[] generarExcelProveedores(List<ReportDTO.ProveedorReporte> proveedores,
                                          LocalDate inicio, LocalDate fin) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Proveedores");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Nombre", "Servicios", "Total Ganado", "CalificaciÃ³n"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowNum = 1;
            for (ReportDTO.ProveedorReporte proveedor : proveedores) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(proveedor.getProveedorId());
                row.createCell(1).setCellValue(proveedor.getNombre());
                row.createCell(2).setCellValue(proveedor.getServiciosCompletados());
                row.createCell(3).setCellValue(proveedor.getTotalGanancias());
                row.createCell(4).setCellValue(proveedor.getCalificacionPromedio().doubleValue());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generarPdfProveedores(List<ReportDTO.ProveedorReporte> proveedores,
                                        LocalDate inicio, LocalDate fin) throws IOException {
        return "PDF Report Placeholder".getBytes();
    }

    private byte[] generarExcelPagos(List<ReportDTO.PagoReporte> pagos,
                                    LocalDate inicio, LocalDate fin) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Pagos");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Fecha", "Referencia", "Monto", "ComisiÃ³n", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowNum = 1;
            for (ReportDTO.PagoReporte pago : pagos) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(pago.getPagoId());
                row.createCell(1).setCellValue(pago.getFechaPago().format(DateTimeFormatter.ISO_DATE_TIME));
                row.createCell(2).setCellValue(pago.getClienteNombre());
                row.createCell(3).setCellValue(pago.getProveedorNombre());
                row.createCell(4).setCellValue(pago.getMonto());
                row.createCell(5).setCellValue(pago.getEstado());
                row.createCell(6).setCellValue(pago.getMetodoPago());
                row.createCell(5).setCellValue(pago.getEstado());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generarPdfPagos(List<ReportDTO.PagoReporte> pagos,
                                  LocalDate inicio, LocalDate fin) throws IOException {
        return "PDF Report Placeholder".getBytes();
    }
}

