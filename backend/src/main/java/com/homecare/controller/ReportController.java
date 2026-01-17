package com.homecare.controller;

import com.homecare.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Generación de reportes exportables")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/servicios/export")
    @Operation(summary = "Exportar reporte de servicios (Excel o PDF)")
    public ResponseEntity<byte[]> exportarServicios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "excel") String formato) throws IOException {

        byte[] content = reportService.generarReporteServicios(fechaInicio, fechaFin, formato);

        String filename = "servicios_" + fechaInicio + "_" + fechaFin + 
                         (formato.equalsIgnoreCase("excel") ? ".xlsx" : ".pdf");

        MediaType mediaType = formato.equalsIgnoreCase("excel") ?
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") :
                MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content);
    }

    @GetMapping("/proveedores/export")
    @Operation(summary = "Exportar reporte de proveedores (Excel o PDF)")
    public ResponseEntity<byte[]> exportarProveedores(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "excel") String formato) throws IOException {

        byte[] content = reportService.generarReporteProveedores(fechaInicio, fechaFin, formato);

        String filename = "proveedores_" + fechaInicio + "_" + fechaFin + 
                         (formato.equalsIgnoreCase("excel") ? ".xlsx" : ".pdf");

        MediaType mediaType = formato.equalsIgnoreCase("excel") ?
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") :
                MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content);
    }

    @GetMapping("/pagos/export")
    @Operation(summary = "Exportar reporte de pagos (Excel o PDF)")
    public ResponseEntity<byte[]> exportarPagos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "excel") String formato) throws IOException {

        byte[] content = reportService.generarReportePagos(fechaInicio, fechaFin, formato);

        String filename = "pagos_" + fechaInicio + "_" + fechaFin + 
                         (formato.equalsIgnoreCase("excel") ? ".xlsx" : ".pdf");

        MediaType mediaType = formato.equalsIgnoreCase("excel") ?
                MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") :
                MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content);
    }
}
