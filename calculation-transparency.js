/* V10.3 — Calculation Transparency Layer
 * Explains where a displayed number comes from and how it is calculated.
 * This layer NEVER changes financial calculations; it only reads the existing model.
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const num=v=>Number(v||0);
const ar=v=>num(v).toLocaleString('ar-EG-u-nu-arab',{maximumFractionDigits:0});
const ar2=v=>num(v).toLocaleString('ar-EG-u-nu-arab',{minimumFractionDigits:2,maximumFractionDigits:2});
const money=v=>ar(v)+' ج';
const pct=v=>ar2(v)+'٪';
const year=v=>ar(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function style(){
 if($('#calcTransparencyStyle'))return;
 const s=document.createElement('style');s.id='calcTransparencyStyle';s.textContent=`
 .ct-target{position:relative;cursor:help}.ct-target .ct-info{position:absolute;top:8px;left:8px;z-index:3;width:25px;height:25px;border:1px solid #b8d8c7;border-radius:50%;background:#fff;color:#176b50;font-weight:900;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.9);transition:.18s;box-shadow:0 3px 12px rgba(0,0,0,.08);font-family:Arial,sans-serif}.ct-target:hover .ct-info,.ct-target:focus-within .ct-info,.ct-target.ct-touch .ct-info{opacity:1;transform:scale(1)}
 .ct-info:focus{outline:3px solid rgba(23,107,80,.18)}
 #ctModal{position:fixed;inset:0;z-index:99999;background:rgba(15,35,28,.38);display:none;align-items:center;justify-content:center;padding:18px;font-family:Cairo,system-ui,sans-serif}.ct-panel{width:min(720px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;border:1px solid #d8e6df;box-shadow:0 24px 70px rgba(0,0,0,.25);direction:rtl}.ct-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:20px 22px 14px;border-bottom:1px solid #e6eee9}.ct-kicker{font-size:11px;color:#6b7a72}.ct-title{font-size:22px;font-weight:900;color:#173f31;margin:3px 0}.ct-close{border:1px solid #d7e3dd;background:#fff;border-radius:10px;width:38px;height:38px;font-size:20px;cursor:pointer}.ct-body{padding:18px 22px 22px}.ct-source{background:#eef7f1;border-right:4px solid #13795b;padding:12px 14px;border-radius:10px;margin-bottom:14px}.ct-section{margin:16px 0}.ct-section h4{font-size:13px;color:#174c3a;margin:0 0 7px}.ct-formula{background:#f8faf9;border:1px solid #dfe9e4;border-radius:10px;padding:13px;direction:ltr;text-align:left;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;font-size:12px;line-height:1.65}.ct-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ct-input{border:1px solid #e0e9e4;border-radius:10px;padding:9px;background:#fbfcfb}.ct-input span{display:block;font-size:10px;color:#6b7a72}.ct-input b{display:block;margin-top:2px;color:#173f31}.ct-result{background:#fff8e9;border-right:4px solid #c88a2b;border-radius:10px;padding:12px 14px;font-weight:800}.ct-link{display:inline-flex;margin-top:10px;padding:9px 12px;border-radius:9px;background:#13795b;color:#fff;text-decoration:none}.ct-note{font-size:11px;color:#6b7a72;line-height:1.7}.ct-tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#f1f4f2;color:#52645b;font-size:10px;margin:2px}
 @media(max-width:600px){.ct-inputs{grid-template-columns:1fr}.ct-panel{max-height:92vh}.ct-title{font-size:18px}}
 `;document.head.appendChild(s);
}
function modal(){if($('#ctModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="ctModal" role="dialog" aria-modal="true" aria-labelledby="ctTitle"><div class="ct-panel"><div class="ct-head"><div><div class="ct-kicker">شفافية الحساب • مصدر الرقم</div><div class="ct-title" id="ctTitle">تفاصيل البطاقة</div></div><button class="ct-close" aria-label="إغلاق">×</button></div><div class="ct-body" id="ctBody"></div></div></div>`);$('#ctModal').addEventListener('click',e=>{if(e.target.id==='ctModal'||e.target.closest('.ct-close'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}
function close(){const m=$('#ctModal');if(m)m.style.display='none'}
function open(item){modal();$('#ctTitle').textContent=item.title;$('#ctBody').innerHTML=`<div class="ct-source"><b>المصدر:</b> ${esc(item.source)}<br><span class="ct-note">${esc(item.sourceDetail||'')}</span></div><div class="ct-section"><h4>نوع الرقم</h4><span class="ct-tag">${esc(item.type||'محسوب')}</span>${item.engine?`<span class="ct-tag">${esc(item.engine)}</span>`:''}</div>${item.formula?`<div class="ct-section"><h4>طريقة الحساب</h4><div class="ct-formula">${esc(item.formula)}</div></div>`:''}${item.inputs?.length?`<div class="ct-section"><h4>المدخلات المستخدمة الآن</h4><div class="ct-inputs">${item.inputs.map(x=>`<div class="ct-input"><span>${esc(x.label)}</span><b>${esc(x.value)}</b></div>`).join('')}</div></div>`:''}${item.result?`<div class="ct-section"><h4>النتيجة الحالية</h4><div class="ct-result">${esc(item.result)}</div></div>`:''}${item.note?`<div class="ct-section"><div class="ct-note">${esc(item.note)}</div></div>`:''}${item.link?`<a class="ct-link" href="${esc(item.link)}">الانتقال إلى التفاصيل</a>`:''}`;$('#ctModal').style.display='flex';setTimeout(()=>$('.ct-close')?.focus(),0)}

function forecast(){try{return typeof buildForecast==='function'?buildForecast((window.D&&D.scenario)||'base'):null}catch(e){return null}}
function commonForecastInputs(r){
 const d=window.D||{};const y=r?.years||[];return [
  {label:'فترة التنبؤ',value:y.length?`${year(y[0].year)} – ${year(y[y.length-1].year)}`:'غير متاح'},
  {label:'رأس المال الافتتاحي',value:money(r?.openingCharge)},
  {label:'السيناريو',value:r?.scenario?.name||d.scenario||'الأساسي'},
  {label:'معدل الخصم',value:d.discountRate!=null?pct(num(d.discountRate)*100):'حسب إعدادات المحرك'}
 ];
}
function getPayback(r){
 if(!r)return null;const ys=r.years||[];let first=null,prev=null;
 for(let i=0;i<ys.length;i++){const c=num(ys[i].cum);if(c>=0&&first===null){first=ys[i];prev=i?ys[i-1]:null;break}}
 if(!first)return {year:null,prev:null,inputs:commonForecastInputs(r)};
 const opening=num(r.openingCharge),before=prev?num(prev.cum):opening*-1,annual=num(first.net);let fraction=annual>0?Math.min(1,Math.max(0,(-before)/annual)):0;const exact=(prev?num(prev.year):num(first.year)-1)+fraction;
 return {year:first.year,prev,first,exact,inputs:[...commonForecastInputs(r),{label:'التدفق في سنة التعادل',value:money(first.net)},{label:'التراكمي قبل التعادل',value:money(before)}]};
}
function resolve(label,card){
 const text=(label+' '+(card?.innerText||'')).replace(/\s+/g,' ').trim();const r=forecast();const d=window.D||{};
 const has=s=>text.includes(s);
 if(has('استرداد رأس المال')||has('Payback')){const p=getPayback(r);return {title:'استرداد رأس المال',source:'Financial Calculation Engine → Forecast ٢٠٢٦–٢٠٤٨',sourceDetail:'الرقم ليس تقديرًا من الذكاء الاصطناعي؛ يتم قراءته من نتيجة المحرك المالي الحالية بعد تطبيق السيناريو والمدخلات.',type:'محسوب',engine:'Financial Calculation Engine',formula:'نبحث عن أول سنة يصبح فيها التدفق النقدي التراكمي ≥ ٠\nثم نحدد سنة الاسترداد.\nولعرض نقطة التعادل الجزئية:\nالسنة السابقة + |التراكمي السابق| ÷ التدفق النقدي الموجب للسنة التالية.',inputs:p?.inputs||[],result:p?.year?`الاسترداد المحسوب: سنة ${year(p.year)}${p.exact!=null?` (تقريبًا ${ar2(p.exact)})`:''}`:'لم يتحقق الاسترداد داخل فترة Forecast الحالية.',note:'إذا تغيرت مساحة محصول، سعر، تكلفة ري، طاقة، استثمار جديد أو أي مدخل في النموذج، يعاد حساب Payback تلقائيًا. لا يتم تعديل النتيجة يدويًا.',link:'#finance'}}
 if(has('NPV')){const rate=num(d.discountRate||d.discount||0);return {title:'صافي القيمة الحالية NPV',source:'Financial Calculation Engine → التدفقات النقدية السنوية',sourceDetail:'يستخدم التدفقات التي ينتجها Forecast، وليس أرقامًا مولدة من AI.',type:'محسوب',engine:'Financial Calculation Engine',formula:'NPV = Σ [Cash Flowₜ ÷ (1 + r)ᵗ] − Initial Investment',inputs:[...commonForecastInputs(r),{label:'NPV الحالي',value:money(r?.npv)}],result:r?.npv!=null?money(r.npv):'غير متاح',note:'موجب = قيمة اقتصادية مضافة وفق معدل الخصم المستخدم؛ سالب = القيمة الحالية للتدفقات لا تغطي الاستثمار وفق الافتراضات الحالية.'}}
 if(has('IRR')){return {title:'معدل العائد الداخلي IRR',source:'Financial Calculation Engine → التدفقات النقدية السنوية',sourceDetail:'IRR ناتج عن حل معدل يجعل صافي القيمة الحالية للتدفقات مساويًا للصفر.',type:'محسوب',engine:'Financial Calculation Engine',formula:'ابحث عن r بحيث: 0 = Σ [Cash Flowₜ ÷ (1 + r)ᵗ] − Initial Investment',inputs:[...commonForecastInputs(r),{label:'IRR الحالي',value:r?.irr==null?'غير متاح':pct(num(r.irr)*100)}],result:r?.irr==null?'غير متاح':pct(num(r.irr)*100),note:'لا تسمح طبقة الشفافية للـAI بتغيير IRR؛ هو ناتج محرك التدفقات النقدية.'}}
 if(has('ROI')||has('العائد على الاستثمار')){const inv=num(r?.openingCharge);return {title:'العائد على الاستثمار ROI',source:'Financial Calculation Engine → إجمالي صافي التدفقات',sourceDetail:'المعادلة تعتمد على صافي العائد المحسوب في Forecast ورأس المال محل الاختبار.',type:'محسوب',engine:'Financial Calculation Engine',formula:'ROI = إجمالي صافي العائد ÷ رأس المال المستثمر × ١٠٠',inputs:[{label:'صافي العائد',value:money(r?.totalNet)},{label:'رأس المال المستثمر',value:money(inv)}],result:inv?pct(num(r.totalNet)/inv*100):'غير متاح'}}
 if(has('الإيرادات')||has('إيراد')){return {title:label||'الإيرادات',source:'Forecast والمحاصيل/المدخلات الزراعية',sourceDetail:'الرقم ينتج من المساحات × الإنتاجية × السعر لكل محصول ثم يجمع سنويًا وفق دورة المحاصيل.',type:'محسوب',engine:'Financial Calculation Engine',formula:'إيراد المحصول = المساحة × الإنتاجية × سعر البيع\nإجمالي الإيرادات = Σ إيرادات المحاصيل + أي إيرادات أخرى مسجلة',inputs:[{label:'إجمالي الإيرادات',value:money(r?.totalRevenue)}],result:money(r?.totalRevenue),note:'تغيير مساحة أو إنتاجية أو سعر ينعكس على الإيرادات ثم على التدفق النقدي وباقي مؤشرات الاستثمار.'}}
 if(has('التكلفة')||has('المصروفات')){return {title:label||'التكاليف والمصروفات',source:'Financial Calculation Engine → تكاليف التشغيل والاستثمار',sourceDetail:'تجمع تكاليف الزراعة والري والطاقة والعمالة والأسمدة والمبيدات والصيانة والحصاد والنقل وغيرها وفق المدخلات المتاحة.',type:'محسوب',engine:'Financial Calculation Engine',formula:'إجمالي التكلفة = تكاليف التشغيل + تكاليف الاستثمار + البنود الأخرى المعرفة في النموذج',inputs:[{label:'إجمالي التكلفة',value:money(r?.totalCost)}],result:money(r?.totalCost)}}
 if(has('التدفق النقدي')||has('Cash Flow')){return {title:label||'التدفق النقدي',source:'Financial Calculation Engine → Forecast السنوي',sourceDetail:'صافي التدفق لكل سنة هو الأساس لمسار الاسترداد وNPV وIRR.',type:'محسوب',engine:'Financial Calculation Engine',formula:'Net Cash Flowₜ = Cash Inflowsₜ − Cash Outflowsₜ',inputs:[{label:'إجمالي صافي التدفق',value:money(r?.totalNet)}],result:money(r?.totalNet)}}
 if(has('المساهم')||has('الملكية')){const sh=Array.isArray(d.shareholders)?d.shareholders:[];const total=sh.reduce((s,x)=>s+num(x.amount),0);return {title:label||'المساهمون والملكية',source:'السجل المحاسبي → ورقة المساهمين',sourceDetail:'بيانات الملكية مصدرها السجل المستورد، ولا يتم افتراض مساهم أو نسبة ملكية غير موجودة في السجل.',type:'بيانات مصدرية',engine:'Ledger / Shareholders',formula:'نسبة الملكية = مساهمة المساهم ÷ إجمالي رأس المال المسجل × ١٠٠',inputs:[{label:'عدد المساهمين',value:ar(sh.length)},{label:'إجمالي رأس المال',value:money(total)}],result:`تم التعرف على ${ar(sh.length)} مساهمين` ,link:'#finance'}}
 return {title:label||'تفاصيل الرقم',source:'بيانات الموقع أو مدخلات المزرعة',sourceDetail:'هذه البطاقة لا تملك تعريفًا حسابيًا مخصصًا في طبقة الشفافية بعد. يمكن ربطها لاحقًا بمصدر أو معادلة دقيقة دون تغيير الرقم المعروض.',type:'مصدر/مدخل',note:'هذه رسالة أمان معلوماتي: النظام لا يخترع مصدرًا غير مسجل.'};
}
function labelOf(card){return (card.querySelector('.label,h3,h2,.eyebrow,th')?.textContent||card.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)}
function decorate(root=document){
 const selectors='.fd-kpi,.fd-card,.fd-sidebox,.card.stat,.stat-card,.metric-card,.kpi-card,.summary-card';
 $$(selectors).filter(el=>!el.dataset.ctBound).forEach(card=>{
  const label=labelOf(card);if(!label)return;card.dataset.ctBound='1';card.classList.add('ct-target');
  const b=document.createElement('button');b.className='ct-info';b.type='button';b.title='مصدر الرقم وطريقة الحساب';b.setAttribute('aria-label','مصدر الرقم وطريقة الحساب');b.textContent='؟';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();card.classList.add('ct-touch');open(resolve(label,card))});card.appendChild(b);
  card.addEventListener('mouseenter',()=>{const r=resolve(label,card);card.title='مرر المؤشر ثم اضغط ؟ لمعرفة مصدر الرقم وطريقة حسابه'});
 });
}
function init(){style();modal();decorate();const mo=new MutationObserver(()=>decorate());mo.observe(document.body,{childList:true,subtree:true});window.CalculationTransparency={openFor:(el)=>open(resolve(labelOf(el),el)),resolve};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
