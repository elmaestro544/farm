/* Tanida Farm — Unified Map Module v1
 * One authoritative interactive map. No secondary map engine, no polling loop,
 * no dependency on visual-intelligence or state-upgrade modules.
 */
(function(){
  'use strict';
  if(window.TanidaFarmMap && window.TanidaFarmMap.ready) return;

  const KEY='tanida_dashboard_v2';
  const FARM={lat:25.4026389,lng:29.4066667};
  const $=(s,r=document)=>r.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const num=v=>Number(v||0);
  const fmt=v=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(num(v));
  const values=()=>{
    const d=read(), crops=Array.isArray(d.crops)?d.crops:[];
    const wheat=crops.find(x=>String(x.name||'').includes('قمح'));
    const alf=crops.find(x=>String(x.name||'').includes('برسيم'));
    return {wheat:num(d.wheatArea??wheat?.area??50),alf:num(d.alfalfaArea??alf?.area??50),well:num(d.wellFlow??200),hours:num(d.wellHours??7),solar:num(d.solarKW??110),energy:num(d.energyCoverage??60)};
  };
  function css(){
    if($('#tanida-unified-map-css'))return;
    const s=document.createElement('style');s.id='tanida-unified-map-css';s.textContent=`
      #map .map-shell{display:block!important}
      #map .map-side{display:none!important}
      #map .map-canvas{position:relative;min-height:0!important;padding:0!important;overflow:hidden;border-radius:18px;background:#d9bd8b;isolation:isolate}
      #map .map-canvas.tanida-map-ready{border:1px solid #d7ded9;box-shadow:0 12px 30px #173f2a18}
      #map .tanida-map-image{display:block;width:100%;height:auto;max-height:850px;object-fit:contain;background:#d9bd8b}
      #map .tanida-map-actions{position:absolute;left:14px;top:14px;z-index:20;display:flex;gap:7px;flex-wrap:wrap}
      #map .tanida-map-actions a,#map .tanida-map-actions button{border:0;border-radius:10px;background:#0f7659;color:#fff;padding:7px 10px;font:700 10px Cairo,Tahoma,sans-serif;cursor:pointer;text-decoration:none}
      #map .tanida-hotspot{position:absolute;z-index:10;border:2px solid transparent;background:transparent;border-radius:16px;cursor:pointer;padding:0}
      #map .tanida-hotspot:hover,#map .tanida-hotspot.active{border-color:#0f7659;background:#0f76591c;box-shadow:0 0 0 4px #fff8}
      #map .tanida-detail{position:absolute;left:14px;bottom:14px;z-index:30;width:300px;background:#fffffff7;border:1px solid #d7e0da;border-radius:16px;padding:14px;box-shadow:0 10px 28px #0003;display:none;direction:rtl;text-align:right}
      #map .tanida-detail.show{display:block}
      #map .tanida-detail h4{margin:0 0 5px;color:#174b3a;font-size:14px}
      #map .tanida-detail p{margin:0 0 8px;color:#637168;font-size:10px;line-height:1.8}
      #map .tanida-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      #map .tanida-detail-grid div{background:#f3f7f4;border-radius:9px;padding:7px}
      #map .tanida-detail-grid span{display:block;font-size:8px;color:#77827c}
      #map .tanida-detail-grid b{display:block;font-size:13px;color:#174b3a}
      #map .tanida-close{position:absolute;left:7px;top:6px;border:0;background:transparent;color:#66736c;font-size:17px;cursor:pointer}
      #map .tanida-status{font-size:9px;color:#6b7871;margin-top:8px}
      #map .tanida-status strong{color:#0f7659}
      #map .tanida-coords{position:absolute;right:14px;bottom:14px;z-index:15;background:#fffffff2;border:1px solid #d7e0da;border-radius:10px;padding:6px 9px;font:700 9px Cairo,Tahoma,sans-serif;color:#174b3a}
      #fields .map-shell,#fields .map-canvas,#fields .map-ui,#fields .map-legend,#fields .map-head{display:none!important}
      @media(max-width:700px){#map .tanida-detail{left:8px;right:8px;bottom:8px;width:auto}#map .tanida-map-actions{left:8px;top:8px}#map .tanida-coords{right:8px;bottom:8px}}
    `;document.head.appendChild(s);
  }
  function detail(kind){
    const v=values();
    return {
      wheat:{title:'القطاع الشمالي — القمح',desc:'المساحة مرتبطة ببيانات خطة الحقول الحالية.',items:[['المساحة',fmt(v.wheat)+' فدان'],['الحالة','زراعة حالية']]},
      alf:{title:'القطاع الأوسط — البرسيم الحجازي',desc:'المساحة مرتبطة ببيانات خطة الحقول الحالية.',items:[['المساحة',fmt(v.alf)+' فدان'],['الحالة','زراعة حالية']]},
      palm1:{title:'نخيل مجدول — المنطقة الأولى',desc:'منطقة نخيل مجدول كما وردت في الدرافت الأصلي.',items:[['المحصول','نخيل مجدول'],['المصدر','الدرافت الأصلي']]},
      palm2:{title:'نخيل مجدول — المنطقة الثانية',desc:'منطقة نخيل مجدول كما وردت في الدرافت الأصلي.',items:[['المحصول','نخيل مجدول'],['المصدر','الدرافت الأصلي']]},
      well:{title:'البئر الرئيسي',desc:'مصدر المياه الرئيسي وتُقرأ قيمه من حالة التشغيل الحالية.',items:[['التصرف',fmt(v.well)+' م³/ساعة'],['التشغيل',fmt(v.hours)+' ساعة/يوم']]},
      power:{title:'الطاقة الشمسية',desc:'قيم الطاقة تُقرأ من المدخلات الحالية للنظام.',items:[['القدرة',fmt(v.solar)+' kW'],['كفاية الطاقة',fmt(v.energy)+'%']]}
    }[kind]||null;
  }
  function render(){
    const section=$('#map'); if(!section || section.dataset.unifiedMap==='1') return;
    const canvas=$('#map .map-canvas'); if(!canvas) return;
    section.dataset.unifiedMap='1'; css();
    canvas.classList.add('tanida-map-ready');
    canvas.innerHTML=`
      <img class="tanida-map-image" src="farm-site-plan.svg?v=20260821-3" alt="المخطط الفعلي لمزرعة تنيدة — الحدود بين النقاط 4 و200.1 و200.2 و1">
      <div class="tanida-map-actions">
        <a href="https://www.google.com/maps?q=${FARM.lat},${FARM.lng}" target="_blank" rel="noopener">فتح الموقع في Google Maps ↗</a>
        <button type="button" data-copy>نسخ الإحداثيات</button>
      </div>
      <div class="tanida-coords">${FARM.lat.toFixed(6)}N · ${FARM.lng.toFixed(6)}E</div>
      <button class="tanida-hotspot" data-kind="wheat" style="right:31%;top:13%;width:38%;height:25%" aria-label="القمح"></button>
      <button class="tanida-hotspot" data-kind="palm1" style="right:48%;top:34%;width:24%;height:9%" aria-label="نخيل مجدول المنطقة الأولى"></button>
      <button class="tanida-hotspot" data-kind="alf" style="right:31%;top:42%;width:38%;height:28%" aria-label="البرسيم الحجازي"></button>
      <button class="tanida-hotspot" data-kind="well" style="right:42%;top:56%;width:16%;height:14%" aria-label="البئر"></button>
      <button class="tanida-hotspot" data-kind="palm2" style="right:31%;top:70%;width:24%;height:9%" aria-label="نخيل مجدول المنطقة الثانية"></button>
      <button class="tanida-hotspot" data-kind="power" style="right:48%;top:78%;width:22%;height:14%" aria-label="الطاقة الشمسية"></button>
      <div class="tanida-detail" id="tanidaMapDetail">
        <button class="tanida-close" type="button" data-close>×</button>
        <h4 id="tanidaMapDetailTitle"></h4><p id="tanidaMapDetailDesc"></p>
        <div class="tanida-detail-grid" id="tanidaMapDetailGrid"></div>
        <div class="tanida-status">المصدر: <strong>حالة الموقع الحالية / الدرافت الأصلي</strong></div>
      </div>`;
    const detailBox=$('#tanidaMapDetail',canvas);
    const open=kind=>{const d=detail(kind);if(!d)return;$('#tanidaMapDetailTitle',canvas).textContent=d.title;$('#tanidaMapDetailDesc',canvas).textContent=d.desc;$('#tanidaMapDetailGrid',canvas).innerHTML=d.items.map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');detailBox.classList.add('show');canvas.querySelectorAll('.tanida-hotspot').forEach(x=>x.classList.toggle('active',x.dataset.kind===kind));};
    canvas.querySelectorAll('.tanida-hotspot').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();open(b.dataset.kind)}));
    $('[data-close]',canvas).addEventListener('click',()=>{detailBox.classList.remove('show');canvas.querySelectorAll('.tanida-hotspot').forEach(x=>x.classList.remove('active'))});
    $('[data-copy]',canvas).addEventListener('click',async()=>{try{await navigator.clipboard.writeText(`${FARM.lat}, ${FARM.lng}`);alert('تم نسخ الإحداثيات')}catch(e){alert(`${FARM.lat}, ${FARM.lng}`)}});
  }
  function boot(){render();}
  window.TanidaFarmMap={ready:true,render,values};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
