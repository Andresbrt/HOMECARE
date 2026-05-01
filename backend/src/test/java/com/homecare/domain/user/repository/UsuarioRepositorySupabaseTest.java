package com.homecare.domain.user.repository;

import com.homecare.domain.user.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests JPA para los métodos de {@link UsuarioRepository} relacionados con {@code supabase_uid}.
 *
 * Usa H2 en memoria (perfil "test") con {@code ddl-auto: create-drop}.
 * Solo se verifican los queries; no se cargan beans de servicio ni de seguridad.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UsuarioRepository — supabase_uid")
class UsuarioRepositorySupabaseTest {

    @Autowired
    private UsuarioRepository repository;

    // ─── findBySupabaseUid ────────────────────────────────────────────────────

    @Nested
    @DisplayName("findBySupabaseUid()")
    class FindBySupabaseUid {

        @Test
        @DisplayName("retorna el usuario cuando el uid existe")
        void existingUid_returnsUsuario() {
            String uid = "550e8400-e29b-41d4-a716-446655440000";
            repository.save(buildUsuario("cliente@homecare.com", uid));

            Optional<Usuario> result = repository.findBySupabaseUid(uid);

            assertThat(result).isPresent();
            assertThat(result.get().getSupabaseUid()).isEqualTo(uid);
            assertThat(result.get().getEmail()).isEqualTo("cliente@homecare.com");
        }

        @Test
        @DisplayName("retorna vacío cuando el uid no existe")
        void nonExistingUid_returnsEmpty() {
            Optional<Usuario> result = repository.findBySupabaseUid("uid-que-no-existe");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("con múltiples usuarios retorna el correcto por uid")
        void multipleUsers_returnsCorrectOne() {
            repository.save(buildUsuario("user1@homecare.com", "uid-uno-111"));
            repository.save(buildUsuario("user2@homecare.com", "uid-dos-222"));
            repository.save(buildUsuario("user3@homecare.com", "uid-tres-333"));

            Optional<Usuario> result = repository.findBySupabaseUid("uid-dos-222");

            assertThat(result).isPresent();
            assertThat(result.get().getEmail()).isEqualTo("user2@homecare.com");
        }
    }

    // ─── existsBySupabaseUid ──────────────────────────────────────────────────

    @Nested
    @DisplayName("existsBySupabaseUid()")
    class ExistsBySupabaseUid {

        @Test
        @DisplayName("retorna true cuando el uid está registrado")
        void existingUid_returnsTrue() {
            String uid = "660e8400-e29b-41d4-a716-446655440000";
            repository.save(buildUsuario("proveedor@homecare.com", uid));

            assertThat(repository.existsBySupabaseUid(uid)).isTrue();
        }

        @Test
        @DisplayName("retorna false cuando el uid no está registrado")
        void nonExistingUid_returnsFalse() {
            assertThat(repository.existsBySupabaseUid("uid-no-registrado")).isFalse();
        }

        @Test
        @DisplayName("retorna false después de guardar usuario con uid diferente")
        void differentUid_returnsFalse() {
            repository.save(buildUsuario("another@homecare.com", "uid-guardado-123"));

            assertThat(repository.existsBySupabaseUid("uid-diferente-456")).isFalse();
        }
    }

    // ─── Unicidad del supabase_uid ────────────────────────────────────────────

    @Nested
    @DisplayName("unicidad de supabase_uid")
    class UniqueConstraint {

        @Test
        @DisplayName("dos usuarios con diferente uid coexisten sin conflicto")
        void twoUsersWithDifferentUids_savedSuccessfully() {
            repository.save(buildUsuario("a@homecare.com", "uid-aaa-111"));
            repository.save(buildUsuario("b@homecare.com", "uid-bbb-222"));

            assertThat(repository.count()).isGreaterThanOrEqualTo(2);
            assertThat(repository.findBySupabaseUid("uid-aaa-111")).isPresent();
            assertThat(repository.findBySupabaseUid("uid-bbb-222")).isPresent();
        }

        @Test
        @DisplayName("usuario guardado sin supabaseUid (null) se guarda correctamente")
        void userWithoutSupabaseUid_savedWithNullUid() {
            Usuario saved = repository.save(buildUsuario("sin-uid@homecare.com", null));

            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getSupabaseUid()).isNull();
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Usuario buildUsuario(String email, String supabaseUid) {
        return Usuario.builder()
                .email(email)
                .password("hashed-password-for-test")
                .nombre("Test")
                .apellido("Usuario")
                .activo(true)
                .verificado(false)
                .supabaseUid(supabaseUid)
                .build();
    }
}
