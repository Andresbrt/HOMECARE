package com.homecare.domain.marketing.service;

import com.homecare.dto.ReferralDTO;
import com.homecare.common.exception.BadRequestException;
import com.homecare.common.exception.NotFoundException;
import com.homecare.model.Referral;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.marketing.repository.ReferralRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferralService {

    private final ReferralRepository referralRepository;
    private final UsuarioRepository usuarioRepository;

    private static final BigDecimal BONUS_REFERRER = new BigDecimal("10.00");
    private static final BigDecimal BONUS_REFEREE = new BigDecimal("5.00");

    @Transactional
    public ReferralDTO.Response generarCodigo(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Referral referral = referralRepository.findByReferrerId(usuarioId)
                .orElseGet(() -> {
                    Referral newReferral = new Referral();
                    newReferral.setReferrer(usuario);
                    newReferral.setCodigo(generateUniqueCode());
                    newReferral.setUsado(false);
                    return newReferral;
                });

        referral = referralRepository.save(referral);
        log.info("CÃ³digo de referido generado para usuario {}: {}", usuarioId, referral.getCodigo());

        return new ReferralDTO.Response(
                referral.getCodigo(),
                referral.getReferrer().getNombre(),
                BONUS_REFERRER,
                BONUS_REFEREE
        );
    }

    @Transactional
    public void aplicarCodigo(Long usuarioId, String codigo) {
        Usuario referee = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Referral referral = referralRepository.findByCodigo(codigo)
                .orElseThrow(() -> new NotFoundException("CÃ³digo de referido no encontrado"));

        if (referral.getReferrer().getId().equals(usuarioId)) {
            throw new BadRequestException("No puedes usar tu propio cÃ³digo de referido");
        }

        if (referral.getUsado()) {
            throw new BadRequestException("Este cÃ³digo ya fue usado");
        }

        referral.setReferee(referee);
        referral.setUsado(true);
        referral.setBonusReferrer(BONUS_REFERRER);
        referral.setBonusReferee(BONUS_REFEREE);

        referralRepository.save(referral);

        log.info("CÃ³digo de referido {} aplicado por usuario {}", codigo, usuarioId);
        // AquÃ­ se aplicarÃ­an los bonos a las cuentas de ambos usuarios
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = "REF" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (referralRepository.existsByCodigo(code));
        return code;
    }
}

