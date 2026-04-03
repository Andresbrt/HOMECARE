package com.homecare.domain.user.repository;

import com.homecare.domain.user.model.UserToken;
import com.homecare.domain.user.model.UserTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByTokenHashAndTokenType(String tokenHash, UserTokenType tokenType);
    Optional<UserToken> findByUsuarioIdAndTokenType(Long usuarioId, UserTokenType tokenType);
    void deleteByUsuarioIdAndTokenType(Long usuarioId, UserTokenType tokenType);

    @Query("SELECT COUNT(t) FROM UserToken t WHERE t.usuario.id = :usuarioId AND t.tokenType = :type AND t.createdAt >= :since")
    long countByUsuarioIdAndTokenTypeAndCreatedAtAfter(Long usuarioId, UserTokenType type, LocalDateTime since);

    List<UserToken> findAllByUsuarioIdAndTokenType(Long usuarioId, UserTokenType type);
}
