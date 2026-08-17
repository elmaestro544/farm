/* Tanida Farm — Shareholders & Original Workbook Reader
 * Source: سجل حسابات مزرعة تنيدة(02-07)(2).xls
 * Keeps ownership/share-register data separate from historical treasury contributions.
 */
(function(){
  'use strict';
  const CDN='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const $=id=>document.getElementById(id);
  const AR='ar-EG-u-nu-arab';
  const n=v=>{if(typeof v==='number')return isFinite(v)?v:0;let s=String(v??'').trim().replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٬,]/g,'').replace(/[٫]/g,'.');let x=Number(s.replace(/[^0-9.+-]/g,''));return isFinite(x)?x:0};
  const num=x=>n(x).toLocaleString(AR,{maximumFractionDigits:0});
  const money=x=>num(x)+' ج';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const SOURCE={
    file:'سجل حسابات مزرعة تنيدة(02-07)(2).xls',
    sheet:'المساهمين',
    currency:'ريال',
    shareholders:[
      {name:'م/ محمود رجب',shares:1,shareValue:190000,required:240000,paid:240000,difference:0,treasuryContribution:3170995},
      {name:'م/ محمود حسين',shares:1,shareValue:190000,required:240000,paid:240000,difference:0,treasuryContribution:3186610},
      {name:'م/ محمد نجيب',shares:1,shareValue:190000,required:240000,paid:240000,difference:0,treasuryContribution:3156580},
      {name:'م/ محمد عبد الهادي',shares:1,shareValue:190000,required:240000,paid:235000,difference:-5000,treasuryContribution:3086179}
    ],
    totals:{shares:4,shareValue:760000,required:960000,paid:955000,difference:-5000,treasuryContribution:12600364}
  };

  function ensureData(){
    if(!window.D)return false;
    if(!Array.isArray(D.shareholders) || !D.shareholders.length){
      D.shareholders=SOURCE.shareholders.map(x=>({...x,amount:x.shareValue,ownershipPct:25}));
      if(typeof saveSilent==='function')saveSilent();
    }
    return true;
  }
  function style(){
    if($('shareholderUpgradeStyle'))return;
    const s=document.createElement('style');s.id='shareholderUpgradeStyle';s.textContent=`
      .sh-source{border-right:5px solid var(--green);background:linear-gradient(135deg,#f7fcf8,#fffdf6)}
      .sh-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}.sh-badge{padding:7px 11px;border-radius:999px;background:#eef7f1;border:1px solid #cce4d4;color:#145a43;font-weight:800;font-size:11px}
      .sh-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.sh-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px}.sh-kpi .l{font-size:11px;color:var(--muted)}.sh-kpi .v{font-size:20px;font-weight:900;color:#173f31}
      .sh-table{overflow:auto;margin-top:12px}.sh-table table{min-width:980px}.sh-table .ok{color:#166534;font-weight:800}.sh-table .warn{color:#9a6700;font-weight:800}
      .sh-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.sh-file{display:none}
      @media(max-width:900px){.sh-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.sh-kpis{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  function panel(){
    const sec=$('finance'); if(!sec)return;
    let el=$('shareholderSourcePanel'); if(!el){el=document.createElement('div');el.id='shareholderSourcePanel';el.className='card sh-source';sec.insertBefore(el,sec.firstElementChild||null)}
    const total=SOURCE.totals;
    el.innerHTML=`<div class="sh-head"><div><span class="eyebrow">المصدر المحاسبي الأصلي</span><h3>بيانات المساهمين — قراءة مباشرة من السجل</h3><div class="small">تم تثبيت بيانات الملكية وجدول الأقساط من ورقة «المساهمين»، مع فصلها عن مساهمات الخزينة التاريخية حتى لا تختلط الملكية بالتدفقات النقدية.</div></div><span class="sh-badge">${esc(SOURCE.sheet)} · ${esc(SOURCE.file)}</span></div>
      <div class="sh-kpis">
        <div class="sh-kpi"><div class="l">عدد الأسهم</div><div class="v">${num(total.shares)}</div></div>
        <div class="sh-kpi"><div class="l">قيمة الأسهم حسب السجل</div><div class="v">${num(total.shareValue)} ${esc(SOURCE.currency)}</div></div>
        <div class="sh-kpi"><div class="l">المطلوب حتى الآن</div><div class="v">${num(total.required)} ${esc(SOURCE.currency)}</div></div>
        <div class="sh-kpi"><div class="l">المسدد حتى الآن</div><div class="v">${num(total.paid)} ${esc(SOURCE.currency)}</div></div>
      </div>
      <div class="sh-table"><table><thead><tr><th>المساهم</th><th>الأسهم</th><th>قيمة السهم</th><th>الملكية</th><th>المطلوب</th><th>المسدد</th><th>الفرق بالسجل</th><th>المتبقي</th><th>مساهمات الخزينة التاريخية</th></tr></thead><tbody>
      ${SOURCE.shareholders.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${num(x.shares)}</td><td>${num(x.shareValue)} ${esc(SOURCE.currency)}</td><td>٢٥٪</td><td>${num(x.required)} ${esc(SOURCE.currency)}</td><td>${num(x.paid)} ${esc(SOURCE.currency)}</td><td class="${x.difference<0?'warn':'ok'}">${num(x.difference)} ${esc(SOURCE.currency)}</td><td class="${x.required-x.paid>0?'warn':'ok'}">${num(Math.max(0,x.required-x.paid))} ${esc(SOURCE.currency)}</td><td>${money(x.treasuryContribution)}</td></tr>`).join('')}
      </tbody><tfoot><tr><th>الإجمالي</th><th>${num(total.shares)}</th><th>${num(total.shareValue)} ${esc(SOURCE.currency)}</th><th>١٠٠٪</th><th>${num(total.required)} ${esc(SOURCE.currency)}</th><th>${num(total.paid)} ${esc(SOURCE.currency)}</th><th>${num(total.difference)} ${esc(SOURCE.currency)}</th><th>${num(Math.max(0,total.required-total.paid))} ${esc(SOURCE.currency)}</th><th>${money(total.treasuryContribution)}</th></tr></tfoot></table></div>
      <div class="callout warn" style="margin-top:12px"><b>تنبيه محاسبي:</b> السجل يذكر قيمة السهم وجدول الأقساط بعملة «${esc(SOURCE.currency)}»، بينما مساهمات الخزينة التاريخية معروضة كأرقام مالية مستقلة. لا يقوم النظام بتحويل العملات أو افتراض سعر صرف غير موجود في المصدر.</div>
      <div class="sh-actions no-print"><button class="btn secondary" id="reloadShareholders">إعادة تثبيت بيانات السجل</button><button class="btn secondary" id="importOriginalWorkbook">قراءة ملف السجل الأصلي</button><input class="sh-file" id="originalWorkbookFile" type="file" accept=".xls,.xlsx"></div>
      <div id="shareholderImportStatus" class="small" style="margin-top:8px"></div>`;
    $('reloadShareholders').onclick=()=>{D.shareholders=SOURCE.shareholders.map(x=>({...x,amount:x.shareValue,ownershipPct:25}));if(typeof saveSilent==='function')saveSilent();if(typeof render==='function')render();panel();};
    $('importOriginalWorkbook').onclick=()=>$('originalWorkbookFile').click();
    $('originalWorkbookFile').onchange=e=>{const f=e.target.files?.[0];if(f)readOriginalWorkbook(f)};
  }
  function ensureXLSX(cb){if(window.XLSX)return cb();const s=document.createElement('script');s.src=CDN;s.onload=cb;s.onerror=()=>alert('تعذر تحميل مكتبة Excel. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.');document.head.appendChild(s)}
  function readOriginalWorkbook(file){
    ensureXLSX(()=>{const r=new FileReader();r.onload=e=>{try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      const names=wb.SheetNames||[];const shName=names.find(x=>String(x).trim()==='المساهمين')||names.find(x=>String(x).includes('مساهم'));
      if(!shName)throw new Error('لم يتم العثور على ورقة المساهمين');
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[shName],{header:1,defval:''});
      const namesRow=rows[2]||[], shareRow=rows[3]||[], valueRow=rows[4]||[];
      const people=[];
      for(let i=2;i<=5;i++){const name=String(namesRow[i]||'').trim();if(!name)continue;people.push({name,shares:n(shareRow[i]),shareValue:n(valueRow[i]),required:0,paid:0,difference:0,treasuryContribution:0,amount:n(valueRow[i]),ownershipPct:0})}
      const req=rows.find(r=>String(r[1]||'').trim()==='اجمالي المطلوب حتى الان')||[];const paid=rows.find(r=>String(r[1]||'').trim()==='اجمالي المسدد بالخزينة حتى الان')||[];const diff=rows.find(r=>String(r[1]||'').trim()==='الفرق')||[];
      people.forEach((p,i)=>{p.required=n(req[i+2]);p.paid=n(paid[i+2]);p.difference=n(diff[i+2]);});
      const totalShares=people.reduce((s,x)=>s+x.shares,0);people.forEach(p=>p.ownershipPct=totalShares?p.shares/totalShares*100:0);
      D.shareholders=people;if(typeof saveSilent==='function')saveSilent();if(typeof render==='function')render();panel();
      $('shareholderImportStatus').textContent=`تمت قراءة ورقة «${shName}» بنجاح: ${num(people.length)} مساهمين. تم تحديث الملكية وجدول الأقساط دون تعديل محرك الحسابات.`;
    }catch(err){$('shareholderImportStatus').textContent='تعذر قراءة الملف: '+err.message}},r.readAsArrayBuffer(file)});
  }
  function boot(){if(!ensureData())return;style();panel();}
  const oldRender=window.render;window.render=function(){if(typeof oldRender==='function')oldRender();setTimeout(boot,0)};
  boot();
})();
