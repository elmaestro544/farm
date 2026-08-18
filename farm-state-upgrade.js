(()=>{
  const DOC=()=>document;
  function addStyle(){const s=DOC().createElement('style');s.textContent=`
    .farm-live-panel{background:#fff;border:1px solid #dce5df;border-radius:18px;padding:18px;margin:16px 0;box-shadow:0 8px 26px rgba(17,38,29,.08);font-family:Cairo,Tahoma,Arial,sans-serif}
    .farm-live-panel h3{color:#0f5d47;margin:0 0 10px}.farm-live-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.farm-live-item{border:1px solid #dce5df;border-radius:12px;padding:10px;background:#f8fbf9}.farm-live-item label{display:block;font-size:11px;color:#65736b;margin-bottom:4px}.farm-live-item input{width:100%;border:1px solid #cbd7d0;border-radius:9px;padding:8px;box-sizing:border-box}.farm-live-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.farm-live-actions button{border:0;border-radius:9px;padding:9px 13px;background:#13795b;color:#fff;cursor:pointer}.farm-live-actions button.secondary{background:#e8f0ec;color:#164b3b}.farm-live-source{font-size:11px;color:#65736b;margin-top:9px}.farm-live-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.farm-live-kpi{background:#f7faf8;border-radius:10px;padding:10px}.farm-live-kpi b{display:block;color:#0f5d47;font-size:18px}.farm-plan-image{width:100%;display:block;border-radius:14px;border:1px solid #dce5df;background:#f7faf8}.farm-plan-wrap{margin-top:14px}.farm-plan-caption{font-size:11px;color:#65736b;margin-top:7px}
    @media(max-width:900px){.farm-live-grid{grid-template-columns:repeat(2,1fr)}.farm-live-summary{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.farm-live-grid,.farm-live-summary{grid-template-columns:1fr}}
  `;DOC().head.appendChild(s)}
  function state(){const k='tanida_dashboard_v2';try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}}
  function save(d){localStorage.setItem('tanida_dashboard_v2',JSON.stringify(d));}
  function num(v){return Number(v||0)}
  function money(v){return num(v).toLocaleString('ar-EG',{maximumFractionDigits:0})+' ج'}
  function syncLegacyMemory(d){try{ if(typeof D!=='undefined'){ if(d.wellFlow!=null)D.wellFlow=d.wellFlow;if(d.wellHours!=null)D.wellHours=d.wellHours;if(d.solarKW!=null)D.solarKW=d.solarKW;if(d.energyCoverage!=null)D.energyCoverage=d.energyCoverage; if(Array.isArray(D.crops)){const w=D.crops.find(c=>String(c.name||'').includes('قمح'));const a=D.crops.find(c=>String(c.name||'').includes('برسيم'));if(w&&d.wheatArea!=null)w.area=d.wheatArea;if(a&&d.alfalfaArea!=null)a.area=d.alfalfaArea;} saveSilent(); if(typeof render==='function')render(); }}catch(e){console.warn('syncLegacyMemory',e)}}
  function buildPanel(){
    const mapSection=DOC().querySelector('#map'); if(!mapSection||mapSection.dataset.liveEnhanced)return; mapSection.dataset.liveEnhanced='1';
    const card=mapSection.querySelector('.card'); if(!card)return;
    const s=state(); const crops=Array.isArray(s.crops)?s.crops:[]; const wheat=crops.find(c=>String(c.name||'').includes('قمح')); const alf=crops.find(c=>String(c.name||'').includes('برسيم'));
    const panel=DOC().createElement('div'); panel.className='farm-live-panel'; panel.innerHTML=`<h3>بيانات الموقع الحالية — تفاعلية</h3><div class="farm-live-grid">
      <div class="farm-live-item"><label>إجمالي الأرض (فدان)</label><input data-k="totalLand" type="number" value="${s.totalLand||200}"></div>
      <div class="farm-live-item"><label>الأرض المجهزة (فدان)</label><input data-k="preparedLand" type="number" value="${s.preparedLand||140}"></div>
      <div class="farm-live-item"><label>قمح (فدان)</label><input data-k="wheatArea" type="number" value="${wheat?.area||50}"></div>
      <div class="farm-live-item"><label>برسيم حجازي (فدان)</label><input data-k="alfalfaArea" type="number" value="${alf?.area||50}"></div>
      <div class="farm-live-item"><label>تصرف البئر (م³/ساعة)</label><input data-k="wellFlow" type="number" value="${s.wellFlow||200}"></div>
      <div class="farm-live-item"><label>ساعات تشغيل البئر/يوم</label><input data-k="wellHours" type="number" value="${s.wellHours||7}"></div>
      <div class="farm-live-item"><label>الطاقة الشمسية (kW)</label><input data-k="solarKW" type="number" value="${s.solarKW||110}"></div>
      <div class="farm-live-item"><label>كفاية الطاقة (%)</label><input data-k="energyCoverage" type="number" value="${s.energyCoverage||60}"></div>
    </div><div class="farm-live-actions"><button id="farmApply">تحديث حالة الموقع</button><button id="farmReset" class="secondary">إعادة القيم الحالية</button></div><div class="farm-live-summary" id="farmLiveSummary"></div><div class="farm-live-source">مصدر الأرقام: بيانات اللوحة الحالية + مدخلات هذه النافذة. التغييرات تحفظ محليًا وتُستخدم في الحسابات التي تعتمد على هذه المتغيرات.</div>`;
    card.insertBefore(panel,card.querySelector('.map-shell')||card.firstChild);
    function refresh(){const d=state();const total=num(d.totalLand||200),prepared=num(d.preparedLand||140),wa=num(d.wellFlow||200)*num(d.wellHours||7)*365;const cropNeed=(Array.isArray(d.crops)?d.crops:[]).reduce((a,c)=>a+num(c.area)*num(c.water)*(num(c.cycles)||1),0);DOC().getElementById('farmLiveSummary').innerHTML=`<div class="farm-live-kpi"><span>نسبة التجهيز</span><b>${total?Math.round(prepared/total*100):0}%</b></div><div class="farm-live-kpi"><span>إمداد المياه النظري</span><b>${Math.round(wa/1000)} ألف م³</b></div><div class="farm-live-kpi"><span>فجوة المياه</span><b>${money(wa-cropNeed)}</b></div>`}
    panel.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{const d=state();d[i.dataset.k]=num(i.value);save(d);refresh()}));
    panel.querySelector('#farmApply').onclick=()=>{const d=state();panel.querySelectorAll('input').forEach(i=>d[i.dataset.k]=num(i.value));if(Array.isArray(d.crops)){const w=d.crops.find(c=>String(c.name||'').includes('قمح'));const a=d.crops.find(c=>String(c.name||'').includes('برسيم'));if(w)w.area=d.wheatArea||w.area;if(a)a.area=d.alfalfaArea||a.area;}save(d);syncLegacyMemory(d);refresh();alert('تم تحديث حالة الموقع وحفظها محليًا وإعادة ربطها بمحرك الحساب.');};
    panel.querySelector('#farmReset').onclick=()=>{const d=state();panel.querySelectorAll('input').forEach(i=>i.value=d[i.dataset.k]??i.value);refresh()}; refresh();
    const img=card.querySelector('.map-canvas img'); if(img){img.src='farm-master-plan.svg';img.alt='مخطط مزرعة تنيدة — مخطط توضيحي';} else {const wrap=DOC().createElement('div');wrap.className='farm-plan-wrap';wrap.innerHTML='<img class="farm-plan-image" src="farm-master-plan.svg" alt="مخطط مزرعة تنيدة — مخطط توضيحي"><div class="farm-plan-caption">مخطط توضيحي للموقع؛ الجداول والمدخلات التفاعلية هي مصدر الحسابات.</div>';card.appendChild(wrap)}
  }
  function run(){addStyle();buildPanel()}
  if(DOC().readyState==='loading')DOC().addEventListener('DOMContentLoaded',run);else run();
})();
