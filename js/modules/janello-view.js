/* Módulo 2: Matriz de Armonías Lógicas de César Janello (y extensión CMY/RGB de J. L. Caivano) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;
  const Bars = DDD.BarsUI;

  // Los 8 casos exhaustivos: ops = [opDim1, opDim2, opDim3] ('=' o '≠')
  const CASES = [
    { id: 1, constants: 3, topo: 'Colores en punto',      ops: ['=', '=', '='], equiv: 'Identidad absoluta (base neutra o juego puro de cesía/textura).' },
    { id: 2, constants: 2, topo: 'Colores en línea',      ops: ['=', '=', '≠'], equiv: 'Perceptual: Munsell 1 (Grises), Ostwald 1 y 4 (=Cr). CMY: varía solo Y.' },
    { id: 3, constants: 2, topo: 'Colores en línea',      ops: ['=', '≠', '='], equiv: 'Perceptual: Munsell 2 horizontal (=V). CMY: varía solo M.' },
    { id: 4, constants: 2, topo: 'Colores en línea',      ops: ['≠', '=', '='], equiv: 'Perceptual: Ostwald 6, 7 y 9 (=W y K en varios tonos), Itten polígonos puros. CMY: varía solo C.' },
    { id: 5, constants: 1, topo: 'Colores en superficie', ops: ['=', '≠', '≠'], equiv: 'Perceptual: Ostwald 2 (=W), 3 (=K), 5 (Combinadas), Munsell 2 diag. CMY: C fijo, varían M e Y.' },
    { id: 6, constants: 1, topo: 'Colores en superficie', ops: ['≠', '≠', '='], equiv: 'Perceptual: Munsell 4 (=V, ≠C), Munsell 9a (Elíptico plano). CMY: Y fijo (o M fijo), varían dos canales.' },
    { id: 7, constants: 1, topo: 'Colores en superficie', ops: ['≠', '=', '≠'], equiv: 'Perceptual: Munsell 5 (Opuestos =C ≠V), Munsell 7a (Vecinos =C). CMY: M fijo, varían C e Y.' },
    { id: 8, constants: 0, topo: 'Colores en volumen',    ops: ['≠', '≠', '≠'], equiv: 'Perceptual: Ostwald 8 (Transversales), Munsell 6, 7b, 7c, 8, 9b, 9c. Requiere progresión regular.' },
  ];

  // Ejemplos exactos de COLOR SINTAXIS DE COLOR.pdf P.4 (CMY) y P.5 (RGB)
  const LECTURE_CMY_PRESETS = {
    1: [[10, 50, 50], [10, 50, 50], [10, 50, 50], [10, 50, 50]],
    2: [[40, 20, 20], [40, 20, 40], [40, 20, 60], [40, 20, 80]],
    3: [[60, 20, 20], [60, 40, 20], [60, 60, 20], [60, 80, 20]],
    4: [[20, 60, 40], [40, 60, 40], [60, 60, 40], [80, 60, 40]],
    5: [[10, 20, 80], [10, 40, 60], [10, 60, 40], [10, 80, 20]],
    6: [[20, 10, 80], [40, 10, 60], [60, 10, 40], [80, 10, 20]],
    7: [[80, 20, 10], [60, 40, 10], [40, 60, 10], [20, 80, 10]],
    8: [[20, 20, 80], [40, 40, 60], [60, 60, 40], [80, 80, 20]],
  };

  const LECTURE_RGB_PRESETS = {
    1: [[200, 100, 180], [200, 100, 180], [200, 100, 180]],
    2: [[200, 100, 130], [200, 100, 80],  [200, 100, 30]],
    3: [[200, 150, 180], [200, 200, 180], [200, 250, 180]],
    4: [[150, 100, 180], [100, 100, 180], [50,  100, 180]],
    5: [[200, 130, 150], [200, 160, 120], [200, 190, 90]],
    6: [[160, 140, 180], [120, 180, 180], [80,  220, 180]],
    7: [[140, 100, 200], [80,  100, 220], [20,  100, 240]],
    8: [[170, 120, 140], [140, 140, 100], [110, 160, 60]],
  };

  const state = {
    axisMode: 'cmy', // 'perceptual' | 'cmy' | 'rgb'
    caseId: 5,
    count: 4,
    step: 20,
    seed: [20, 40, 60], // [dim1, dim2, dim3] en % (o [H_deg, S%, L%] en perceptual)
    useLecturePreset: true,
    case8Chaotic: false,
  };

  function getAxisLabels() {
    if (state.axisMode === 'perceptual') return ['Tinte (H)', 'Saturación (S)', 'Valor (V)'];
    if (state.axisMode === 'rgb') return ['Rojo (R)', 'Verde (G)', 'Azul (B)'];
    return ['Cian (C)', 'Magenta (M)', 'Amarillo (Y)'];
  }

  function buildSamples(activeCase) {
    if (state.useLecturePreset) {
      if (state.axisMode === 'cmy') {
        return LECTURE_CMY_PRESETS[activeCase.id].map((arr, idx) => {
          const s = CE.makeSampleFromCMY(arr[0], arr[1], arr[2], {
            name: `Caso ${activeCase.id} · #${idx + 1}`,
            code: `C${arr[0]} M${arr[1]} Y${arr[2]}`,
            isAnchor: idx === 0,
          });
          s._raw = arr.slice();
          return s;
        });
      }
      if (state.axisMode === 'rgb') {
        return LECTURE_RGB_PRESETS[activeCase.id].map((arr, idx) => {
          const s = CE.makeSampleFromRgb255(arr[0], arr[1], arr[2], {
            name: `Caso ${activeCase.id} · #${idx + 1}`,
            code: `R${arr[0]} G${arr[1]} B${arr[2]}`,
            isAnchor: idx === 0,
          });
          s._raw = [Math.round(arr[0] / 2.55), Math.round(arr[1] / 2.55), Math.round(arr[2] / 2.55)];
          return s;
        });
      }
    }

    const ops = activeCase.ops;
    const samples = [];
    const chaoticOffsets = [
      [0, 0, 0],
      [45, -25, 30],
      [-15, 55, -35],
      [60, 10, -50],
      [-30, -20, 45],
      [25, 45, 10],
    ];

    for (let i = 0; i < state.count; i++) {
      let d1 = state.seed[0];
      let d2 = state.seed[1];
      let d3 = state.seed[2];

      if (activeCase.id === 8 && state.case8Chaotic) {
        const off = chaoticOffsets[i % chaoticOffsets.length];
        d1 = CE.clamp(d1 + off[0], 5, 95);
        d2 = CE.clamp(d2 + off[1], 5, 95);
        d3 = CE.clamp(d3 + off[2], 5, 95);
      } else {
        const offset = i * state.step;
        if (ops[0] === '≠') {
          d1 = state.axisMode === 'perceptual'
            ? (state.seed[0] * 3.6 + i * 45) % 360
            : (state.seed[0] <= 50 ? CE.clamp(state.seed[0] + offset, 0, 100) : CE.clamp(state.seed[0] - offset, 0, 100));
        } else if (state.axisMode === 'perceptual') {
          d1 = state.seed[0] * 3.6;
        }
        if (ops[1] === '≠') {
          d2 = state.seed[1] <= 50 ? CE.clamp(state.seed[1] + offset, 5, 95) : CE.clamp(state.seed[1] - offset, 5, 95);
        }
        if (ops[2] === '≠') {
          const dir = (ops[0] === '≠' && ops[1] === '≠') ? -1 : (state.seed[2] <= 50 ? 1 : -1);
          d3 = CE.clamp(state.seed[2] + dir * offset, 12, 92);
        }
      }

      if (state.axisMode === 'perceptual') {
        const hDeg = ops[0] === '≠' ? d1 : state.seed[0] * 3.6;
        const C = d2 * 0.72;
        const L = CE.clamp(d3, 18, 92);
        const { rgb } = CE.lchToRgb(L, C, hDeg);
        const s = CE.makeSampleFromRgb255(rgb[0], rgb[1], rgb[2], {
          name: `Muestra ${i + 1}`,
          code: `H${Math.round(hDeg)}° S${Math.round(d2)} V${Math.round(L)}`,
          isAnchor: i === 0,
        });
        s._raw = [Math.round(hDeg / 3.6), Math.round(d2), Math.round(L)];
        samples.push(s);
      } else if (state.axisMode === 'rgb') {
        const rgb255 = CE.rgbPctToRgb255(d1, d2, d3);
        const s = CE.makeSampleFromRgb255(rgb255[0], rgb255[1], rgb255[2], {
          name: `Muestra ${i + 1}`,
          code: `R${Math.round(d1)}% G${Math.round(d2)}% B${Math.round(d3)}%`,
          isAnchor: i === 0,
        });
        s._raw = [d1, d2, d3];
        samples.push(s);
      } else {
        const s = CE.makeSampleFromCMY(d1, d2, d3, {
          name: `Muestra ${i + 1}`,
          code: `C${Math.round(d1)} M${Math.round(d2)} Y${Math.round(d3)}`,
          isAnchor: i === 0,
        });
        s._raw = [d1, d2, d3];
        samples.push(s);
      }
    }
    return samples;
  }

  function renderIsoCubeSvg(samples, activeCase, labels) {
    // Proyección isométrica simple de un cubo normalizado [0..1]^3
    const W = 250;
    const H = 220;
    const ox = 125;
    const oy = 118;
    const scale = 68;
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = 0.5;

    const proj = (x, y, z) => {
      // x,y,z en [-0.5 .. +0.5]
      const px = ox + (x - z) * cos30 * scale;
      const py = oy + (x + z) * sin30 * scale - y * scale;
      return [px, py];
    };

    const corners = [
      [0,0,0], [1,0,0], [1,1,0], [0,1,0],
      [0,0,1], [1,0,1], [1,1,1], [0,1,1],
    ].map(([a, b, c]) => proj(a - 0.5, b - 0.5, c - 0.5));

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:250px; display:block; margin:0 auto;">`;
    edges.forEach(([i, j]) => {
      svg += `<line x1="${corners[i][0].toFixed(1)}" y1="${corners[i][1].toFixed(1)}" x2="${corners[j][0].toFixed(1)}" y2="${corners[j][1].toFixed(1)}" stroke="#C7C3B8" stroke-width="1.2"/>`;
    });

    const pts = samples.map((s) => {
      const r = s._raw || [50, 50, 50];
      return {
        pt: proj(r[0] / 100 - 0.5, r[2] / 100 - 0.5, r[1] / 100 - 0.5),
        hex: s.hex,
        code: s.code,
      };
    });

    if (pts.length >= 2) {
      const pStr = pts.map((p) => `${p.pt[0].toFixed(1)},${p.pt[1].toFixed(1)}`).join(' ');
      svg += `<polyline points="${pStr}" fill="none" stroke="#181816" stroke-width="1.8" stroke-dasharray="${activeCase.id === 8 ? '4 3' : ''}"/>`;
    }

    pts.forEach((p, idx) => {
      svg += `<circle cx="${p.pt[0].toFixed(1)}" cy="${p.pt[1].toFixed(1)}" r="${idx === 0 ? 7.5 : 6}" fill="${p.hex}" stroke="#181816" stroke-width="1.5"><title>${p.code}</title></circle>`;
    });

    // Etiquetas de ejes
    const axX = proj(0.65, -0.5, -0.5);
    const axZ = proj(-0.5, -0.5, 0.65);
    const axY = proj(-0.5, 0.65, -0.5);
    svg += `<text x="${axX[0].toFixed(1)}" y="${axX[1].toFixed(1)}" font-size="9" font-family="JetBrains Mono, monospace" fill="#5E5B54">${labels[0].split(' ')[0]}</text>`;
    svg += `<text x="${axZ[0].toFixed(1)}" y="${axZ[1].toFixed(1)}" font-size="9" text-anchor="end" font-family="JetBrains Mono, monospace" fill="#5E5B54">${labels[1].split(' ')[0]}</text>`;
    svg += `<text x="${axY[0].toFixed(1)}" y="${axY[1].toFixed(1)}" font-size="9" text-anchor="middle" font-family="JetBrains Mono, monospace" fill="#5E5B54">${labels[2].split(' ')[0]}</text>`;
    svg += `</svg>`;
    return svg;
  }

  function render(container, appState) {
    const activeCase = CASES.find((c) => c.id === state.caseId) || CASES[4];
    const labels = getAxisLabels();
    const samples = buildSamples(activeCase);
    const displayModel = state.axisMode === 'rgb' || state.axisMode === 'perceptual' ? 'rgb' : 'cmy';

    container.innerHTML = `
      <div class="stack-md">
        <!-- Selector de dimensiones -->
        <div class="row-wrap" style="justify-content:space-between;">
          <div class="pill-switch" role="group" aria-label="Variables de la matriz de Janello">
            <button type="button" data-j-axis="cmy" aria-pressed="${state.axisMode === 'cmy'}">
              Sustractivo CMY
              <small>Adaptación Caivano (C·M·Y)</small>
            </button>
            <button type="button" data-j-axis="rgb" aria-pressed="${state.axisMode === 'rgb'}">
              Aditivo RGB
              <small>Adaptación Caivano (R·G·B)</small>
            </button>
            <button type="button" data-j-axis="perceptual" aria-pressed="${state.axisMode === 'perceptual'}">
              Perceptual (Janello)
              <small>Tinte · Saturación · Valor</small>
            </button>
          </div>

          <div class="row-wrap">
            ${state.axisMode !== 'perceptual' ? `
              <button type="button" class="btn btn-sm ${state.useLecturePreset ? 'is-active' : ''}" id="j-preset-btn">
                Ejemplo oficial de teórica
              </button>
            ` : ''}
            ${activeCase.id === 8 && !state.useLecturePreset ? `
              <button type="button" class="btn btn-sm ${!state.case8Chaotic ? 'is-active' : ''}" id="j-c8-mode">
                ${state.case8Chaotic ? 'Modo: Libre (sin regla)' : 'Modo: Progresión aritmética (Caivano)'}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Matriz interactiva de 8 casos -->
        <div class="panel">
          <div class="section-rule">
            <span class="section-rule-label">Matriz lógica de 8 casos · Hacé clic en una columna o alterná los signos (= / ≠)</span>
            <span class="section-rule-line"></span>
          </div>

          <div style="overflow-x:auto;">
            <table class="janello-matrix">
              <thead>
                <tr>
                  <th style="text-align:left; min-width:130px;">Dimensión</th>
                  <th>3 constantes<br/><small>punto</small></th>
                  <th colspan="3">2 constantes<br/><small>colores en línea</small></th>
                  <th colspan="3">1 constante<br/><small>colores en superficie</small></th>
                  <th>0 constantes<br/><small>volumen</small></th>
                </tr>
                <tr>
                  <th style="text-align:left;">Caso lógico</th>
                  ${CASES.map((c) => `
                    <th class="${c.id === activeCase.id ? 'janello-cell-active' : ''}">
                      <button type="button" class="janello-col-btn" data-j-case="${c.id}">${c.id}</button>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${labels.map((lbl, rIdx) => `
                  <tr>
                    <td style="text-align:left; font-weight:600;">${lbl}</td>
                    ${CASES.map((c) => `
                      <td class="${c.id === activeCase.id ? 'janello-cell-active' : ''}">
                        <button type="button" class="janello-op-btn" data-j-toggle-row="${rIdx}" data-j-col="${c.id}" title="Clic para alternar = / ≠">
                          ${c.ops[rIdx]}
                        </button>
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Generador + Sólido 3D -->
        <div class="two-col">
          <div class="panel stack-md">
            <div class="section-rule" style="margin-bottom:0;">
              <span class="section-rule-label">Caso ${activeCase.id} · ${activeCase.constants} constante(s) · ${activeCase.topo}</span>
              <span class="section-rule-line"></span>
            </div>

            <div class="notice-box">
              <strong>Equivalencia con otros sistemas:</strong> ${Bars.escHtml(activeCase.equiv)}
            </div>

            <div class="row-wrap" style="justify-content:space-between;">
              <label class="row-wrap" style="font-size:12px;">
                <span>Muestras:</span>
                <select id="j-count" class="btn btn-sm" ${state.useLecturePreset ? 'disabled' : ''}>
                  ${[3, 4, 5, 6].map((n) => `<option value="${n}" ${state.count === n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              </label>
              <label class="row-wrap" style="font-size:12px;">
                <span>Paso numérico:</span>
                <select id="j-step" class="btn btn-sm" ${state.useLecturePreset ? 'disabled' : ''}>
                  ${[12.5, 15, 20, 25].map((st) => `<option value="${st}" ${state.step === st ? 'selected' : ''}>${st}%</option>`).join('')}
                </select>
              </label>
            </div>

            <div class="stack-sm">
              <span class="muted" style="font-size:11.5px;">Ajustá el color semilla (las dimensiones en <strong>=</strong> permanecen bloqueadas en toda la paleta):</span>
              ${labels.map((lbl, idx) => `
                <label class="row-wrap" style="justify-content:space-between; font-size:12px;">
                  <span style="min-width:120px;">
                    <span class="badge mono">${activeCase.ops[idx]}</span>
                    <strong>${lbl}</strong>
                  </span>
                  <input type="range" min="0" max="100" step="5" value="${state.seed[idx]}" data-j-seed="${idx}" style="flex:1;"/>
                  <span class="mono" style="min-width:44px; text-align:right;">${state.axisMode === 'perceptual' && idx === 0 ? Math.round(state.seed[idx] * 3.6) + '°' : state.seed[idx] + '%'}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="panel">
            <div class="section-rule">
              <span class="section-rule-label">Ubicación en el sólido (${activeCase.topo})</span>
              <span class="section-rule-line"></span>
            </div>
            ${renderIsoCubeSvg(samples, activeCase, labels)}
            <div class="muted" style="text-align:center; font-size:11.5px; margin-top:6px;">
              ${activeCase.id === 8 && !state.case8Chaotic
                ? 'Incluso con <strong>0 constantes</strong>, la progresión aritmética regular dibuja una recta ordenada dentro del sólido.'
                : `Topología resultante: <strong>${activeCase.topo}</strong>.`}
            </div>
          </div>
        </div>

        <!-- Muestras resultantes -->
        <div class="panel">
          <div class="section-rule">
            <span class="section-rule-label">Paleta generada · Caso ${activeCase.id} (${samples.length} muestras)</span>
            <span class="section-rule-line"></span>
          </div>
          ${Bars.renderPaletteCards(samples, displayModel)}
          <div class="action-bar">
            <span class="muted">Cada muestra exhibe su Código Visual de Porcentajes (<span class="mono">%CMY / %WCrK</span> o <span class="mono">%RGB / %KCrW</span>).</span>
            <div class="row-wrap">
              <button type="button" class="btn" id="j-export-png">Exportar imagen (PNG A5)</button>
              <button type="button" class="btn btn-primary" id="j-send-pattern">Probar esta paleta en trama →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos
    container.querySelectorAll('[data-j-axis]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.axisMode = btn.getAttribute('data-j-axis');
        if (state.axisMode === 'perceptual') state.useLecturePreset = false;
        render(container, appState);
      });
    });

    const presetBtn = container.querySelector('#j-preset-btn');
    if (presetBtn) {
      presetBtn.addEventListener('click', () => {
        state.useLecturePreset = !state.useLecturePreset;
        render(container, appState);
      });
    }

    const c8Btn = container.querySelector('#j-c8-mode');
    if (c8Btn) {
      c8Btn.addEventListener('click', () => {
        state.case8Chaotic = !state.case8Chaotic;
        render(container, appState);
      });
    }

    container.querySelectorAll('[data-j-case]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.caseId = parseInt(btn.getAttribute('data-j-case'), 10);
        render(container, appState);
      });
    });

    container.querySelectorAll('[data-j-toggle-row]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const colId = parseInt(btn.getAttribute('data-j-col'), 10);
        const rIdx = parseInt(btn.getAttribute('data-j-toggle-row'), 10);
        const curOps = CASES.find((c) => c.id === state.caseId).ops.slice();
        if (colId !== state.caseId) {
          state.caseId = colId;
        } else {
          curOps[rIdx] = curOps[rIdx] === '=' ? '≠' : '=';
          const match = CASES.find((c) => c.ops[0] === curOps[0] && c.ops[1] === curOps[1] && c.ops[2] === curOps[2]);
          if (match) state.caseId = match.id;
        }
        render(container, appState);
      });
    });

    container.querySelector('#j-count').addEventListener('change', (e) => {
      state.count = parseInt(e.target.value, 10);
      state.useLecturePreset = false;
      render(container, appState);
    });

    container.querySelector('#j-step').addEventListener('change', (e) => {
      state.step = parseFloat(e.target.value);
      state.useLecturePreset = false;
      render(container, appState);
    });

    container.querySelectorAll('[data-j-seed]').forEach((sl) => {
      sl.addEventListener('input', () => {
        const idx = parseInt(sl.getAttribute('data-j-seed'), 10);
        state.seed[idx] = parseFloat(sl.value);
        state.useLecturePreset = false;
        render(container, appState);
      });
    });

    container.querySelector('#j-export-png').addEventListener('click', () => {
      DDD.PlateExporter.exportPlatePng({
        systemTitle: `Matriz Lógica de Janello · Ejes ${state.axisMode.toUpperCase()}`,
        harmonyTitle: `Caso ${activeCase.id}: ${activeCase.constants} constante(s) — ${activeCase.topo}`,
        subtitle: labels.map((l, i) => `${l.split(' ')[0]} ${activeCase.ops[i]}`).join(' · '),
        janelloTag: activeCase.equiv,
        colorModel: displayModel,
        samples,
        filename: `janello-caso-${activeCase.id}`,
      });
    });

    container.querySelector('#j-send-pattern').addEventListener('click', () => {
      DDD.App.sendToPatternLab({
        systemTitle: 'Matriz de Janello',
        harmonyTitle: `Caso ${activeCase.id} · ${activeCase.topo}`,
        subtitle: labels.map((l, i) => `${l.split(' ')[0]} ${activeCase.ops[i]}`).join(' · '),
        janelloTag: `${activeCase.constants} constante(s)`,
        samples,
      });
    });

    Bars.bindCopyButtons(container);
  }

  DDD.JanelloView = { render };
})((window.DDD = window.DDD || {}));
