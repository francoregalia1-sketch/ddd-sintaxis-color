/* Rueda Cromática SVG Parametrizable (10, 12 o 24 sectores) con Polígono Interactivo */
(function (DDD) {
  'use strict';

  function polarToXY(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcSectorPath(cx, cy, rIn, rOut, aStart, aEnd) {
    const [x1, y1] = polarToXY(cx, cy, rOut, aStart);
    const [x2, y2] = polarToXY(cx, cy, rOut, aEnd);
    const [x3, y3] = polarToXY(cx, cy, rIn, aEnd);
    const [x4, y4] = polarToXY(cx, cy, rIn, aStart);
    const large = aEnd - aStart > 180 ? 1 : 0;
    return [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  // sectors: [{ idx, hex, label }]
  // activeIndices: array de índices resaltados (el primero o primaryIdx lleva marca fuerte)
  // polygonIndices: array ordenado de índices para trazar polígono inscrito dentro del anillo
  function renderWheelSvg(container, opts) {
    const o = opts || {};
    const sectors = o.sectors || [];
    const n = sectors.length;
    const size = o.size || 240;
    const cx = size / 2;
    const cy = size / 2;
    const rOut = size * 0.45;
    const rIn = size * 0.25;
    const rPoly = (rOut + rIn) * 0.5;
    const step = 360 / Math.max(1, n);
    const activeSet = new Set(o.activeIndices || []);
    const primaryIdx = o.primaryIdx !== undefined ? o.primaryIdx : (o.activeIndices && o.activeIndices[0]);
    const poly = o.polygonIndices || [];

    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="wheel-svg" role="img" aria-label="${o.ariaLabel || 'Círculo cromático'}" style="display:block; user-select:none; touch-action:none;">`;

    for (let i = 0; i < n; i++) {
      const a0 = i * step - step / 2;
      const a1 = a0 + step;
      const d = arcSectorPath(cx, cy, rIn, rOut, a0, a1);
      const isAct = activeSet.has(i);
      const isPrim = i === primaryIdx;
      const stroke = isPrim ? '#181816' : isAct ? '#181816' : '#F5F4F0';
      const sw = isPrim ? 2.6 : isAct ? 1.8 : 1.2;

      svg += `<path d="${d}" fill="${sectors[i].hex}" stroke="${stroke}" stroke-width="${sw}" data-wheel-idx="${i}" style="cursor:pointer;">
        <title>${sectors[i].label || ''}</title>
      </path>`;
    }

    // Re-dibujar borde de sectores activos encima para evitar cortes de vecinos
    activeSet.forEach((i) => {
      if (i < 0 || i >= n) return;
      const a0 = i * step - step / 2;
      const a1 = a0 + step;
      const d = arcSectorPath(cx, cy, rIn, rOut, a0, a1);
      const sw = i === primaryIdx ? 2.8 : 1.8;
      svg += `<path d="${d}" fill="none" stroke="#181816" stroke-width="${sw}" pointer-events="none"/>`;
    });

    // Polígono inscrito (para Itten o Munsell)
    if (poly.length >= 2) {
      const pts = poly.map((idx) => polarToXY(cx, cy, rPoly * 0.62, idx * step));
      if (poly.length === 2) {
        svg += `<line x1="${pts[0][0].toFixed(1)}" y1="${pts[0][1].toFixed(1)}" x2="${pts[1][0].toFixed(1)}" y2="${pts[1][1].toFixed(1)}" stroke="#181816" stroke-width="2" pointer-events="none"/>`;
      } else {
        const ptStr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        svg += `<polygon points="${ptStr}" fill="rgba(24,24,22,0.06)" stroke="#181816" stroke-width="2" stroke-linejoin="round" pointer-events="none"/>`;
      }
      pts.forEach((p, k) => {
        const isFirst = k === 0;
        svg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${isFirst ? 6 : 4.5}" fill="${isFirst ? '#181816' : '#FFFFFF'}" stroke="#181816" stroke-width="2" pointer-events="none"/>`;
      });
    }

    // Texto central opcional
    if (o.centerLabel) {
      svg += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="700" font-family="JetBrains Mono, monospace" fill="#5E5B54">${o.centerLabel}</text>`;
    }

    svg += `</svg>`;
    container.innerHTML = svg;

    const svgEl = container.querySelector('svg');
    if (o.onSelect) {
      svgEl.querySelectorAll('[data-wheel-idx]').forEach((el) => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-wheel-idx'), 10);
          o.onSelect(idx);
        });
      });

      // Soporte de arrastre angular sobre la rueda (útil para rotar polígonos de Itten)
      if (o.draggable) {
        let dragging = false;
        let lastIdx = -1;
        const pickFromEvent = (ev) => {
          const rect = svgEl.getBoundingClientRect();
          const px = (ev.clientX - rect.left) * (size / rect.width) - cx;
          const py = (ev.clientY - rect.top) * (size / rect.height) - cy;
          let deg = (Math.atan2(py, px) * 180) / Math.PI + 90;
          if (deg < 0) deg += 360;
          const idx = Math.round(deg / step) % n;
          if (idx !== lastIdx) {
            lastIdx = idx;
            o.onSelect(idx);
          }
        };
        svgEl.addEventListener('pointerdown', (ev) => {
          dragging = true;
          svgEl.setPointerCapture(ev.pointerId);
          pickFromEvent(ev);
        });
        svgEl.addEventListener('pointermove', (ev) => {
          if (dragging) pickFromEvent(ev);
        });
        svgEl.addEventListener('pointerup', () => { dragging = false; });
        svgEl.addEventListener('pointercancel', () => { dragging = false; });
      }
    }
  }

  DDD.WheelUI = {
    renderWheelSvg,
    polarToXY,
  };
})((window.DDD = window.DDD || {}));
