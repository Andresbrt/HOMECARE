import { getPasswordStrength } from '../../src/utils/passwordUtils';

describe('passwordUtils — Validación de Fortaleza de Contraseñas', () => {
  it('debe calificar como "Muy débil" contraseñas cortas y simples', () => {
    const res = getPasswordStrength('123');
    expect(res.level).toBe(0);
    expect(res.label).toBe('Muy débil');
  });

  it('debe calificar como "Débil" contraseñas con solo 2 criterios cumplidos', () => {
    const res = getPasswordStrength('abcdefgh'); // >= 8 chars, pero solo minúsculas
    expect(res.level).toBe(0); // score: 1 (length>=8)

    const res2 = getPasswordStrength('Abcdefgh'); // length>=8 + Mayúscula
    expect(res2.level).toBe(1);
    expect(res2.label).toBe('Débil');
  });

  it('debe calificar como "Regular" contraseñas con 3 criterios cumplidos', () => {
    const res = getPasswordStrength('Abcdef12'); // length>=8 + Mayúscula + Número
    expect(res.level).toBe(2);
    expect(res.label).toBe('Regular');
  });

  it('debe calificar como "Fuerte" contraseñas con 4 criterios cumplidos', () => {
    const res = getPasswordStrength('Abcdef12!'); // length>=8 + Mayúscula + Número + Especial
    expect(res.level).toBe(3);
    expect(res.label).toBe('Fuerte');
  });

  it('debe calificar como "Muy fuerte" contraseñas largas y completas (>=12 chars)', () => {
    const res = getPasswordStrength('PasswordSeguro2026!'); // >=12 + Mayúscula + Número + Especial
    expect(res.level).toBe(4);
    expect(res.label).toBe('Muy fuerte');
  });
});
