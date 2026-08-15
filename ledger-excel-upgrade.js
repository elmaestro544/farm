/* Tanida Farm — Accounting Ledger / Excel Upgrade
 * Adds Excel/XLSX import, validation, preview, duplicate detection, template/export,
 * automatic classification, and live linkage to the existing financial engine.
 * Financial calculations remain owned by the existing model; this module only updates D.ledger.
 */
(function(){
  'use strict';
  const KEY='tanida_ledger_import_meta_v1';
  const CDN='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const $=id=>document.getElementById(id);
  const arabNum=x=>Number(x||0).toLocaleString('ar-EG-u-nu-arab',{maximumFractionDigits:2});
  const money=x=>arabNum(x)+' ج';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let pending=[];

  function normalize(v){return String(v??'').trim().replace(/\s+/g,' ').toLowerCase();}
  function num(v){
    if(typeof v==='number') return isFinite(v)?v:0;
    let s=String(v??'').trim();
    if(!s)return 0;
    s=s.replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[٬,]/g,'').replace(/[٫]/g,'.').replace(/جنيه|ج|EGP|LE/gi,'').replace(/\s/g,'');
    const n=Number(s.replace(/[^0-9.+-]/g,''));
    return isFinite(n)?n:0;
  }
  function canonicalHeader(h){
    const x=normalize(h).replace(/[ـ_]/g,'');
    const map={
      'التاريخ':'date','date':'date','تاريخ':'date','transaction date':'date',
      'الوصف':'desc','description':'desc','البيان':'desc','الشرح':'desc','details':'desc','المعاملة':'desc',
      'المبلغ':'amount','amount':'amount','القيمة':'amount','value':'amount','اجمالي':'amount','الإجمالي':'amount','total':'amount',
      'المدين':'debit','debit':'debit','مدين':'debit','المصروف':'debit',
      'الدائن':'credit','credit':'credit','دائن':'credit','الإيراد':'credit',
      'النوع':'type','type':'type','نوع الحركة':'type',
      'التصنيف':'cat','category':'cat','التصنيف المحاسبي':'cat','الفئة':'cat',
      'المرجع':'ref','reference':'ref','رقم المرجع':'ref','رقم':'ref','ref':'ref',
      'المشروع':'project','project':'project','مركز التكلفة':'costcenter','cost center':'costcenter'
    };
    return map[x]||null;
  }
  function parseDate(v){
    if(v instanceof Date && !isNaN(v)) return v.toISOString().slice(0,10);
    if(typeof v==='number' && window.XLSX && XLSX.SSF){
      try{return XLSX.SSF.format('yyyy-mm-dd',v)}catch(e){}
    }
    let s=String(v??'').trim(); if(!s)return '';
    s=s.replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[.]/g,'-').replace(/\//g,'-');
    const d=new Date(s); if(!isNaN(d))return d.toISOString().slice(0,10);
    const m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/); if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return s;
  }
  function classify(desc, type, cat, amount){
    let t=String(type||'').trim(), c=String(cat||'').trim();
    const d=normalize(desc);
    if(!t){
      if(/تمويل|مساهم|رأس مال|رأسـمال|شريك|قرض|سلفة/.test(d))t='تمويل';
      else if(/بيع|مبيعات|إيراد|توريد|محصول|قمح|برسيم|نخيل|تمر/.test(d))t='إيراد';
      else t='مصروف';
    }
    if(!c){
      if(/أرض|ايجار|إيجار|تملك|شراء أرض/.test(d))c='أرض';
      else if(/مضخة|بئر|طاقة|كهرباء|شمس|ري|مياه|صيانة|وقود/.test(d))c='تشغيل';
      else if(/آلة|معدات|شبكة|نظام|ألواح|تجهيز|إنشاء|بنية/.test(d))c='رأسمالي';
      else if(/قمح|برسيم|نخيل|بذور|سماد|مبيد|حصاد|نقل محصول/.test(d))c='إنتاج';
      else c='أخرى';
    }
    return {type:t,cat:c};
  }
  function rowKey(x){return [x.date,normalize(x.desc),Number(x.amount).toFixed(2),normalize(x.type),normalize(x.cat)].join('|');}

  function ensureLibrary(cb){
    if(window.XLSX)return cb();
    const s=document.createElement('script'); s.src=CDN; s.onload=()=>cb(); s.onerror=()=>alert('تعذر تحميل مكتبة Excel. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.'); document.head.appendChild(s);
  }
  function normalizeRows(raw){
    if(!raw.length)return [];
    const headers=Object.keys(raw[0]);
    const mapped=headers.map(h=>({h,key:canonicalHeader(h)}));
    return raw.map((r,idx)=>{
      const get=k=>{const m=mapped.find(x=>x.key===k);return m?r[m.h]:''};
      const debit=num(get('debit')),credit=num(get('credit'));
      let amount=num(get('amount')); if(!amount && (debit||credit)) amount=credit||debit;
      const desc=String(get('desc')||'').trim();
      const cls=classify(desc,get('type'),get('cat'),amount);
      return {date:parseDate(get('date')),desc,amount,type:cls.type,cat:cls.cat,ref:String(get('ref')||'').trim(),sourceRow:idx+2,project:String(get('project')||'').trim(),costcenter:String(get('costcenter')||'').trim()};
    }).filter(x=>x.desc||x.amount||x.date);
  }
  function validate(rows){
    const existing=new Set((window.D?.ledger||[]).map(rowKey));
    const seen=new Set(), errors=[], clean=[];
    rows.forEach((r,i)=>{
      const er=[];
      if(!r.date)er.push('التاريخ مفقود');
      if(!r.desc)er.push('الوصف مفقود');
      if(!(r.amount>0))er.push('المبلغ غير صالح');
      const k=rowKey(r);
      const dup=existing.has(k)||seen.has(k); if(dup)er.push('مكرر');
      seen.add(k);
      (er.length?errors:clean).push(er.length?{...r,_row:i+1,_errors:er}:r);
    });
    return {clean,errors};
  }
  function addPanel(){
    const sec=$('ledger'); if(!sec||$('ledgerExcelPanel'))return;
    const card=document.createElement('div');card.className='card';card.id='ledgerExcelPanel';
    card.innerHTML=`<div class="section-head"><div><span class="eyebrow">المحاسبة والبيانات</span><h3>استيراد وتحديث ملفات Excel</h3><div class="small">استيراد آمن مع معاينة وتحقق وتجنب التكرار، ثم إعادة حساب المؤشرات والـForecast من السجل نفسه.</div></div><span id="ledgerExcelStatus" class="badge info">جاهز</span></div>
    <div class="callout" style="margin-top:12px"><b>صيغة الأعمدة المقبولة:</b> التاريخ، الوصف، المبلغ، النوع، التصنيف. ويمكن استخدام «مدين» و«دائن» بدل المبلغ. إذا غاب النوع أو التصنيف يحاول النظام تصنيفه آليًا من الوصف، وتظل الحركة قابلة للمراجعة قبل الاستيراد.</div>
    <div class="controls no-print" style="margin-top:14px">
      <button class="btn" id="excelChoose">اختيار ملف Excel / CSV</button>
      <button class="btn secondary" id="excelTemplate">تحميل قالب Excel</button>
      <button class="btn secondary" id="excelExport">تصدير السجل الحالي إلى Excel</button>
      <input id="excelLedgerFile" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style="display:none">
    </div>
    <div id="excelPreview" style="margin-top:14px"></div>`;
    sec.insertBefore(card,sec.firstElementChild?.nextElementSibling||sec.firstElementChild);
    $('excelChoose').onclick=()=>$('excelLedgerFile').click();
    $('excelLedgerFile').onchange=e=>{const f=e.target.files?.[0];if(f)readFile(f)};
    $('excelTemplate').onclick=downloadTemplate;
    $('excelExport').onclick=exportLedger;
    $('ledgerExcelStatus').textContent='جاهز للاستيراد';
    updateLedgerHeader();
  }
  function updateLedgerHeader(){
    const h=$('ledger')?.querySelector('h2'); if(h)h.textContent='السجل المحاسبي — استيراد وتحديث ملفات EXCEL';
    const call=$('ledger')?.querySelector('.callout'); if(call && !call.dataset.excelUpdated) {call.innerHTML='يمكنك إدخال الحركات يدويًا أو استيراد <b>Excel / XLSX / XLS / CSV</b>. يتم التحقق من الأعمدة والمبالغ والتاريخ وكشف التكرار قبل الإضافة. بعد الاعتماد يعاد تحديث التمويل والإيرادات والمصروفات والرصيد وقراءات الاستثمار والـForecast تلقائيًا.';call.dataset.excelUpdated='1';}
  }
  function readFile(file){
    ensureLibrary(()=>{const reader=new FileReader();reader.onload=e=>{try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(ws,{defval:''});
      pending=normalizeRows(raw);const v=validate(pending);pending=v.clean;renderPreview(file.name,v);
    }catch(err){alert('تعذر قراءة الملف: '+err.message)}};reader.readAsArrayBuffer(file)});
  }
  function renderPreview(fileName,v){
    const el=$('excelPreview'); if(!el)return;
    const bad=v.errors.length, good=v.clean.length;
    $('ledgerExcelStatus').textContent=`${arabNum(good)} حركة صالحة`;
    const sample=[...v.clean,...v.errors].slice(0,12);
    el.innerHTML=`<div class="grid g4"><div class="kpi"><div class="l">الملف</div><div class="v" style="font-size:16px">${esc(fileName)}</div></div><div class="kpi"><div class="l">صالح للاستيراد</div><div class="v">${arabNum(good)}</div></div><div class="kpi"><div class="l">مرفوض/مكرر</div><div class="v">${arabNum(bad)}</div></div><div class="kpi"><div class="l">إجمالي صالح</div><div class="v">${money(v.clean.reduce((s,x)=>s+x.amount,0))}</div></div></div>
    <div style="overflow:auto;margin-top:12px"><table><thead><tr><th>التاريخ</th><th>الوصف</th><th>المبلغ</th><th>النوع</th><th>التصنيف</th><th>الحالة</th></tr></thead><tbody>${sample.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.desc)}</td><td>${money(x.amount)}</td><td>${esc(x.type)}</td><td>${esc(x.cat)}</td><td>${x._errors?'<span class="badge bad">'+esc(x._errors.join('، '))+'</span>':'<span class="badge good">صالح</span>'}</td></tr>`).join('')}</tbody></table></div>
    <div class="controls no-print" style="margin-top:12px"><button class="btn" id="confirmExcel" ${good?'':'disabled'}>اعتماد وإضافة ${arabNum(good)} حركة</button><button class="btn secondary" id="cancelExcel">إلغاء المعاينة</button></div>`;
    $('confirmExcel').onclick=commitPending;$('cancelExcel').onclick=()=>{pending=[];$('excelPreview').innerHTML='';$('ledgerExcelStatus').textContent='جاهز للاستيراد';};
  }
  function commitPending(){
    if(!pending.length||!window.D)return;
    const before=D.ledger.length;D.ledger.push(...pending.map(x=>({date:x.date,desc:x.desc,amount:x.amount,type:x.type,cat:x.cat,ref:x.ref||'',source:'Excel'})));
    if(typeof saveSilent==='function')saveSilent();else if(typeof saveData==='function')saveData();
    if(typeof render==='function')render();
    try{localStorage.setItem(KEY,JSON.stringify({lastImport:new Date().toISOString(),count:D.ledger.length-before}))}catch(e){}
    const count=pending.length;pending=[];$('excelPreview').innerHTML=`<div class="callout"><b>تم الاستيراد بنجاح.</b> أضيفت ${arabNum(count)} حركة إلى السجل، وأعيد تحديث الحسابات من المصدر نفسه.</div>`;$('ledgerExcelStatus').textContent='تم التحديث';
  }
  function downloadTemplate(){
    ensureLibrary(()=>{const rows=[
      {'التاريخ':'2026-01-15','الوصف':'شراء أسمدة','المبلغ':25000,'النوع':'مصروف','التصنيف':'إنتاج','المرجع':'INV-001'},
      {'التاريخ':'2026-02-01','الوصف':'مساهمة شريك','المبلغ':100000,'النوع':'تمويل','التصنيف':'أخرى','المرجع':'CAP-001'},
      {'التاريخ':'2026-05-20','الوصف':'بيع قمح','المبلغ':80000,'النوع':'إيراد','التصنيف':'إنتاج','المرجع':'SAL-001'}
    ];const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[{wch:14},{wch:30},{wch:16},{wch:14},{wch:16},{wch:16}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'السجل المحاسبي');XLSX.writeFile(wb,'Tanida_Accounting_Template.xlsx')});
  }
  function exportLedger(){
    ensureLibrary(()=>{const rows=(window.D?.ledger||[]).map(x=>({'التاريخ':x.date,'الوصف':x.desc,'المبلغ':x.amount,'النوع':x.type,'التصنيف':x.cat,'المرجع':x.ref||''}));const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'السجل المحاسبي');XLSX.writeFile(wb,'Tanida_Accounting_Ledger.xlsx')});
  }
  // Optional duplicate-aware override for the legacy CSV input.
  window.importCSV=function(ev){const f=ev.target.files?.[0];if(!f)return;readFile(f);ev.target.value='';};
  const oldRender=window.render;
  window.render=function(){if(typeof oldRender==='function')oldRender();setTimeout(()=>{addPanel();},0)};
  addPanel();
})();
