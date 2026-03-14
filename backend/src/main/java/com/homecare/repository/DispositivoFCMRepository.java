package com.homecare.repository;

import com.homecare.model.DispositivoFCM;
import com.homecare.model.DispositivoFCM.Plataforma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DispositivoFCMRepository extends JpaRepository<DispositivoFCM, Long> {

    List<DispositivoFCM> findByUsuarioIdAndActivoTrue(Long usuarioId);

    Optional<DispositivoFCM> findByTokenFcm(String tokenFcm);

    @Modifying
    @Query("UPDATE DispositivoFCM d SET d.activo = false WHERE d.tokenFcm = :token")
    void desactivarPorToken(@Param("token") String token);

    @Modifying
    @Query("UPDATE DispositivoFCM d SET d.ultimoUso = :fecha WHERE d.id = :id")
    void actualizarUltimoUso(@Param("id") Long id, @Param("fecha") LocalDateTime fecha);

    @Query("SELECT d FROM DispositivoFCM d WHERE d.activo = true AND d.ultimoUso < :fecha")
    List<DispositivoFCM> findDispositivosInactivos(@Param("fecha") LocalDateTime fecha);

    @Query("SELECT d FROM DispositivoFCM d JOIN d.usuario u JOIN u.roles r WHERE r.nombre = :rol AND d.activo = true")
    List<DispositivoFCM> findByRol(@Param("rol") String rol);

    List<DispositivoFCM> findByPlataformaAndActivoTrue(Plataforma plataforma);
}
