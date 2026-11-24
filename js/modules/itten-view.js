/* Módulo 3: Johannes Itten (Concordancias Geométricas Giratorias + Laboratorio de los 7 Contrastes) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;
  const W = DDD.Wheels;
  const Bars = DDD.BarsUI;
  const Wheel = DDD.WheelUI;

  const CONCORDANCES = [
    { id: 'comp',  short: 'COMP.',     label: 'Complementarios',      shape: 'Diámetro (2 tonos)',        steps12: [0, 6],           steps24: [0, 12] },
    { id: 'triad', short: 'TRÍADA',    label: 'Tríada',               shape: 'Triángulo equilátero (3)',  steps12: [0, 4, 8],        steps24: [0, 8, 16] },
    { id: 'split', short: 'DIVIDIDO',  label: 'Complemento dividido', shape: 'Triángulo isósceles (3)',   steps12: [0, 5, 7],        steps24: [0, 10, 14] },
    { id: 'sq',    short: 'CUADRADO',  label: 'Cuadrado',             shape: 'Cuadrado (4 tonos)',        steps12: [0, 3, 6, 9],     steps24: [0, 6, 12, 18] },
    { id: 'rect',  short: 'RECTÁNG.',  label: 'Rectángulo',           shape: 'Rectángulo (4 tonos)',      steps12: [0, 2, 6, 8],     steps24: [0, 4, 12, 16] },
    { id: 'hex',   short: 'HEXÁGONO',  label: 'Hexágono',             shape: 'Hexágono regular (6)',      steps12: [0, 2, 4, 6, 8, 10], steps24: [0, 4, 8, 12, 16, 20] },
    { id: 'ana',   short: 'ANÁLOGOS',  label: 'Análogos',             shape: '3 tonos contiguos',         steps12: [11, 0, 1],       steps24: [22, 0, 2] },
    { id: 'mono',  short: 'MONO',      label: 'Monocromo',            shape: '1 tono · escala valor',     steps12: [0],              steps24: [0] },
  ];

  const CONTRASTS = [
    { id: 1, title: '1. Contraste de Tinte',               desc: 'Yuxtaposición de colores puros diferentes. Separarlos con líneas blancas o negras refuerza cada tono.' },
    { id: 2, title: '2. Contraste de Claro-Oscuro',        desc: 'Oposición entre luminosidades. El test en escala de grises revela si la jerarquía de valor funciona.' },
    { id: 3, title: '3. Contraste Cálido-Frío',            desc: 'Polos térmicos (Rojo-Naranja vs Azul-Verde). Un mismo tono intermedio cambia de temperatura según el fondo.' },
    { id: 4, title: '4. Contraste de Complementarios',     desc: 'Opuestos en el círculo. Al 100% vibran intensamente; modulando valor o saturación se vuelve armónico.' },
    { id: 5, title: '5. Contraste Simultáneo',             desc: 'El ojo induce el complementario del fondo sobre un gris neutro adyacente de igual luminosidad.' },
    { id: 6, title: '6. Contraste de Saturación (Cualitativo)', desc: 'Oposición entre un color puro intenso y variantes apagadas o quebradas.' },
    { id: 7, title: '7. Contraste de Extensión (Cuantitativo)', desc: 'Equilibrio de superficies según los valores de luminosidad de Goethe–Itten (Y:9, O:8, R:6, G:6, B:4, V:3).' },
  ];

  const state = {
    subtab: 'concordances', // 'concordances' | 'contrasts'
    wheelMode: 'cmy24',     // 'cmy24' | 'cmy12' | 'ryb12'
    baseIdx: 0,
    concordanceId: 'triad',
    addWhite: 0,
    addBlack: 0,
    activeContrast: 5,
    // Parámetros del laboratorio de contrastes
    c1Border: 'none',      // 'none' | 'white' | 'black'
    c2Gray: false,
    c3WitnessIdx: 5,       // tono testigo para cálido-frío
    c5HueIdx: 0,           // tono fondo para simultáneo
    c5Compensate: 0,       // 0..30% tinte compensador en el gris
    c7Pair: 'yv',          // 'yv' (1:3) | 'ob' (1:2) | 'rg' (1:1)
    c7Rupture: false,
  };

  function getWheelData() {
    if (state.wheelMode === 'cmy24') return W.WHEEL_24;
    if (state.wheelMode === 'cmy12') return W.WHEEL_12_CMY;
    return W.WHEEL_12_RYB;
  }

  function attenuateSample(baseTone, wPct, kPct, isAnchor) {
    const crPct = Math.max(0, 100 - wPct - kPct);
    const [c0, m0, y0] = baseTone.cmy;
    const c = kPct + (crPct * c0) / 100;
    const m = kPct + (crPct * m0) / 100;
    const y = kPct + (crPct * y0) / 100;
    return CE.makeSampleFromCMY(c, m, y, {
      name: baseTone.name,
      code: `W${wPct} Cr${crPct} K${kPct}`,
      isAnchor,
    });
  }

  function buildConcordanceSamples(wheel, conc) {
    const n = wheel.length;
    if (conc.id === 'mono') {
      const t = wheel[state.baseIdx % n];
      return [
        attenuateSample(t, 50, 0, false),
        attenuateSample(t, 25, 0, false),
        attenuateSample(t, 0, 0, true),
        attenuateSample(t, 0, 25, false),
        attenuateSample(t, 0, 50, false),
      ];
    }
    const steps = n === 24 ? conc.steps24 : conc.steps12;
    return steps.map((st, idx) => {
      const t = wheel[(state.baseIdx + st) % n];
      return attenuateSample(t, state.addWhite, state.addBlack, idx === 0);
    });
  }

  function renderContrastLab(colorModel) {
    const cDef = CONTRASTS.find((c) => c.id === state.activeContrast) || CONTRASTS[0];
    let body = '';

    if (cDef.id === 1) {
      const borderCss = state.c1Border === 'white' ? '6px solid #FFFFFF' : state.c1Border === 'black' ? '6px solid #181816' : 'none';
      const cols = ['#FFE900', '#E2007A', '#00A0DE'];
      body = `
        <div class="row-wrap" style="margin-bottom:10px;">
          <button type="button" class="btn btn-sm ${state.c1Border === 'none' ? 'is-active' : ''}" data-c1-b="none">Sin separador</button>
          <button type="button" class="btn btn-sm ${state.c1Border === 'white' ? 'is-active' : ''}" data-c1-b="white">Líneas blancas</button>
          <button type="button" class="btn btn-sm ${state.c1Border === 'black' ? 'is-active' : ''}" data-c1-b="black">Líneas negras</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); height:140px; border-radius:8px; overflow:hidden; background:${state.c1Border === 'black' ? '#181816' : '#FFFFFF'};">
          ${cols.map((c) => `<div style="background:${c}; border:${borderCss};"></div>`).join('')}
        </div>
      `;
    } else if (cDef.id === 2) {
      const tiles = ['#181816', '#55534E', '#A8A49B', '#F5F4F0', '#FFE900', '#0050A4'];
      body = `
        <div class="row-wrap" style="margin-bottom:10px;">
          <button type="button" class="btn btn-sm ${state.c2Gray ? 'is-active' : ''}" id="c2-gray-btn">
            ${state.c2Gray ? 'Vista: Escala de Grises activa' : 'Ver en Escala de Grises'}
          </button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(6,1fr); height:130px; gap:4px; ${state.c2Gray ? 'filter:grayscale(100%);' : ''}">
          ${tiles.map((c) => `<div style="background:${c}; border-radius:6px; border:1px solid #C7C3B8;"></div>`).join('')}
        </div>
      `;
    } else if (cDef.id === 3) {
      const wt = W.WHEEL_12_RYB[state.c3WitnessIdx % 12];
      const wHex = CE.rgbToHex(wt.rgb[0], wt.rgb[1], wt.rgb[2]);
      body = `
        <label class="row-wrap" style="margin-bottom:10px; font-size:12px;">
          <span>Tono testigo central: <strong>${wt.name}</strong></span>
          <input type="range" min="0" max="11" value="${state.c3WitnessIdx}" id="c3-slider" style="width:160px;"/>
        </label>
        <div class="two-col-even">
          <div class="sim-box" style="background:#E93A00;"><div class="sim-inner" style="background:${wHex};"></div></div>
          <div class="sim-box" style="background:#00996F;"><div class="sim-inner" style="background:${wHex};"></div></div>
        </div>
        <div class="muted" style="margin-top:8px;">Ambos cuadrados centrales tienen <strong>exactamente el mismo color</strong>: rodeado de cálido parece más frío y viceversa.</div>
      `;
    } else if (cDef.id === 4) {
      body = `
        <div class="two-col-even">
          <div>
            <div class="muted" style="margin-bottom:4px;">100% puros (vibración máxima)</div>
            <div style="display:flex; height:120px; border-radius:8px; overflow:hidden; border:1px solid #C7C3B8;">
              <div style="flex:1; background:#E20000;"></div>
              <div style="flex:1; background:#00A0DE;"></div>
            </div>
          </div>
          <div>
            <div class="muted" style="margin-bottom:4px;">Modulados en valor y croma (armónico)</div>
            <div style="display:flex; height:120px; border-radius:8px; overflow:hidden; border:1px solid #C7C3B8;">
              <div style="flex:1; background:#9B4E4E;"></div>
              <div style="flex:1; background:#A8D4E6;"></div>
            </div>
          </div>
        </div>
      `;
    } else if (cDef.id === 5) {
      const bgTone = W.WHEEL_12_CMY[state.c5HueIdx % 12];
      const bgSample = CE.makeSampleFromCMY(bgTone.cmy[0], bgTone.cmy[1], bgTone.cmy[2]);
      const gBase = 50;
      const compC = gBase - (state.c5Compensate * (bgTone.cmy[0] - 50)) / 100;
      const compM = gBase - (state.c5Compensate * (bgTone.cmy[1] - 50)) / 100;
      const compY = gBase - (state.c5Compensate * (bgTone.cmy[2] - 50)) / 100;
      // Si compensa añadiendo el mismo tono del fondo, se acerca a bgTone
      const gC = 50 * (1 - state.c5Compensate / 100) + bgTone.cmy[0] * (state.c5Compensate / 100);
      const gM = 50 * (1 - state.c5Compensate / 100) + bgTone.cmy[1] * (state.c5Compensate / 100);
      const gY = 50 * (1 - state.c5Compensate / 100) + bgTone.cmy[2] * (state.c5Compensate / 100);
      const innerSample = CE.makeSampleFromCMY(gC, gM, gY);

      body = `
        <div class="row-wrap" style="margin-bottom:10px; justify-content:space-between;">
          <label class="row-wrap" style="font-size:12px;">
            <span>Fondo: <strong>${bgTone.name}</strong></span>
            <input type="range" min="0" max="11" value="${state.c5HueIdx}" id="c5-hue"/>
          </label>
          <label class="row-wrap" style="font-size:12px;">
            <span>Compensar inducción: <strong class="mono">${state.c5Compensate}%</strong></span>
            <input type="range" min="0" max="30" step="2" value="${state.c5Compensate}" id="c5-comp"/>
          </label>
        </div>
        <div class="sim-box" style="background:${bgSample.hex}; height:170px;">
          <div class="sim-inner" style="background:${innerSample.hex}; width:54px; height:54px;"></div>
        </div>
        <div class="muted" style="margin-top:8px;">Con 0% de compensación, el cuadrado central es gris neutro (C50 M50 Y50) pero el ojo le induce el opuesto del fondo.</div>
      `;
    } else if (cDef.id === 6) {
      const cells = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const dist = Math.max(Math.abs(r - 2), Math.abs(c - 2)); // 0 centro .. 2 borde
          const w = dist * 15;
          const k = dist * 15;
          const cr = 100 - w - k;
          const s = CE.makeSampleFromCMY(k, k + cr, k + cr);
          cells.push(s.hex);
        }
      }
      body = `
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:2px; max-width:260px; margin:0 auto;">
          ${cells.map((hex) => `<div style="aspect-ratio:1; background:${hex}; border-radius:3px;"></div>`).join('')}
        </div>
        <div class="muted" style="text-align:center; margin-top:8px;">El Rojo puro central (Cr 100%) brilla rodeado de sus propios tonos quebrados (Cr 70% y Cr 40%).</div>
      `;
    } else if (cDef.id === 7) {
      const pairs = {
        yv: { aName: 'Amarillo (9)', aHex: '#FFE900', bName: 'Violeta (3)', bHex: '#601E8C', eqA: 25, eqB: 75, ratio: '1 : 3' },
        ob: { aName: 'Naranja (8)',  aHex: '#FF7600', bName: 'Azul (4)',    bHex: '#005CB8', eqA: 33.3, eqB: 66.7, ratio: '1 : 2' },
        rg: { aName: 'Rojo (6)',     aHex: '#E00F23', bName: 'Verde (6)',   bHex: '#009A3E', eqA: 50, eqB: 50, ratio: '1 : 1' },
      };
      const p = pairs[state.c7Pair];
      const pctA = state.c7Rupture ? 5 : p.eqA;
      const pctB = 100 - pctA;
      body = `
        <div class="row-wrap" style="justify-content:space-between; margin-bottom:10px;">
          <div class="row-wrap">
            <button type="button" class="btn btn-sm ${state.c7Pair === 'yv' ? 'is-active' : ''}" data-c7-pair="yv">Amarillo : Violeta (1:3)</button>
            <button type="button" class="btn btn-sm ${state.c7Pair === 'ob' ? 'is-active' : ''}" data-c7-pair="ob">Naranja : Azul (1:2)</button>
            <button type="button" class="btn btn-sm ${state.c7Pair === 'rg' ? 'is-active' : ''}" data-c7-pair="rg">Rojo : Verde (1:1)</button>
          </div>
          <button type="button" class="btn btn-sm ${state.c7Rupture ? 'is-active' : ''}" id="c7-rupture">
            ${state.c7Rupture ? 'Modo: Ruptura por acento (5% / 95%)' : 'Modo: Equilibrio Goethe–Itten'}
          </button>
        </div>
        <div class="area-bar" style="height:80px;">
          <div class="area-segment" style="width:${pctA}%; background:${p.aHex}; color:#181816;">${CE.formatPct(pctA)}</div>
          <div class="area-segment" style="width:${pctB}%; background:${p.bHex}; color:#FFFFFF;">${CE.formatPct(pctB)}</div>
        </div>
        <div class="muted">${p.aName} vs ${p.bName} · Proporción armónica: <strong>${p.ratio}</strong>. Al romperla a 5% / 95%, el color minoritario se vuelve un foco expresivo potente.</div>
      `;
    }

    return `
      <div class="panel stack-md">
        <div class="harm-btn-group">
          ${CONTRASTS.map((c) => `
            <button type="button" class="harm-btn ${c.id === state.activeContrast ? 'is-active' : ''}" data-contrast-id="${c.id}">
              <span class="harm-num">${c.id}</span>
              <span>${c.title.replace(/^\d+\.\s*/, '')}</span>
            </button>
          `).join('')}
        </div>
        <div class="notice-box">
          <strong>${cDef.title}:</strong> ${cDef.desc}
        </div>
        <div class="panel-muted">${body}</div>
      </div>
    `;
  }

  function render(container, appState) {
    const colorModel = appState.colorModel;
    const wheel = getWheelData();
    const n = wheel.length;
    if (state.baseIdx >= n) state.baseIdx = 0;

    const conc = CONCORDANCES.find((c) => c.id === state.concordanceId) || CONCORDANCES[1];
    const samples = buildConcordanceSamples(wheel, conc);
    const steps = conc.id === 'mono' ? [0] : (n === 24 ? conc.steps24 : conc.steps12);
    const activeIndices = steps.map((st) => (state.baseIdx + st) % n);

    const sectors = wheel.map((t, idx) => {
      const rgb = t.rgb
        ? t.rgb
        : (colorModel === 'rgb'
          ? CE.rgbPctToRgb255(t.rgbPct[0], t.rgbPct[1], t.rgbPct[2])
          : CE.cmyToRgbVisual(t.cmy[0], t.cmy[1], t.cmy[2]));
      return { idx, hex: CE.rgbToHex(rgb[0], rgb[1], rgb[2]), label: t.name };
    });

    container.innerHTML = `
      <div class="stack-md">
        <!-- Subtabs Itten -->
        <div class="row-wrap" style="justify-content:space-between;">
          <div class="pill-switch" role="group">
            <button type="button" data-itten-tab="concordances" aria-pressed="${state.subtab === 'concordances'}">
              A · Concordancias Geométricas
              <small>Polígonos giratorios (2, 3, 4 y 6 tonos)</small>
            </button>
            <button type="button" data-itten-tab="contrasts" aria-pressed="${state.subtab === 'contrasts'}">
              B · Laboratorio de 7 Contrastes
              <small>El arte del color (interacción perceptiva)</small>
            </button>
          </div>
        </div>

        ${state.subtab === 'contrasts' ? renderContrastLab(colorModel) : `
          <div class="two-col">
            <div class="panel stack-md">
              <div class="row-wrap" style="justify-content:space-between;">
                <span class="section-rule-label">Rueda giratoria · Arrastrá o tocá cualquier sector</span>
                <div class="row-wrap">
                  <button type="button" class="btn btn-sm ${state.wheelMode === 'cmy24' ? 'is-active' : ''}" data-i-wheel="cmy24">CMY 24 tonos</button>
                  <button type="button" class="btn btn-sm ${state.wheelMode === 'cmy12' ? 'is-active' : ''}" data-i-wheel="cmy12">CMY 12 tonos</button>
                  <button type="button" class="btn btn-sm ${state.wheelMode === 'ryb12' ? 'is-active' : ''}" data-i-wheel="ryb12">Itten RYB 12</button>
                </div>
              </div>

              <div style="display:flex; justify-content:center;" id="itten-wheel-box"></div>

              <div class="notice-box" style="font-size:12px;">
                ${state.wheelMode === 'ryb12'
                  ? '<strong>Rueda histórica RYB (Itten 1961):</strong> opuestos pictóricos <em>Amarillo↔Violeta, Rojo↔Verde, Azul↔Naranja</em>.'
                  : '<strong>Adaptación CMY/RGB de Cátedra:</strong> mismas figuras geométricas aplicadas sobre primarios sustractivos/aditivos (<em>Amarillo↔Azul, Rojo↔Cian, Verde↔Magenta</em>).'}
              </div>
            </div>

            <div class="panel stack-md">
              <div class="section-rule" style="margin-bottom:0;">
                <span class="section-rule-label">Elegí la concordancia geométrica</span>
                <span class="section-rule-line"></span>
              </div>

              <div class="harm-options-grid" style="grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));">
                ${CONCORDANCES.map((c) => `
                  <button type="button" class="harm-opt ${c.id === conc.id ? 'is-active' : ''}" data-i-conc="${c.id}">
                    <div class="harm-opt-label">
                      <strong>${c.label}</strong><br/>
                      <span class="muted" style="font-size:11px;">${c.shape}</span>
                    </div>
                  </button>
                `).join('')}
              </div>

              <div class="panel-muted stack-sm">
                <strong style="font-size:12px;">Atenuación Ostwald/Munsell (opcional, pasos de 12,5%):</strong>
                <label class="row-wrap" style="justify-content:space-between; font-size:12px;">
                  <span>+ Blanco (W): <strong class="mono">${state.addWhite}%</strong></span>
                  <input type="range" min="0" max="75" step="12.5" value="${state.addWhite}" id="i-white" style="width:170px;"/>
                </label>
                <label class="row-wrap" style="justify-content:space-between; font-size:12px;">
                  <span>+ Negro (K): <strong class="mono">${state.addBlack}%</strong></span>
                  <input type="range" min="0" max="75" step="12.5" value="${state.addBlack}" id="i-black" style="width:170px;"/>
                </label>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="section-rule">
              <span class="section-rule-label">Paleta · ${conc.label} (${conc.shape})</span>
              <span class="section-rule-line"></span>
            </div>
            ${Bars.renderPaletteCards(samples, state.wheelMode === 'ryb12' ? 'cmy' : colorModel)}
            <div class="action-bar">
              <span class="muted">Concordancia centrada en: <strong>${wheel[state.baseIdx].name}</strong></span>
              <div class="row-wrap">
                <button type="button" class="btn" id="i-export-png">Exportar imagen (PNG A5)</button>
                <button type="button" class="btn btn-primary" id="i-send-pattern">Probar esta paleta en trama →</button>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    container.querySelectorAll('[data-itten-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.subtab = btn.getAttribute('data-itten-tab');
        render(container, appState);
      });
    });

    if (state.subtab === 'concordances') {
      Wheel.renderWheelSvg(container.querySelector('#itten-wheel-box'), {
        sectors,
        size: 255,
        activeIndices,
        primaryIdx: state.baseIdx,
        polygonIndices: conc.id === 'mono' || conc.id === 'ana' ? [] : activeIndices,
        draggable: true,
        centerLabel: conc.short,
        onSelect: (idx) => {
          state.baseIdx = idx;
          render(container, appState);
        },
      });

      container.querySelectorAll('[data-i-wheel]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.wheelMode = btn.getAttribute('data-i-wheel');
          state.baseIdx = 0;
          render(container, appState);
        });
      });

      container.querySelectorAll('[data-i-conc]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.concordanceId = btn.getAttribute('data-i-conc');
          render(container, appState);
        });
      });

      container.querySelector('#i-white').addEventListener('input', (e) => {
        state.addWhite = parseFloat(e.target.value);
        if (state.addWhite + state.addBlack > 87.5) state.addBlack = 87.5 - state.addWhite;
        render(container, appState);
      });

      container.querySelector('#i-black').addEventListener('input', (e) => {
        state.addBlack = parseFloat(e.target.value);
        if (state.addWhite + state.addBlack > 87.5) state.addWhite = 87.5 - state.addBlack;
        render(container, appState);
      });

      container.querySelector('#i-export-png').addEventListener('click', () => {
        DDD.PlateExporter.exportPlatePng({
          systemTitle: `Sistema Johannes Itten (${state.wheelMode.toUpperCase()})`,
          harmonyTitle: `Concordancia: ${conc.label} — ${conc.shape}`,
          subtitle: `Base: ${wheel[state.baseIdx].name} · W ${state.addWhite}% · K ${state.addBlack}%`,
          janelloTag: conc.id === 'mono' ? 'Caso 5 Janello (=T ≠S ≠V)' : 'Caso 4 Janello (≠T =S =V)',
          colorModel: state.wheelMode === 'ryb12' ? 'cmy' : colorModel,
          samples,
          filename: `itten-${conc.id}`,
        });
      });

      container.querySelector('#i-send-pattern').addEventListener('click', () => {
        DDD.App.sendToPatternLab({
          systemTitle: 'Johannes Itten',
          harmonyTitle: `${conc.label} (${conc.shape})`,
          subtitle: `Base: ${wheel[state.baseIdx].name}`,
          janelloTag: conc.id === 'mono' ? '=T ≠S ≠V' : '≠T =S =V',
          samples,
        });
      });
    } else {
      container.querySelectorAll('[data-contrast-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.activeContrast = parseInt(btn.getAttribute('data-contrast-id'), 10);
          render(container, appState);
        });
      });
      container.querySelectorAll('[data-c1-b]').forEach((b) => b.addEventListener('click', () => { state.c1Border = b.getAttribute('data-c1-b'); render(container, appState); }));
      const c2Btn = container.querySelector('#c2-gray-btn');
      if (c2Btn) c2Btn.addEventListener('click', () => { state.c2Gray = !state.c2Gray; render(container, appState); });
      const c3Sl = container.querySelector('#c3-slider');
      if (c3Sl) c3Sl.addEventListener('input', (e) => { state.c3WitnessIdx = parseInt(e.target.value, 10); render(container, appState); });
      const c5H = container.querySelector('#c5-hue');
      if (c5H) c5H.addEventListener('input', (e) => { state.c5HueIdx = parseInt(e.target.value, 10); render(container, appState); });
      const c5C = container.querySelector('#c5-comp');
      if (c5C) c5C.addEventListener('input', (e) => { state.c5Compensate = parseInt(e.target.value, 10); render(container, appState); });
      container.querySelectorAll('[data-c7-pair]').forEach((b) => b.addEventListener('click', () => { state.c7Pair = b.getAttribute('data-c7-pair'); render(container, appState); }));
      const c7R = container.querySelector('#c7-rupture');
      if (c7R) c7R.addEventListener('click', () => { state.c7Rupture = !state.c7Rupture; render(container, appState); });
    }

    Bars.bindCopyButtons(container);
  }

  DDD.IttenView = { render };
})((window.DDD = window.DDD || {}));
