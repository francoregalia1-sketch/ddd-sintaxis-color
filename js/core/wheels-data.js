/* Círculos Cromáticos Oficiales: Ostwald 24 (CMY/RGB), 12 CMY, 12 Itten RYB y 10 Familias Munsell */
(function (DDD) {
  'use strict';

  // 24 tonos exactos de https://ddd.geapmdp.com.ar/ostwald24/ (Amarillo arriba a las 12:00 / 0°)
  const WHEEL_24 = [
    { idx: 0,  angle: 0,   name: 'Amarillo',                   cmy: [0, 0, 100],   rgbPct: [100, 100, 0] },
    { idx: 1,  angle: 15,  name: 'Amarillo–Amarillo verdoso',  cmy: [25, 0, 100],  rgbPct: [75, 100, 0] },
    { idx: 2,  angle: 30,  name: 'Amarillo verdoso',           cmy: [50, 0, 100],  rgbPct: [50, 100, 0] },
    { idx: 3,  angle: 45,  name: 'Amarillo verdoso–Verde',     cmy: [75, 0, 100],  rgbPct: [25, 100, 0] },
    { idx: 4,  angle: 60,  name: 'Verde',                      cmy: [100, 0, 100], rgbPct: [0, 100, 0] },
    { idx: 5,  angle: 75,  name: 'Verde–Verde azulado',        cmy: [100, 0, 75],  rgbPct: [0, 100, 25] },
    { idx: 6,  angle: 90,  name: 'Verde azulado',              cmy: [100, 0, 50],  rgbPct: [0, 100, 50] },
    { idx: 7,  angle: 105, name: 'Verde azulado–Cian',         cmy: [100, 0, 25],  rgbPct: [0, 100, 75] },
    { idx: 8,  angle: 120, name: 'Cian',                       cmy: [100, 0, 0],   rgbPct: [0, 100, 100] },
    { idx: 9,  angle: 135, name: 'Cian–Azul celeste',          cmy: [100, 25, 0],  rgbPct: [0, 75, 100] },
    { idx: 10, angle: 150, name: 'Azul celeste',               cmy: [100, 50, 0],  rgbPct: [0, 50, 100] },
    { idx: 11, angle: 165, name: 'Azul celeste–Azul',          cmy: [100, 75, 0],  rgbPct: [0, 25, 100] },
    { idx: 12, angle: 180, name: 'Azul',                       cmy: [100, 100, 0], rgbPct: [0, 0, 100] },
    { idx: 13, angle: 195, name: 'Azul–Violeta',               cmy: [75, 100, 0],  rgbPct: [25, 0, 100] },
    { idx: 14, angle: 210, name: 'Violeta',                    cmy: [50, 100, 0],  rgbPct: [50, 0, 100] },
    { idx: 15, angle: 225, name: 'Violeta–Magenta',            cmy: [25, 100, 0],  rgbPct: [75, 0, 100] },
    { idx: 16, angle: 240, name: 'Magenta',                    cmy: [0, 100, 0],   rgbPct: [100, 0, 100] },
    { idx: 17, angle: 255, name: 'Magenta–Rosa',               cmy: [0, 100, 25],  rgbPct: [100, 0, 75] },
    { idx: 18, angle: 270, name: 'Rosa',                       cmy: [0, 100, 50],  rgbPct: [100, 0, 50] },
    { idx: 19, angle: 285, name: 'Rosa–Rojo',                  cmy: [0, 100, 75],  rgbPct: [100, 0, 25] },
    { idx: 20, angle: 300, name: 'Rojo',                       cmy: [0, 100, 100], rgbPct: [100, 0, 0] },
    { idx: 21, angle: 315, name: 'Rojo–Naranja',               cmy: [0, 75, 100],  rgbPct: [100, 25, 0] },
    { idx: 22, angle: 330, name: 'Naranja',                    cmy: [0, 50, 100],  rgbPct: [100, 50, 0] },
    { idx: 23, angle: 345, name: 'Naranja–Amarillo',           cmy: [0, 25, 100],  rgbPct: [100, 75, 0] },
  ];

  // 12 tonos de la adaptación CMY de la cátedra (pasos pares de WHEEL_24)
  const WHEEL_12_CMY = WHEEL_24.filter((_, i) => i % 2 === 0).map((t, idx) => ({
    idx,
    idx24: t.idx,
    angle: idx * 30,
    name: t.name,
    cmy: t.cmy.slice(),
    rgbPct: t.rgbPct.slice(),
  }));

  // 12 tonos clásicos de Johannes Itten (modelo tradicional RYB: Amarillo a las 12:00)
  // Valores CMY aproximados de láminas de "El arte del color" + luminosidad Goethe-Itten
  const WHEEL_12_RYB = [
    { idx: 0,  angle: 0,   name: 'Amarillo',          role: 'Primario',   goethe: 9,   cmy: [0, 0, 100],   rgb: [255, 235, 0] },
    { idx: 1,  angle: 30,  name: 'Amarillo-Naranja',  role: 'Terciario',  goethe: 8.5, cmy: [0, 25, 100],  rgb: [255, 184, 0] },
    { idx: 2,  angle: 60,  name: 'Naranja',           role: 'Secundario', goethe: 8,   cmy: [0, 55, 100],  rgb: [255, 118, 0] },
    { idx: 3,  angle: 90,  name: 'Rojo-Naranja',      role: 'Terciario',  goethe: 7,   cmy: [0, 80, 100],  rgb: [242, 62, 0] },
    { idx: 4,  angle: 120, name: 'Rojo',              role: 'Primario',   goethe: 6,   cmy: [0, 100, 90],  rgb: [224, 15, 35] },
    { idx: 5,  angle: 150, name: 'Rojo-Violeta',      role: 'Terciario',  goethe: 4.5, cmy: [25, 100, 35], rgb: [168, 12, 108] },
    { idx: 6,  angle: 180, name: 'Violeta',           role: 'Secundario', goethe: 3,   cmy: [65, 100, 0],  rgb: [96, 30, 140] },
    { idx: 7,  angle: 210, name: 'Azul-Violeta',      role: 'Terciario',  goethe: 3.5, cmy: [85, 90, 0],   rgb: [52, 52, 158] },
    { idx: 8,  angle: 240, name: 'Azul',              role: 'Primario',   goethe: 4,   cmy: [100, 60, 0],  rgb: [0, 92, 184] },
    { idx: 9,  angle: 270, name: 'Azul-Verde',        role: 'Terciario',  goethe: 5,   cmy: [100, 15, 45], rgb: [0, 142, 138] },
    { idx: 10, angle: 300, name: 'Verde',             role: 'Secundario', goethe: 6,   cmy: [90, 0, 100],  rgb: [0, 154, 62] },
    { idx: 11, angle: 330, name: 'Amarillo-Verde',    role: 'Terciario',  goethe: 7.5, cmy: [45, 0, 100],  rgb: [148, 206, 0] },
  ];

  // 10 familias principales de Munsell (5R arriba, opuestos a +5 pasos: 5R↔5BG, 5YR↔5B, 5Y↔5PB, 5GY↔5P, 5G↔5RP)
  // Perfiles maxChroma por valor V=1..9 basados en sólidos reales del Munsell Book of Color (pasos de 2)
  const MUNSELL_10 = [
    { idx: 0, code: '5R',  name: 'Rojo',             labHue: 24,  maxC: { 1: 4, 2: 6, 3: 10, 4: 14, 5: 12, 6: 10, 7: 8, 8: 4, 9: 2 } },
    { idx: 1, code: '5YR', name: 'Amarillo Rojizo',  labHue: 55,  maxC: { 1: 2, 2: 4, 3: 6,  4: 8,  5: 10, 6: 12, 7: 12, 8: 6, 9: 4 } },
    { idx: 2, code: '5Y',  name: 'Amarillo',         labHue: 89,  maxC: { 1: 2, 2: 4, 3: 4,  4: 6,  5: 8,  6: 10, 7: 12, 8: 14, 9: 8 } },
    { idx: 3, code: '5GY', name: 'Verde Amarillento',labHue: 124, maxC: { 1: 2, 2: 4, 3: 6,  4: 8,  5: 10, 6: 10, 7: 12, 8: 8, 9: 4 } },
    { idx: 4, code: '5G',  name: 'Verde',            labHue: 156, maxC: { 1: 4, 2: 6, 3: 8,  4: 10, 5: 10, 6: 10, 7: 8,  8: 6, 9: 2 } },
    { idx: 5, code: '5BG', name: 'Azul Verdoso',     labHue: 187, maxC: { 1: 4, 2: 6, 3: 8,  4: 8,  5: 10, 6: 8,  7: 6,  8: 4, 9: 2 } },
    { idx: 6, code: '5B',  name: 'Azul',             labHue: 221, maxC: { 1: 4, 2: 6, 3: 8,  4: 8,  5: 8,  6: 8,  7: 6,  8: 4, 9: 2 } },
    { idx: 7, code: '5PB', name: 'Azul Púrpura',     labHue: 258, maxC: { 1: 6, 2: 10, 3: 12, 4: 10, 5: 10, 6: 8,  7: 6,  8: 4, 9: 2 } },
    { idx: 8, code: '5P',  name: 'Púrpura',          labHue: 298, maxC: { 1: 6, 2: 8,  3: 10, 4: 12, 5: 10, 6: 8,  7: 6,  8: 4, 9: 2 } },
    { idx: 9, code: '5RP', name: 'Rojo Púrpura',     labHue: 339, maxC: { 1: 4, 2: 8,  3: 10, 4: 12, 5: 12, 6: 10, 7: 8,  8: 4, 9: 2 } },
  ];

  DDD.Wheels = {
    WHEEL_24,
    WHEEL_12_CMY,
    WHEEL_12_RYB,
    MUNSELL_10,
  };
})((window.DDD = window.DDD || {}));
