/* Motor Cromático Exacto — Adaptación CMY/RGB (GEAP / FAUD-UNMdP) + CIE LCh para Munsell Original */
(function (DDD) {
  'use strict';

  // Vértices medidos de ddd.geapmdp.com.ar/ostwald24/ para interpolación trilineal CMY -> sRGB visual
  const CMY_CORNERS = {
    W: [255, 255, 255], // C=0, M=0, Y=0
    C: [0, 160, 222],   // C=1, M=0, Y=0
    M: [226, 0, 122],   // C=0, M=1, Y=0
    Y: [255, 233, 0],   // C=0, M=0, Y=1
    R: [226, 0, 0],     // C=0, M=1, Y=1
    G: [0, 146, 0],     // C=1, M=0, Y=1
    B: [0, 0, 106],     // C=1, M=1, Y=0
    K: [28, 26, 26],    // C=1, M=1, Y=1 (negro sustractivo sin tinta K)
  };

  const OFFICIAL_255 = {
    0: '0',
    12.5: '32',
    25: '64',
    37.5: '96',
    50: '127/8',
    62.5: '158/9',
    75: '191',
    87.5: '223',
    100: '255',
  };

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function roundStep(v, step) {
    const s = step || 0.5;
    return Math.round(v / s) * s;
  }

  function cmyToRgbVisual(cPct, mPct, yPct) {
    const c = clamp(cPct, 0, 100) / 100;
    const m = clamp(mPct, 0, 100) / 100;
    const y = clamp(yPct, 0, 100) / 100;

    const ic = 1 - c;
    const im = 1 - m;
    const iy = 1 - y;

    const weights = [
      [ic * im * iy, CMY_CORNERS.W],
      [c  * im * iy, CMY_CORNERS.C],
      [ic * m  * iy, CMY_CORNERS.M],
      [ic * im * y,  CMY_CORNERS.Y],
      [ic * m  * y,  CMY_CORNERS.R],
      [c  * im * y,  CMY_CORNERS.G],
      [c  * m  * iy, CMY_CORNERS.B],
      [c  * m  * y,  CMY_CORNERS.K],
    ];

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i][0];
      const col = weights[i][1];
      r += w * col[0];
      g += w * col[1];
      b += w * col[2];
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  function rgbPctToRgb255(rPct, gPct, bPct) {
    return [
      Math.round(clamp(rPct, 0, 100) * 2.55),
      Math.round(clamp(gPct, 0, 100) * 2.55),
      Math.round(clamp(bPct, 0, 100) * 2.55),
    ];
  }

  function rgb255ToPct(r, g, b) {
    return [
      roundStep((clamp(r, 0, 255) / 255) * 100, 0.5),
      roundStep((clamp(g, 0, 255) / 255) * 100, 0.5),
      roundStep((clamp(b, 0, 255) / 255) * 100, 0.5),
    ];
  }

  function cmyToRgbPctExact(c, m, y) {
    return [100 - clamp(c, 0, 100), 100 - clamp(m, 0, 100), 100 - clamp(y, 0, 100)];
  }

  function rgbPctToCmyExact(rPct, gPct, bPct) {
    return [100 - clamp(rPct, 0, 100), 100 - clamp(gPct, 0, 100), 100 - clamp(bPct, 0, 100)];
  }

  function rgbToHex(r, g, b) {
    const toH = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();
    return '#' + toH(r) + toH(g) + toH(b);
  }

  function hexToRgb(hex) {
    const clean = String(hex).replace('#', '').trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  }

  function hexToCmy(hex) {
    const [r, g, b] = hexToRgb(hex);
    return [
      roundStep(100 - (r / 255) * 100, 0.5),
      roundStep(100 - (g / 255) * 100, 0.5),
      roundStep(100 - (b / 255) * 100, 0.5),
    ];
  }

  // Identidad Ostwald en CMY: W + Cr + K = 100%
  function cmyToWCrK(c, m, y) {
    const cc = clamp(c, 0, 100);
    const mm = clamp(m, 0, 100);
    const yy = clamp(y, 0, 100);
    const k = Math.min(cc, mm, yy);
    const maxV = Math.max(cc, mm, yy);
    const w = 100 - maxV;
    const cr = maxV - k;
    return {
      w: roundStep(w, 0.5),
      cr: roundStep(cr, 0.5),
      k: roundStep(k, 0.5),
    };
  }

  // Identidad Ostwald en RGB: K + Cr + W = 100%
  function rgbPctToKCrW(rPct, gPct, bPct) {
    const rr = clamp(rPct, 0, 100);
    const gg = clamp(gPct, 0, 100);
    const bb = clamp(bPct, 0, 100);
    const w = Math.min(rr, gg, bb);
    const maxV = Math.max(rr, gg, bb);
    const k = 100 - maxV;
    const cr = maxV - w;
    return {
      w: roundStep(w, 0.5),
      cr: roundStep(cr, 0.5),
      k: roundStep(k, 0.5),
    };
  }

  // Luminancia relativa sRGB (0..1) y L* perceptual CIE (0..100)
  function srgbToLinear(u8) {
    const s = clamp(u8, 0, 255) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  function linearToSrgb(lin) {
    const c = clamp(lin, 0, 1);
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(clamp(s * 255, 0, 255));
  }

  function relativeLuminance(r, g, b) {
    return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  }

  function rgbToLstar(r, g, b) {
    const Y = relativeLuminance(r, g, b);
    const f = Y > 0.008856 ? Math.cbrt(Y) : 7.787 * Y + 16 / 116;
    return 116 * f - 16;
  }

  // CIE LCh -> sRGB (D65) con reducción suave de croma si sale del gamut sRGB
  function lchToLinearRgbRaw(L, C, hDeg) {
    const hRad = (hDeg * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const e = 0.008856;
    const k = 903.3;
    const xr = Math.pow(fx, 3) > e ? Math.pow(fx, 3) : (116 * fx - 16) / k;
    const yr = L > k * e ? Math.pow((L + 16) / 116, 3) : L / k;
    const zr = Math.pow(fz, 3) > e ? Math.pow(fz, 3) : (116 * fz - 16) / k;

    // D65 white
    const X = xr * 0.95047;
    const Y = yr * 1.00000;
    const Z = zr * 1.08883;

    const rLin =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    const gLin = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    const bLin =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
    return [rLin, gLin, bLin];
  }

  function inUnitRange(rgbLin) {
    return rgbLin[0] >= -0.001 && rgbLin[0] <= 1.001 &&
           rgbLin[1] >= -0.001 && rgbLin[1] <= 1.001 &&
           rgbLin[2] >= -0.001 && rgbLin[2] <= 1.001;
  }

  function lchToRgb(L, C, hDeg) {
    let raw = lchToLinearRgbRaw(L, C, hDeg);
    let outOfGamut = false;
    if (!inUnitRange(raw) && C > 0) {
      outOfGamut = true;
      let lo = 0, hi = C;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) * 0.5;
        const test = lchToLinearRgbRaw(L, mid, hDeg);
        if (inUnitRange(test)) lo = mid;
        else hi = mid;
      }
      raw = lchToLinearRgbRaw(L, lo, hDeg);
    }
    return {
      rgb: [linearToSrgb(raw[0]), linearToSrgb(raw[1]), linearToSrgb(raw[2])],
      outOfGamut,
    };
  }

  function format255(pct) {
    const p = roundStep(clamp(pct, 0, 100), 0.5);
    if (Object.prototype.hasOwnProperty.call(OFFICIAL_255, p)) {
      return OFFICIAL_255[p];
    }
    return String(Math.round((p / 100) * 255));
  }

  function formatPct(pct) {
    const r = Math.round(pct * 10) / 10;
    return (Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',')) + '%';
  }

  function contrastTextColor(r, g, b) {
    return relativeLuminance(r, g, b) > 0.34 ? '#181816' : '#FFFFFF';
  }

  // Construye objeto de muestra unificado para cualquier vista y para el exportador
  function makeSampleFromCMY(c, m, y, opts) {
    const o = opts || {};
    const cc = roundStep(clamp(c, 0, 100), 0.5);
    const mm = roundStep(clamp(m, 0, 100), 0.5);
    const yy = roundStep(clamp(y, 0, 100), 0.5);
    const visRgb = cmyToRgbVisual(cc, mm, yy);
    const rgbPct = cmyToRgbPctExact(cc, mm, yy);
    const wcrk = cmyToWCrK(cc, mm, yy);
    return {
      cmy: [cc, mm, yy],
      rgbPct: [roundStep(rgbPct[0], 0.5), roundStep(rgbPct[1], 0.5), roundStep(rgbPct[2], 0.5)],
      visRgb,
      hex: rgbToHex(visRgb[0], visRgb[1], visRgb[2]),
      wcrk,
      lstar: rgbToLstar(visRgb[0], visRgb[1], visRgb[2]),
      name: o.name || '',
      code: o.code || '',
      area: o.area !== undefined ? o.area : null,
      isAnchor: Boolean(o.isAnchor),
      munsell: o.munsell || null,
    };
  }

  function makeSampleFromRgb255(r, g, b, opts) {
    const o = opts || {};
    const rr = clamp(Math.round(r), 0, 255);
    const gg = clamp(Math.round(g), 0, 255);
    const bb = clamp(Math.round(b), 0, 255);
    const rgbPct = rgb255ToPct(rr, gg, bb);
    const cmy = rgbPctToCmyExact(rgbPct[0], rgbPct[1], rgbPct[2]);
    const wcrk = rgbPctToKCrW(rgbPct[0], rgbPct[1], rgbPct[2]);
    return {
      cmy: [roundStep(cmy[0], 0.5), roundStep(cmy[1], 0.5), roundStep(cmy[2], 0.5)],
      rgbPct,
      visRgb: [rr, gg, bb],
      hex: rgbToHex(rr, gg, bb),
      wcrk,
      lstar: rgbToLstar(rr, gg, bb),
      name: o.name || '',
      code: o.code || '',
      area: o.area !== undefined ? o.area : null,
      isAnchor: Boolean(o.isAnchor),
      munsell: o.munsell || null,
    };
  }

  function showToast(msg) {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('ddd-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ddd-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('is-visible'), 2000);
  }

  function copyToClipboard(text, label) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Copiado: ' + (label || text)));
    } else if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      showToast('Copiado: ' + (label || text));
    }
  }

  DDD.ColorEngine = {
    CMY_CORNERS,
    cmyToRgbVisual,
    rgbPctToRgb255,
    rgb255ToPct,
    cmyToRgbPctExact,
    rgbPctToCmyExact,
    rgbToHex,
    hexToRgb,
    hexToCmy,
    cmyToWCrK,
    rgbPctToKCrW,
    relativeLuminance,
    rgbToLstar,
    lchToRgb,
    format255,
    formatPct,
    contrastTextColor,
    makeSampleFromCMY,
    makeSampleFromRgb255,
    copyToClipboard,
    showToast,
    clamp,
    roundStep,
  };
})((window.DDD = window.DDD || {}));
