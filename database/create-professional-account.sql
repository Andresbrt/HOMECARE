-- Crea una cuenta de profesional de prueba en la base de datos.
-- Ejecútalo en tu DB Postgres local o en la consola H2 si usas el entorno de desarrollo.

INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado, disponible, created_at, updated_at)
VALUES (
  'profesional@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Profesional',
  'Test',
  '+573001234567',
  true,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u, roles r
WHERE u.email = 'profesional@test.com'
  AND r.nombre = 'ROLE_SERVICE_PROVIDER'
ON CONFLICT DO NOTHING;
