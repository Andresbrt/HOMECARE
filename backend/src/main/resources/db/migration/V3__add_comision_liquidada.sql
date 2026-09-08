-- V3: Agregar columna comision_liquidada a la tabla pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comision_liquidada BOOLEAN DEFAULT FALSE;

-- Marcar pagos ya aprobados existentes como liquidados
UPDATE pagos SET comision_liquidada = TRUE WHERE estado = 'APROBADO' AND metodo_pago != 'EFECTIVO';
