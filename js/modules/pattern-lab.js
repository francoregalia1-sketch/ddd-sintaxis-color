/* Módulo 4: Probador en Trama Bidimensional (4 Motivos TP1/TP4, Permutación, Grises, Cesía y Export PNG) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;
  const Bars = DDD.BarsUI;

  const PATTERNS = [
    { id: 'hex',  name: 'Hexágono concéntrico (TP1)' },
    { id: 'cube', name: 'Cubos y arcos isométricos (Volumen)' },
    { id: 'wave', name: 'Curvas orgánicas superpuestas' },
    { id: 'grid', name: 'Grilla geométrica modular' },
  ];

  const state = {
    patternId: 'cube',
    shift: 0,
    respectAreas: true,
    grayscale: false,
    cesia: 'mate', // 'mate' | 'satinado' | 'brillante'
    payload: {
      systemTitle: 'Ejemplo Ostwald / Munsell',
      harmonyTitle: 'Paleta de prueba en trama',
      subtitle: 'Enviá cualquier armonía desde Munsell, Janello o Itten',
      janelloTag: 'Prueba bidimensional',
      samples: [
        CE.makeSampleFromCMY(50, 25, 25, { name: 'Cian atenuado', code: 'W50 Cr25 K25', area: 50, isAnchor: true }),
        CE.makeSampleFromCMY(25, 50, 50, { name: 'Rojo opuesto', code: 'W50 Cr25 K25', area: 30 }),
        CE.makeSampleFromCMY(75, 50, 50, { name: 'Cian profundo', code: 'W25 Cr25 K50', area: 20 }),
      ],
    },
  };

  function setPalette(payload) {
    if (payload && payload.samples && payload.samples.length) {
      state.payload = payload;
      state.shift = 0;
    }
  }

  function getRotatedColors(samples, shift) {
    const n = samples.length;
    const ordered = [];
    let list = samples.slice();
    // Si respeta áreas y vienen definidas, ordena de mayor área a menor área para fondo -> medio -> acento
    if (state.respectAreas && samples.some((s) => s.area !== null && s.area !== undefined)) {
      list.sort((a, b) => (b.area || 0) - (a.area || 0));
    }
    for (let i = 0; i < 4; i++) {
      ordered.push(list[(i + shift) % n].hex);
    }
    return ordered;
  }

  function buildPatternSvg(patternId, cols, idSuffix) {
    const [c0, c1, c2, c3] = cols;
    const sfx = idSuffix || 'main';
    let inner = `<rect width="400" height="300" fill="${c0}"/>`;

    if (patternId === 'hex') {
      inner += `<defs><pattern id="p-hex-${sfx}" width="80" height="69.28" patternUnits="userSpaceOnUse">
        <rect width="80" height="69.28" fill="${c0}"/>
        <polygon points="40,4 74,22 74,52 40,66 6,52 6,22" fill="${c1}"/>
        <polygon points="40,14 62,26 62,48 40,56 18,48 18,26" fill="${c2}"/>
        <polygon points="40,24 50,30 50,42 40,46 30,42 30,30" fill="${c3}"/>
      </pattern></defs><rect width="400" height="300" fill="url(#p-hex-${sfx})"/>`;
    } else if (patternId === 'cube') {
      inner += `<defs><pattern id="p-cube-${sfx}" width="80" height="92" patternUnits="userSpaceOnUse">
        <rect width="80" height="92" fill="${c0}"/>
        <polygon points="40,4 76,24 40,44 4,24" fill="${c1}"/>
        <polygon points="4,24 40,44 40,86 4,66" fill="${c2}"/>
        <polygon points="76,24 40,44 40,86 76,66" fill="${c3}"/>
        <circle cx="40" cy="44" r="10" fill="${c0}" opacity="0.85"/>
      </pattern></defs><rect width="400" height="300" fill="url(#p-cube-${sfx})"/>`;
    } else if (patternId === 'wave') {
      inner += `<defs><pattern id="p-wave-${sfx}" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="${c0}"/>
        <path d="M0,50 C25,10 75,90 100,50 L100,100 L0,100 Z" fill="${c1}"/>
        <circle cx="30" cy="34" r="22" fill="${c2}"/>
        <circle cx="72" cy="68" r="16" fill="${c3}"/>
      </pattern></defs><rect width="400" height="300" fill="url(#p-wave-${sfx})"/>`;
    } else {
      inner += `<defs><pattern id="p-grid-${sfx}" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="${c0}"/>
        <rect x="0" y="0" width="30" height="30" fill="${c1}"/>
        <rect x="30" y="30" width="30" height="30" fill="${c2}"/>
        <circle cx="30" cy="30" r="10" fill="${c3}"/>
      </pattern></defs><rect width="400" height="300" fill="url(#p-grid-${sfx})"/>`;
    }

    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  function render(container, appState) {
    const samples = state.payload.samples;
    const cols = getRotatedColors(samples, state.shift);
    const hasAreas = samples.some((s) => s.area !== null && s.area !== undefined);

    container.innerHTML = `
      <div class="stack-md">
        <div class="two-col">
          <div class="pattern-canvas-frame">
            <div class="row-wrap" style="justify-content:space-between;">
              <span class="section-rule-label">Composición bidimensional en vivo</span>
              <span class="badge">${Bars.escHtml(state.payload.harmonyTitle)}</span>
            </div>

            <div class="pattern-svg-box ${state.grayscale ? 'is-grayscale' : ''} cesia-${state.cesia}" id="pattern-svg-box">
              ${buildPatternSvg(state.patternId, cols, 'main')}
              <div class="cesia-overlay"></div>
            </div>

            <!-- Tira de 4 permutaciones -->
            <div>
              <div class="muted" style="font-size:11px; margin-bottom:6px;">Variaciones de disposición (permutación de planos):</div>
              <div class="mini-perms">
                ${[0, 1, 2, 3].map((sh) => {
                  const pCols = getRotatedColors(samples, sh);
                  return `
                    <button type="button" class="mini-perm-btn ${state.shift === sh ? 'is-active' : ''}" data-p-shift="${sh}" title="Permutación ${sh + 1}">
                      <div style="aspect-ratio:4/3; border-radius:4px; overflow:hidden;">
                        ${buildPatternSvg(state.patternId, pCols, 'm' + sh)}
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="panel stack-md">
            <div class="section-rule" style="margin-bottom:0;">
              <span class="section-rule-label">Controles proyectuales</span>
              <span class="section-rule-line"></span>
            </div>

            <div class="stack-sm">
              <strong style="font-size:12px;">1. Motivo / Trama bidimensional</strong>
              <div class="row-wrap">
                ${PATTERNS.map((p) => `
                  <button type="button" class="btn btn-sm ${state.patternId === p.id ? 'is-active' : ''}" data-p-id="${p.id}">${p.name}</button>
                `).join('')}
              </div>
            </div>

            <div class="stack-sm">
              <strong style="font-size:12px;">2. Asignación y test de lectura</strong>
              <div class="row-wrap">
                <button type="button" class="btn btn-sm" id="p-rotate-btn">Rotar asignación de colores</button>
                ${hasAreas ? `
                  <button type="button" class="btn btn-sm ${state.respectAreas ? 'is-active' : ''}" id="p-areas-btn">
                    Respetar áreas proporcionales
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm ${state.grayscale ? 'is-active' : ''}" id="p-gray-btn">
                  Test Escala de Grises
                </button>
              </div>
            </div>

            <div class="stack-sm">
              <strong style="font-size:12px;">3. Apariencia / Cesía orientativa</strong>
              <div class="row-wrap">
                ${['mate', 'satinado', 'brillante'].map((c) => `
                  <button type="button" class="btn btn-sm ${state.cesia === c ? 'is-active' : ''}" data-p-cesia="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>
                `).join('')}
              </div>
            </div>

            <div class="panel-muted stack-sm">
              <strong style="font-size:12px;">Importar muestra rápida desde Ostwald 24 (CMY)</strong>
              <div class="row-wrap" style="font-size:11.5px;">
                <label>C <input type="number" id="p-imp-c" min="0" max="100" step="12.5" value="0" style="width:56px;" class="btn btn-sm mono"/></label>
                <label>M <input type="number" id="p-imp-m" min="0" max="100" step="12.5" value="100" style="width:56px;" class="btn btn-sm mono"/></label>
                <label>Y <input type="number" id="p-imp-y" min="0" max="100" step="12.5" value="50" style="width:56px;" class="btn btn-sm mono"/></label>
                <button type="button" class="btn btn-sm" id="p-imp-add">+ Agregar a paleta</button>
              </div>
            </div>

            <div class="action-bar" style="margin-top:4px;">
              <span class="muted">Exportá la lámina con trama + barras de Código Visual.</span>
              <button type="button" class="btn btn-primary" id="p-export-png">Exportar lámina PNG (A5)</button>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="section-rule">
            <span class="section-rule-label">Paleta activa en el probador (${Bars.escHtml(state.payload.systemTitle)})</span>
            <span class="section-rule-line"></span>
          </div>
          ${Bars.renderPaletteCards(samples, appState.colorModel)}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-p-id]').forEach((b) => {
      b.addEventListener('click', () => { state.patternId = b.getAttribute('data-p-id'); render(container, appState); });
    });
    container.querySelectorAll('[data-p-shift]').forEach((b) => {
      b.addEventListener('click', () => { state.shift = parseInt(b.getAttribute('data-p-shift'), 10); render(container, appState); });
    });
    container.querySelector('#p-rotate-btn').addEventListener('click', () => {
      state.shift = (state.shift + 1) % Math.max(1, samples.length);
      render(container, appState);
    });
    const areasBtn = container.querySelector('#p-areas-btn');
    if (areasBtn) areasBtn.addEventListener('click', () => { state.respectAreas = !state.respectAreas; render(container, appState); });
    container.querySelector('#p-gray-btn').addEventListener('click', () => { state.grayscale = !state.grayscale; render(container, appState); });
    container.querySelectorAll('[data-p-cesia]').forEach((b) => {
      b.addEventListener('click', () => { state.cesia = b.getAttribute('data-p-cesia'); render(container, appState); });
    });

    container.querySelector('#p-imp-add').addEventListener('click', () => {
      const c = parseFloat(container.querySelector('#p-imp-c').value) || 0;
      const m = parseFloat(container.querySelector('#p-imp-m').value) || 0;
      const y = parseFloat(container.querySelector('#p-imp-y').value) || 0;
      const s = CE.makeSampleFromCMY(c, m, y, { name: 'Importada CMY', code: `C${c} M${m} Y${y}` });
      state.payload = Object.assign({}, state.payload, { samples: state.payload.samples.concat([s]) });
      render(container, appState);
    });

    container.querySelector('#p-export-png').addEventListener('click', () => {
      const svgEl = container.querySelector('#pattern-svg-box svg');
      DDD.PlateExporter.exportPlatePng({
        systemTitle: state.payload.systemTitle,
        harmonyTitle: state.payload.harmonyTitle,
        subtitle: state.payload.subtitle,
        janelloTag: state.payload.janelloTag,
        colorModel: appState.colorModel,
        samples,
        svgElement: svgEl,
        filename: 'lamina-trama-sintaxis',
      });
    });

    Bars.bindCopyButtons(container);
  }

  DDD.PatternLab = { render, setPalette };
})((window.DDD = window.DDD || {}));
