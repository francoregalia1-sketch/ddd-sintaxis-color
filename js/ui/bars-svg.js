/* Componentes Reutilizables: Código Visual de Porcentajes (%CMY/%RGB + %WCrK/%KCrW), Tarjetas y Morfología */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // SVG compacto de Código Visual (4 columnas x 8 divisiones de 12,5%)
  function renderBarsSvg(sample, colorModel, opts) {
    const o = opts || {};
    const w = o.width || 66;
    const h = o.height || 86;
    const padBottom = 14;
    const chartH = h - padBottom - 2;
    const colW = 10;
    const gap = 4;
    const x0 = 2;

    const isRgb = colorModel === 'rgb';
    const vals = isRgb ? sample.rgbPct : sample.cmy;
    const colors = isRgb
      ? ['#E20000', '#00B800', '#0040FF']
      : ['#00A0DE', '#E2007A', '#FFE900'];
    const labels = isRgb ? ['R', 'G', 'B'] : ['C', 'M', 'Y'];

    let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" style="display:block">`;

    // 3 columnas de primarios (crecen desde abajo hacia arriba)
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * (colW + gap);
      const fillH = (CE.clamp(vals[i], 0, 100) / 100) * chartH;
      const fillY = 2 + (chartH - fillH);
      svg += `<rect x="${x}" y="2" width="${colW}" height="${chartH}" fill="#FFFFFF" stroke="#C7C3B8" stroke-width="0.8"/>`;
      if (fillH > 0.2) {
        svg += `<rect x="${x}" y="${fillY.toFixed(2)}" width="${colW}" height="${fillH.toFixed(2)}" fill="${colors[i]}"/>`;
      }
      for (let d = 1; d < 8; d++) {
        const gy = 2 + (chartH * d) / 8;
        svg += `<line x1="${x}" y1="${gy.toFixed(2)}" x2="${x + colW}" y2="${gy.toFixed(2)}" stroke="rgba(24,24,22,0.22)" stroke-width="0.6"/>`;
      }
      svg += `<text x="${x + colW / 2}" y="${h - 2}" text-anchor="middle" font-size="8.5" font-family="JetBrains Mono, monospace" fill="#5E5B54">${labels[i]}</text>`;
    }

    // 4ta columna apilada Ostwald: %WCrK (CMY: Blanco arriba, Croma centro, Negro abajo) o %KCrW (RGB: Negro arriba, Croma centro, Blanco abajo)
    const x4 = x0 + 3 * (colW + gap) + 3;
    const { w: wPct, cr: crPct, k: kPct } = sample.wcrk;
    const segments = isRgb
      ? [
          { pct: kPct, fill: '#181816' },
          { pct: crPct, fill: sample.hex },
          { pct: wPct, fill: '#FFFFFF' },
        ]
      : [
          { pct: wPct, fill: '#FFFFFF' },
          { pct: crPct, fill: sample.hex },
          { pct: kPct, fill: '#181816' },
        ];

    svg += `<rect x="${x4}" y="2" width="${colW}" height="${chartH}" fill="#FFFFFF" stroke="#C7C3B8" stroke-width="0.8"/>`;
    let curY = 2;
    for (let s = 0; s < segments.length; s++) {
      const segH = (CE.clamp(segments[s].pct, 0, 100) / 100) * chartH;
      if (segH > 0.2) {
        svg += `<rect x="${x4}" y="${curY.toFixed(2)}" width="${colW}" height="${segH.toFixed(2)}" fill="${segments[s].fill}"/>`;
      }
      curY += segH;
    }
    for (let d = 1; d < 8; d++) {
      const gy = 2 + (chartH * d) / 8;
      svg += `<line x1="${x4}" y1="${gy.toFixed(2)}" x2="${x4 + colW}" y2="${gy.toFixed(2)}" stroke="rgba(24,24,22,0.25)" stroke-width="0.6"/>`;
    }
    svg += `<rect x="${x4}" y="2" width="${colW}" height="${chartH}" fill="none" stroke="#181816" stroke-width="0.8"/>`;
    svg += `<text x="${x4 + colW / 2}" y="${h - 2}" text-anchor="middle" font-size="7.5" font-family="JetBrains Mono, monospace" fill="#5E5B54">${isRgb ? 'KCrW' : 'WCrK'}</text>`;
    svg += `</svg>`;
    return svg;
  }

  // Tarjeta grande "Morfología del color" estilo ostwald24
  function renderMorphologyPanel(sample, colorModel, extraNote) {
    const isRgb = colorModel === 'rgb';
    const scaleRows = [
      ['100%', '255'],
      ['87,5%', '223'],
      ['75%', '191'],
      ['62,5%', '158/9'],
      ['50%', '127/8'],
      ['37,5%', '96'],
      ['25%', '64'],
      ['12,5%', '32'],
      ['0%', '0'],
    ];

    const cVals = isRgb ? sample.rgbPct : sample.cmy;
    const labels = isRgb ? ['R', 'G', 'B'] : ['C', 'M', 'Y'];

    const copyText = isRgb
      ? `R:${Math.round(sample.visRgb[0])} G:${Math.round(sample.visRgb[1])} B:${Math.round(sample.visRgb[2])} | ${sample.hex}`
      : `C:${CE.formatPct(sample.cmy[0])} M:${CE.formatPct(sample.cmy[1])} Y:${CE.formatPct(sample.cmy[2])} K:0% | ${sample.hex}`;

    return `
      <div class="panel">
        <div class="row-wrap" style="justify-content:space-between; margin-bottom:10px;">
          <strong style="font-size:15px;">Muestra de color <span class="mono" style="font-size:12px; color:var(--ink-secondary);">${isRgb ? 'RGB' : 'CMY'}</span></strong>
          <button type="button" class="copy-chip" data-copy="${escHtml(copyText)}">Copiar ${escHtml(sample.hex)}</button>
        </div>

        <div class="morph-grid">
          <div class="row-wrap" style="gap:6px; align-items:stretch;">
            <div style="display:flex; flex-direction:column; justify-content:space-between; height:128px; padding:2px 0 16px; font-family:var(--font-mono); font-size:10px; color:var(--ink-secondary); text-align:right;">
              ${scaleRows.map((r) => `<span>${r[0]} <b>${r[1]}</b></span>`).join('')}
            </div>
            ${renderBarsSvg(sample, colorModel, { width: 88, height: 128 })}
          </div>

          <div>
            <div class="morph-swatch-lg" style="background:${sample.hex};"></div>
            <table class="morph-table">
              <tr><td>${labels[0]} (${CE.format255(cVals[0])})</td><td>${CE.formatPct(cVals[0])}</td></tr>
              <tr><td>${labels[1]} (${CE.format255(cVals[1])})</td><td>${CE.formatPct(cVals[1])}</td></tr>
              <tr><td>${labels[2]} (${CE.format255(cVals[2])})</td><td>${CE.formatPct(cVals[2])}</td></tr>
            </table>
            <div class="morph-divider"></div>
            <table class="morph-table">
              <tr><td>Croma</td><td>${CE.formatPct(sample.wcrk.cr)}</td></tr>
              <tr><td>Blanco</td><td>${CE.formatPct(sample.wcrk.w)}</td></tr>
              <tr><td>Negro</td><td>${CE.formatPct(sample.wcrk.k)}</td></tr>
            </table>
          </div>
        </div>

        ${extraNote ? `<div class="muted" style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border);">${extraNote}</div>` : ''}
      </div>
    `;
  }

  // Renderiza la grilla de tarjetas de una paleta
  function renderPaletteCards(samples, colorModel, opts) {
    const o = opts || {};
    const isRgb = colorModel === 'rgb';
    const labels = isRgb ? ['R', 'G', 'B'] : ['C', 'M', 'Y'];

    return `<div class="palette-cards">` + samples.map((s, idx) => {
      const vals = isRgb ? s.rgbPct : s.cmy;
      const copyStr = isRgb
        ? `rgb(${s.visRgb.join(', ')}) ${s.hex}`
        : `C:${CE.formatPct(s.cmy[0])} M:${CE.formatPct(s.cmy[1])} Y:${CE.formatPct(s.cmy[2])} K:0% (${s.hex})`;
      const areaBadge = s.area !== null && s.area !== undefined
        ? `<span class="color-swatch-badge">${CE.formatPct(s.area)} área</span>`
        : '';
      const anchorBadge = s.isAnchor ? ` <span class="badge" style="font-size:9px; padding:1px 6px;">base</span>` : '';

      return `
        <article class="color-card ${s.isAnchor ? 'is-anchor' : ''}" data-sample-idx="${idx}">
          <div class="color-card-head">
            <h4 class="color-card-title">${escHtml(s.name || 'Muestra ' + (idx + 1))}${anchorBadge}</h4>
            <span class="color-card-code">${escHtml(s.code || s.hex)}</span>
          </div>
          <div class="color-card-body">
            <div class="color-swatch-box" style="background:${s.hex};" title="Clic para inspeccionar o copiar" data-inspect="${idx}">
              ${areaBadge}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              ${renderBarsSvg(s, colorModel, { width: 62, height: 82 })}
              <div class="color-values">
                <div>${labels[0]}: <strong>${CE.formatPct(vals[0])}</strong></div>
                <div>${labels[1]}: <strong>${CE.formatPct(vals[1])}</strong></div>
                <div>${labels[2]}: <strong>${CE.formatPct(vals[2])}</strong></div>
                <div style="margin-top:3px; border-top:1px solid var(--border); padding-top:2px;">
                  Cr ${CE.formatPct(s.wcrk.cr)}<br/>
                  W ${CE.formatPct(s.wcrk.w)} · K ${CE.formatPct(s.wcrk.k)}
                </div>
              </div>
            </div>
          </div>
          <div class="color-card-actions">
            <span class="mono" style="font-size:10px; color:var(--ink-muted);">${s.hex}${o.showLstar ? ' · L*' + Math.round(s.lstar) : ''}</span>
            <button type="button" class="copy-chip" data-copy="${escHtml(copyStr)}">Copiar</button>
          </div>
        </article>
      `;
    }).join('') + `</div>`;
  }

  // Renderiza una tira de muestras (.strip)
  function renderStrip(samples) {
    return `<span class="strip">` + samples.map((s) =>
      `<span class="strip-chip ${s.isAnchor ? 'is-user' : ''}" style="background:${s.hex};" title="${escHtml(s.code || s.name || s.hex)}"></span>`
    ).join('') + `</span>`;
  }

  // Delegación global de botones de copiado
  function bindCopyButtons(root) {
    const target = root || document;
    target.querySelectorAll('[data-copy]').forEach((btn) => {
      if (btn._boundCopy) return;
      btn._boundCopy = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        CE.copyToClipboard(btn.getAttribute('data-copy'));
      });
    });
  }

  DDD.BarsUI = {
    renderBarsSvg,
    renderMorphologyPanel,
    renderPaletteCards,
    renderStrip,
    bindCopyButtons,
    escHtml,
  };
})((window.DDD = window.DDD || {}));
