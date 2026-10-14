import { convertUnit, getDensity } from './conversions';

describe('Unit Conversions', () => {
  test('Basic mass conversions', () => {
    expect(convertUnit(1000, 'g', 'kg')).toBeCloseTo(1);
    expect(convertUnit(1, 'kg', 'g')).toBeCloseTo(1000);
    expect(convertUnit(100, 'g', 'dkg')).toBeCloseTo(10);
  });

  test('Basic volume conversions', () => {
    expect(convertUnit(1000, 'ml', 'l')).toBeCloseTo(1);
    expect(convertUnit(1, 'l', 'ml')).toBeCloseTo(1000);
    expect(convertUnit(5, 'tsp', 'ml')).toBeCloseTo(25);
    expect(convertUnit(1, 'cup', 'ml')).toBeCloseTo(240);
  });

  test('Mass to volume with density', () => {
    // Liszt: 100g = ~188.68 ml (100/0.53)
    expect(convertUnit(100, 'g', 'ml', getDensity('FLOUR'))).toBeCloseTo(188.68);
    // Cukor: 1kg = ~1176.47 ml (1000/0.85)
    expect(convertUnit(1, 'kg', 'ml', getDensity('SUGAR'))).toBeCloseTo(1176.47);
  });

  test('Volume to mass with density', () => {
    // Tej: 1 dl = ~103 g (100 * 1.03)
    expect(convertUnit(1, 'dl', 'g', getDensity('MILK'))).toBeCloseTo(103);
    // Vaj: 1 evőkanál = ~13.65 g (15 * 0.91)
    expect(convertUnit(1, 'tbsp', 'g', getDensity('BUTTER'))).toBeCloseTo(13.65);
  });

  test('Throws error for invalid conversions', () => {
    expect(() => convertUnit(1, 'db', 'g')).toThrow();
    expect(() => convertUnit(1, 'g', 'db')).toThrow();
    expect(() => convertUnit(1, 'g', 'ml')).toThrow(); // Missing density
  });
});
