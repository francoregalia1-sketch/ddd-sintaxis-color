/* Coordinador General de la Aplicación DDD · Sintaxis del Color */
(function (DDD) {
  'use strict';

  const appState = {
    activeTab: 'munsell', // 'munsell' | 'janello' | 'itten' | 'pattern'
    colorModel: 'cmy',    // 'cmy' | 'rgb'
  };

  function syncHash() {
    if (window.location.hash !== '#' + appState.activeTab) {
      try { history.replaceState(null, '', '#' + appState.activeTab); } catch (_) {}
    }
  }

  function renderActiveTab() {
    const mount = document.getElementById('app-view');
    if (!mount) return;
    syncHash();

    document.querySelectorAll('.module-tab').forEach((btn) => {
      const tab = btn.getAttribute('data-tab');
      btn.setAttribute('aria-selected', String(tab === appState.activeTab));
    });

    document.querySelectorAll('[data-global-model]').forEach((btn) => {
      const m = btn.getAttribute('data-global-model');
      btn.setAttribute('aria-pressed', String(m === appState.colorModel));
    });

    if (appState.activeTab === 'munsell') {
      DDD.MunsellView.render(mount, appState);
    } else if (appState.activeTab === 'janello') {
      DDD.JanelloView.render(mount, appState);
    } else if (appState.activeTab === 'itten') {
      DDD.IttenView.render(mount, appState);
    } else if (appState.activeTab === 'pattern') {
      DDD.PatternLab.render(mount, appState);
    }
  }

  function sendToPatternLab(payload) {
    DDD.PatternLab.setPalette(payload);
    appState.activeTab = 'pattern';
    renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    const h = (window.location.hash || '').replace('#', '').toLowerCase();
    if (['munsell', 'janello', 'itten', 'pattern'].includes(h)) {
      appState.activeTab = h;
    }

    document.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.activeTab = btn.getAttribute('data-tab');
        renderActiveTab();
      });
    });

    document.querySelectorAll('[data-global-model]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.colorModel = btn.getAttribute('data-global-model');
        renderActiveTab();
      });
    });

    renderActiveTab();
  }

  DDD.App = {
    init,
    sendToPatternLab,
    getState: () => appState,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})((window.DDD = window.DDD || {}));
