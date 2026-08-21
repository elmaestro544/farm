/* Tanida Farm — Consolidated Runtime v1
 * Core Engine -> State -> Render -> Map -> Forecast -> AI
 * Route-scoped modules are loaded once; no polling loops or duplicate map engines.
 */
(function(){
  'use strict';
  if (window.TanidaFarm && window.TanidaFarm.__coreReady) return;
  const APP_KEY='tanida_dashboard_v2';
  const loaded=new Map(), listeners=new Set();
  let frame=0, originalRender=null, wrapped=false;
  const Core={
    version:'1.1.0-consolidated',__coreReady:true,modules:{},
    state:{
      key:APP_KEY,
      read(){try{return JSON.parse(localStorage.getItem(APP_KEY)||'{}')}catch(e){return {}}},
      write(next){localStorage.setItem(APP_KEY,JSON.stringify(next||{}));listeners.forEach(fn=>{try{fn(next||{})}catch(e){console.warn('[FarmState]',e)}});Core.render.schedule('state')},
      patch(p){const next=Object.assign({},this.read(),p||{});this.write(next);return next},
      subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
    },
    render:{
      wrap(){if(wrapped||typeof window.render!=='function')return;originalRender=window.render;const w=function(){Core.render.schedule('legacy-render')};w.__tanidaWrapped=true;w.__original=originalRender;window.render=w;wrapped=true},
      schedule(reason){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(typeof originalRender==='function'){try{originalRender.call(window)}catch(e){console.error('[FarmRender]',reason,e)}}})},
      flush(){this.schedule('flush')}
    },
    engine:{
      route(){return(location.hash||'#dash').replace(/^#/,'').toLowerCase()||'dash'},
      idle(fn,timeout){if('requestIdleCallback'in window)window.requestIdleCallback(fn,{timeout:timeout||1200});else setTimeout(fn,timeout||250)},
      load(src){if(loaded.has(src))return loaded.get(src);const p=new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-farm-module="'+src+'"]');if(existing){resolve();return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset.farmModule=src;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.body.appendChild(s)});loaded.set(src,p);return p},
      loadMany(files){return files.reduce((p,f)=>p.then(()=>Core.engine.load(f)),Promise.resolve())},
      routeModules(){const r=this.route();return{r,map:r==='map',forecast:r==='forecast',finance:r==='finance',water:r==='water',ledger:r==='ledger',ai:['dash','investment','forecast'].includes(r)}}
    }
  };
  Core.modules.state={name:'State',load:()=>Promise.resolve()};
  Core.modules.map={name:'Map Module',load:()=>Core.engine.load('farm-map-pro.js')};
  Core.modules.forecast={name:'Forecast Module',load:()=>Core.engine.load('farm-forecast.js')};
  Core.modules.ai={name:'AI Module',load:()=>Core.engine.load('farm-ai.js')};
  Core.modules.water={name:'Water & Energy Module',load:()=>Core.engine.load('energy-upgrade.js')};
  Core.modules.finance={name:'Finance Module',load:()=>Core.engine.load('finance-dashboard-upgrade.js')};
  Core.modules.ledger={name:'Ledger Module',load:()=>Core.engine.loadMany(['ledger-excel-upgrade.js','ledger-mapping-upgrade.js','shareholders-upgrade.js'])};
  Core.modules.transparency={name:'Transparency Module',load:()=>Core.engine.loadMany(['calculation-transparency.js','homepage-transparency-upgrade.js','universal-transparency-upgrade.js','transparency-popup-upgrade.js'])};
  window.TanidaFarm=Core;window.FarmCore=Core;window.FarmState=Core.state;window.FarmRender=Core.render;
  function bootRoute(){
    Core.render.wrap();
    const m=Core.engine.routeModules(),jobs=[];
    if(m.map)jobs.push(Core.modules.map.load());
    if(m.forecast)jobs.push(Core.modules.forecast.load());
    if(m.finance)jobs.push(Core.modules.finance.load());
    if(m.water)jobs.push(Core.modules.water.load());
    if(m.ledger)jobs.push(Core.modules.ledger.load());
    if(m.ai)jobs.push(Core.modules.ai.load());
    Core.engine.idle(()=>Core.modules.transparency.load().catch(console.error),1500);
    Promise.allSettled(jobs).then(()=>Core.render.flush());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootRoute,{once:true});else bootRoute();
  window.addEventListener('hashchange',bootRoute,{passive:true});
  window.TanidaFarmDiagnostics=()=>({core:Core.version,route:Core.engine.route(),loadedModules:Array.from(loaded.keys()),localStateBytes:(localStorage.getItem(APP_KEY)||'').length,renderWrapped:wrapped,timestamp:new Date().toISOString()});
})();
