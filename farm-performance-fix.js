/* Performance guard — keeps the single-page dashboard responsive. */
(function(){
  'use strict';
  const KEY='farm-performance-fix-v1';
  if(window[KEY]) return;
  window[KEY]=true;

  function replaceLegacyMapImage(){
    const img=document.querySelector('#map .map-canvas img');
    if(!img) return;
    const src=img.getAttribute('src')||'';
    if(src.indexOf('data:image/')===0){
      img.loading='lazy';
      img.decoding='async';
      img.src='farm-site-plan.svg?v=20260821-2';
      img.alt='مخطط موقع مزرعة تنيدة — الحدود الفعلية بين النقاط 4 و200.1 و200.2 و1';
    }
  }

  function optimizeDigitLocalization(){
    if(typeof window.localizeVisibleDigits!=='function') return;
    window.localizeVisibleDigits=function(){
      const root=document.querySelector('main>section.app-section.is-active')||document.querySelector('main');
      if(!root) return;
      const skip=new Set(['SCRIPT','STYLE','INPUT','TEXTAREA','SELECT','TABLE']);
      const walk=node=>{
        if(node.nodeType===3){
          if(/[0-9]/.test(node.nodeValue)) node.nodeValue=node.nodeValue.replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
          return;
        }
        if(node.nodeType===1 && skip.has(node.tagName)) return;
        node.childNodes.forEach(walk);
      };
      walk(root);
    };
  }

  function debounceRender(){
    const original=window.render;
    if(typeof original!=='function' || original.__farmPerfWrapped) return;
    let queued=false;
    const wrapped=function(){
      if(queued) return;
      queued=true;
      requestAnimationFrame(function(){
        queued=false;
        original.apply(this,arguments);
      });
    };
    wrapped.__farmPerfWrapped=true;
    wrapped.__farmOriginal=original;
    window.render=wrapped;
  }

  function cleanupLegacyMapDom(){
    const map=document.querySelector('#map');
    if(!map) return;
    map.querySelectorAll('.map-ui,.map-legend').forEach(el=>el.remove());
    const img=map.querySelector('.map-canvas img');
    if(img && (img.getAttribute('src')||'').indexOf('data:image/')===0) replaceLegacyMapImage();
  }

  function boot(){
    replaceLegacyMapImage();
    cleanupLegacyMapDom();
    optimizeDigitLocalization();
    debounceRender();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('hashchange',function(){
    replaceLegacyMapImage();
    optimizeDigitLocalization();
  },{passive:true});
})();
