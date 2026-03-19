package com.homecare.domain.health.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para verificar el estado de la base de datos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseHealthService {

    private final DataSource dataSource;

    /**
     * Verifica la salud de la base de datos
     */
    public Map<String, Object> checkDatabaseHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test basic connectivity
            try (Connection connection = dataSource.getConnection()) {
                if (connection.isValid(5)) { // 5 seconds timeout
                    
                    // Test simple query
                    try (PreparedStatement stmt = connection.prepareStatement("SELECT 1");
                         ResultSet rs = stmt.executeQuery()) {
                        
                        if (rs.next() && rs.getInt(1) == 1) {
                            long responseTime = System.currentTimeMillis() - startTime;
                            
                            health.put("status", "UP");
                            health.put("responseTime", responseTime + "ms");
                            health.put("timestamp", LocalDateTime.now());
                            
                            // Additional database info
                            health.put("databaseProductName", connection.getMetaData().getDatabaseProductName());
                            health.put("databaseVersion", connection.getMetaData().getDatabaseProductVersion());
                            health.put("driverName", connection.getMetaData().getDriverName());
                            health.put("driverVersion", connection.getMetaData().getDriverVersion());
                            health.put("url", connection.getMetaData().getURL());
                            
                        } else {
                            health.put("status", "DOWN");
                            health.put("error", "Query test failed");
                        }
                    }
                } else {
                    health.put("status", "DOWN");
                    health.put("error", "Connection validation failed");
                }
            }
            
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage(), e);
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            health.put("timestamp", LocalDateTime.now());
        }
        
        return health;
    }

    /**
     * Verifica mÃ©tricas especÃ­ficas de la base de datos
     */
    public Map<String, Object> getDatabaseMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            
            // Contar tablas principales
            metrics.put("totalUsuarios", getTableCount(connection, "usuarios"));
            metrics.put("totalSolicitudes", getTableCount(connection, "solicitudes"));
            metrics.put("totalOfertas", getTableCount(connection, "ofertas"));
            metrics.put("totalServicios", getTableCount(connection, "servicios_aceptados"));
            metrics.put("totalPagos", getTableCount(connection, "pagos"));
            metrics.put("totalSuscripciones", getTableCount(connection, "suscripciones"));
            
            // EstadÃ­sticas de actividad reciente (Ãºltimo dÃ­a)
            metrics.put("solicitudesHoy", getCountToday(connection, "solicitudes", "fecha_creacion"));
            metrics.put("serviciosHoy", getCountToday(connection, "servicios_aceptados", "fecha_aceptacion"));
            metrics.put("pagosHoy", getCountToday(connection, "pagos", "created_at"));
            
            metrics.put("timestamp", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Error obteniendo mÃ©tricas de base de datos: {}", e.getMessage(), e);
            metrics.put("error", e.getMessage());
        }
        
        return metrics;
    }
    
    private int getTableCount(Connection connection, String tableName) {
        try (PreparedStatement stmt = connection.prepareStatement("SELECT COUNT(*) FROM " + tableName);
             ResultSet rs = stmt.executeQuery()) {
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            
        } catch (Exception e) {
            log.warn("Error contando registros en tabla {}: {}", tableName, e.getMessage());
        }
        
        return 0;
    }
    
    private int getCountToday(Connection connection, String tableName, String dateColumn) {
        String sql = "SELECT COUNT(*) FROM " + tableName + 
                    " WHERE DATE(" + dateColumn + ") = CURRENT_DATE";
        
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            
        } catch (Exception e) {
            log.warn("Error contando registros del dÃ­a en tabla {}: {}", tableName, e.getMessage());
        }
        
        return 0;
    }
}

