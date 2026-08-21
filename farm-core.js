/* Tanida Farm — Consolidated Runtime v1
 * Core Engine -> State -> Render -> Map -> Forecast -> AI
 * Compatibility loader keeps existing feature modules intact while eliminating
 * duplicate script injection and uncontrolled render storms.
 */
(function(){
  'use strict';
  if (window.TanidaFarm && window.TanidaFarm.__coreReady) return;

  const APP_KEY = 'tanida_dashboard_v2';
  const loaded = new Map();
  const listeners = new Set();
  let renderFrame = 0;
  let renderOriginal = null;
  let renderWrapped = false;

  const Core = {
    version: '1.0.0-consolidated',
    __coreReady: true,
    modules: {},
    state: {
      key: APP_KEY,
      read(){
        try { return JSON.parse(localStorage.getItem(APP_KEY) || '{}'); }
        catch(e){ return {}; }
      },
      write(next){
        localStorage.setItem(APP_KEY, JSON.stringify(next || {}));
        listeners.forEach(fn => { try { fn(next || {}); } catch(e) { console.warn('[FarmState]', e); } });
        Core.render.schedule('state');
      },
      patch(patch){
        const next = Object.assign({}, this.read(), patch || {});
        this.write(next);
        return next;
      },
      subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
    },
    render: {
      wrap(){
        if (renderWrapped || typeof window.render !== 'function') return;
        renderOriginal = window.render;
        const wrapped = function(){ Core.render.schedule('legacy-render'); };
        wrapped.__tanidaWrapped = true;
        wrapped.__original = renderOriginal;
        window.render = wrapped;
        renderWrapped = true;
      },
      schedule(reason){
        if (renderFrame) return;
        renderFrame = requestAnimationFrame(() => {
          renderFrame = 0;
          if (typeof renderOriginal === 'function') {
            try { renderOriginal.call(window); }
            catch(e){ console.error('[FarmRender]', reason, e); }
          }
        });
      },
      flush(){ this.schedule('flush'); }
    },
    engine: {
      route(){ return (location.hash || '#dash').replace(/^#/, '').toLowerCase() || 'dash'; },
      idle(fn, timeout){
        if ('requestIdleCallback' in window) window.requestIdleCallback(fn, {timeout: timeout || 1200});
        else setTimeout(fn, timeout || 250);
      },
      load(src){
        if (loaded.has(src)) return loaded.get(src);
        const p = new Promise((resolve, reject) => {
          const existing = document.querySelector('script[data-farm-module="'+src+'"]');
          if (existing) { loaded.set(src, Promise.resolve()); resolve(); return; }
          const s = document.createElement('script');
          s.src = src;
          s.async = false;
          s.dataset.farmModule = src;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load '+src));
          document.body.appendChild(s);
        });
        loaded.set(src, p);
        return p;
      },
      loadMany(files){ return files.reduce((p, f) => p.then(() => Core.engine.load(f)), Promise.resolve()); },
      routeModules(){
        const r = Core.engine.route();
        return {
          r,
          map: ['map','fields'].includes(r),
          forecast: ['forecast','dash'].includes(r),
          finance: r === 'finance',
          water: r === 'water',
          ledger: r === 'ledger'
        };
      }
    }
  };

  Core.modules.state = { name:'State', load:()=>Promise.resolve() };
  Core.modules.map = { name:'Map Module', load:()=>Core.engine.loadMany(['farm-state-upgrade.js','farm-map-pro.js']) };
  Core.modules.forecast = { name:'Forecast Module', load:()=>Core.engine.loadMany(['farm-visuals-upgrade.js','farm-visual-intelligence.js']) };
  Core.modules.ai = { name:'AI Module', load:()=>Core.engine.load('farm-visual-intelligence.js') };
  Core.modules.water = { name:'Water & Energy Module', load:()=>Core.engine.load('energy-upgrade.js') };
  Core.modules.finance = { name:'Finance Module', load:()=>Core.engine.load('finance-dashboard-upgrade.js') };
  Core.modules.ledger = { name:'Ledger Module', load:()=>Core.engine.loadMany(['ledger-excel-upgrade.js','ledger-mapping-upgrade.js','shareholders-upgrade.js']) };
  Core.modules.transparency = { name:'Transparency Module', load:()=>Core.engine.loadMany(['calculation-transparency.js','homepage-transparency-upgrade.js','universal-transparency-upgrade.js','transparency-popup-upgrade.js']) };

  window.TanidaFarm = Core;
  window.FarmCore = Core;
  window.FarmState = Core.state;
  window.FarmRender = Core.render;

  function bootRoute(){
    Core.render.wrap();
    const m = Core.engine.routeModules();
    const jobs = [];
    if (m.map) jobs.push(Core.modules.map.load());
    if (m.forecast) jobs.push(Core.modules.forecast.load(), Core.modules.ai.load());
    if (m.finance) jobs.push(Core.modules.finance.load());
    if (m.water) jobs.push(Core.modules.water.load());
    if (m.ledger) jobs.push(Core.modules.ledger.load());
    Core.engine.idle(() => Core.modules.transparency.load().catch(console.error), 1200);
    Promise.allSettled(jobs).then(() => Core.render.flush());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootRoute, {once:true});
  else bootRoute();
  window.addEventListener('hashchange', bootRoute, {passive:true});

  window.TanidaFarmDiagnostics = function(){
    return {
      core: Core.version,
      route: Core.engine.route(),
      loadedModules: Array.from(loaded.keys()),
      localStateBytes: (localStorage.getItem(APP_KEY)||'').length,
      renderWrapped,
      timestamp: new Date().toISOString()
    };
  };
})();
