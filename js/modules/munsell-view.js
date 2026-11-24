/* Módulo 1: Sistema Munsell (Adaptación CMY 9x9 recortada + Original H V/C, Balanza N5, 9 Armonías) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;
  const W = DDD.Wheels;
  const MD = DDD.MunsellData;
  const Bars = DDD.BarsUI;
  const Wheel = DDD.WheelUI;

  const state = {
    mode: 'cmy', // 'cmy' | 'original'
    hueIdx: 4,   // Cian en 12 CMY (o 5G en 10 Munsell)
    selectedV: 5,
    selectedS: 3,
    showTrimmed: true,
    grayscaleSheet: false,
    harmonyId: '4',
    variantId: '4-a',
    useVC: false,
    customAreas: null,
  };

  function getTotalHues() {
    return state.mode === 'cmy' ? 12 : 10;
  }

  function getWheelSectors(colorModel, activeSamples) {
    if (state.mode === 'cmy') {
      return W.WHEEL_12_CMY.map((t, idx) => {
        const rgb = colorModel === 'rgb'
          ? CE.rgbPctToRgb255(t.rgbPct[0], t.rgbPct[1], t.rgbPct[2])
          : CE.cmyToRgbVisual(t.cmy[0], t.cmy[1], t.cmy[2]);
        return { idx, hex: CE.rgbToHex(rgb[0], rgb[1], rgb[2]), label: t.name };
      });
    }
    return W.MUNSELL_10.map((h, idx) => {
      const { rgb } = CE.lchToRgb(55, (h.maxC[5] || 8) * 5.0, h.labHue);
      return { idx, hex: CE.rgbToHex(rgb[0], rgb[1], rgb[2]), label: `${h.code} · ${h.name}` };
    });
  }

  function renderClelandBalance(samples) {
    // Calcula momento alrededor de N5: muestra 0 a la izquierda (-1), resto a la derecha (+1)
    let tiltDeg = 0;
    let statusText = 'Equilibrio en N5';

    if (samples.length >= 2) {
      const left = samples[0];
      const rightList = samples.slice(1);
      const calcWeight = (s) => {
        const a = s.area !== null && s.area !== undefined ? s.area : (100 / samples.length);
        const c = (s._coord && s._coord.c) ? Math.max(1, s._coord.c) : Math.max(1, s.wcrk.cr / 8);
        const vFactor = state.useVC && s._coord ? s._coord.v : 5;
        return a * c * (vFactor / 5);
      };
      const wL = calcWeight(left);
      const wR = rightList.reduce((acc, s) => acc + calcWeight(s), 0) / rightList.length * (rightList.length);
      const diff = (wR - wL) / Math.max(1, wR + wL);
      tiltDeg = CE.clamp(diff * 28, -14, 14);
      if (Math.abs(tiltDeg) < 1.8) statusText = 'Equilibrada en N5';
      else if (tiltDeg > 0) statusText = 'Inclinada a la derecha (mayor peso cromático)';
      else statusText = 'Inclinada a la izquierda (mayor peso cromático)';
    }

    const leftColor = samples[0] ? samples[0].hex : '#808080';
    const rightColor = samples[1] ? samples[1].hex : leftColor;

    return `
      <div class="panel" style="margin-top:14px;">
        <div class="row-wrap" style="justify-content:space-between; margin-bottom:6px;">
          <span class="section-rule-label" style="font-size:10px;">Balanza de Cleland · Equilibrio en N5</span>
          <span class="badge">${statusText}</span>
        </div>
        <svg viewBox="0 0 320 110" width="100%" style="max-height:110px; display:block;">
          <!-- Base y fulcro N5 -->
          <polygon points="150,96 170,96 160,64" fill="#181816"/>
          <rect x="148" y="42" width="24" height="22" rx="4" fill="#808080" stroke="#181816" stroke-width="1.5"/>
          <text x="160" y="57" text-anchor="middle" font-size="10" font-weight="700" font-family="JetBrains Mono, monospace" fill="#FFFFFF">N5</text>
          <!-- Brazo móvil -->
          <g transform="rotate(${tiltDeg.toFixed(2)} 160 40)">
            <line x1="36" y1="40" x2="284" y2="40" stroke="#181816" stroke-width="3" stroke-linecap="round"/>
            <circle cx="160" cy="40" r="4" fill="#FFFFFF" stroke="#181816" stroke-width="2"/>
            <!-- Platillo izquierdo -->
            <line x1="48" y1="40" x2="48" y2="56" stroke="#5E5B54" stroke-width="1.2"/>
            <rect x="26" y="56" width="44" height="22" rx="4" fill="${leftColor}" stroke="#181816" stroke-width="1.4"/>
            <!-- Platillo derecho -->
            <line x1="272" y1="40" x2="272" y2="56" stroke="#5E5B54" stroke-width="1.2"/>
            <rect x="250" y="56" width="44" height="22" rx="4" fill="${rightColor}" stroke="#181816" stroke-width="1.4"/>
          </g>
        </svg>
        <div class="muted" style="font-size:11.5px;">La balanza compara el peso visual (<span class="mono">Área × Croma</span>) a ambos lados de <strong>N5</strong>. Ajustá las áreas abajo para probar cómo se compensa.</div>
      </div>
    `;
  }

  function renderPathMapSvg(pathPoints, isEllipse) {
    const size = 210;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 82;
    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block; margin:0 auto;">`;
    // Anillos de croma
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      svg += `<circle cx="${cx}" cy="${cy}" r="${(maxR * f).toFixed(1)}" fill="none" stroke="#E2E0DA" stroke-width="1"/>`;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="11" fill="#808080" stroke="#181816" stroke-width="1"/>`;
    svg += `<text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-size="9" font-family="JetBrains Mono, monospace" fill="#FFFFFF">N5</text>`;

    const pts = pathPoints.map((p) => {
      const ang = ((p.h / p.totalHues) * 360 - 90) * (Math.PI / 180);
      const r = 18 + (p.s / 6) * (maxR - 18);
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang), p];
    });

    if (pts.length >= 2) {
      const poly = pts.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
      svg += isEllipse
        ? `<polygon points="${poly}" fill="rgba(24,24,22,0.05)" stroke="#181816" stroke-width="1.6"/>`
        : `<polyline points="${poly}" fill="none" stroke="#181816" stroke-width="1.8"/>`;
    }

    pts.forEach((pt, idx) => {
      svg += `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="${pt[2].isPole ? 7.5 : 6}" fill="${pt[2].hex}" stroke="#181816" stroke-width="1.4"><title>${pt[2].code}</title></circle>`;
      svg += `<text x="${pt[0].toFixed(1)}" y="${(pt[1] - 9).toFixed(1)}" text-anchor="middle" font-size="8" font-family="JetBrains Mono, monospace" fill="#5E5B54">V${pt[2].v}</text>`;
    });

    svg += `</svg>`;
    return svg;
  }

  function render(container, appState) {
    const colorModel = appState.colorModel;
    const totalHues = getTotalHues();
    if (state.hueIdx >= totalHues) state.hueIdx = 0;

    const harmonyDef = MD.HARMONIES.find((h) => h.id === state.harmonyId) || MD.HARMONIES[0];
    if (!harmonyDef.variants.some((v) => v.id === state.variantId)) {
      state.variantId = harmonyDef.variants[0].id;
    }

    const res = MD.generateHarmony({
      mode: state.mode,
      colorModel,
      hueIdx: state.hueIdx,
      selectedV: state.selectedV,
      selectedS: state.selectedS,
      variantId: state.variantId,
      useVC: state.useVC,
    });

    // Aplicar áreas personalizadas si el alumno movió los sliders
    let activeSamples = res.samples;
    if (res.usesAreas && state.customAreas && state.customAreas.length === res.samples.length) {
      activeSamples = res.samples.map((s, i) => Object.assign({}, s, { area: state.customAreas[i] }));
    }

    const sheet = res.mainSheet;
    const selectedCell = MD.pickCell(sheet, state.selectedV, state.selectedS);

    // Qué celdas de la hoja activa pertenecen a la armonía
    const inHarmonyCoords = new Set(
      activeSamples
        .filter((s) => s._coord && (s.name === 'N' + s._coord.v || (s.code && s.code.indexOf(sheet.hueCode) === 0) || state.harmonyId === '1' || state.harmonyId === '2'))
        .map((s) => `${s._coord.v}-${s._coord.s}`)
    );

    const sectors = getWheelSectors(colorModel, activeSamples);

    container.innerHTML = `
      <div class="stack-md">
        <!-- Modo Munsell -->
        <div class="row-wrap" style="justify-content:space-between;">
          <div class="pill-switch" role="group" aria-label="Versión del Sistema Munsell">
            <button type="button" data-munsell-mode="cmy" aria-pressed="${state.mode === 'cmy'}">
              Adaptación CMY Cátedra
              <small>12 tonos · Matriz 9×9 recortada</small>
            </button>
            <button type="button" data-munsell-mode="original" aria-pressed="${state.mode === 'original'}">
              Munsell Original
              <small>10 familias · Notación H V/C</small>
            </button>
          </div>

          <div class="row-wrap">
            ${state.mode === 'cmy' ? `
              <button type="button" class="btn btn-sm ${state.showTrimmed ? 'is-active' : ''}" id="m-toggle-trim">
                Mostrar recorte por luminosidad
              </button>
            ` : ''}
            <button type="button" class="btn btn-sm ${state.grayscaleSheet ? 'is-active' : ''}" id="m-toggle-gray">
              Vista en escala de grises
            </button>
          </div>
        </div>

        <!-- Panel superior 2 columnas: Rueda + Hoja asimétrica | Morfología + Balanza N5 -->
        <div class="two-col">
          <div class="panel">
            <div class="section-rule">
              <span class="section-rule-label">Hoja del sólido · ${Bars.escHtml(sheet.hueName)} (opuesto: ${Bars.escHtml(sheet.oppName)})</span>
              <span class="section-rule-line"></span>
            </div>

            <div class="row-wrap" style="align-items:flex-start; gap:18px; flex-wrap:nowrap;">
              <div style="flex-shrink:0;" class="munsell-wheel-holder">
                <div id="munsell-wheel-box"></div>
                <div class="muted" style="text-align:center; font-size:11px; margin-top:4px;">Elegí un tono del círculo</div>
              </div>

              <div class="munsell-sheet-wrap" style="flex:1;">
                <div class="munsell-grid" style="grid-template-columns: 34px repeat(${sheet.rows[0].cells.length}, minmax(26px, 1fr)); ${state.grayscaleSheet ? 'filter:grayscale(100%);' : ''}">
                  ${sheet.rows.map((row) => {
                    const isN5 = row.v === 5;
                    const labelHtml = `<div class="munsell-row-label ${isN5 ? 'is-n5' : ''}">${isN5 ? 'N5 →' : 'V' + row.v}</div>`;
                    const cellsHtml = row.cells.map((cell) => {
                      if (cell.isEmpty) {
                        return `<div class="munsell-cell is-empty"></div>`;
                      }
                      if (!cell.inCut && !state.showTrimmed) {
                        return `<div class="munsell-cell is-empty"></div>`;
                      }
                      const isSel = cell.v === selectedCell.v && cell.s === selectedCell.s;
                      const isHarm = inHarmonyCoords.has(`${cell.v}-${cell.s}`);
                      const cls = [
                        'munsell-cell',
                        isSel ? 'is-selected' : '',
                        isHarm ? 'is-in-harmony' : '',
                        !cell.inCut ? 'is-trimmed' : '',
                      ].filter(Boolean).join(' ');
                      const title = cell.inCut
                        ? `${cell.sample.code} (L*${Math.round(cell.sample.lstar)})`
                        : `${cell.sample.code} · Recortada (ΔL*=${cell.lstarDiff})`;
                      return `<button type="button" class="${cls}" data-cell-v="${cell.v}" data-cell-s="${cell.s}" style="background:${cell.sample.hex};" title="${Bars.escHtml(title)}" ${!cell.inCut ? 'disabled' : ''}></button>`;
                    }).join('');
                    return labelHtml + cellsHtml;
                  }).join('')}
                </div>
                <div class="row-wrap" style="justify-content:space-between; margin-top:8px; font-size:11px; color:var(--ink-secondary);">
                  <span>← Eje Neutro (N1–N9)</span>
                  <span>Croma creciente →</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            ${Bars.renderMorphologyPanel(
              selectedCell.sample,
              colorModel,
              `Coordenada: <strong class="mono">${Bars.escHtml(selectedCell.sample.code)}</strong> · L* = <span class="mono">${Math.round(selectedCell.sample.lstar)}</span>${state.mode === 'cmy' ? ' (hoja 9×9 recortada por igual luminosidad)' : ' (Munsell Book of Color)'}`
            )}
            ${renderClelandBalance(activeSamples)}
          </div>
        </div>

        <!-- Bloque de las 9 Armonías de Munsell -->
        <div class="panel">
          <div class="section-rule">
            <span class="section-rule-label">Armonías de Munsell (9 criterios · 13 variantes)</span>
            <span class="section-rule-line"></span>
          </div>

          <div class="harm-btn-group" role="group" aria-label="Armonías de Munsell">
            ${MD.HARMONIES.map((h) => `
              <button type="button" class="harm-btn ${h.id === state.harmonyId ? 'is-active' : ''}" data-m-harm="${h.id}">
                <span class="harm-num">${h.num}</span>
                <span>${Bars.escHtml(h.title.split('(')[0].trim())}</span>
              </button>
            `).join('')}
          </div>

          <div class="harm-options-grid">
            ${harmonyDef.variants.map((v) => {
              const prev = MD.generateHarmony({
                mode: state.mode,
                colorModel,
                hueIdx: state.hueIdx,
                selectedV: state.selectedV,
                selectedS: state.selectedS,
                variantId: v.id,
                useVC: state.useVC,
              });
              return `
                <button type="button" class="harm-opt ${v.id === state.variantId ? 'is-active' : ''}" data-m-var="${v.id}">
                  ${Bars.renderStrip(prev.samples)}
                  <span class="harm-opt-label">${Bars.escHtml(v.label)}</span>
                </button>
              `;
            }).join('')}
          </div>

          <div class="notice-box stack-sm" style="margin-bottom:14px;">
            <div class="row-wrap" style="justify-content:space-between;">
              <strong>${harmonyDef.num}. ${Bars.escHtml(harmonyDef.title)}</strong>
              <span class="badge mono">${Bars.escHtml(harmonyDef.janello)}</span>
            </div>
            <div>${Bars.escHtml(harmonyDef.principle)} <span class="mono" style="color:var(--ink);">(${Bars.escHtml(res.subtitle)})</span></div>
          </div>

          ${res.usesAreas ? `
            <div class="panel-muted" style="margin-bottom:14px;">
              <div class="row-wrap" style="justify-content:space-between;">
                <strong style="font-size:12px;">Ley de Áreas (compensación por superficie)</strong>
                <div class="row-wrap">
                  <button type="button" class="btn btn-sm ${!state.useVC ? 'is-active' : ''}" data-area-law="c">Inversa al Croma (1/C)</button>
                  <button type="button" class="btn btn-sm ${state.useVC ? 'is-active' : ''}" data-area-law="vc">Completa Cleland (1 / V·C)</button>
                  <button type="button" class="btn btn-sm" id="m-reset-areas">Restaurar equilibrio N5</button>
                </div>
              </div>
              <div class="area-bar">
                ${activeSamples.map((s) => `
                  <div class="area-segment" style="width:${s.area}%; background:${s.hex}; color:${CE.contrastTextColor(s.visRgb[0], s.visRgb[1], s.visRgb[2])};">
                    ${s.area >= 12 ? CE.formatPct(s.area) : ''}
                  </div>
                `).join('')}
              </div>
              <div class="row-wrap" style="gap:16px;">
                ${activeSamples.map((s, idx) => `
                  <label style="font-size:11.5px; display:flex; align-items:center; gap:6px;">
                    <span style="width:12px; height:12px; border-radius:3px; background:${s.hex}; border:1px solid #181816; display:inline-block;"></span>
                    <span class="mono">${Bars.escHtml(s.code)}:</span>
                    <input type="range" min="5" max="90" step="1" value="${Math.round(s.area)}" data-area-slider="${idx}" style="width:90px;"/>
                    <strong class="mono">${CE.formatPct(s.area)}</strong>
                  </label>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${harmonyDef.hasPathMap ? `
            <div class="two-col" style="margin-bottom:14px; align-items:center;">
              <div class="panel-muted" style="text-align:center;">
                <div class="section-rule-label" style="font-size:10px; margin-bottom:6px;">Mapa polar 2.5D alrededor de N5</div>
                ${renderPathMapSvg(res.pathPoints, state.harmonyId === '9')}
              </div>
              <div class="stack-sm">
                <strong>Lectura del recorrido:</strong>
                <div class="muted">${state.harmonyId === '8'
                  ? 'Cada punto avanza un tono en el círculo mientras cae en Valor (V) y en Croma (distancia al centro N5), trazando una espiral descendente continua.'
                  : 'Los dos polos complementarios (círculos grandes) se conectan por dos ramas de tintes intermedios alrededor de N5 formando una elipse cerrada.'}</div>
                <div class="row-wrap">
                  ${res.pathPoints.map((pt) => `<span class="badge mono" style="border-left:6px solid ${pt.hex};">${Bars.escHtml(pt.code)}</span>`).join('')}
                </div>
              </div>
            </div>
          ` : ''}

          ${Bars.renderPaletteCards(activeSamples, colorModel, { showLstar: true })}

          <div class="action-bar">
            <span class="muted">Hacé clic en cualquier tarjeta o botón <b>Copiar</b> para llevar los valores exactos a Illustrator.</span>
            <div class="row-wrap">
              <button type="button" class="btn" id="m-export-png">Exportar imagen (PNG A5)</button>
              <button type="button" class="btn btn-primary" id="m-send-pattern">Probar esta paleta en trama →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Renderizar rueda SVG
    const wheelBox = container.querySelector('#munsell-wheel-box');
    Wheel.renderWheelSvg(wheelBox, {
      sectors,
      size: 205,
      activeIndices: [state.hueIdx, (state.hueIdx + (state.mode === 'cmy' ? 6 : 5)) % totalHues],
      primaryIdx: state.hueIdx,
      centerLabel: sheet.hueCode,
      onSelect: (idx) => {
        state.hueIdx = idx;
        state.customAreas = null;
        render(container, appState);
      },
    });

    // Eventos
    container.querySelectorAll('[data-munsell-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMode = btn.getAttribute('data-munsell-mode');
        if (nextMode !== state.mode) {
          state.mode = nextMode;
          state.hueIdx = 0;
          state.customAreas = null;
          render(container, appState);
        }
      });
    });

    const trimBtn = container.querySelector('#m-toggle-trim');
    if (trimBtn) {
      trimBtn.addEventListener('click', () => {
        state.showTrimmed = !state.showTrimmed;
        render(container, appState);
      });
    }

    container.querySelector('#m-toggle-gray').addEventListener('click', () => {
      state.grayscaleSheet = !state.grayscaleSheet;
      render(container, appState);
    });

    container.querySelectorAll('[data-cell-v]').forEach((cellBtn) => {
      cellBtn.addEventListener('click', () => {
        state.selectedV = parseInt(cellBtn.getAttribute('data-cell-v'), 10);
        state.selectedS = parseInt(cellBtn.getAttribute('data-cell-s'), 10);
        state.customAreas = null;
        render(container, appState);
      });
    });

    container.querySelectorAll('[data-m-harm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.harmonyId = btn.getAttribute('data-m-harm');
        const hDef = MD.HARMONIES.find((h) => h.id === state.harmonyId);
        state.variantId = hDef.variants[0].id;
        state.customAreas = null;
        render(container, appState);
      });
    });

    container.querySelectorAll('[data-m-var]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.variantId = btn.getAttribute('data-m-var');
        state.customAreas = null;
        render(container, appState);
      });
    });

    container.querySelectorAll('[data-area-law]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.useVC = btn.getAttribute('data-area-law') === 'vc';
        state.customAreas = null;
        render(container, appState);
      });
    });

    const resetBtn = container.querySelector('#m-reset-areas');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.customAreas = null;
        render(container, appState);
      });
    }

    container.querySelectorAll('[data-area-slider]').forEach((sl) => {
      sl.addEventListener('input', () => {
        const idx = parseInt(sl.getAttribute('data-area-slider'), 10);
        const val = parseFloat(sl.value);
        const current = activeSamples.map((s) => s.area || (100 / activeSamples.length));
        const otherSum = current.reduce((acc, v, i) => (i === idx ? acc : acc + v), 0);
        const rem = Math.max(5, 100 - val);
        const next = current.map((v, i) => {
          if (i === idx) return Math.round(val * 10) / 10;
          return Math.round(((v / Math.max(1, otherSum)) * rem) * 10) / 10;
        });
        state.customAreas = next;
        render(container, appState);
      });
    });

    container.querySelector('#m-export-png').addEventListener('click', () => {
      DDD.PlateExporter.exportPlatePng({
        systemTitle: `Sistema Munsell · ${state.mode === 'cmy' ? 'Adaptación CMY 9×9 recortada' : 'Munsell Original (H V/C)'}`,
        harmonyTitle: `${harmonyDef.num}. ${harmonyDef.title}`,
        subtitle: res.subtitle,
        janelloTag: harmonyDef.janello,
        colorModel,
        samples: activeSamples,
        filename: `munsell-armonia-${harmonyDef.num}`,
      });
    });

    container.querySelector('#m-send-pattern').addEventListener('click', () => {
      DDD.App.sendToPatternLab({
        systemTitle: 'Sistema Munsell',
        harmonyTitle: `${harmonyDef.num}. ${harmonyDef.title}`,
        subtitle: res.subtitle,
        janelloTag: harmonyDef.janello,
        samples: activeSamples,
      });
    });

    Bars.bindCopyButtons(container);
  }

  DDD.MunsellView = { render };
})((window.DDD = window.DDD || {}));
