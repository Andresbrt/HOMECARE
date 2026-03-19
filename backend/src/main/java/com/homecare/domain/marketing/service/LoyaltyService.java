package com.homecare.domain.marketing.service;

import com.homecare.dto.LoyaltyDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final UsuarioRepository usuarioRepository;

    @Transactional
    public LoyaltyDTO.Response earnPoints(Long usuarioId, Integer points, String motivo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Integer currentPoints = usuario.getLoyaltyPoints() != null ? usuario.getLoyaltyPoints() : 0;
        usuario.setLoyaltyPoints(currentPoints + points);

        usuarioRepository.save(usuario);
        log.info("Usuario {} ganÃ³ {} puntos de lealtad. Motivo: {}", usuarioId, points, motivo);

        return new LoyaltyDTO.Response(
                usuario.getId(),
                usuario.getLoyaltyPoints(),
                getTierLevel(usuario.getLoyaltyPoints())
        );
    }

    @Transactional
    public LoyaltyDTO.Response redeemPoints(Long usuarioId, Integer points) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Integer currentPoints = usuario.getLoyaltyPoints() != null ? usuario.getLoyaltyPoints() : 0;
        
        if (currentPoints < points) {
            throw new IllegalArgumentException("Puntos insuficientes");
        }

        usuario.setLoyaltyPoints(currentPoints - points);
        usuarioRepository.save(usuario);

        log.info("Usuario {} canjeÃ³ {} puntos de lealtad", usuarioId, points);

        return new LoyaltyDTO.Response(
                usuario.getId(),
                usuario.getLoyaltyPoints(),
                getTierLevel(usuario.getLoyaltyPoints())
        );
    }

    public LoyaltyDTO.Response getPoints(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        return new LoyaltyDTO.Response(
                usuario.getId(),
                usuario.getLoyaltyPoints() != null ? usuario.getLoyaltyPoints() : 0,
                getTierLevel(usuario.getLoyaltyPoints())
        );
    }

    private String getTierLevel(Integer points) {
        if (points == null) return "BRONZE";
        if (points >= 1000) return "GOLD";
        if (points >= 500) return "SILVER";
        return "BRONZE";
    }
}

