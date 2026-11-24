/* Exportador de Lámina PNG en Formato A5 Horizontal (Canvas 2D) */
(function (DDD) {
  'use strict';

  const CE = DDD.ColorEngine;

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBarsOnCanvas(ctx, x, y, sample, colorModel) {
    const isRgb = colorModel === 'rgb';
    const vals = isRgb ? sample.rgbPct : sample.cmy;
    const colors = isRgb
      ? ['#E20000', '#00B800', '#0040FF']
      : ['#00A0DE', '#E2007A', '#FFE900'];
    const labels = isRgb ? ['R', 'G', 'B'] : ['C', 'M', 'Y'];
    const colW = 10;
    const gap = 4;
    const chartH = 68;

    for (let i = 0; i < 3; i++) {
      const cx = x + i * (colW + gap);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx, y, colW, chartH);
      const fh = (CE.clamp(vals[i], 0, 100) / 100) * chartH;
      if (fh > 0.5) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cx, y + chartH - fh, colW, fh);
      }
      ctx.strokeStyle = '#B8B4AA';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(cx, y, colW, chartH);
      for (let d = 1; d < 8; d++) {
        const gy = y + (chartH * d) / 8;
        ctx.beginPath();
        ctx.moveTo(cx, gy);
        ctx.lineTo(cx + colW, gy);
        ctx.strokeStyle = 'rgba(24,24,22,0.22)';
        ctx.stroke();
      }
      ctx.fillStyle = '#5E5B54';
      ctx.font = '600 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], cx + colW / 2, y + chartH + 11);
    }

    // Columna WCrK / KCrW
    const x4 = x + 3 * (colW + gap) + 3;
    const { w, cr, k } = sample.wcrk;
    const segs = isRgb
      ? [{ p: k, c: '#181816' }, { p: cr, c: sample.hex }, { p: w, c: '#FFFFFF' }]
      : [{ p: w, c: '#FFFFFF' }, { p: cr, c: sample.hex }, { p: k, c: '#181816' }];
    let cy = y;
    for (let s = 0; s < segs.length; s++) {
      const sh = (CE.clamp(segs[s].p, 0, 100) / 100) * chartH;
      if (sh > 0.4) {
        ctx.fillStyle = segs[s].c;
        ctx.fillRect(x4, cy, colW, sh);
      }
      cy += sh;
    }
    ctx.strokeStyle = '#181816';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x4, y, colW, chartH);
    ctx.fillStyle = '#5E5B54';
    ctx.font = '600 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isRgb ? 'KCrW' : 'WCrK', x4 + colW / 2, y + chartH + 11);
    ctx.textAlign = 'left';
  }

  function exportPlatePng(opts) {
    const W = 1480;
    const H = 1050;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fondo editorial GEAP
    ctx.fillStyle = '#F5F4F0';
    ctx.fillRect(0, 0, W, H);

    // Encabezado
    ctx.fillStyle = '#5E5B54';
    ctx.font = '600 15px sans-serif';
    ctx.fillText((opts.systemTitle || 'TEORÍA DEL COLOR · SINTAXIS DEL COLOR').toUpperCase(), 48, 52);

    ctx.fillStyle = '#181816';
    ctx.font = '700 32px sans-serif';
    ctx.fillText(opts.harmonyTitle || 'Armonía Cromática', 48, 92);

    ctx.fillStyle = '#5E5B54';
    ctx.font = '400 17px sans-serif';
    const sub = [opts.subtitle, opts.janelloTag].filter(Boolean).join('   ·   ');
    ctx.fillText(sub.slice(0, 115), 48, 122);

    ctx.strokeStyle = '#E2E0DA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 144);
    ctx.lineTo(W - 48, 144);
    ctx.stroke();

    const samples = (opts.samples || []).slice(0, 12);
    const hasSvg = Boolean(opts.svgElement);

    // Si viene SVG de trama, dibujarlo a la derecha y tarjetas a la izquierda/abajo
    const finishExport = (patternImg) => {
      let cardsTop = 172;
      let cardsW = W - 96;

      if (patternImg) {
        const boxX = W - 48 - 540;
        const boxY = 172;
        const boxW = 540;
        const boxH = 405;
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        ctx.strokeStyle = '#E2E0DA';
        ctx.stroke();
        ctx.drawImage(patternImg, boxX + 16, boxY + 16, boxW - 32, boxH - 32);
        cardsW = boxX - 48 - 28;
      }

      // Barra de proporciones de área si existe
      const hasAreas = samples.some((s) => s.area !== null && s.area !== undefined);
      if (hasAreas) {
        let ax = 48;
        const ay = 172;
        const aw = cardsW;
        samples.forEach((s) => {
          const w = ((s.area || 0) / 100) * aw;
          ctx.fillStyle = s.hex;
          ctx.fillRect(ax, ay, w, 34);
          if (w > 46) {
            ctx.fillStyle = CE.contrastTextColor(s.visRgb[0], s.visRgb[1], s.visRgb[2]);
            ctx.font = '700 13px monospace';
            ctx.fillText(CE.formatPct(s.area), ax + 8, ay + 22);
          }
          ax += w;
        });
        ctx.strokeStyle = '#181816';
        ctx.strokeRect(48, ay, aw, 34);
        cardsTop = 224;
      }

      // Tarjetas de muestras
      const cols = patternImg ? 3 : Math.min(5, Math.max(3, Math.ceil(samples.length / 2)));
      const gap = 16;
      const cardW = (cardsW - gap * (cols - 1)) / cols;
      const cardH = 164;
      const isRgb = opts.colorModel === 'rgb';
      const labels = isRgb ? ['R', 'G', 'B'] : ['C', 'M', 'Y'];

      samples.forEach((s, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = 48 + col * (cardW + gap);
        const cy = cardsTop + row * (cardH + gap);
        if (cy + cardH > H - 64) return;

        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, cx, cy, cardW, cardH, 10);
        ctx.fill();
        ctx.strokeStyle = s.isAnchor ? '#181816' : '#E2E0DA';
        ctx.lineWidth = s.isAnchor ? 2 : 1;
        ctx.stroke();

        // Título y código
        ctx.fillStyle = '#181816';
        ctx.font = '700 13px sans-serif';
        ctx.fillText((s.name || 'Muestra ' + (idx + 1)).slice(0, 20), cx + 12, cy + 22);
        ctx.fillStyle = '#5E5B54';
        ctx.font = '500 11px monospace';
        ctx.fillText((s.code || s.hex).slice(0, 18), cx + 12, cy + 38);

        // Swatch
        ctx.fillStyle = s.hex;
        ctx.fillRect(cx + 12, cy + 48, 66, 74);
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 12, cy + 48, 66, 74);

        // Barras
        drawBarsOnCanvas(ctx, cx + 88, cy + 48, s, opts.colorModel);

        // Valores abajo
        const vals = isRgb ? s.rgbPct : s.cmy;
        ctx.fillStyle = '#181816';
        ctx.font = '500 10.5px monospace';
        ctx.fillText(
          `${labels[0]}:${CE.formatPct(vals[0])} ${labels[1]}:${CE.formatPct(vals[1])} ${labels[2]}:${CE.formatPct(vals[2])}`,
          cx + 12,
          cy + 142
        );
        ctx.fillStyle = '#5E5B54';
        ctx.fillText(
          `Cr:${CE.formatPct(s.wcrk.cr)} · W:${CE.formatPct(s.wcrk.w)} · K:${CE.formatPct(s.wcrk.k)}`,
          cx + 12,
          cy + 156
        );
      });

      // Pie de lámina
      ctx.fillStyle = '#848078';
      ctx.font = '500 12px sans-serif';
      ctx.fillText(
        `DDD · Sintaxis del Color (Modelo ${isRgb ? 'Luz RGB' : 'Pigmento CMY puro, K_tinta = 0%'}) · FAUD UNMdP`,
        48,
        H - 28
      );

      const link = document.createElement('a');
      link.download = (opts.filename || 'lamina-sintaxis-color') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      CE.showToast('Lámina PNG exportada');
    };

    if (hasSvg && opts.svgElement) {
      const xml = new XMLSerializer().serializeToString(opts.svgElement);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        finishExport(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        finishExport(null);
      };
      img.src = url;
    } else {
      finishExport(null);
    }
  }

  DDD.PlateExporter = {
    exportPlatePng,
  };
})((window.DDD = window.DDD || {}));
