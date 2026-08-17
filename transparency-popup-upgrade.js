/* V10.10 — Transparency Popup UX
 * Keeps source/formula/accounting details out of the page flow.
 * Existing financial calculations are untouched.
 */
(function(){
'use strict';
function css(){
 if(document.getElementById('tpuxStyle')) return;
 const s=document.createElement('style');s.id='tpuxStyle';s.textContent=`
/* The transparency layer is an interaction, never a page section. */
#utModal,#ctModal{position:fixed!important;inset:0!important;z-index:2147483000!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,35,28,.42)!important;}
#utModal{display:none!important}#utModal[style*="display: flex"],#utModal[style*="display:flex"]{display:flex!important}
#ctModal{display:none!important}#ctModal[style*="display: flex"],#ctModal[style*="display:flex"]{display:flex!important}
#utPanel,.ct-panel{position:relative!important;width:min(760px,96vw)!important;max-height:90vh!important;overflow:auto!important;background:#fff!important;border-radius:20px!important;box-shadow:0 24px 70px rgba(0,0,0,.28)!important;}
/* Safety net for a transparency block accidentally rendered in normal document flow. */
body>.ut-flow-copy,body>.ct-flow-copy{display:none!important}
.tpux-info{position:absolute;top:9px;left:9px;z-index:25;width:29px;height:29px;border:1px solid #b8d8c7;border-radius:50%;background:#fff;color:#176b50;font:900 14px Arial,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.10);}
.tpux-info:hover{transform:scale(1.07);background:#eef7f1}
.tpux-target{position:relative!important}
@media(max-width:600px){#utModal,#ctModal{padding:9px!important}.tpux-info{opacity:1!important}}
`;
 document.head.appendChild(s);
}
function isTransparencyCopy(el){
 const t=(el.textContent||'').replace(/\s+/g,' ').trim();
 return t.includes('شفافية الحساب')||t.includes('مصدر الرقم وطريقة الحساب')||t.includes('مصدر الحساب')&&t.includes('طريقة الحساب');
}
function hideFlowCopies(){
 document.querySelectorAll('body *').forEach(el=>{
   if(el.id==='utModal'||el.id==='ctModal'||el.closest('#utModal')||el.closest('#ctModal')) return;
   if(!el.children.length && isTransparencyCopy(el)){
     let p=el.parentElement;
     for(let i=0;i<5&&p&&p!==document.body;i++,p=p.parentElement){
       if(isTransparencyCopy(p) && (p.classList.contains('card')||p.tagName==='SECTION'||p.getAttribute('role')==='dialog')){
         p.classList.add('ut-flow-copy');break;
       }
     }
   }
 });
}
function addInfoButtons(){
 const root=document.querySelector('.app-section.is-active');if(!root)return;
 const els=root.querySelectorAll('.card,.kpi,.field-summary,.detail,.ai-mini,.constraint,.road-step');
 els.forEach(el=>{
   if(el.closest('#utModal,#ctModal')||el.dataset.tpux==='1')return;
   const text=(el.innerText||'').replace(/\s+/g,' ').trim();
   if(text.length<8)return;
   el.dataset.tpux='1';el.classList.add('tpux-target');
   if(el.querySelector('.ut-info,.ct-info,.tpux-info'))return;
   const b=document.createElement('button');b.type='button';b.className='tpux-info';b.textContent='ⓘ';b.title='مصدر الرقم وطريقة الحساب';b.setAttribute('aria-label','مصدر الرقم وطريقة الحساب');
   b.onclick=function(e){e.preventDefault();e.stopPropagation();
     if(window.UniversalTransparency&&typeof window.UniversalTransparency.open==='function'){window.UniversalTransparency.open(el);return;}
     if(window.CalculationTransparency&&typeof window.CalculationTransparency.open==='function'){window.CalculationTransparency.open(el);return;}
     const m=document.getElementById('utModal')||document.getElementById('ctModal');if(m)m.style.display='flex';
   };
   el.appendChild(b);
 });
}
function boot(){
 css();
 setTimeout(hideFlowCopies,50);setTimeout(addInfoButtons,250);setTimeout(addInfoButtons,1000);
 const mo=new MutationObserver(function(){hideFlowCopies();addInfoButtons()});mo.observe(document.body,{childList:true,subtree:true});
 window.TransparencyPopupUX={refresh:function(){hideFlowCopies();addInfoButtons()}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
