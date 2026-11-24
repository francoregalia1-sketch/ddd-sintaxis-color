/* Datos, Recorte 9x9 y Generador de las 9 Armonías de Munsell (Adaptación CMY + Munsell Original) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;
  const W = DDD.Wheels;

  // Construye la hoja Munsell CMY 9x9 (V=9 arriba .. V=1 abajo, S=0..8) y marca el recorte por luminosidad L*
  // Fórmula verificada de COLOR SISTEMAS 6.pdf (P.43-52) y MUNSELL CON CODIGO COLOR 9x9.pdf:
  //   g = (9 - V) * 12.5% (0% en V=9 .. 100% en V=1); t = S / 8
  //   CMY(V, S) = g*(1 - t) + CMY_puro * t
  function buildCMYSheet(hueIdx12, colorModel) {
    const tone = W.WHEEL_12_CMY[((hueIdx12 % 12) + 12) % 12];
    const [c0, m0, y0] = tone.cmy;
    const rows = [];

    for (let v = 9; v >= 1; v--) {
      const g = (9 - v) * 12.5;
      const graySample = makeCellSample(g, g, g, colorModel, tone.name, v, 0);
      const refL = graySample.lstar;
      const cells = [];

      let contiguousValid = true;
      for (let s = 0; s <= 8; s++) {
        const t = s / 8;
        const c = g * (1 - t) + c0 * t;
        const m = g * (1 - t) + m0 * t;
        const y = g * (1 - t) + y0 * t;
        const sample = makeCellSample(c, m, y, colorModel, tone.name, v, s);

        // Recorte por constancia de luminosidad perceptual respecto al gris N_v de la fila
        const diff = Math.abs(sample.lstar - refL);
        const withinL = s === 0 || diff <= 14.5;
        if (!withinL) contiguousValid = false;

        cells.push({
          v,
          s,
          chromaLabel: s * 2,
          inCut: s === 0 || contiguousValid,
          lstarDiff: Math.round(diff * 10) / 10,
          sample,
        });
      }
      rows.push({ v, grayL: refL, cells });
    }

    return {
      mode: 'cmy',
      hueIdx: tone.idx,
      hueName: tone.name,
      hueCode: tone.name,
      oppIdx: (tone.idx + 6) % 12,
      oppName: W.WHEEL_12_CMY[(tone.idx + 6) % 12].name,
      rows,
    };
  }

  function makeCellSample(c, m, y, colorModel, toneName, v, s) {
    if (colorModel === 'rgb') {
      const rgbPct = CE.cmyToRgbPctExact(c, m, y);
      const [r, g, b] = CE.rgbPctToRgb255(rgbPct[0], rgbPct[1], rgbPct[2]);
      return CE.makeSampleFromRgb255(r, g, b, {
        name: s === 0 ? `N${v}` : toneName,
        code: s === 0 ? `N${v}` : `${toneName} ${v}/${s * 2}`,
      });
    }
    return CE.makeSampleFromCMY(c, m, y, {
      name: s === 0 ? `N${v}` : toneName,
      code: s === 0 ? `N${v}` : `${toneName} ${v}/${s * 2}`,
    });
  }

  // Construye hoja perceptual Munsell Original (V=9..1, C=0,2,4..maxC) usando CIE LCh -> sRGB
  function buildOriginalSheet(hueIdx10) {
    const hue = W.MUNSELL_10[((hueIdx10 % 10) + 10) % 10];
    const maxCols = 8; // C = 0, 2, 4, 6, 8, 10, 12, 14
    const rows = [];

    for (let v = 9; v >= 1; v--) {
      const L = v * 10.2; // Munsell Value V=1..9 -> L* ≈ 10..92
      const maxC = hue.maxC[v] || 2;
      const cells = [];
      for (let s = 0; s < maxCols; s++) {
        const chroma = s * 2;
        if (chroma > maxC) {
          cells.push({ v, s, chromaLabel: chroma, inCut: false, isEmpty: true, sample: null });
          continue;
        }
        // Factor de escala aproximado: Munsell Chroma * 5.2 ≈ CIE C*
        const { rgb } = CE.lchToRgb(L, chroma * 5.2, hue.labHue);
        const sample = CE.makeSampleFromRgb255(rgb[0], rgb[1], rgb[2], {
          name: chroma === 0 ? `N${v}` : `${hue.code} ${hue.name}`,
          code: chroma === 0 ? `N${v}` : `${hue.code} ${v}/${chroma}`,
          munsell: { hueCode: hue.code, v, c: chroma },
        });
        cells.push({
          v,
          s,
          chromaLabel: chroma,
          inCut: true,
          isEmpty: false,
          sample,
        });
      }
      rows.push({ v, grayL: L, cells });
    }

    return {
      mode: 'original',
      hueIdx: hue.idx,
      hueName: `${hue.code} (${hue.name})`,
      hueCode: hue.code,
      oppIdx: (hue.idx + 5) % 10,
      oppName: `${W.MUNSELL_10[(hue.idx + 5) % 10].code} (${W.MUNSELL_10[(hue.idx + 5) % 10].name})`,
      rows,
    };
  }

  // Busca la celda válida más cercana al (v, s) pedido dentro de una hoja
  function pickCell(sheet, vTarget, sTarget) {
    const vClamped = CE.clamp(Math.round(vTarget), 1, 9);
    const row = sheet.rows.find((r) => r.v === vClamped) || sheet.rows[4];
    const valid = row.cells.filter((c) => c.inCut && !c.isEmpty && c.sample);
    if (!valid.length) return row.cells[0];
    let best = valid[0];
    let bestDist = Infinity;
    for (let i = 0; i < valid.length; i++) {
      const d = Math.abs(valid[i].s - sTarget);
      if (d < bestDist) {
        bestDist = d;
        best = valid[i];
      }
    }
    return best;
  }

  function cloneWithArea(cell, areaPct, isAnchor) {
    const s = cell.sample;
    return Object.assign({}, s, {
      area: areaPct !== null && areaPct !== undefined ? Math.round(areaPct * 10) / 10 : null,
      isAnchor: Boolean(isAnchor),
      _coord: { v: cell.v, s: cell.s, c: cell.chromaLabel },
    });
  }

  // Calcula áreas inversamente proporcionales al croma (o a V*C si se solicita), sumando 100%
  function computeInverseAreas(items, useVC) {
    const weights = items.map((it) => {
      const c = Math.max(1, it.c || it.s * 2 || 2);
      const v = Math.max(1, it.v || 5);
      return useVC ? 1 / (v * c) : 1 / c;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => Math.round((w / sum) * 1000) / 10);
  }

  // Catálogo oficial de las 9 Armonías de Munsell (con subvariantes 7a-7c y 9a-9c)
  const HARMONIES = [
    {
      id: '1',
      num: 1,
      title: 'Grises igualmente espaciados centrados en N5',
      janello: '= Tinte (acromático) · ≠ Valor · = Desaturación',
      principle: 'Escala acromática simétrica a ambos lados del gris medio N5.',
      variants: [
        { id: '1-3', label: '3 grises (N2 – N5 – N8)' },
        { id: '1-5', label: '5 grises (N1 – N3 – N5 – N7 – N9)' },
      ],
    },
    {
      id: '2',
      num: 2,
      title: 'Monocromáticos igualmente espaciados centrados en valor y croma medio',
      janello: '= Tinte · ≠ Valor / ≠ Desaturación',
      principle: 'Desde un color central en valor 5 y croma medio, se eligen muestras equidistantes en línea horizontal, vertical o diagonal.',
      variants: [
        { id: '2-h', label: 'Horizontal (= V, ≠ C)' },
        { id: '2-v', label: 'Vertical (≠ V, = C)' },
        { id: '2-d1', label: 'Diagonal ascendente (↑V ↑C)' },
        { id: '2-d2', label: 'Diagonal descendente (↑V ↓C)' },
      ],
    },
    {
      id: '3',
      num: 3,
      title: 'Opuestos de igual croma nivelados en N5',
      janello: '≠ Tinte (complementarios) · = Valor (5) · = Desaturación',
      principle: 'Complementarios de igual croma situados en el nivel medio V = 5; se equilibran en áreas iguales (50% / 50%).',
      variants: [{ id: '3-a', label: 'Equilibrio horizontal en N5 (50% / 50%)' }],
    },
    {
      id: '4',
      num: 4,
      title: 'Opuestos de igual valor y distinto croma (áreas inversas al croma)',
      janello: '≠ Tinte (complementarios) · = Valor · ≠ Desaturación',
      principle: 'Complementarios al mismo nivel de claridad pero con distinta intensidad; el color más cromático ocupa menos superficie.',
      hasAreaLaw: true,
      variants: [{ id: '4-a', label: 'Igual valor V5/V6 · Compensado por áreas' }],
    },
    {
      id: '5',
      num: 5,
      title: 'Opuestos de igual croma y distinto valor centrados en N5',
      janello: '≠ Tinte (complementarios) · ≠ Valor · = Desaturación',
      principle: 'Un complementario claro y otro oscuro equidistantes de N5 (V₁ + V₂ = 10), manteniendo croma equivalente.',
      variants: [
        { id: '5-2', label: 'Salto medio (V7 y V3)' },
        { id: '5-3', label: 'Salto alto (V8 y V2)' },
      ],
    },
    {
      id: '6',
      num: 6,
      title: 'Opuestos de distinto valor y distinto croma (áreas inversas al croma)',
      janello: '≠ Tinte (complementarios) · ≠ Valor · ≠ Desaturación',
      principle: 'Complementarios que difieren en valor y croma (uno claro e intenso, otro oscuro y apagado), compensados con áreas inversas al croma.',
      hasAreaLaw: true,
      variants: [{ id: '6-a', label: 'Cálido/claro intenso vs. Opuesto oscuro apagado' }],
    },
    {
      id: '7',
      num: 7,
      title: 'Tintes vecinos y complementarios divididos',
      janello: '≠ Tinte (vecinos / div.) · ≠ Valor · =/≠ Desaturación',
      principle: 'Combinación de tres tintes cercanos o de un tinte con los dos vecinos de su complementario.',
      variants: [
        { id: '7a', label: '7a · Tintes vecinos de igual croma' },
        { id: '7b', label: '7b · Tintes vecinos de distinto croma (áreas)' },
        { id: '7c', label: '7c · Complementarios divididos (en Y)' },
      ],
    },
    {
      id: '8',
      num: 8,
      title: 'Secuencias en disminución',
      janello: '≠ Tinte (secuencia) · ≠ Valor (secuencia) · ≠ Desaturación (secuencia)',
      principle: 'Progresión helicoidal donde el tono avanza regularmente mientras valor y croma disminuyen paso a paso.',
      hasPathMap: true,
      variants: [{ id: '8-a', label: 'Espiral descendente de 6 pasos' }],
    },
    {
      id: '9',
      num: 9,
      title: 'Camino elíptico',
      janello: '≠ Tinte (sucesión) · =/≠ Valor · ≠ Desaturación (sucesión)',
      principle: 'Circuito elíptico cerrado que une dos complementarios a través de una secuencia de tintes intermedios por ambos lados.',
      hasPathMap: true,
      variants: [
        { id: '9a', label: '9a · Opuestos =V =C, intermedios =V' },
        { id: '9b', label: '9b · Opuestos ≠V =C, intermedios ≠V ≠C' },
        { id: '9c', label: '9c · Opuestos =V =C, intermedios ≠V ≠C' },
      ],
    },
  ];

  // Genera las muestras para una armonía/variante dada
  function generateHarmony(params) {
    const { mode, colorModel, hueIdx, selectedV, selectedS, variantId, useVC } = params;
    const totalHues = mode === 'cmy' ? 12 : 10;
    const getSheet = (h) => (mode === 'cmy' ? buildCMYSheet(h, colorModel) : buildOriginalSheet(h));

    const mainSheet = getSheet(hueIdx);
    const oppStep = mode === 'cmy' ? 6 : 5;
    const oppSheet = getSheet((hueIdx + oppStep) % totalHues);
    const sMid = Math.max(1, Math.min(selectedS || 2, 3));

    let samples = [];
    let pathPoints = [];
    let usesAreas = false;
    let subtitle = '';

    if (variantId === '1-3' || variantId === '1-5') {
      const vs = variantId === '1-3' ? [8, 5, 2] : [9, 7, 5, 3, 1];
      samples = vs.map((v) => cloneWithArea(pickCell(mainSheet, v, 0), null, v === 5));
      subtitle = vs.map((v) => `N${v}`).join(' – ');
    } else if (variantId.startsWith('2-')) {
      const pivotS = Math.max(1, Math.min(sMid, 2));
      const cMid = pickCell(mainSheet, 5, pivotS);
      let coords;
      if (variantId === '2-h') coords = [[5, 0], [5, pivotS], [5, pivotS * 2]];
      else if (variantId === '2-v') coords = [[7, pivotS], [5, pivotS], [3, pivotS]];
      else if (variantId === '2-d1') coords = [[7, pivotS + 1], [5, pivotS], [3, Math.max(0, pivotS - 1)]];
      else coords = [[6, Math.max(0, pivotS - 1)], [5, pivotS], [4, pivotS + 1]];
      samples = coords.map(([v, s], idx) => cloneWithArea(pickCell(mainSheet, v, s), null, idx === 1));
      subtitle = `${cMid.sample.code} como pivote central`;
    } else if (variantId === '3-a') {
      const c1 = pickCell(mainSheet, 5, sMid);
      const c2 = pickCell(oppSheet, 5, Math.min(sMid, c1.s));
      const minS = Math.min(c1.s, c2.s);
      const p1 = pickCell(mainSheet, 5, minS);
      const p2 = pickCell(oppSheet, 5, minS);
      samples = [cloneWithArea(p1, 50, true), cloneWithArea(p2, 50, false)];
      subtitle = `${p1.sample.code} (50%) ↔ ${p2.sample.code} (50%)`;
    } else if (variantId === '4-a') {
      usesAreas = true;
      const vCommon = selectedV >= 4 && selectedV <= 7 ? selectedV : 5;
      const c1 = pickCell(mainSheet, vCommon, 2);
      const c2 = pickCell(oppSheet, vCommon, 5);
      const areas = computeInverseAreas([{ v: c1.v, s: c1.s }, { v: c2.v, s: c2.s }], useVC);
      samples = [cloneWithArea(c1, areas[0], true), cloneWithArea(c2, areas[1], false)];
      subtitle = `Mismo valor V${vCommon}, áreas inversas al croma`;
    } else if (variantId === '5-2' || variantId === '5-3') {
      const delta = variantId === '5-2' ? 2 : 3;
      const c1 = pickCell(mainSheet, 5 + delta, sMid);
      const c2 = pickCell(oppSheet, 5 - delta, sMid);
      const commonS = Math.min(c1.s, c2.s);
      const p1 = pickCell(mainSheet, 5 + delta, commonS);
      const p2 = pickCell(oppSheet, 5 - delta, commonS);
      samples = [cloneWithArea(p1, 50, true), cloneWithArea(p2, 50, false)];
      subtitle = `Equidistantes de N5: V${p1.v} y V${p2.v}`;
    } else if (variantId === '6-a') {
      usesAreas = true;
      const c1 = pickCell(mainSheet, 7, 5);
      const c2 = pickCell(oppSheet, 3, 2);
      const areas = computeInverseAreas([{ v: c1.v, s: c1.s }, { v: c2.v, s: c2.s }], useVC);
      samples = [cloneWithArea(c1, areas[0], true), cloneWithArea(c2, areas[1], false)];
      subtitle = `Contraste pleno compensado por superficie`;
    } else if (variantId === '7a') {
      const hPrev = getSheet((hueIdx - 1 + totalHues) % totalHues);
      const hNext = getSheet((hueIdx + 1) % totalHues);
      const cA = pickCell(hPrev, 7, 2);
      const cB = pickCell(mainSheet, 5, 2);
      const cC = pickCell(hNext, 3, 2);
      samples = [cloneWithArea(cA, null, false), cloneWithArea(cB, null, true), cloneWithArea(cC, null, false)];
      subtitle = `Vecinos equidistantes de igual croma`;
    } else if (variantId === '7b') {
      usesAreas = true;
      const hPrev = getSheet((hueIdx - 1 + totalHues) % totalHues);
      const hNext = getSheet((hueIdx + 1) % totalHues);
      const cA = pickCell(hPrev, 7, 5);
      const cB = pickCell(mainSheet, 5, 3);
      const cC = pickCell(hNext, 3, 2);
      const areas = computeInverseAreas([{ v: cA.v, s: cA.s }, { v: cB.v, s: cB.s }, { v: cC.v, s: cC.s }], useVC);
      samples = [cloneWithArea(cA, areas[0], false), cloneWithArea(cB, areas[1], true), cloneWithArea(cC, areas[2], false)];
      subtitle = `Vecinos con croma decreciente y áreas inversas`;
    } else if (variantId === '7c') {
      usesAreas = true;
      const oL = getSheet((hueIdx + oppStep - 1 + totalHues) % totalHues);
      const oR = getSheet((hueIdx + oppStep + 1) % totalHues);
      const cMain = pickCell(mainSheet, 6, 4);
      const cLeft = pickCell(oL, 4, 2);
      const cRight = pickCell(oR, 3, 2);
      const areas = computeInverseAreas(
        [{ v: cMain.v, s: cMain.s }, { v: cLeft.v, s: cLeft.s }, { v: cRight.v, s: cRight.s }],
        useVC
      );
      samples = [
        cloneWithArea(cMain, areas[0], true),
        cloneWithArea(cLeft, areas[1], false),
        cloneWithArea(cRight, areas[2], false),
      ];
      subtitle = `Tinte principal + 2 vecinos de su complementario`;
    } else if (variantId === '8-a') {
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const h = (hueIdx + i) % totalHues;
        const sh = getSheet(h);
        const vTarget = 8 - i;
        const sTarget = Math.max(1, 5 - Math.floor(i * 0.7));
        const cell = pickCell(sh, vTarget, sTarget);
        samples.push(cloneWithArea(cell, null, i === 0));
        pathPoints.push({ h, totalHues, v: cell.v, s: cell.s, hex: cell.sample.hex, code: cell.sample.code });
      }
      subtitle = `6 pasos: avanza el tono mientras bajan valor y croma`;
    } else if (variantId === '9a' || variantId === '9b' || variantId === '9c') {
      const count = totalHues === 12 ? 12 : 10;
      for (let i = 0; i < count; i++) {
        const h = (hueIdx + i) % count;
        const sh = getSheet(h);
        const phase = (i / count) * Math.PI * 2;
        const isPole = i === 0 || i === oppStep;
        let vTarget = 5;
        let sTarget = 2;
        if (variantId === '9a') {
          vTarget = 5;
          sTarget = Math.round(2 + 1.5 * Math.abs(Math.cos(phase)));
        } else if (variantId === '9b') {
          vTarget = Math.round(5 + 2 * Math.cos(phase));
          sTarget = Math.round(2 + 1.5 * Math.abs(Math.cos(phase)));
        } else {
          // 9c: opuestos igual valor 5 y croma alto; ramas suben a V7 y bajan a V3 con menor croma
          vTarget = Math.round(5 + 2 * Math.sin(phase));
          sTarget = Math.round(1 + 2.2 * Math.abs(Math.cos(phase)));
        }
        const cell = pickCell(sh, vTarget, sTarget);
        samples.push(cloneWithArea(cell, null, i === 0));
        pathPoints.push({ h, totalHues: count, v: cell.v, s: cell.s, hex: cell.sample.hex, code: cell.sample.code, isPole });
      }
      subtitle = `Circuito cerrado de ${count} pasos alrededor de N5`;
    }

    return {
      samples,
      pathPoints,
      usesAreas,
      subtitle,
      mainSheet,
      oppSheet,
    };
  }

  DDD.MunsellData = {
    HARMONIES,
    buildCMYSheet,
    buildOriginalSheet,
    pickCell,
    computeInverseAreas,
    generateHarmony,
  };
})((window.DDD = window.DDD || {}));
