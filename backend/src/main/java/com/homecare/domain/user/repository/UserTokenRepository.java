package com.homecare.domain.user.repository;

import com.homecare.domain.user.model.UserToken;
import com.homecare.domain.user.model.UserTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByTokenHashAndTokenType(String tokenHash, UserTokenType tokenType);
    Optional<UserToken> findByUsuarioIdAndTokenType(Long usuarioId, UserTokenType tokenType);
    void deleteByUsuarioIdAndTokenType(Long usuarioId, UserTokenType tokenType);
}
