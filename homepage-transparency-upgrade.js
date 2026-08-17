/* V10.4 — Homepage Calculation Transparency
 * Adds the same interactive "source of number" experience to the dashboard/home page.
 * Read-only layer: it never changes the financial/agricultural calculation engine.
 */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function style(){
    if($('#homeCtStyle')) return;
    const s=document.createElement('style');
    s.id='homeCtStyle';
    s.textContent=`
      #homeCtModal{position:fixed;inset:0;z-index:100000;background:rgba(15,35,28,.38);display:none;align-items:center;justify-content:center;padding:18px;font-family:Cairo,system-ui,sans-serif}
      .home-ct-panel{width:min(720px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;border:1px solid #d8e6df;box-shadow:0 24px 70px rgba(0,0,0,.25);direction:rtl}
      .home-ct-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:20px 22px 14px;border-bottom:1px solid #e6eee9}
      .home-ct-kicker{font-size:11px;color:#6b7a72}.home-ct-title{font-size:22px;font-weight:900;color:#173f31;margin:3px 0}
      .home-ct-close{border:1px solid #d7e3dd;background:#fff;border-radius:10px;width:38px;height:38px;font-size:20px;cursor:pointer}
      .home-ct-body{padding:18px 22px 22px}.home-ct-source{background:#eef7f1;border-right:4px solid #13795b;padding:12px 14px;border-radius:10px;margin-bottom:14px}
      .home-ct-section{margin:16px 0}.home-ct-section h4{font-size:13px;color:#174c3a;margin:0 0 7px}
      .home-ct-formula{background:#f8faf9;border:1px solid #dfe9e4;border-radius:10px;padding:13px;direction:ltr;text-align:left;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;font-size:12px;line-height:1.65}
      .home-ct-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.home-ct-input{border:1px solid #e0e9e4;border-radius:10px;padding:9px;background:#fbfcfb}
      .home-ct-input span{display:block;font-size:10px;color:#6b7a72}.home-ct-input b{display:block;margin-top:2px;color:#173f31}
      .home-ct-result{background:#fff8e9;border-right:4px solid #c88a2b;border-radius:10px;padding:12px 14px;font-weight:800}
      .home-ct-link{display:inline-flex;margin-top:10px;padding:9px 12px;border-radius:9px;background:#13795b;color:#fff;text-decoration:none}
      .home-ct-note{font-size:11px;color:#6b7a72;line-height:1.7}.home-ct-tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#f1f4f2;color:#52645b;font-size:10px;margin:2px}
      .home-ct-trigger{position:absolute;top:10px;left:10px;z-index:5;border:1px solid #b8d8c7;background:#fff;color:#176b50;width:27px;height:27px;border-radius:50%;font-weight:900;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.08);opacity:.72;transition:.18s}
      .kpi:hover .home-ct-trigger,.home-ct-trigger:focus{opacity:1;transform:scale(1.06)}
      .home-ct-hint{font-size:10px;color:#6b7a72;margin-top:5px}
      @media(max-width:600px){.home-ct-inputs{grid-template-columns:1fr}.home-ct-panel{max-height:92vh}.home-ct-title{font-size:18px}}
    `;
    document.head.appendChild(s);
  }

  function modal(){
    if($('#homeCtModal')) return;
    document.body.insertAdjacentHTML('beforeend',`
      <div id="homeCtModal" role="dialog" aria-modal="true" aria-labelledby="homeCtTitle">
        <div class="home-ct-panel">
          <div class="home-ct-head"><div><div class="home-ct-kicker">شفافية الحساب • مصدر الرقم</div><div class="home-ct-title" id="homeCtTitle">تفاصيل البطاقة</div></div><button class="home-ct-close" aria-label="إغلاق">×</button></div>
          <div class="home-ct-body" id="homeCtBody"></div>
        </div>
      </div>`);
    $('#homeCtModal').addEventListener('click',e=>{if(e.target.id==='homeCtModal'||e.target.closest('.home-ct-close')) close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  function close(){const m=$('#homeCtModal');if(m)m.style.display='none';}

  const num=v=>Number(v||0);
  const ar=v=>num(v).toLocaleString('ar-EG-u-nu-arab',{maximumFractionDigits:0});
  const ar2=v=>num(v).toLocaleString('ar-EG-u-nu-arab',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money=v=>ar(v)+' ج';
  const pct=v=>ar2(v)+'٪';

  function getForecast(){
    try{return typeof buildForecast==='function'?buildForecast((window.D&&D.scenario)||'base'):null;}catch(e){return null;}
  }
  function payback(r){
    if(!r||!Array.isArray(r.years)) return null;
    let prev=null;
    for(const y of r.years){
      const cum=num(y.cum);
      if(cum>=0){
        const before=prev?num(prev.cum):num(r.openingCharge)*-1;
        const annual=num(y.net);
        const fraction=annual>0?Math.min(1,Math.max(0,(-before)/annual)):0;
        return {year:y.year,prevYear:prev?.year,exact:(prev?num(prev.year):num(y.year)-1)+fraction,before,annual};
      }
      prev=y;
    }
    return null;
  }

  function buildItem(label, value, note){
    const text=(label+' '+note).replace(/\s+/g,' ').trim();
    const r=getForecast();
    const d=window.D||{};
    const has=s=>text.includes(s);
    const baseInputs=[
      {label:'الرقم المعروض في الصفحة الرئيسية',value:value||'غير متاح'},
      {label:'السيناريو الحالي',value:d.scenario||'الأساسي'}
    ];

    if(has('استرداد رأس المال')||has('استرداد')){
      const p=payback(r);
      return {title:'استرداد رأس المال',source:'Financial Calculation Engine → Forecast ٢٠٢٦–٢٠٤٨',sourceDetail:'هذا الرقم يُقرأ من التدفقات النقدية التراكمية الناتجة عن المحرك المالي. طبقة AI لا تنشئ الرقم ولا تعدله.',type:'محسوب',engine:'Financial Calculation Engine',formula:'نحدد أول سنة يصبح فيها التدفق النقدي التراكمي ≥ ٠\nثم نحدد سنة الاسترداد.\nالنقطة الجزئية ≈ السنة السابقة + |التراكمي السابق| ÷ التدفق الموجب للسنة التالية.',inputs:p?[...baseInputs,{label:'التراكمي قبل الاسترداد',value:money(p.before)},{label:'صافي التدفق في سنة الاسترداد',value:money(p.annual)}]:baseInputs,result:p?`الاسترداد المحسوب: سنة ${ar(p.year)}${p.exact!=null?` — تقريبًا ${ar2(p.exact)}`:''}`:'لم يتحقق الاسترداد داخل فترة Forecast الحالية.',note:'تغيير المساحة أو الإنتاجية أو الأسعار أو التكاليف أو الطاقة أو الاستثمار الجديد يعيد حساب التدفق التراكمي، وبالتالي قد تتغير سنة الاسترداد تلقائيًا.',link:'#finance'};
    }
    if(has('المساحة')||has('فدان')){
      return {title:label||'المساحة',source:'خطة الحقول → بيانات المزرعة الحالية',sourceDetail:'الرقم مأخوذ من بيانات المساحات المدخلة في نموذج المزرعة، وليس من Forecast أو AI.',type:'مدخل أساسي',engine:'Agricultural Inputs',formula:'المساحة الإجمالية = مجموع المساحات المخصصة للمحاصيل/القطاعات الحالية.',inputs:baseInputs,result:value,note:'تغيير المساحة من خطة الحقول ينعكس على الإنتاج المتوقع، استهلاك المياه، الطاقة، التكاليف والإيرادات في الصفحات المرتبطة.',link:'#fields'};
    }
    if(has('إيراد')||has('الإيرادات')){
      return {title:label||'إيراد خطة الحقول',source:'خطة الحقول → Financial Calculation Engine',sourceDetail:'يُحسب من المساحة والإنتاجية والسعر لكل محصول وفق البيانات الحالية.',type:'محسوب',engine:'Financial Calculation Engine',formula:'إيراد المحصول = المساحة × الإنتاجية × سعر البيع\nإجمالي الإيرادات = Σ إيرادات المحاصيل + الإيرادات الأخرى المسجلة.',inputs:[...baseInputs,{label:'إجمالي الإيرادات Forecast',value:money(r?.totalRevenue)}],result:r?.totalRevenue!=null?money(r.totalRevenue):value,note:'تعديل المساحة أو الإنتاجية أو السعر يغير الإيراد ثم ينعكس على التدفق النقدي وNPV وIRR وPayback.',link:'#finance'};
    }
    if(has('هامش')||has('محاصيل')){
      return {title:label||'هامش المحاصيل المباشر',source:'خطة الحقول → المحاصيل والتكاليف المباشرة',sourceDetail:'الهامش يعتمد على إيرادات المحاصيل مطروحًا منها التكاليف المباشرة المشتركة/المخصصة وفق النموذج.',type:'محسوب',engine:'Financial Calculation Engine',formula:'الهامش المباشر = إيرادات المحاصيل − التكاليف المباشرة المرتبطة بالإنتاج.',inputs:baseInputs,result:value,note:'هذا مؤشر تشغيلي وليس NPV أو IRR. أي تغيير في سعر أو إنتاجية أو تكلفة محصول يؤثر عليه.',link:'#fields'};
    }
    if(has('المياه')||has('فجوة')||has('احتياج')){
      return {title:label||'المياه',source:'المياه والطاقة → نموذج الاحتياج المائي',sourceDetail:'يُبنى من احتياج المحاصيل ومساحاتها وفترة التشغيل ثم يقارن بالإمداد النظري المتاح.',type:'محسوب',engine:'Water Balance Engine',formula:'احتياج المياه = Σ (مساحة المحصول × الاحتياج المائي للمحصول)\nفجوة المياه = الإمداد النظري/المتاح − احتياج الخطة.',inputs:baseInputs,result:value,note:'تغيير المحاصيل أو المساحات أو ساعات التشغيل أو كفاءة الطاقة/الضخ ينعكس على ميزان المياه.',link:'#water'};
    }
    if(has('طاقة')||has('كهرب')||has('شمسي')){
      return {title:label||'الطاقة',source:'المياه والطاقة → بيانات الطاقة الشمسية/الكهرباء',sourceDetail:'الرقم يُقرأ من إعدادات الطاقة المدخلة ويُستخدم في تقدير تكلفة التشغيل وقدرة الضخ حسب النموذج.',type:'مدخل/محسوب',engine:'Energy Model',formula:'الطاقة المتاحة والتكلفة التشغيلية تُشتق من قدرة المصدر × ساعات التشغيل × أيام التشغيل، مع مراعاة كفاءة/تغطية المصدر.',inputs:baseInputs,result:value,note:'إضافة أو تعديل بيانات الطاقة الشمسية أو الكهرباء يجب أن ينعكس على تقديرات الري والطاقة والتكاليف والتمويل.',link:'#water'};
    }
    if(has('إيجار')){
      return {title:label||'الإيجار',source:'الافتراضات والقرار → عقد الأرض',sourceDetail:'القيمة تعتمد على الإيجار السنوي المدخل ومساحة الأرض ومعدل الزيادة إن كان مفعّلًا.',type:'مدخل/محسوب',engine:'Financial Calculation Engine',formula:'الإيجار السنوي = مساحة الأرض × إيجار الفدان\nالإيجار المستقبلي = الإيجار الحالي × (1 + معدل الزيادة)^(السنة−سنة الأساس).',inputs:baseInputs,result:value,note:'تغيير الإيجار أو خيار التملك يؤثر على التدفقات النقدية وPayback وNPV وIRR.',link:'#assumptions'};
    }
    return {title:label||'مصدر الرقم',source:'بيانات الصفحة الحالية',sourceDetail:'هذه البطاقة لا تحمل تعريفًا تفصيليًا كافيًا في النموذج الحالي؛ الرقم المعروض هو القيمة التي تنتجها الصفحة.',type:'محسوب/مدخل',engine:'Current Model',formula:'راجع المدخلات المرتبطة بالقسم ثم أعد التحليل.',inputs:baseInputs,result:value,note:'طبقة الشفافية للعرض فقط ولا تغير أي نتيجة حسابية.'};
  }

  function open(item){
    modal();
    $('#homeCtTitle').textContent=item.title;
    $('#homeCtBody').innerHTML=`
      <div class="home-ct-source"><b>المصدر:</b> ${esc(item.source)}<br><span class="home-ct-note">${esc(item.sourceDetail||'')}</span></div>
      <div class="home-ct-section"><h4>نوع الرقم</h4><span class="home-ct-tag">${esc(item.type||'محسوب')}</span>${item.engine?`<span class="home-ct-tag">${esc(item.engine)}</span>`:''}</div>
      ${item.formula?`<div class="home-ct-section"><h4>طريقة الحساب</h4><div class="home-ct-formula">${esc(item.formula)}</div></div>`:''}
      ${item.inputs?.length?`<div class="home-ct-section"><h4>المدخلات المستخدمة الآن</h4><div class="home-ct-inputs">${item.inputs.map(x=>`<div class="home-ct-input"><span>${esc(x.label)}</span><b>${esc(x.value)}</b></div>`).join('')}</div></div>`:''}
      ${item.result?`<div class="home-ct-section"><h4>النتيجة الحالية</h4><div class="home-ct-result">${esc(item.result)}</div></div>`:''}
      ${item.note?`<div class="home-ct-section"><div class="home-ct-note">${esc(item.note)}</div></div>`:''}
      ${item.link?`<a class="home-ct-link" href="${esc(item.link)}" onclick="document.getElementById('homeCtModal').style.display='none'">الانتقال إلى التفاصيل</a>`:''}`;
    $('#homeCtModal').style.display='flex';
    setTimeout(()=>$('.home-ct-close')?.focus(),0);
  }

  function install(){
    style();
    const dash=$('#dash');
    if(!dash) return;
    $$('.kpi',dash).forEach(card=>{
      if(card.dataset.homeTransparencyInstalled==='1') return;
      card.dataset.homeTransparencyInstalled='1';
      card.style.position='relative';
      const label=$('.l',card)?.textContent?.trim()||'البطاقة';
      const value=$('.v',card)?.textContent?.trim()||'';
      const note=$('.n',card)?.textContent?.trim()||'';
      const b=document.createElement('button');
      b.type='button'; b.className='home-ct-trigger'; b.title='مصدر الرقم وطريقة الحساب'; b.setAttribute('aria-label','مصدر الرقم وطريقة الحساب'); b.textContent='ⓘ';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(buildItem(label,value,note));});
      card.appendChild(b);
    });
  }

  function boot(){install();setTimeout(install,300);setTimeout(install,1000);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.HomepageTransparency={install,open};
})();
