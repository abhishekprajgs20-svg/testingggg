// QUIZINOX — Notes engine. Ported 1:1 from the supplied Notes Generator (same parser, same page layout, same CSS).
/* eslint-disable */
const NOTES_CSS = String.raw`
:root{--font-title:Georgia,"Bookman Old Style","Times New Roman",serif;--font-body:"Segoe UI",Calibri,Arial,sans-serif;--cream:#faf6ee;--cream2:#f3ead8;--paper:#fefcf6;--navy:#1a3a6b;--maroon:#8b1a1a;--green:#1a6b3a;--purple:#5a1a8b;--teal:#1a6b6b;--mustard:#8b6a00;--indigo:#2d2d8b;--rose:#8b2d5a;--navy-bg:#e8eef7;--maroon-bg:#f7e8e8;--green-bg:#e8f7ee;--purple-bg:#f0e8f7;--teal-bg:#e8f7f7;--mustard-bg:#f7f3e8;--indigo-bg:#eeeef7;--rose-bg:#f7e8ef;--sidebar-w:270px;--header-h:56px;--radius:10px;--shadow:0 2px 10px rgba(0,0,0,.10);--shadow-sm:0 1px 4px rgba(0,0,0,.08)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-body);font-size:15px;background:#e8e2d8;color:#1a1a1a;min-height:100vh;overflow-x:hidden}
#upload-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1a3a6b 0%,#5a1a8b 50%,#8b1a1a 100%);padding:24px}
.brand{font-family:var(--font-title);font-size:2.4rem;color:#fff;text-align:center;margin-bottom:8px;text-shadow:0 2px 12px rgba(0,0,0,.3)}
.brand span{color:#ffd700}
.subtitle{color:rgba(255,255,255,.8);font-size:1rem;text-align:center;margin-bottom:40px}
#drop-zone{background:rgba(255,255,255,.12);border:2.5px dashed rgba(255,255,255,.5);border-radius:18px;width:100%;max-width:520px;padding:56px 32px;text-align:center;cursor:pointer;transition:all .25s;backdrop-filter:blur(8px)}
#drop-zone:hover,#drop-zone.drag-over{background:rgba(255,255,255,.22);border-color:#ffd700;transform:scale(1.01)}
.drop-icon{font-size:3.5rem;display:block;margin-bottom:16px}
#drop-zone p{color:rgba(255,255,255,.85);font-size:1.05rem;margin-bottom:20px}
#drop-zone small{color:rgba(255,255,255,.55);font-size:.8rem}
#file-input{display:none}
.btn-upload{display:inline-block;background:linear-gradient(135deg,#ffd700,#ffb300);color:#1a1a1a;font-weight:700;font-size:.95rem;padding:12px 32px;border-radius:30px;border:none;cursor:pointer;transition:all .2s;margin-top:12px;box-shadow:0 4px 16px rgba(255,200,0,.35)}
.btn-upload:hover{transform:translateY(-2px)}
#error-msg{margin-top:16px;background:rgba(255,80,80,.15);border:1.5px solid rgba(255,80,80,.5);color:#fff;border-radius:10px;padding:12px 20px;font-size:.9rem;display:none;max-width:520px;text-align:center}
#loading-screen{display:none;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1a3a6b 0%,#5a1a8b 50%,#8b1a1a 100%)}
.spinner{width:60px;height:60px;border:5px solid rgba(255,255,255,.2);border-top-color:#ffd700;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:24px}
@keyframes spin{to{transform:rotate(360deg)}}
#loading-text{color:#fff;font-size:1.1rem;text-align:center}
#loading-progress{width:300px;height:6px;background:rgba(255,255,255,.2);border-radius:3px;margin-top:16px;overflow:hidden}
#loading-bar{height:100%;background:linear-gradient(90deg,#ffd700,#ffb300);border-radius:3px;width:0%;transition:width .3s ease}
#app-screen{display:none;height:100vh;flex-direction:column}
#toolbar{height:var(--header-h);background:linear-gradient(90deg,#1a3a6b,#2d2d8b);display:flex;align-items:center;padding:0 16px;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:100;flex-shrink:0;overflow:hidden}
.toolbar-brand{font-family:var(--font-title);color:#ffd700;font-size:1.05rem;font-weight:700;white-space:nowrap;flex-shrink:0}
.sep{color:rgba(255,255,255,.2);flex-shrink:0}
.tbtn{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:7px;padding:6px 12px;font-size:.8rem;cursor:pointer;transition:all .18s;white-space:nowrap;display:flex;align-items:center;gap:5px;flex-shrink:0}
.tbtn:hover{background:rgba(255,255,255,.22)}
.tbtn:disabled{opacity:.4;cursor:not-allowed}
#nav-info{color:rgba(255,255,255,.65);font-size:.8rem;white-space:nowrap;flex-shrink:0}
.toolbar-spacer{flex:1;min-width:8px}
.font-ctrl{display:flex;align-items:center;gap:4px;flex-shrink:0}
.font-ctrl label{color:rgba(255,255,255,.6);font-size:.75rem}
.font-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:#fff;width:26px;height:26px;border-radius:5px;cursor:pointer;font-size:.95rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
.font-btn:hover{background:rgba(255,255,255,.2)}
#sidebar-toggle{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:#fff;width:32px;height:32px;border-radius:6px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
#sidebar-toggle:hover{background:rgba(255,255,255,.2)}
#app-body{display:flex;flex:1;overflow:hidden}
#sidebar{width:var(--sidebar-w);background:#f7f3ea;border-right:2px solid #d4cbb8;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;transition:width .25s,opacity .25s}
#sidebar.collapsed{width:0;opacity:0;pointer-events:none}
#sidebar-header{padding:12px 14px 10px;border-bottom:1.5px solid #d4cbb8;background:#ede7d5;flex-shrink:0}
#sidebar-header h3{font-family:var(--font-title);font-size:.92rem;color:#1a3a6b;margin-bottom:8px}
#search-input{width:100%;padding:7px 10px;border:1.5px solid #c4b89a;border-radius:7px;background:#faf6ee;font-size:.82rem;color:#333;outline:none;transition:border-color .2s}
#search-input:focus{border-color:#1a3a6b}
#sidebar-list{flex:1;overflow-y:auto;padding:8px 0}
#sidebar-list::-webkit-scrollbar{width:5px}
#sidebar-list::-webkit-scrollbar-thumb{background:#c4b89a;border-radius:3px}
.sidebar-item{padding:9px 14px;cursor:pointer;border-left:3px solid transparent;transition:all .15s;border-bottom:1px solid rgba(0,0,0,.05)}
.sidebar-item:hover{background:#ede7d5;border-left-color:#8b6a00}
.sidebar-item.active{background:#e8eef7;border-left-color:#1a3a6b;font-weight:600}
.q-num-label{font-size:.7rem;color:#8b6a00;font-weight:700;letter-spacing:.5px;display:block;margin-bottom:2px}
.q-title-label{font-size:.82rem;color:#333;line-height:1.35;display:block}
.sidebar-item.active .q-title-label{color:#1a3a6b}
.sidebar-item.hidden{display:none}
#main-panel{flex:1;overflow-y:auto;background:#e8e2d8;padding:20px 24px}
#main-panel::-webkit-scrollbar{width:7px}
#main-panel::-webkit-scrollbar-thumb{background:#c4b89a;border-radius:4px}
#no-question{display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-style:italic;font-size:1.1rem}
.note-page{background:#fefcf6;background-image:repeating-linear-gradient(transparent,transparent 27px,rgba(0,0,0,.055) 27px,rgba(0,0,0,.055) 28px);border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.13),0 1px 3px rgba(0,0,0,.08);padding:28px 32px 36px;max-width:960px;margin:0 auto;position:relative}
.parse-warning{position:absolute;top:10px;right:14px;background:#fff3cd;border:1px solid #ffc107;color:#856404;font-size:.72rem;padding:3px 9px;border-radius:12px}
.note-header{display:grid;grid-template-columns:200px 1fr;gap:20px;margin-bottom:22px;align-items:start}
.note-title-card{border:2px solid var(--navy);border-radius:var(--radius);padding:14px 16px;background:linear-gradient(135deg,#e8eef7,#dde5f5);text-align:center}
.crown-icon{font-size:1.8rem;display:block;margin-bottom:6px}
.q-label-card{font-size:.68rem;font-weight:700;color:var(--navy);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.q-title-card{font-family:var(--font-title);font-size:1.05rem;color:var(--navy);line-height:1.3;font-weight:700}
.q-subject-card{font-size:.68rem;color:#8b6a00;margin-top:6px;font-style:italic;border-top:1px solid rgba(26,58,107,.2);padding-top:5px}
.note-header-right{display:flex;flex-direction:column;gap:12px}
.note-question-box{background:var(--navy-bg);border:1.5px solid var(--navy);border-radius:var(--radius);padding:12px 16px}
.qb-label{font-size:.68rem;font-weight:700;color:var(--navy);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
.qb-text{font-size:.87rem;line-height:1.55;color:#222}
.note-index-box{background:var(--mustard-bg);border:1.5px solid var(--mustard);border-radius:var(--radius);padding:10px 14px}
.ib-label{font-size:.68rem;font-weight:700;color:var(--mustard);letter-spacing:1px;text-transform:uppercase;margin-bottom:7px}
.ib-list{list-style:none;padding:0;columns:2;column-gap:12px}
.ib-list li{font-size:.76rem;color:#444;margin-bottom:3px;break-inside:avoid}
.ib-list li a{color:#8b6a00;text-decoration:none}
.ib-list li a:hover{color:#1a3a6b;text-decoration:underline}
.section-box{border-radius:var(--radius);border:1.5px solid;padding:14px 16px;margin-bottom:15px;box-shadow:var(--shadow-sm)}
.sb-heading{font-family:var(--font-title);font-size:.88rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:7px;padding-bottom:6px;border-bottom:1px dashed rgba(0,0,0,.12)}
.sh-icon{font-size:1rem}
.section-box.navy{border-color:var(--navy);background:var(--navy-bg)}.section-box.navy .sb-heading{color:var(--navy)}
.section-box.maroon{border-color:var(--maroon);background:var(--maroon-bg)}.section-box.maroon .sb-heading{color:var(--maroon)}
.section-box.green{border-color:var(--green);background:var(--green-bg)}.section-box.green .sb-heading{color:var(--green)}
.section-box.purple{border-color:var(--purple);background:var(--purple-bg)}.section-box.purple .sb-heading{color:var(--purple)}
.section-box.teal{border-color:var(--teal);background:var(--teal-bg)}.section-box.teal .sb-heading{color:var(--teal)}
.section-box.mustard{border-color:var(--mustard);background:var(--mustard-bg)}.section-box.mustard .sb-heading{color:var(--mustard)}
.section-box.indigo{border-color:var(--indigo);background:var(--indigo-bg)}.section-box.indigo .sb-heading{color:var(--indigo)}
.section-box.rose{border-color:var(--rose);background:var(--rose-bg)}.section-box.rose .sb-heading{color:var(--rose)}
.def-box{background:linear-gradient(135deg,#fff8e1,#fff3cd);border:2px solid #ffb300;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px}
.def-box-label{font-size:.68rem;font-weight:700;color:#7a5000;letter-spacing:1px;margin-bottom:7px;display:block}
.def-box p{font-size:.88rem;line-height:1.6;color:#333;font-style:italic}
.key-points-list{list-style:none;padding:0}
.key-points-list li{display:flex;align-items:flex-start;gap:8px;font-size:.87rem;line-height:1.55;color:#2a2a2a;margin-bottom:7px}
.kp-bullet{flex-shrink:0;margin-top:2px;color:var(--navy);font-size:.8rem}
.verdict-table{width:100%;border-collapse:collapse;font-size:.84rem;margin-top:4px}
.verdict-table th{background:#1a3a6b;color:#fff;padding:7px 10px;text-align:left;font-size:.75rem}
.verdict-table td{padding:7px 10px;border-bottom:1px solid rgba(0,0,0,.08);vertical-align:top}
.verdict-table tr:nth-child(even) td{background:rgba(0,0,0,.03)}
.verdict-table tr:hover td{background:rgba(26,58,107,.06)}
.tag-correct{display:inline-flex;align-items:center;gap:4px;background:#d4edda;color:#155724;border:1px solid #c3e6cb;border-radius:12px;padding:2px 9px;font-size:.74rem;font-weight:700;white-space:nowrap}
.tag-incorrect{display:inline-flex;align-items:center;gap:4px;background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;border-radius:12px;padding:2px 9px;font-size:.74rem;font-weight:700;white-space:nowrap}
.comp-table{width:100%;border-collapse:collapse;font-size:.84rem}
.comp-table th{background:var(--green);color:#fff;padding:6px 10px;text-align:left;font-size:.75rem}
.comp-table td{padding:6px 10px;border-bottom:1px solid rgba(0,0,0,.08)}
.comp-table tr:nth-child(even) td{background:rgba(26,107,58,.04)}
.conclusion-box{background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:2px solid #388e3c;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;gap:10px;align-items:flex-start}
.cb-icon{font-size:1.4rem;flex-shrink:0}
.cb-label{font-size:.68rem;font-weight:700;color:#1b5e20;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.conclusion-box p{font-size:.87rem;line-height:1.5;color:#1b5e20;font-weight:600}
.answer-box{background:#faf6ee;border:2px solid var(--navy);border-radius:var(--radius);padding:14px 16px;margin-bottom:15px}
.ab-label{font-size:.68rem;font-weight:700;color:#1a3a6b;letter-spacing:1px;text-transform:uppercase;margin-bottom:9px}
.options-list{list-style:none;padding:0}
.options-list li{padding:6px 12px;border-radius:7px;font-size:.85rem;margin-bottom:5px;border:1.5px solid transparent;display:flex;align-items:center;gap:8px}
.opt-letter{font-weight:700;font-size:.78rem;width:20px;text-align:center;flex-shrink:0}
.options-list li.correct{background:#d4edda;border-color:#28a745;color:#155724;font-weight:600}
.options-list li.wrong{background:#f8f9fa;border-color:#dee2e6;color:#666}
.opt-tick{margin-left:auto;font-size:.95rem}
.timeline{position:relative;padding-left:28px}
.timeline::before{content:'';position:absolute;left:10px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,var(--navy),var(--teal));border-radius:1px}
.tl-item{position:relative;margin-bottom:14px}
.tl-item::before{content:'';position:absolute;left:-22px;top:6px;width:10px;height:10px;background:var(--navy);border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 2px var(--navy)}
.tl-year{font-weight:700;font-size:.78rem;color:var(--navy);display:inline-block;background:var(--navy-bg);border:1px solid var(--navy);border-radius:4px;padding:1px 7px;margin-bottom:4px}
.tl-text{font-size:.84rem;color:#333;line-height:1.4}
.terms-strip{display:flex;flex-wrap:wrap;gap:7px;padding-top:4px}
.term-chip{background:#f3ead8;border:1.5px solid #b8a980;border-radius:20px;padding:4px 12px;font-size:.78rem;font-weight:600;color:#5a4500}
.term-chip:hover{background:var(--mustard-bg);border-color:var(--mustard)}
.revision-box{background:linear-gradient(135deg,#ede7d5,#e8eef7);border:2px dashed #1a3a6b;border-radius:var(--radius);padding:14px 18px;margin-top:18px}
.rb-title{font-family:var(--font-title);font-size:.95rem;color:var(--navy);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.revision-list{list-style:none;padding:0}
.revision-list li{display:flex;align-items:flex-start;gap:8px;font-size:.85rem;color:#333;margin-bottom:7px;line-height:1.45}
.chk{font-size:1rem;flex-shrink:0;color:#666}
.quote-box{background:#f3ead8;border-left:4px solid var(--mustard);padding:10px 16px;margin-top:16px;border-radius:0 8px 8px 0;font-style:italic;font-size:.88rem;color:#555}
.quote-box cite{display:block;font-style:normal;font-size:.76rem;color:#888;margin-top:5px}
.kw-article{color:var(--maroon);font-weight:700}
.kw-year{color:var(--indigo);font-weight:700}
.kw-act{color:var(--purple);font-weight:700}
.kw-pct{color:var(--teal);font-weight:700}
@media print{#toolbar,#sidebar,#upload-screen,#loading-screen{display:none!important}#app-screen{display:block!important;height:auto!important}#app-body{display:block!important}#main-panel{padding:0!important;background:#fff!important;overflow:visible!important}.note-page{box-shadow:none!important;border-radius:0!important;margin:0!important;max-width:100%!important;page-break-after:always}body{background:#fff!important}}
@media(max-width:768px){.note-page{padding:16px}.note-header{grid-template-columns:1fr}}
@media(max-width:560px){#sidebar{position:absolute;z-index:200;height:calc(100vh - var(--header-h));top:var(--header-h);left:0;box-shadow:4px 0 20px rgba(0,0,0,.2)}.ib-list{columns:1}.note-header{grid-template-columns:1fr}}
`;

const questions = [];
function parseFile(text){
  text=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  var lines=text.split('\n'),qStarts=[];
  for(var i=0;i<lines.length;i++){if(/^Q\d+\./.test(lines[i].trim()))qStarts.push(i);}
  if(qStarts.length===0)return[];
  qStarts.push(lines.length);
  var result=[];
  for(var qi=0;qi<qStarts.length-1;qi++){
    var p=parseOneQuestion(lines.slice(qStarts[qi],qStarts[qi+1]));
    if(p)result.push(p);
  }
  return result;
}

function parseOneQuestion(bl){
  var fl=bl[0],qm=fl.match(/^Q(\d+)\.(.*)/);
  if(!qm)return null;
  var qNum=parseInt(qm[1]),warnings=[],qLines=[],oLines=[],eLines=[],phase='question';
  var emojiRx=/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1FA00}-\u{1FFFF}]/u;
  var exRx=/^Ex:/i,tickRx=/\u2705/;
  for(var i=0;i<bl.length;i++){
    var line=bl[i].trim();
    if(phase==='question'){
      var cl=(i===0)?bl[i].replace(/^Q\d+\./,'').trim():line;
      if(line.length===0&&i>0){qLines.push('');continue;}
      if(emojiRx.test(line)&&line.length<=6){phase='options';continue;}
      if(exRx.test(line)){phase='explanation';var t=line.replace(/^Ex:/i,'').trim();if(t)eLines.push(t);continue;}
      if(tickRx.test(line)&&i>2){phase='options';oLines.push(cl);continue;}
      qLines.push(i===0?cl:line);
    }else if(phase==='options'){
      if(exRx.test(line)){phase='explanation';var t2=line.replace(/^Ex:/i,'').trim();if(t2)eLines.push(t2);continue;}
      if(line.length>0)oLines.push(line);
    }else{eLines.push(line);}
  }
  var expText=eLines.join('\n').trim();
  var qText=qLines.filter(function(l){return l.trim();}).join('\n').trim();
  if(!qText)warnings.push('Question text missing');
  if(!expText)warnings.push('Explanation (Ex:) missing');
  var opts=[],ca=null;
  for(var oi=0;oi<oLines.length;oi++){
    var o=oLines[oi],ic=o.indexOf('\u2705')!==-1,co=o.replace(/\u2705/g,'').trim();
    if(co){opts.push({text:co,correct:ic});if(ic)ca=co;}
  }
  if(opts.length>0&&!ca)warnings.push('No correct answer detected');
  if(opts.length===0)warnings.push('Options not found');
  return{num:qNum,questionText:qText,options:opts,correctAnswer:ca,explanationText:expText,warnings:warnings};
}

function splitSentences(text){
  var s=text;
  var abbrs=['e.g','i.e','etc','vs','Dr','Mr','Mrs','Prof','No','Art','Sec'];
  var phs={};
  abbrs.forEach(function(a,idx){
    var rx=new RegExp('\\b'+a.replace('.','\\.')+'\\.'+'(?=\\s)','g');
    var ph='__A'+idx+'__';phs[ph]=a+'.';
    s=s.replace(rx,ph);
  });
  s=s.replace(/(\d)\.(\d)/g,'$1__D__$2');
  var parts=s.split(/(?<=[.!?])\s+(?=[A-Z"])/);
  return parts.map(function(p){
    var r=p;
    Object.keys(phs).forEach(function(ph){r=r.split(ph).join(phs[ph]);});
    return r.replace(/__D__/g,'.').trim();
  }).filter(function(x){return x.length>10;});
}

function extractDefinition(text){
  var pats=[
    /^([^.]{5,120})\s+(?:is|are|was|were|refers to|means|defined as|known as|called)\s+(.{10,250}[.!?])/i,
    /([^.]{5,80})\s+(?:is defined as|is referred to as|is known as)\s+([^.]{10,250}\.)/i
  ];
  for(var i=0;i<pats.length;i++){var m=text.match(pats[i]);if(m)return m[0];}
  return null;
}

function extractVerdicts(text){
  var results=[],seen={};
  var pats=[
    {rx:/[Ss]tatement[\s-]*([I1-9]+)\s+is\s+(correct|not correct|incorrect|true|false)/gi,t:'Statement'},
    {rx:/[Pp]air\s+(\d+)\s+is\s+(correctly matched|not correctly matched|incorrectly matched)/gi,t:'Pair'},
    {rx:/[Hh]ence[,]?\s+[Ss]tatement[\s-]*([I1-9]+)\s+is\s+(correct|not correct|incorrect)/gi,t:'Statement'},
    {rx:/[Hh]ence[,]?\s+[Pp]air\s+(\d+)\s+is\s+(correctly matched|not correctly matched|incorrectly matched)/gi,t:'Pair'}
  ];
  pats.forEach(function(p){
    var rxc=new RegExp(p.rx.source,p.rx.flags),m;
    while((m=rxc.exec(text))!==null){
      var k=p.t+'-'+m[1];
      if(!seen[k]){
        seen[k]=1;
        var vt=m[2].toLowerCase();
        var ok=(vt.indexOf('not')===-1&&vt.indexOf('in')===-1&&(vt.indexOf('correct')!==-1||vt.indexOf('true')!==-1));
        results.push({label:p.t+' '+m[1],verdict:ok,raw:m[0]});
      }
    }
  });
  return results;
}

function extractYears(text){
  var evts=[],seen={};
  var rx=/\b(1[6-9]\d{2}|20[0-2]\d)\b[^.!\n]{0,160}/g,m;
  while((m=rx.exec(text))!==null){
    var yr=m[1];
    if(!seen[yr]){
      seen[yr]=1;
      var tt=m[0].replace(yr,'').replace(/^[\s,\-]+/,'').trim();
      if(tt.length>3)evts.push({year:yr,text:tt.slice(0,150)});
    }
  }
  return evts.slice(0,8);
}

function extractKeyTerms(text){
  var freq={};
  var rx=/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b/g;
  var stops={The:1,This:1,That:1,These:1,Those:1,Such:1,Some:1,Most:1,Many:1,Both:1,Each:1,Which:1,When:1,Where:1,Hence:1,Thus:1,Therefore:1,India:1,Indian:1,Also:1,However:1,Although:1,Because:1,Since:1,After:1,During:1,While:1,Though:1,Even:1,About:1,Only:1,More:1,Less:1,Other:1,First:1,Second:1,Third:1,North:1,South:1,East:1,West:1,Upper:1,Lower:1,Government:1,Statement:1,Statements:1,Correct:1,Incorrect:1,Given:1,Above:1,Its:1,Their:1,They:1,Have:1,Been:1,Were:1,Here:1,There:1};
  var m;
  while((m=rx.exec(text))!==null){var t=m[1].trim();if(!stops[t]&&t.length>3)freq[t]=(freq[t]||0)+1;}
  return Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];}).slice(0,7);
}

function extractConclusion(sents){
  return sents.filter(function(s){return /^(Hence|Therefore|Thus|So,|As a result|Consequently|In conclusion)/i.test(s.trim());});
}

function extractItems(qText){
  var items=[],rx=/^\s*(\d+)[.)]\s*(.+)$/gm,m;
  while((m=rx.exec(qText))!==null)items.push({num:m[1],text:m[2].trim()});
  return items;
}

function hl(h){
  h=h.replace(/\b(Article[s]?\s+\d+(?:[A-Za-z])?(?:\s*(?:and|to|,)\s*\d+[A-Za-z]?)*)\b/g,'<span class="kw-article">$1</span>');
  h=h.replace(/\b(1[6-9]\d{2}|20[0-2]\d)\b/g,'<span class="kw-year">$1</span>');
  h=h.replace(/\b(\d{4}\s+(?:Act|Amendment|Constitution|Bill))\b/g,'<span class="kw-act">$1</span>');
  h=h.replace(/\b((?:Act|Amendment|Bill)\s+of\s+\d{4})\b/g,'<span class="kw-act">$1</span>');
  h=h.replace(/(\d+(?:\.\d+)?%)/g,'<span class="kw-pct">$1</span>');
  return h;
}

function esc(s){
  if(!s)return'';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

var CC=['navy','maroon','green','purple','teal','mustard','indigo','rose'];

function getTitle(q){
  var qt=q.questionText||'';
  var acStop={THE:1,AND:1,FOR:1,ARE:1,WITH:1,THAT:1,FROM:1,THIS:1,WHICH:1,BOTH:1,ABOVE:1,GIVEN:1,FOLLOWING:1,CONSIDER:1,REGARDING:1,REFERENCE:1,STATEMENTS:1,CORRECT:1,STATEMENT:1,RESPECT:1,SELECT:1,ANSWER:1,CODE:1,INDIA:1,NOT:1,HOW:1,MANY:1,ONLY:1};
  var m,rx=/\b([A-Z]{3,8}(?:\s+[A-Z]{2,8}){0,2})\b/g;
  while((m=rx.exec(qt))!==null){var a=m[1].trim();if(!acStop[a])return toTC(a);}
  var qm=qt.match(/"([^"]{3,40})"/);if(qm)return qm[1].trim();
  var propStop={Consider:1,Which:1,Statement:1,Both:1,Following:1,India:1,Select:1,Correct:1,Regarding:1,Reference:1,Statements:1,Given:1,Above:1,Answer:1,How:1,Many:1,Other:1,Most:1,Recent:1,Using:1,Code:1,With:1,What:1,Where:1,When:1,The:1,This:1,That:1,These:1};
  var props=[],prx=/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3})\b/g;
  while((m=prx.exec(qt))!==null){var p=m[1].trim();if(!propStop[p])props.push(p);}
  if(props.length>0){props.sort(function(a,b){return b.split(' ').length-a.split(' ').length;});return props[0];}
  return qt.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean).slice(0,6).join(' ')||'Q'+q.num;
}

function toTC(s){return s.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase();});}
function buildPage(q){
  var title=getTitle(q),et=q.explanationText||'',qt=q.questionText||'';
  var sents=splitSentences(et),def=extractDefinition(et),verdicts=extractVerdicts(et);
  var years=extractYears(et),terms=extractKeyTerms(et),concls=extractConclusion(sents);
  var pts=sents.filter(function(s){return concls.indexOf(s)===-1;}),items=extractItems(qt);
  var ci=0;function nc(){return CC[ci++%CC.length];}
  var secs=[];
  if(q.options.length>0)secs.push({id:'sa',label:'Correct Answer'});
  if(def)secs.push({id:'sd',label:'Definition'});
  if(verdicts.length>0)secs.push({id:'sv',label:'Statement Verdicts'});
  if(pts.length>0)secs.push({id:'sp',label:'Key Points'});
  if(items.length>1)secs.push({id:'si',label:'Item Analysis'});
  if(concls.length>0)secs.push({id:'sc',label:'Conclusion'});
  if(years.length>0)secs.push({id:'st',label:'Timeline'});
  if(terms.length>0)secs.push({id:'sk',label:'Key Terms'});
  secs.push({id:'sr',label:'Quick Revision'});
  var n=q.num,h='<div class="note-page" id="qpage-'+n+'">';
  if(q.warnings&&q.warnings.length>0)h+='<div class="parse-warning">&#9888; '+esc(q.warnings.join(', '))+'</div>';

  /* Header */
  h+='<div class="note-header">';
  h+='<div class="note-title-card"><span class="crown-icon">&#128218;</span><div class="q-label-card">Q '+n+'</div><div class="q-title-card">'+esc(title.slice(0,60))+'</div><div class="q-subject-card">UPSC Study Notes</div></div>';
  h+='<div class="note-header-right">';
  if(qt){h+='<div class="note-question-box"><div class="qb-label">&#10022; Question</div><div class="qb-text">'+hl(esc(qt))+'</div></div>';}
  if(secs.length>0){
    h+='<div class="note-index-box"><div class="ib-label">&#128203; Index</div><ol class="ib-list">';
    secs.forEach(function(s,i){h+='<li>'+(i+1)+'. <a href="#'+s.id+'-'+n+'">'+esc(s.label)+'</a></li>';});
    h+='</ol></div>';
  }
  h+='</div></div>';

  /* Answer box */
  if(q.options.length>0){
    var ltrs=['A','B','C','D','E','F'];
    h+='<div id="sa-'+n+'" class="answer-box"><div class="ab-label">&#9989; MCQ Options &amp; Correct Answer</div><ul class="options-list">';
    q.options.forEach(function(o,i){
      h+='<li class="'+(o.correct?'correct':'wrong')+'"><span class="opt-letter">'+(ltrs[i]||(i+1))+'</span>'+hl(esc(o.text))+(o.correct?'<span class="opt-tick">&#9989;</span>':'')+'</li>';
    });
    h+='</ul></div>';
  }

  /* Definition */
  if(def){h+='<div id="sd-'+n+'" class="def-box"><span class="def-box-label">&#128214; DEFINITION</span><p>'+hl(esc(def))+'</p></div>';}

  /* Verdicts */
  if(verdicts.length>0){
    var c=nc();
    h+='<div id="sv-'+n+'" class="section-box '+c+'"><div class="sb-heading"><span class="sh-icon">&#9878;</span> Statement-wise Verdict</div>';
    h+='<table class="verdict-table"><thead><tr><th>Statement / Pair</th><th>Verdict</th><th>Details</th></tr></thead><tbody>';
    verdicts.forEach(function(v){
      var tag=v.verdict?'<span class="tag-correct">&#9989; Correct</span>':'<span class="tag-incorrect">&#10060; Incorrect</span>';
      h+='<tr><td><strong>'+esc(v.label)+'</strong></td><td>'+tag+'</td><td style="font-size:.78rem;color:#555">'+hl(esc(v.raw))+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }

  /* Key Points */
  if(pts.length>0){
    var c2=nc();
    var icons=['&#10022;','&#9733;','&#10148;','&#128313;','&#9670;','&#9656;','&#8226;'];
    h+='<div id="sp-'+n+'" class="section-box '+c2+'"><div class="sb-heading"><span class="sh-icon">&#128204;</span> Key Points</div><ul class="key-points-list">';
    pts.slice(0,12).forEach(function(p,i){h+='<li><span class="kp-bullet">'+icons[i%icons.length]+'</span><span>'+hl(esc(p))+'</span></li>';});
    h+='</ul></div>';
  }

  /* Item Analysis */
  if(items.length>1){
    var c3=nc();
    h+='<div id="si-'+n+'" class="section-box '+c3+'"><div class="sb-heading"><span class="sh-icon">&#128202;</span> Item Analysis</div>';
    h+='<table class="comp-table"><thead><tr><th>#</th><th>Item</th><th>Note from Explanation</th></tr></thead><tbody>';
    items.forEach(function(it){
      var rel='';
      for(var si=0;si<sents.length;si++){
        var wds=it.text.split(/\s+/).slice(0,4),found=false;
        for(var wi=0;wi<wds.length;wi++){if(wds[wi].length>3&&sents[si].toLowerCase().indexOf(wds[wi].toLowerCase())!==-1){found=true;break;}}
        if(found){rel=sents[si];break;}
      }
      h+='<tr><td><strong>'+esc(it.num)+'</strong></td><td>'+hl(esc(it.text))+'</td><td style="font-size:.78rem;color:#444">'+hl(esc(rel.slice(0,140)))+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }

  /* Conclusion */
  if(concls.length>0){
    h+='<div id="sc-'+n+'" class="conclusion-box"><div class="cb-icon">&#128161;</div><div><div class="cb-label">Conclusion / Answer Rationale</div>';
    concls.forEach(function(c){h+='<p>'+hl(esc(c))+'</p>';});
    h+='</div></div>';
  }

  /* Timeline */
  if(years.length>0){
    var c4=nc();
    h+='<div id="st-'+n+'" class="section-box '+c4+'"><div class="sb-heading"><span class="sh-icon">&#128197;</span> Timeline / Key Dates</div><div class="timeline">';
    years.forEach(function(y){h+='<div class="tl-item"><div class="tl-year">'+esc(y.year)+'</div><div class="tl-text">'+hl(esc(y.text.slice(0,160)))+'</div></div>';});
    h+='</div></div>';
  }

  /* Key Terms */
  if(terms.length>0){
    var c5=nc();
    h+='<div id="sk-'+n+'" class="section-box '+c5+'"><div class="sb-heading"><span class="sh-icon">&#128273;</span> Key Terms</div><div class="terms-strip">';
    terms.forEach(function(t){h+='<span class="term-chip">'+esc(t)+'</span>';});
    h+='</div></div>';
  }

  /* Quick Revision */
  var revPts=sents.slice(0,5);
  if(revPts.length>0){
    h+='<div id="sr-'+n+'" class="revision-box"><div class="rb-title">&#9744; Quick Revision Checklist</div><ul class="revision-list">';
    revPts.forEach(function(p){h+='<li><span class="chk">&#9744;</span><span>'+hl(esc(p.slice(0,200)))+'</span></li>';});
    h+='</ul></div>';
  }

  /* Quote */
  var last=sents[sents.length-1]||'';
  if(last&&last.length>20&&last.length<200&&sents.length>3){
    h+='<div class="quote-box">&ldquo;'+esc(last)+'&rdquo;<cite>&mdash; Explanation, Q'+n+'</cite></div>';
  }
  h+='</div>';
  return h;
}


function quizToNotesTxt(q) {
  return q.questions.map((x, i) => 'Q' + (i + 1) + '. ' + x.text + '\n😂\n' + x.options.map((o, j) => o + (j === x.correct ? ' ✅' : '')).join('\n') + (x.explanation ? '\nEx: ' + x.explanation : '')).join('\n\n') + '\n';
}
/** Build the standalone "all study notes" HTML — identical to the Notes Generator's own HTML export. */
export function buildStudyNotesHtml(quiz) {
  const list = parseFile(quizToNotesTxt(quiz));
  if (!list.length) throw new Error('No questions found in this quiz');
  const all = list.map(q => buildPage(q)).join('\n<div style="page-break-after:always;margin:20px 0"></div>\n');
  const title = esc(quiz.title || 'Quiz');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + title + ' — Study Notes</title>\n<style>\n' + NOTES_CSS + '\nbody{background:#e8e2d8;padding:20px}\n</style>\n</head>\n<body>\n<h1 style="text-align:center;font-family:Georgia,serif;color:#1a3a6b;margin-bottom:6px;padding:16px 16px 0">&#128218; Study Notes &mdash; ' + title + '</h1>\n<p style="text-align:center;color:#6b5d3a;margin-bottom:24px;font-size:.9rem">' + list.length + ' questions &middot; generated by QUIZINOX Notes Generator</p>\n' + all + '\n</body>\n</html>';
}
