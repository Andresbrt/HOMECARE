package com.homecare.domain.user.service;

import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioDesactivarCuentaTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    @DisplayName("Debe desactivar y anonimizar cuenta de usuario para cumplimiento Apple y privacidad")
    void debeDesactivarYAnonimizarCuenta() {
        Long usuarioId = 42L;
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        usuario.setNombre("Andres");
        usuario.setApellido("Bermudez");
        usuario.setTelefono("3001234567");
        usuario.setFotoPerfil("https://storage.com/foto.jpg");
        usuario.setDireccion("Calle 100 # 15-20");
        usuario.setActivo(true);
        usuario.setDisponible(true);

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));

        usuarioService.desactivarCuenta(usuarioId);

        assertFalse(usuario.getActivo(), "El usuario debe quedar inactivo");
        assertFalse(usuario.getDisponible(), "La disponibilidad debe quedar en false");
        assertEquals("Usuario", usuario.getNombre(), "Nombre debe quedar anonimizado");
        assertEquals("Inactivo", usuario.getApellido(), "Apellido debe quedar anonimizado");
        assertNull(usuario.getTelefono(), "Teléfono debe quedar nulo");
        assertNull(usuario.getFotoPerfil(), "Foto de perfil debe ser eliminada");
        assertNull(usuario.getDireccion(), "Dirección debe ser eliminada");

        verify(usuarioRepository, times(1)).save(usuario);
    }
}
