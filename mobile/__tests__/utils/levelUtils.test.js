import {
  computeLevel,
  nextLevelName,
  getQuarterStart,
  getQuarterEnd,
  getQuarterLabel,
  getQuarterNumber,
  VISIBILITY_BONUS,
  LEVEL_COLORS,
} from '../../src/utils/levelUtils';

describe('levelUtils — Sistema de Niveles Trimestral Homecare', () => {
  describe('computeLevel', () => {
    it('debe asignar nivel Básico para 0 servicios', () => {
      const level = computeLevel(0);
      expect(level.label).toBe('Básico');
      expect(level.color).toBe(LEVEL_COLORS['Básico']);
      expect(level.visibilityBonus).toBe(0);
      expect(level.next).toBe(16);
      expect(level.nextLabel).toBe('Pro');
      expect(level.remaining).toBe(16);
      expect(level.progress).toBe(0);
    });

    it('debe calcular correctamente el progreso en nivel Básico (15 servicios)', () => {
      const level = computeLevel(15);
      expect(level.label).toBe('Básico');
      expect(level.remaining).toBe(1);
      expect(level.progress).toBeCloseTo(15 / 16);
    });

    it('debe asignar nivel Pro a partir de 16 servicios con +5% visibilidad', () => {
      const level = computeLevel(16);
      expect(level.label).toBe('Pro');
      expect(level.color).toBe(LEVEL_COLORS['Pro']);
      expect(level.visibilityBonus).toBe(VISIBILITY_BONUS['Pro']);
      expect(level.next).toBe(36);
      expect(level.nextLabel).toBe('Elite');
      expect(level.remaining).toBe(20);
      expect(level.progress).toBe(0);
    });

    it('debe calcular correctamente el progreso en nivel Pro (26 servicios)', () => {
      const level = computeLevel(26);
      expect(level.label).toBe('Pro');
      expect(level.remaining).toBe(10);
      expect(level.progress).toBe(0.5); // (26 - 16) / 20 = 0.5
    });

    it('debe asignar nivel Elite a partir de 36 servicios con +10% visibilidad', () => {
      const level = computeLevel(36);
      expect(level.label).toBe('Elite');
      expect(level.color).toBe(LEVEL_COLORS['Elite']);
      expect(level.visibilityBonus).toBe(VISIBILITY_BONUS['Elite']);
      expect(level.next).toBeNull();
      expect(level.nextLabel).toBeNull();
      expect(level.remaining).toBe(0);
      expect(level.progress).toBe(0);
    });

    it('debe topar el progreso de Elite en 1.0 para 70 o más servicios', () => {
      const level70 = computeLevel(70);
      expect(level70.label).toBe('Elite');
      expect(level70.progress).toBe(1);

      const level100 = computeLevel(100);
      expect(level100.label).toBe('Elite');
      expect(level100.progress).toBe(1);
    });

    it('debe manejar valores nulos, negativos o indefinidos sin lanzar excepción', () => {
      expect(computeLevel(null).label).toBe('Básico');
      expect(computeLevel(undefined).label).toBe('Básico');
      expect(computeLevel(-5).label).toBe('Básico');
      expect(computeLevel('invalid').label).toBe('Básico');
    });
  });

  describe('nextLevelName', () => {
    it('debe retornar Pro para Básico', () => {
      expect(nextLevelName('Básico')).toBe('Pro');
    });

    it('debe retornar Elite para Pro', () => {
      expect(nextLevelName('Pro')).toBe('Elite');
    });

    it('debe retornar null para Elite o desconocido', () => {
      expect(nextLevelName('Elite')).toBeNull();
      expect(nextLevelName('Otro')).toBeNull();
    });
  });

  describe('Helpers de Trimestre', () => {
    it('debe calcular el inicio del trimestre correctamente', () => {
      const dateQ1 = new Date(2026, 1, 15); // Febrero (Mes 1 -> Q1)
      const startQ1 = getQuarterStart(dateQ1);
      expect(startQ1.getMonth()).toBe(0); // Enero
      expect(startQ1.getDate()).toBe(1);

      const dateQ3 = new Date(2026, 8, 20); // Septiembre (Mes 8 -> Q3)
      const startQ3 = getQuarterStart(dateQ3);
      expect(startQ3.getMonth()).toBe(6); // Julio
    });

    it('debe calcular el fin del trimestre correctamente', () => {
      const dateQ1 = new Date(2026, 0, 10);
      const endQ1 = getQuarterEnd(dateQ1);
      expect(endQ1.getMonth()).toBe(2); // Marzo
      expect(endQ1.getDate()).toBe(31);
    });

    it('debe retornar el número de trimestre correcto (1 a 4)', () => {
      expect(getQuarterNumber(new Date(2026, 0, 1))).toBe(1); // Ene
      expect(getQuarterNumber(new Date(2026, 4, 1))).toBe(2); // May
      expect(getQuarterNumber(new Date(2026, 7, 1))).toBe(3); // Ago
      expect(getQuarterNumber(new Date(2026, 11, 1))).toBe(4); // Dic
    });

    it('debe formatear el label legible del trimestre', () => {
      const label = getQuarterLabel(new Date(2026, 3, 1)); // Abril 2026
      expect(label).toBe('Abril - Junio 2026');
    });
  });
});
