// CURSOR
const curEl=document.getElementById('cur'),ringEl=document.getElementById('curRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;curEl.style.left=mx+'px';curEl.style.top=my+'px';});
(function raf(){rx+=(mx-rx)*0.1;ry+=(my-ry)*0.1;ringEl.style.left=rx+'px';ringEl.style.top=ry+'px';requestAnimationFrame(raf);})();

// PAGE CONFIG
const pageConf={
  dashboard:{title:'Dashboard',sub:'Visão geral do escritório',btn:'+ Novo Lançamento',act:'m-lanc'},
  clientes:{title:'Clientes / Empresas',sub:'0 empresas cadastradas',btn:'+ Novo Cliente',act:'m-cliente'},
  lancamentos:{title:'Lançamentos Contábeis',sub:'Registro de débitos e créditos em partida dobrada',btn:'+ Novo Lançamento',act:'m-lanc'},
  plano:{title:'Plano de Contas',sub:'Estrutura CFC — NBC TG 26',btn:'+ Nova Conta',act:null},
  relatorios:{title:'Relatórios Contábeis',sub:'Balancete · DRE · Balanço · Razão · Obrigações',btn:'🖨 Imprimir Relatório',act:null},
  folha:{title:'Folha de Pagamento',sub:'Processamento, eSocial e GFIP',btn:'Processar Folha',act:null},
  obrigacoes:{title:'Obrigações Acessórias',sub:'Calendário fiscal e prazos de entrega',btn:null,act:null},
  conciliacao:{title:'Conciliação Bancária',sub:'Extrato bancário × Lançamentos contábeis',btn:'📂 Importar OFX',act:null},
  config:{title:'Configurações',sub:'Escritório, usuários e integrações',btn:null,act:null},
};
let activePg='dashboard';

document.querySelectorAll('.ni[data-pg]').forEach(el=>{
  el.addEventListener('click',()=>{
    const pg=el.dataset.pg;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
    document.getElementById('pg-'+pg)?.classList.add('active');
    el.classList.add('active');
    const cfg=pageConf[pg]||{};
    document.getElementById('tpTitle').textContent=cfg.title||pg;
    document.getElementById('tpSub').textContent=cfg.sub||'';
    const btn=document.getElementById('topBtn');
    if(cfg.btn){btn.textContent=cfg.btn;btn.style.display='';}
    else btn.style.display='none';
    activePg=pg;
    if(pg==='dashboard'){loadDashboard();}
    if(pg==='clientes')loadClientes();
    if(pg==='lancamentos')loadLancamentos();
    if(pg==='plano')loadPlano();
    if(pg==='relatorios')loadRelatorios();
    if(pg==='folha')loadFolha();
    if(pg==='obrigacoes')loadObrigacoes();
    if(pg==='conciliacao')loadConciliacao();
    if(pg==='config')loadConfig();
  });
});

function goPage(pg){document.querySelector(`.ni[data-pg="${pg}"]`)?.click();}
function topAction(){
  const cfg=pageConf[activePg];
  if(cfg?.act)openM(cfg.act);
  else if(activePg==='relatorios')imprimirRel();
  else if(activePg==='folha')toast('📤 Processando folha de pagamento…');
  else if(activePg==='conciliacao')importarOFX();
  else if(activePg==='plano')openNovaConta();
}
function swTab(el){el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');}

// MODALS
function openM(id){
  const o=document.getElementById(id);o.classList.add('open');
  gsap.fromTo(o.querySelector('.modal'),{opacity:0,y:18,scale:.96},{opacity:1,y:0,scale:1,duration:.28,ease:'power2.out'});
}
function closeM(id){
  const o=document.getElementById(id);
  gsap.to(o.querySelector('.modal'),{opacity:0,y:10,scale:.96,duration:.18,ease:'power2.in',onComplete:()=>o.classList.remove('open')});
}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeM(o.id);}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.overlay.open').forEach(o=>closeM(o.id));});

// THEME
function toggleTheme(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  const next=dark?'light':'dark';
  document.documentElement.setAttribute('data-theme',next==='dark'?'dark':'');
  localStorage.setItem('theme',next);
  document.getElementById('theme-icon').textContent=next==='dark'?'☀️':'🌙';
  document.getElementById('theme-label').textContent=next==='dark'?'Modo Claro':'Modo Escuro';
}
(function applyTheme(){
  if(localStorage.getItem('theme')==='dark'){
    document.documentElement.setAttribute('data-theme','dark');
    const i=document.getElementById('theme-icon');const l=document.getElementById('theme-label');
    if(i)i.textContent='☀️';if(l)l.textContent='Modo Claro';
  }
})();

// TOAST
let toastTimer;
function toast(msg){const el=document.getElementById('toastEl');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}

// KPI COUNTERS
function animKPI(k2val,k3val,k1val,k4val){
  const fmtBRL=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  [{id:'k1',val:k1val||0,fmt:fmtBRL},{id:'k2',val:k2val||0,fmt:v=>Math.round(v)},{id:'k3',val:k3val||0,fmt:v=>Math.round(v)},{id:'k4',val:k4val||0,fmt:fmtBRL}].forEach(({id,val,fmt})=>{
    const el=document.getElementById(id);if(!el)return;
    const obj={v:0};
    gsap.killTweensOf(obj);
    gsap.to(obj,{v:val,duration:1.4,ease:'power2.out',delay:.15,onUpdate:()=>{el.textContent=fmt(obj.v);}});
  });
}

// CHARTS
let cBar,cDonut;
function buildCharts(recData,despData,regimeData){
  const rec=recData||[0,0,0,0,0,0,0,0,0,0,0,0];
  const desp=despData||[0,0,0,0,0,0,0,0,0,0,0,0];
  const regimes=regimeData||[0,0,0];
  if(cBar){cBar.destroy();cBar=null;}
  if(cDonut){cDonut.destroy();cDonut=null;}

  cBar=new ApexCharts(document.getElementById('ch-bar'),{
    series:[{name:'Receitas',data:rec},{name:'Despesas',data:desp}],
    chart:{type:'bar',height:185,toolbar:{show:false},background:'transparent',fontFamily:'Plus Jakarta Sans, sans-serif',animations:{enabled:true,easing:'easeinout',speed:700}},
    plotOptions:{bar:{columnWidth:'55%',borderRadius:4,borderRadiusApplication:'end'}},
    colors:['#1a7a4a','#e05252'],
    dataLabels:{enabled:false},
    xaxis:{categories:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],labels:{style:{fontSize:'10px',colors:'#8a8a8a'}},axisBorder:{show:false},axisTicks:{show:false}},
    yaxis:{labels:{formatter:v=>v>=1000?'R$'+Math.round(v/1000)+'k':'R$'+v,style:{fontSize:'10px',colors:'#8a8a8a'}}},
    grid:{borderColor:'#e2ddd6',strokeDashArray:4},
    legend:{position:'top',horizontalAlign:'right',fontSize:'11px',labels:{colors:['#4a4a4a']}},
    tooltip:{theme:'light',y:{formatter:v=>'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}},
    theme:{mode:'light'},
  });
  cBar.render();

  const totalRegime=regimes.reduce((a,b)=>a+b,0);
  cDonut=new ApexCharts(document.getElementById('ch-donut'),{
    series:regimes,
    chart:{type:'donut',height:185,toolbar:{show:false},background:'transparent',fontFamily:'Plus Jakarta Sans, sans-serif'},
    labels:['Lucro Real','Simples Nac.','L. Presumido'],
    colors:['#1a7a4a','#1d4ed8','#9a7c2a'],
    dataLabels:{enabled:false},
    legend:{position:'bottom',fontSize:'10px',labels:{colors:['#4a4a4a']}},
    plotOptions:{pie:{donut:{size:'65%',labels:{show:true,total:{show:true,label:'Clientes',fontSize:'10px',color:'#8a8a8a',formatter:()=>String(totalRegime)}}}}},
    stroke:{width:0},
    tooltip:{theme:'light'},
    theme:{mode:'light'},
  });
  cDonut.render();
}

// SUPABASE
const SUPA_URL='https://qyjpuisuwaroftoilrvc.supabase.co';
const SUPA_KEY='sb_publishable_17OQIf-VNA-yFWUh7FfqNQ_5zZ9Nh8y';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);
let currentUser=null;
let escritorioId=null;
let pendingConciliacaoTxId=null;
let _planoCache=[];

async function ensurePlanoCache(){
  if(_planoCache.length)return;
  const {data}=await sb.from('plano_contas').select('codigo,descricao,tipo').eq('escritorio_id',escritorioId).eq('tipo','Analítica').order('codigo');
  _planoCache=data||[];
}

async function acFilter(input,listId){
  await ensurePlanoCache();
  const q=(input.value||'').toLowerCase().trim();
  const list=document.getElementById(listId);
  if(!q){list.classList.remove('open');list.innerHTML='';return;}
  const matches=_planoCache.filter(c=>c.codigo.includes(q)||c.descricao.toLowerCase().includes(q)).slice(0,12);
  if(!matches.length){list.classList.remove('open');return;}
  list.innerHTML=matches.map(c=>{
    const nomeEsc=c.descricao.replace(/'/g,"\\'");
    return `<li onclick="acSelect('${input.id}','${listId}','${c.codigo}','${nomeEsc}')"><strong>${c.codigo}</strong><span>${c.descricao}</span></li>`;
  }).join('');
  list.classList.add('open');
}

function acSelect(inputId,listId,codigo,descricao){
  const el=document.getElementById(inputId);
  if(el)el.value=codigo;
  const list=document.getElementById(listId);
  list.classList.remove('open');
  list.innerHTML='';
}

document.addEventListener('click',e=>{
  document.querySelectorAll('.ac-list.open').forEach(l=>{
    if(!l.closest('.ac-wrap').contains(e.target)){l.classList.remove('open');l.innerHTML='';}
  });
});
let filtroClienteConcId=null;
let filtroClienteConcNome='';
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const setKpi=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};

async function init(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){window.location.href='login.html';return;}
  const user=session.user;
  currentUser=user;
  const meta=user.user_metadata||{};
  const uname=document.querySelector('.u-name');
  const urole=document.querySelector('.u-role');
  if(uname)uname.textContent=meta.nome_completo||user.email;
  if(urole)urole.textContent='Contador · '+(meta.plano||'Pro');
  const av=document.querySelector('.av');
  if(av&&meta.nome_completo){const parts=meta.nome_completo.split(' ');av.textContent=(parts[0][0]+(parts[1]?.[0]||'')).toUpperCase();}
  document.querySelector('.user-row').addEventListener('click',async()=>{
    if(confirm('Deseja sair do TEUcontador?')){await sb.auth.signOut();window.location.href='login.html';}
  });
  await loadDashboard();
  populateClienteSelects();
  populateResponsavelSelect();
  document.getElementById('lanc-data').value=new Date().toISOString().split('T')[0];
  const mesAtual=new Date().toISOString().slice(0,7);
  document.getElementById('sped-competencia').value=mesAtual;
  document.getElementById('dctf-competencia').value=mesAtual;
  gsap.from('.sidebar',{x:-20,opacity:0,duration:.6,ease:'power2.out'});
  gsap.from('.topbar',{y:-14,opacity:0,duration:.5,delay:.15,ease:'power2.out'});
}

async function loadDashboard(){
  let {data:esc}=await sb.from('escritorios').select('*').single();
  if(!esc&&currentUser){
    const nome=currentUser.user_metadata?.nome_completo||currentUser.email||'Escritório';
    const {data:novo}=await sb.from('escritorios').insert({user_id:currentUser.id,nome}).select('*').single();
    esc=novo;
  }
  if(esc){escritorioId=esc.id;document.querySelector('.logo-ver').textContent=esc.nome||'Sistema Contábil';}
  const {count:totalClientes}=await sb.from('clientes').select('*',{count:'exact',head:true});
  const {count:pendentes}=await sb.from('clientes').select('*',{count:'exact',head:true}).eq('situacao','pendente');
  const tc=totalClientes||0,pend=pendentes||0,emDia=tc-pend;
  const tabs=document.querySelectorAll('#dash-clientes-tabs .tab');
  if(tabs[0])tabs[0].textContent=`Todos (${tc})`;
  if(tabs[1])tabs[1].textContent=`Pendentes (${pend})`;
  if(tabs[2])tabs[2].textContent=`Em dia (${emDia})`;
  const sbBadge=document.getElementById('sb-clientes-badge');
  if(sbBadge)sbBadge.textContent=tc;
  const {data:clientes}=await sb.from('clientes').select('id,razao_social,cnpj,regime,situacao,honorarios').limit(5).order('created_at',{ascending:false});
  renderClientesTable(clientes||[]);
  const {data:lancs}=await sb.from('lancamentos').select('id,historico,valor,tipo,data_lanc,created_at,clientes(razao_social)').order('created_at',{ascending:false});
  const lancsAll=lancs||[];
  const {data:todosClientes}=await sb.from('clientes').select('honorarios');
  const receitaBruta=(todosClientes||[]).reduce((s,c)=>s+(Number(c.honorarios)||0),0);
  const {data:colaboradores}=await sb.from('colaboradores').select('salario_bruto');
  const totalFolha=(colaboradores||[]).reduce((s,c)=>s+(Number(c.salario_bruto)||0),0);
  const {data:obrigAlerts,count:totalPendFiscal}=await sb.from('obrigacoes').select('tipo,vencimento,status,clientes(razao_social)',{count:'exact'}).in('status',['pendente','atrasado']).order('vencimento',{ascending:true}).limit(3);
  renderAlertas(obrigAlerts||[]);
  const pendFiscal=totalPendFiscal||0;
  const k3delta=document.getElementById('k3-delta');
  if(k3delta)k3delta.textContent=pendFiscal===1?'1 obrigação pendente':`${pendFiscal} obrigações pendentes`;
  renderAtividade(lancsAll.slice(0,4));
  // compute monthly rec/desp and rebuild chart with real data
  const ano=new Date().getFullYear();
  const recArr=Array(12).fill(0);
  const despArr=Array(12).fill(0);
  lancsAll.forEach(l=>{
    const d=new Date(l.data_lanc||l.created_at);
    if(d.getFullYear()!==ano)return;
    const m=d.getMonth();
    const v=Number(l.valor)||0;
    if(l.tipo==='credito')recArr[m]+=v;
    else despArr[m]+=v;
  });
  // Contagem por regime para o donut
  const {data:clientesRegime}=await sb.from('clientes').select('regime').eq('escritorio_id',escritorioId);
  const regimes={lucro_real:0,simples:0,lucro_presumido:0};
  (clientesRegime||[]).forEach(c=>{
    const r=(c.regime||'').toLowerCase();
    if(r.includes('real'))regimes.lucro_real++;
    else if(r.includes('presumido'))regimes.lucro_presumido++;
    else regimes.simples++;
  });
  buildCharts(recArr.map(v=>+v.toFixed(2)),despArr.map(v=>+v.toFixed(2)),[regimes.lucro_real,regimes.simples,regimes.lucro_presumido]);
  animKPI(tc,pendFiscal,receitaBruta,totalFolha);
}

function renderClientesTable(clientes){
  const tbody=document.getElementById('dash-clientes-tbody');if(!tbody)return;
  if(!clientes.length){tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:20px">Nenhum cliente cadastrado ainda</td></tr>';return;}
  const colors=['linear-gradient(135deg,#1a5c3a,#2563a8)','linear-gradient(135deg,#c94f1a,#7c5cbf)','linear-gradient(135deg,#2563a8,#7c5cbf)','linear-gradient(135deg,#c0392b,#c94f1a)','linear-gradient(135deg,#1a7a3a,#1a5c3a)'];
  tbody.innerHTML=clientes.map(c=>{
    const ini=(c.razao_social||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const color=colors[Math.floor(Math.random()*colors.length)];
    const badgeSit=c.situacao==='em_dia'?'<span class="badge b-ok">Em dia</span>':c.situacao==='pendente'?'<span class="badge b-pend">Pendente</span>':'<span class="badge b-late">Atrasado</span>';
    const hon=c.honorarios?`R$ ${Number(c.honorarios).toLocaleString('pt-BR')}`:'—';
    const honColor=c.situacao==='em_dia'?'color:var(--pos);font-weight:500':c.situacao==='atrasado'?'color:var(--neg);font-weight:500':'';
    return `<tr style="cursor:pointer" onclick="verCliente('${c.id}')"><td><div class="co"><div class="co-av" style="background:${color}">${ini}</div><div><div class="co-name">${c.razao_social}</div><div class="co-cnpj">${c.cnpj||''}</div></div></div></td><td><span class="badge b-info">${c.regime||'—'}</span></td><td>${badgeSit}</td><td style="${honColor}">${hon}</td></tr>`;
  }).join('');
}


async function verCliente(id){
  const {data:c}=await sb.from('clientes').select('*').eq('id',id).single();
  if(!c){toast('❌ Cliente não encontrado');return;}
  const colors=['linear-gradient(135deg,#1a5c3a,#2563a8)','linear-gradient(135deg,#c94f1a,#7c5cbf)','linear-gradient(135deg,#2563a8,#7c5cbf)','linear-gradient(135deg,#c0392b,#c94f1a)','linear-gradient(135deg,#1a7a3a,#1a5c3a)'];
  const ini=(c.razao_social||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const av=document.getElementById('vc-av');
  if(av){av.textContent=ini;av.style.background=colors[ini.charCodeAt(0)%colors.length];}
  const set=(el,val)=>{const e=document.getElementById(el);if(e)e.textContent=val||'—';};
  set('vc-nome',c.razao_social);
  set('vc-cnpj',c.cnpj?'CNPJ: '+c.cnpj:'Sem CNPJ');
  const sitMap={em_dia:'Em dia',pendente:'Pendente',atrasado:'Atrasado'};
  set('vc-sit',sitMap[c.situacao]||c.situacao||'—');
  set('vc-regime',c.regime||'—');
  set('vc-hon',c.honorarios?'R$ '+Number(c.honorarios).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—');
  set('vc-resp',c.responsavel||'—');
  set('vc-data',c.created_at?new Date(c.created_at).toLocaleDateString('pt-BR'):'—');
  // Novos campos
  const vcId=document.getElementById('vc-id');if(vcId)vcId.value=c.id||'';
  set('vc-ie',c.inscricao_estadual||'—');
  set('vc-natureza',c.natureza_juridica||'—');
  set('vc-cnae',c.cnae||'—');
  set('vc-municipio',c.municipio||'—');
  set('vc-uf',c.uf||'—');
  set('vc-cod-municipio',c.cod_municipio||'—');
  const fmtAliq=v=>v!=null&&v!==''?Number(v).toFixed(2)+'%':'—';
  set('vc-aliq-irpj',fmtAliq(c.aliq_irpj));
  set('vc-aliq-csll',fmtAliq(c.aliq_csll));
  set('vc-aliq-pis',fmtAliq(c.aliq_pis));
  set('vc-aliq-cofins',fmtAliq(c.aliq_cofins));
  set('vc-aliq-iss',fmtAliq(c.aliq_iss));
  openM('m-ver-cliente');
}

function renderAlertas(obs){
  const wrap=document.getElementById('dash-alertas');if(!wrap)return;
  if(!obs.length){wrap.innerHTML='<div style="padding:10px;text-align:center;color:var(--text-dim);font-size:12px">Nenhum alerta no momento</div>';return;}
  const hoje=new Date();
  wrap.innerHTML=obs.map(o=>{
    const venc=o.vencimento?new Date(o.vencimento):null;
    const dias=venc?Math.ceil((venc-hoje)/(1000*60*60*24)):null;
    const atrasado=o.status==='atrasado'||dias<0;
    const urgente=!atrasado&&dias!=null&&dias<=3;
    const cls=atrasado?'a-err':urgente?'a-err':'a-warn';
    const icon=atrasado?'🚨':urgente?'🚨':'⏰';
    const tempo=atrasado?'Atrasado':dias!=null?`${dias} dia${dias!==1?'s':''}`:o.status;
    const cliente=o.clientes?.razao_social?` — ${o.clientes.razao_social}`:'';
    return `<div class="alert-item ${cls}" onclick="goPage('obrigacoes')"><span>${icon}</span><div class="a-txt">${o.tipo}${cliente}</div><div class="a-time">${tempo}</div></div>`;
  }).join('');
}

function renderAtividade(lancs){
  const wrap=document.getElementById('act-recente');if(!wrap)return;
  if(!lancs.length){wrap.innerHTML='<div style="padding:16px;text-align:center;color:var(--text-dim)">Nenhuma atividade recente</div>';return;}
  const colors=['var(--pos)','var(--info)','var(--warn)','var(--gold)'];
  wrap.innerHTML=lancs.map((l,i)=>{
    const dt=new Date(l.created_at).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
    const nome=l.clientes?.razao_social||'';
    return `<div class="act-item"><div class="act-dot" style="background:${colors[i%colors.length]}"></div><div><div class="act-text"><strong>Lançamento #${l.id}</strong>${nome?' — '+nome:''} — ${l.historico||''}</div><div class="act-time">${dt}</div></div></div>`;
  }).join('');
}

async function loadClientes(){
  const {data}=await sb.from('clientes').select('*').order('created_at',{ascending:false});
  const clientes=data||[];
  const emDia=clientes.filter(c=>c.situacao==='em_dia').length;
  const pend=clientes.filter(c=>c.situacao==='pendente').length;
  const statsEl=document.getElementById('pg-clientes-stats');
  if(statsEl)statsEl.textContent=`${clientes.length} empresas · ${emDia} em dia · ${pend} com pendências`;
  const tabs=document.querySelectorAll('#pg-clientes-tabs .tab');
  if(tabs[0])tabs[0].textContent=`Todos (${clientes.length})`;
  pageConf.clientes.sub=`${clientes.length} empresas cadastradas`;
  document.getElementById('tpSub').textContent=pageConf.clientes.sub;
  const tbody=document.querySelector('#pg-clientes tbody');if(!tbody)return;
  if(!clientes.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:20px">Nenhum cliente cadastrado ainda</td></tr>';
    return;
  }
  const colors=['linear-gradient(135deg,#1a5c3a,#2563a8)','linear-gradient(135deg,#c94f1a,#7c5cbf)','linear-gradient(135deg,#2563a8,#7c5cbf)','linear-gradient(135deg,#c0392b,#c94f1a)','linear-gradient(135deg,#1a7a3a,#1a5c3a)'];
  tbody.innerHTML=clientes.map((c,i)=>{
    const ini=(c.razao_social||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const color=colors[i%colors.length];
    const badgeSit=c.situacao==='em_dia'?'<span class="badge b-ok">Em dia</span>':c.situacao==='pendente'?'<span class="badge b-pend">Pendente</span>':'<span class="badge b-late">Atrasado</span>';
    const hon=c.honorarios?`R$ ${Number(c.honorarios).toLocaleString('pt-BR')}`:'—';
    const honColor=c.situacao==='em_dia'?'color:var(--pos);font-weight:500':c.situacao==='atrasado'?'color:var(--neg);font-weight:500':'';
    const nomeEsc=(c.razao_social||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<tr><td><div class="co"><div class="co-av" style="background:${color}">${ini}</div><div><div class="co-name">${c.razao_social}</div><div class="co-cnpj">${c.cnpj||''}</div></div></div></td><td><span class="badge b-info">${c.regime||'—'}</span></td><td style="font-size:11.5px;color:var(--text-dim)">${c.responsavel||'—'}</td><td style="font-size:11.5px;color:var(--text-dim)">${c.competencia||'—'}</td><td>${badgeSit}</td><td style="${honColor}">${hon}</td><td><div style="display:flex;gap:5px"><button class="btn btn-ghost btn-sm" onclick="verCliente('${c.id}')">Ver</button><button class="btn btn-ghost btn-sm" onclick="editCliente('${c.id}')">Editar</button><button class="btn btn-danger btn-sm" onclick="confirmarExcluirCliente('${c.id}','${nomeEsc}')">Excluir</button></div></td></tr>`;
  }).join('');
}

async function loadLancamentos(){
  const {data}=await sb.from('lancamentos').select('*, clientes(razao_social)').order('data_lanc',{ascending:false}).limit(50);
  const lancs=data||[];
  // stats
  const debitos=lancs.filter(l=>l.tipo==='debito');
  const creditos=lancs.filter(l=>l.tipo==='credito');
  const totDeb=debitos.reduce((s,l)=>s+(Number(l.valor)||0),0);
  const totCred=creditos.reduce((s,l)=>s+(Number(l.valor)||0),0);
  const fmt=v=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2});
  const statsEl=document.getElementById('lanc-stats');
  if(statsEl)statsEl.textContent=`${lancs.length} lançamento${lancs.length!==1?'s':''}`;
  const elDeb=document.getElementById('lanc-debitos');if(elDeb)elDeb.textContent=fmt(totDeb);
  const elCred=document.getElementById('lanc-creditos');if(elCred)elCred.textContent=fmt(totCred);
  const elDebC=document.getElementById('lanc-debitos-count');if(elDebC)elDebC.textContent=`${debitos.length} lançamento${debitos.length!==1?'s':''} a débito`;
  const elCredC=document.getElementById('lanc-creditos-count');if(elCredC)elCredC.textContent=`${creditos.length} lançamento${creditos.length!==1?'s':''} a crédito`;
  const tbody=document.querySelector('#pg-lancamentos tbody');if(!tbody)return;
  if(!lancs.length){
    tbody.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:20px">Nenhum lançamento registrado ainda</td></tr>';
    return;
  }
  tbody.innerHTML=lancs.map(l=>{
    const dt=l.data_lanc?new Date(l.data_lanc).toLocaleDateString('pt-BR'):'—';
    const val=l.valor?Number(l.valor).toLocaleString('pt-BR',{minimumFractionDigits:2}):'0,00';
    const isCredit=l.tipo==='credito';
    return `<tr><td style="color:var(--text-dim)">#${l.id.slice(0,8)}…</td><td>${dt}</td><td>${l.clientes?.razao_social||'—'}</td><td style="color:var(--text-dim);font-size:11px">${l.conta_debito||'—'}</td><td style="color:var(--text-dim);font-size:11px">${l.conta_credito||'—'}</td><td>${l.historico||'—'}</td><td>${isCredit?'':'<span class="ld">R$ '+val+'</span>'}</td><td>${isCredit?'<span class="lc">R$ '+val+'</span>':''}</td><td><div style="display:flex;gap:5px"><button class="btn btn-ghost btn-sm" onclick='verLanc(${JSON.stringify(l)})'>Ver</button><button class="btn btn-danger btn-sm" onclick="deleteLanc('${l.id}')">✕</button></div></td></tr>`;
  }).join('');
}

async function saveCliente(){
  const g=id=>document.getElementById(id)?.value||'';
  const id=g('cli-id');
  const obj={
    razao_social:g('cli-razao').trim(),
    cnpj:g('cli-cnpj').trim(),
    inscricao_estadual:g('cli-ie').trim()||null,
    natureza_juridica:g('cli-natureza')||null,
    cnae:g('cli-cnae').trim()||null,
    municipio:g('cli-municipio').trim()||null,
    uf:g('cli-uf')||null,
    cod_municipio:g('cli-cod-municipio').trim()||null,
    regime:g('cli-regime'),
    honorarios:parseFloat(g('cli-honorarios').replace(/[^0-9,.]/g,'').replace(',','.'))||null,
    responsavel:g('cli-responsavel')||null,
    aliq_irpj:parseFloat(g('cli-aliq-irpj'))||0,
    aliq_csll:parseFloat(g('cli-aliq-csll'))||0,
    aliq_pis:parseFloat(g('cli-aliq-pis'))||0,
    aliq_cofins:parseFloat(g('cli-aliq-cofins'))||0,
    aliq_iss:parseFloat(g('cli-aliq-iss'))||0,
    escritorio_id:escritorioId
  };
  if(!obj.razao_social){toast('⚠️ Informe a razão social');return;}
  let error;
  if(id){
    ({error}=await sb.from('clientes').update(obj).eq('id',id));
  }else{
    obj.situacao='em_dia';
    ({error}=await sb.from('clientes').insert(obj));
  }
  if(error){toast('❌ '+error.message);return;}
  closeM('m-cliente');
  toast(id?'✅ Cliente atualizado!':'✅ Cliente cadastrado com sucesso!');
  await loadDashboard();populateClienteSelects();if(activePg==='clientes')await loadClientes();
}

let pendingExcluirClienteId=null;

function confirmarExcluirCliente(id,nome){
  pendingExcluirClienteId=id;
  const el=document.getElementById('excluir-cliente-nome');
  if(el)el.textContent=nome;
  openM('m-excluir-cliente');
}

async function excluirCliente(){
  if(!pendingExcluirClienteId)return;
  // 1. Busca IDs dos lançamentos do cliente
  const {data:lancsDoCliente}=await sb.from('lancamentos').select('id').eq('cliente_id',pendingExcluirClienteId);
  const lancIds=(lancsDoCliente||[]).map(l=>l.id);
  // 2. Zera lancamento_id nas transações que apontam para esses lançamentos
  if(lancIds.length){
    await sb.from('transacoes_bancarias').update({lancamento_id:null,conciliado:false}).in('lancamento_id',lancIds);
  }
  // 3. Desvincula transações do cliente
  await sb.from('transacoes_bancarias').update({cliente_id:null}).eq('cliente_id',pendingExcluirClienteId);
  // 4. Exclui lançamentos
  const {error:errLanc}=await sb.from('lancamentos').delete().eq('cliente_id',pendingExcluirClienteId);
  if(errLanc){toast('❌ Erro ao excluir lançamentos: '+errLanc.message);return;}
  // 5. Exclui obrigações vinculadas
  await sb.from('obrigacoes').delete().eq('cliente_id',pendingExcluirClienteId);
  // 6. Exclui o cliente
  const {error}=await sb.from('clientes').delete().eq('id',pendingExcluirClienteId);
  if(error){toast('❌ '+error.message);return;}
  pendingExcluirClienteId=null;
  closeM('m-excluir-cliente');
  toast('✅ Cliente e dados vinculados excluídos!');
  await loadDashboard();
  populateClienteSelects();
  if(activePg==='clientes')await loadClientes();
}

function abrirNovoCliente(){
  ['cli-id','cli-razao','cli-cnpj','cli-ie','cli-cnae','cli-municipio','cli-cod-municipio','cli-honorarios','cli-aliq-irpj','cli-aliq-csll','cli-aliq-pis','cli-aliq-cofins','cli-aliq-iss'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('cli-regime').value='Simples Nacional';
  document.getElementById('cli-uf').value='SP';
  document.getElementById('cli-natureza').value='';
  document.getElementById('cli-responsavel').value='';
  document.getElementById('m-cliente-title').textContent='Cadastrar Novo Cliente';
  document.getElementById('cli-save-btn').textContent='Cadastrar';
  openM('m-cliente');
}

async function editCliente(id){
  const {data:c}=await sb.from('clientes').select('*').eq('id',id).single();
  if(!c){toast('❌ Cliente não encontrado');return;}
  const s=(elId,val)=>{const el=document.getElementById(elId);if(el)el.value=val||'';};
  s('cli-id',c.id);
  s('cli-razao',c.razao_social);
  s('cli-cnpj',c.cnpj);
  s('cli-ie',c.inscricao_estadual);
  s('cli-natureza',c.natureza_juridica);
  s('cli-cnae',c.cnae);
  s('cli-municipio',c.municipio);
  s('cli-uf',c.uf||'SP');
  s('cli-cod-municipio',c.cod_municipio);
  s('cli-regime',c.regime||'Simples Nacional');
  s('cli-honorarios',c.honorarios);
  s('cli-responsavel',c.responsavel);
  s('cli-aliq-irpj',c.aliq_irpj||0);
  s('cli-aliq-csll',c.aliq_csll||0);
  s('cli-aliq-pis',c.aliq_pis||0);
  s('cli-aliq-cofins',c.aliq_cofins||0);
  s('cli-aliq-iss',c.aliq_iss||0);
  document.getElementById('m-cliente-title').textContent='Editar Cliente';
  document.getElementById('cli-save-btn').textContent='Salvar';
  openM('m-cliente');
}

async function exportarLancamentos(){
  const {data}=await sb.from('lancamentos').select('*,clientes(razao_social)').eq('escritorio_id',escritorioId).order('data_lanc',{ascending:false});
  if(!data?.length){toast('⚠️ Nenhum lançamento para exportar');return;}
  const header='Data;Cliente;Histórico;Tipo;Valor;Conta Débito;Conta Crédito;Nº Documento';
  const rows=data.map(l=>[
    l.data_lanc?new Date(l.data_lanc+'T12:00').toLocaleDateString('pt-BR'):'',
    `"${l.clientes?.razao_social||''}"`,
    `"${l.historico||''}"`,
    l.tipo||'',
    Number(l.valor||0).toFixed(2).replace('.',','),
    l.conta_debito||'',
    l.conta_credito||'',
    l.nrdoc||''
  ].join(';'));
  const csv='\uFEFF'+header+'\n'+rows.join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='lancamentos_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  URL.revokeObjectURL(url);
  toast('✅ CSV exportado!');
}

async function exportarClientes(){
  const {data}=await sb.from('clientes').select('*').eq('escritorio_id',escritorioId).order('razao_social');
  if(!data?.length){toast('⚠️ Nenhum cliente para exportar');return;}
  const header='Razão Social;CNPJ;Regime;Honorários;Responsável;Situação;Cadastrado em';
  const rows=data.map(c=>[
    `"${c.razao_social||''}"`,
    c.cnpj||'',
    c.regime||'',
    c.honorarios||'',
    `"${c.responsavel||''}"`,
    c.situacao||'',
    c.created_at?new Date(c.created_at).toLocaleDateString('pt-BR'):''
  ].join(';'));
  const csv='\uFEFF'+header+'\n'+rows.join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='clientes_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  toast('✅ CSV exportado!');
}

async function saveLanc(){
  const g=id=>document.getElementById(id)?.value||'';
  const obj={
    conta_debito:g('lanc-conta-debito').trim(),
    conta_credito:g('lanc-conta-credito').trim(),
    valor:parseFloat(g('lanc-valor').replace(/[^0-9,.]/g,'').replace(',','.'))||0,
    tipo:g('lanc-tipo')||'debito',
    nr_documento:g('lanc-nrdoc').trim(),
    historico:g('lanc-historico').trim(),
    data_lanc:g('lanc-data')||new Date().toISOString().split('T')[0],
    cliente_id:document.querySelector('#m-lanc .sel-cliente')?.value||null,
    escritorio_id:escritorioId
  };
  if(!obj.historico){toast('⚠️ Informe o histórico');return;}
  if(!obj.valor){toast('⚠️ Informe o valor');return;}
  const {data:novo,error}=await sb.from('lancamentos').insert(obj).select('id').single();
  if(error){toast('❌ '+error.message);return;}
  if(pendingConciliacaoTxId){
    await sb.from('transacoes_bancarias').update({conciliado:true,lancamento_id:novo.id}).eq('id',pendingConciliacaoTxId);
    pendingConciliacaoTxId=null;
    closeM('m-lanc');toast('✅ Lançamento criado e vinculado!');
    await loadConciliacao();
  }else{
    closeM('m-lanc');toast('✅ Lançamento registrado!');
    await loadDashboard();
    if(activePg==='lancamentos')await loadLancamentos();
  }
}

function criarLancamentoDaConciliacao(txId,valor,tipo,data,descricao){
  pendingConciliacaoTxId=txId;
  document.getElementById('lanc-data').value=data;
  document.getElementById('lanc-valor').value=Number(valor).toFixed(2).replace('.',',');
  document.getElementById('lanc-tipo').value=tipo;
  document.getElementById('lanc-historico').value=descricao;
  document.getElementById('lanc-nrdoc').value='';
  document.getElementById('lanc-conta-debito').value='';
  document.getElementById('lanc-conta-credito').value='';
  const sel=document.querySelector('#m-lanc .sel-cliente');
  if(sel)sel.value='';
  openM('m-lanc');
}

function verLanc(l){
  const fmt=v=>v?'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—';
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val||'—';};
  set('vl-data',l.data_lanc?new Date(l.data_lanc).toLocaleDateString('pt-BR'):'—');
  set('vl-tipo',l.tipo==='credito'?'Crédito':'Débito');
  set('vl-cliente',l.clientes?.razao_social||'—');
  set('vl-debito',l.conta_debito);
  set('vl-credito',l.conta_credito);
  set('vl-valor',fmt(l.valor));
  set('vl-nrdoc',l.nr_documento);
  set('vl-historico',l.historico);
  openM('m-ver-lanc');
}

async function deleteLanc(id){
  if(!confirm('Excluir este lançamento?'))return;
  const {error}=await sb.from('lancamentos').delete().eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('🗑 Lançamento excluído');
  await loadLancamentos();
  await loadDashboard();
}

async function loadConfig(){
  const {data:esc}=await sb.from('escritorios').select('*').single();
  if(!esc)return;
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val||'';};
  set('cfg-nome',esc.nome);
  set('cfg-cnpj',esc.cnpj);
  set('cfg-crc',esc.crc);
  set('cfg-resp',esc.responsavel_tecnico||currentUser?.user_metadata?.nome_completo||'');
  set('cfg-tel',esc.telefone);
  set('cfg-end',esc.endereco);
}

async function saveConfig(){
  const get=id=>document.getElementById(id)?.value.trim()||null;
  const obj={nome:get('cfg-nome'),cnpj:get('cfg-cnpj'),crc:get('cfg-crc'),responsavel_tecnico:get('cfg-resp'),telefone:get('cfg-tel'),endereco:get('cfg-end')};
  if(!obj.nome){toast('⚠️ Informe o nome do escritório');return;}
  // Tenta pelo escritorioId global primeiro
  if(escritorioId){
    const {error}=await sb.from('escritorios').update(obj).eq('id',escritorioId);
    if(error){toast('❌ '+error.message);return;}
  }else{
    // Fallback: atualiza o escritório do usuário logado
    const {data:esc}=await sb.from('escritorios').select('id').eq('user_id',currentUser.id).single();
    if(!esc){toast('❌ Escritório não encontrado');return;}
    const {error}=await sb.from('escritorios').update(obj).eq('id',esc.id);
    if(error){toast('❌ '+error.message);return;}
    escritorioId=esc.id;
  }
  const logoEl=document.querySelector('.logo-ver');
  if(logoEl)logoEl.textContent=obj.nome;
  toast('✅ Dados salvos com sucesso!');
}

// ── INTEGRAÇÕES ───────────────────────────────────────────────────────────────

async function salvarDadosBanco(){
  const g=id=>document.getElementById(id)?.value||'';
  const obj={banco_nome:g('banco-nome'),banco_agencia:g('banco-agencia'),banco_conta:g('banco-conta'),banco_tipo:g('banco-tipo'),banco_pix:g('banco-pix')};
  if(!obj.banco_nome){toast('⚠️ Selecione o banco');return;}
  const {error}=await sb.from('escritorios').update(obj).eq('id',escritorioId);
  if(error){toast('❌ '+error.message);return;}
  closeM('m-int-banco');
  toast('✅ Dados bancários salvos!');
}

async function loadDadosBanco(){
  if(!escritorioId)return;
  const {data}=await sb.from('escritorios').select('banco_nome,banco_agencia,banco_conta,banco_tipo,banco_pix').eq('id',escritorioId).single();
  if(!data)return;
  const s=(id,val)=>{const el=document.getElementById(id);if(el&&val)el.value=val;};
  s('banco-nome',data.banco_nome);s('banco-agencia',data.banco_agencia);
  s('banco-conta',data.banco_conta);s('banco-tipo',data.banco_tipo);
  s('banco-pix',data.banco_pix);
}

async function gerarNFSe(){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const prestadorId=g('nfse-prestador');
  if(!prestadorId){toast('⚠️ Selecione o prestador');return;}
  if(!g('nfse-tomador')||!g('nfse-valor')||!g('nfse-descricao')){toast('⚠️ Preencha os campos obrigatórios');return;}
  const {data:cli}=await sb.from('clientes').select('*').eq('id',prestadorId).single();
  if(!cli){toast('❌ Cliente não encontrado');return;}
  const cnpj=(cli.cnpj||'').replace(/\D/g,'');
  const valor=parseFloat(g('nfse-valor').replace(/[^0-9,]/g,'').replace(',','.'))||0;
  const aliqIss=Math.min(parseFloat(g('nfse-aliq-iss').replace(',','.'))||0,100);
  const aliqPis=Math.min(parseFloat(g('nfse-aliq-pis').replace(',','.'))||0,100);
  const aliqCofins=Math.min(parseFloat(g('nfse-aliq-cofins').replace(',','.'))||0,100);
  if(aliqIss>20){toast('⚠️ Alíquota ISS acima de 20% — verifique o valor');return;}
  const vlIss=(valor*aliqIss/100).toFixed(2);
  const vlPis=(valor*aliqPis/100).toFixed(2);
  const vlCofins=(valor*aliqCofins/100).toFixed(2);
  const vlLiq=(valor-parseFloat(vlIss)-parseFloat(vlPis)-parseFloat(vlCofins)).toFixed(2);
  const dt=g('nfse-data')||new Date().toISOString().slice(0,10);
  const dtFmt=dt+'T00:00:00';
  const num=g('nfse-numero')||'000001';
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.01">
    <InfNfse Id="N${num}">
      <Numero>${num}</Numero>
      <CodigoVerificacao>GERADO-SISTEMA</CodigoVerificacao>
      <DataEmissao>${dtFmt}</DataEmissao>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <CpfCnpj><Cnpj>${cnpj}</Cnpj></CpfCnpj>
          <InscricaoMunicipal>${cli.inscricao_estadual||''}</InscricaoMunicipal>
        </IdentificacaoPrestador>
        <RazaoSocial>${cli.razao_social||''}</RazaoSocial>
        <Endereco>
          <Municipio>${cli.municipio||''}</Municipio>
          <Uf>${cli.uf||''}</Uf>
          <CodigoMunicipio>${cli.cod_municipio||''}</CodigoMunicipio>
        </Endereco>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj><Cnpj>${g('nfse-tomador-doc').replace(/\D/g,'')}</Cnpj></CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>${g('nfse-tomador')}</RazaoSocial>
      </TomadorServico>
      <Servico>
        <Valores>
          <ValorServicos>${valor.toFixed(2)}</ValorServicos>
          <ValorIss>${vlIss}</ValorIss>
          <ValorPis>${vlPis}</ValorPis>
          <ValorCofins>${vlCofins}</ValorCofins>
          <ValorLiquidoNfse>${vlLiq}</ValorLiquidoNfse>
          <AliquotaIss>${(aliqIss/100).toFixed(4)}</AliquotaIss>
        </Valores>
        <IssRetido>2</IssRetido>
        <ItemListaServico>${g('nfse-cod-servico')||'17.06'}</ItemListaServico>
        <Discriminacao>${g('nfse-descricao')}</Discriminacao>
        <CodigoMunicipio>${cli.cod_municipio||''}</CodigoMunicipio>
      </Servico>
    </InfNfse>
  </Nfse>
</CompNfse>`;
  closeM('m-int-nfse');
  downloadTxt(xml,`NFSe_${cnpj}_${num}_${dt.replace(/-/g,'')}.xml`);
  toast('✅ XML NFS-e gerado! Importe no sistema da prefeitura para assinar e transmitir.');
}

function renderEsocialForm(){
  const ev=document.getElementById('esocial-evento')?.value;
  const area=document.getElementById('esocial-form-area');
  if(!area)return;
  if(!ev){area.innerHTML='';return;}
  const forms={
    'S-1200':`<div class="form-grid" style="gap:10px">
      <div><label class="f-label">Competência (AAAA-MM)</label><input class="f-input" id="es-competencia" placeholder="2026-03"></div>
      <div><label class="f-label">CPF do Trabalhador</label><input class="f-input" id="es-cpf" placeholder="000.000.000-00"></div>
      <div><label class="f-label">Matrícula</label><input class="f-input" id="es-matricula" placeholder="001"></div>
      <div><label class="f-label">Categoria (ex: 101)</label><input class="f-input" id="es-categoria" placeholder="101"></div>
      <div><label class="f-label">Remuneração Bruta (R$)</label><input class="f-input" id="es-remuneracao" placeholder="0,00"></div>
      <div><label class="f-label">INSS Descontado (R$)</label><input class="f-input" id="es-inss" placeholder="0,00"></div>
      <div><label class="f-label">IRRF Descontado (R$)</label><input class="f-input" id="es-irrf" placeholder="0,00"></div>
    </div>`,
    'S-2200':`<div class="form-grid" style="gap:10px">
      <div><label class="f-label">CPF do Trabalhador</label><input class="f-input" id="es-cpf" placeholder="000.000.000-00"></div>
      <div><label class="f-label">Nome Completo</label><input class="f-input" id="es-nome" placeholder="Nome do trabalhador"></div>
      <div><label class="f-label">Data de Nascimento</label><input class="f-input" type="date" id="es-nascimento"></div>
      <div><label class="f-label">Data de Admissão</label><input class="f-input" type="date" id="es-admissao"></div>
      <div><label class="f-label">Cargo / Função</label><input class="f-input" id="es-cargo" placeholder="Analista Contábil"></div>
      <div><label class="f-label">Salário Base (R$)</label><input class="f-input" id="es-salario" placeholder="0,00"></div>
      <div><label class="f-label">Regime (1=CLT / 2=Estatutário)</label><input class="f-input" id="es-regime-trab" placeholder="1"></div>
      <div><label class="f-label">Matrícula</label><input class="f-input" id="es-matricula" placeholder="001"></div>
    </div>`,
    'S-2206':`<div class="form-grid" style="gap:10px">
      <div><label class="f-label">CPF do Trabalhador</label><input class="f-input" id="es-cpf" placeholder="000.000.000-00"></div>
      <div><label class="f-label">Matrícula</label><input class="f-input" id="es-matricula" placeholder="001"></div>
      <div><label class="f-label">Data da Alteração</label><input class="f-input" type="date" id="es-dt-alt"></div>
      <div><label class="f-label">Novo Cargo</label><input class="f-input" id="es-cargo" placeholder="Novo cargo"></div>
      <div><label class="f-label">Novo Salário (R$)</label><input class="f-input" id="es-salario" placeholder="0,00"></div>
    </div>`,
    'S-2299':`<div class="form-grid" style="gap:10px">
      <div><label class="f-label">CPF do Trabalhador</label><input class="f-input" id="es-cpf" placeholder="000.000.000-00"></div>
      <div><label class="f-label">Matrícula</label><input class="f-input" id="es-matricula" placeholder="001"></div>
      <div><label class="f-label">Data do Desligamento</label><input class="f-input" type="date" id="es-dt-deslig"></div>
      <div><label class="f-label">Motivo (ex: 01 — Rescisão)</label><input class="f-input" id="es-motivo" placeholder="01"></div>
      <div><label class="f-label">Aviso Prévio (S/N)</label><select class="f-select" id="es-aviso"><option value="S">Sim</option><option value="N">Não</option></select></div>
    </div>`
  };
  area.innerHTML=forms[ev]||'';
}

async function gerarESocial(){
  const ev=document.getElementById('esocial-evento')?.value;
  if(!ev){toast('⚠️ Selecione o tipo de evento');return;}
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const {data:esc}=await sb.from('escritorios').select('*').eq('id',escritorioId).single();
  const cnpjEsc=((esc?.cnpj)||'').replace(/\D/g,'');
  const agora=new Date().toISOString().slice(0,19);
  const nrRec=Date.now().toString().slice(-15);
  let evXml='';
  if(ev==='S-1200'){
    const comp=g('es-competencia');
    const cpf=g('es-cpf').replace(/\D/g,'');
    const rem=parseFloat(g('es-remuneracao').replace(',','.'))||0;
    const inss=parseFloat(g('es-inss').replace(',','.'))||0;
    const irrf=parseFloat(g('es-irrf').replace(',','.'))||0;
    evXml=`<evRemun>
      <ideEvento><indRetif>1</indRetif><nrRec>${nrRec}</nrRec><perApur>${comp}</perApur><indGuia>1</indGuia><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>
      <ideEmpregador><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc></ideEmpregador>
      <ideTrabalhador><cpfTrab>${cpf}</cpfTrab></ideTrabalhador>
      <dmDev><codCateg>${g('es-categoria')||'101'}</codCateg>
        <infoPerApur><ideEstabLot><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc><codLotacao>1</codLotacao>
          <detVerbas><codRubr>0001</codRubr><ideTabRubr>S</ideTabRubr><qtdRubr>1</qtdRubr><vrRubr>${rem.toFixed(2)}</vrRubr></detVerbas>
        </ideEstabLot></infoPerApur>
      </dmDev></evRemun>`;
  }else if(ev==='S-2200'){
    const cpf=g('es-cpf').replace(/\D/g,'');
    const sal=parseFloat(g('es-salario').replace(',','.'))||0;
    evXml=`<evCadIni>
      <ideEvento><indRetif>1</indRetif><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>
      <ideEmpregador><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc></ideEmpregador>
      <trabalhador><cpfTrab>${cpf}</cpfTrab><nmTrab>${g('es-nome')}</nmTrab><dtNascto>${g('es-nascimento')}</dtNascto></trabalhador>
      <vinculo><matric>${g('es-matricula')}</matric><tpRegTrab>${g('es-regime-trab')||'1'}</tpRegTrab><tpRegPrev>1</tpRegPrev>
        <infoRegCLT><dtAdm>${g('es-admissao')}</dtAdm><tpAdmissao>1</tpAdmissao><indAdmissao>1</indAdmissao>
          <cargo>${g('es-cargo')}</cargo><remuneracao><vrSalFx>${sal.toFixed(2)}</vrSalFx><undSalFixo>5</undSalFixo></remuneracao>
        </infoRegCLT>
      </vinculo></evCadIni>`;
  }else if(ev==='S-2206'){
    const cpf=g('es-cpf').replace(/\D/g,'');
    const sal=parseFloat(g('es-salario').replace(',','.'))||0;
    evXml=`<evAltContratual>
      <ideEvento><indRetif>1</indRetif><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>
      <ideEmpregador><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc></ideEmpregador>
      <ideTrabalhador><cpfTrab>${cpf}</cpfTrab><nisTrab></nisTrab></ideTrabalhador>
      <vinculo><matric>${g('es-matricula')}</matric>
        <alteracao><dtAlt>${g('es-dt-alt')}</dtAlt><cargo>${g('es-cargo')}</cargo>
          <remuneracao><vrSalFx>${sal.toFixed(2)}</vrSalFx><undSalFixo>5</undSalFixo></remuneracao>
        </alteracao>
      </vinculo></evAltContratual>`;
  }else if(ev==='S-2299'){
    const cpf=g('es-cpf').replace(/\D/g,'');
    evXml=`<evDeslig>
      <ideEvento><indRetif>1</indRetif><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>1.0</verProc></ideEvento>
      <ideEmpregador><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc></ideEmpregador>
      <ideTrabalhador><cpfTrab>${cpf}</cpfTrab></ideTrabalhador>
      <vinculo><matric>${g('es-matricula')}</matric>
        <infoDeslig><dtDeslig>${g('es-dt-deslig')}</dtDeslig><mtvDeslig>${g('es-motivo')||'01'}</mtvDeslig>
          <avisoPrevio><tpAvPrev>${g('es-aviso')||'N'}</tpAvPrev></avisoPrevio>
        </infoDeslig>
      </vinculo></evDeslig>`;
  }
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/${ev}/v_S_01_02_00" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <evtTotal>
    <ideEvento><nrRec>${nrRec}</nrRec></ideEvento>
    <ideEmpregador><tpInsc>1</tpInsc><nrInsc>${cnpjEsc}</nrInsc></ideEmpregador>
    ${evXml}
  </evtTotal>
</eSocial>`;
  closeM('m-int-esocial');
  downloadTxt(xml,`eSocial_${ev}_${cnpjEsc}_${agora.replace(/[-:T]/g,'').slice(0,14)}.xml`);
  toast(`✅ XML ${ev} gerado! Envie pelo portal eSocial (gov.br) após assinar com certificado digital.`);
}

// ── DADOS GLOBAIS DE RELATÓRIOS ─────────────────────────────────────────────
let _relLanc=[], _relPlano=[], _relClientes=[], _relObrig=[], _relTabAtiva='balancete';
let _relLancFiltrado=[];  // lançamentos após filtros de data/cliente

async function loadRelatorios(){
  // Carrega tudo em paralelo
  const [rLanc,rPlano,rCli,rObrig]=await Promise.all([
    sb.from('lancamentos').select('*,clientes(razao_social)').eq('escritorio_id',escritorioId).order('data_lanc',{ascending:true}),
    sb.from('plano_contas').select('*').eq('escritorio_id',escritorioId).order('codigo',{ascending:true}),
    sb.from('clientes').select('id,razao_social').eq('escritorio_id',escritorioId).order('razao_social'),
    sb.from('obrigacoes').select('*,clientes(razao_social)').eq('escritorio_id',escritorioId).order('vencimento',{ascending:true})
  ]);
  _relLanc=rLanc.data||[];
  _relPlano=rPlano.data||[];
  _relClientes=rCli.data||[];
  _relObrig=rObrig.data||[];

  // Popula selects de cliente
  const opts=`<option value="">Todos os clientes</option>`+_relClientes.map(c=>`<option value="${c.id}">${c.razao_social}</option>`).join('');
  ['rel-fil-cliente','obrig-cli-fil'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=opts;});
  const obrigOpts=`<option value="">Selecione…</option>`+_relClientes.map(c=>`<option value="${c.id}">${c.razao_social}</option>`).join('');
  const obrigSel=document.getElementById('obrig-cliente-sel');if(obrigSel)obrigSel.innerHTML=obrigOpts;

  // Razão: popula contas analíticas
  const razaoSel=document.getElementById('razao-conta-sel');
  if(razaoSel){
    razaoSel.innerHTML='<option value="">Selecione uma conta analítica…</option>'+
      _relPlano.filter(c=>c.tipo==='Analítica').map(c=>`<option value="${c.codigo}">${c.codigo} — ${c.descricao}</option>`).join('');
  }

  // Define período padrão = mês atual
  relSetMesAtual();
  aplicarFiltrosRel();
}

function relSetMesAtual(){
  const hoje=new Date();
  const ini=new Date(hoje.getFullYear(),hoje.getMonth(),1);
  const fim=new Date(hoje.getFullYear(),hoje.getMonth()+1,0);
  const toISO=d=>d.toISOString().slice(0,10);
  const i=document.getElementById('rel-fil-inicio');if(i)i.value=toISO(ini);
  const f=document.getElementById('rel-fil-fim');if(f)f.value=toISO(fim);
}

function relSetAnoAtual(){
  const ano=new Date().getFullYear();
  const i=document.getElementById('rel-fil-inicio');if(i)i.value=`${ano}-01-01`;
  const f=document.getElementById('rel-fil-fim');if(f)f.value=`${ano}-12-31`;
  aplicarFiltrosRel();
}

function aplicarFiltrosRel(){
  const cliId=document.getElementById('rel-fil-cliente')?.value||'';
  const ini=document.getElementById('rel-fil-inicio')?.value||'';
  const fim=document.getElementById('rel-fil-fim')?.value||'';

  // Filtra lançamentos
  let lanc=_relLanc;
  if(cliId)lanc=lanc.filter(l=>l.cliente_id===cliId);
  if(ini)lanc=lanc.filter(l=>l.data_lanc>=ini);
  if(fim)lanc=lanc.filter(l=>l.data_lanc<=fim);
  _relLancFiltrado=lanc;

  // KPIs
  const rec=lanc.filter(l=>_relPlano.find(p=>p.codigo===l.conta_credito&&p.grupo==='4')||
    l.conta_credito?.startsWith('4'));
  const desp=lanc.filter(l=>_relPlano.find(p=>p.codigo===l.conta_debito&&(p.grupo==='5'||p.grupo==='6'))||
    l.conta_debito?.match(/^[56]/));
  const totalRec=rec.reduce((s,l)=>s+Number(l.valor||0),0);
  const totalDesp=desp.reduce((s,l)=>s+Number(l.valor||0),0);
  const result=totalRec-totalDesp;
  setKpi('rel-kpi-lanc',lanc.length);
  setKpi('rel-kpi-rec','R$ '+fmt(totalRec));
  setKpi('rel-kpi-desp','R$ '+fmt(totalDesp));
  setKpi('rel-kpi-res','R$ '+fmt(Math.abs(result)));
  const resEl=document.getElementById('rel-kpi-res');
  if(resEl)resEl.style.color=result>=0?'var(--pos)':'var(--neg)';
  const resLbl=document.getElementById('rel-kpi-res-label');
  if(resLbl)resLbl.textContent=result>=0?'lucro no período':'prejuízo no período';

  // Renderiza aba ativa
  const aba=_relTabAtiva;
  if(aba==='balancete')renderBalancete(lanc);
  else if(aba==='dre')renderDRE(lanc);
  else if(aba==='balanco')renderBalanco(lanc);
  else if(aba==='razao')renderRazao(lanc);
  else if(aba==='obrig')renderObrigacoes();
}

function swRelTab(aba){
  _relTabAtiva=aba;
  ['balancete','dre','balanco','razao','obrig'].forEach(a=>{
    const tab=document.getElementById('rel-tab-'+a);
    const pane=document.getElementById('rel-pane-'+a);
    if(tab)tab.classList.toggle('active',a===aba);
    if(pane)pane.style.display=a===aba?'block':'none';
  });
  aplicarFiltrosRel();
}

// ── BALANCETE DE VERIFICAÇÃO ─────────────────────────────────────────────────
function renderBalancete(lancFiltrado){
  const lanc=lancFiltrado||_relLancFiltrado||_relLanc;
  const grpFil=document.getElementById('balancete-grupo-fil')?.value||'';
  const soMov=document.getElementById('balancete-so-mov')?.checked||false;

  // Adiciona classe rel-card ao wrapper
  const tbl=document.getElementById('balancete-table');
  if(tbl)tbl.closest('div.card,div')?.classList.add('rel-card');

  const saldos={};
  lanc.forEach(l=>{
    const vl=Number(l.valor||0);
    if(l.conta_debito){if(!saldos[l.conta_debito])saldos[l.conta_debito]={deb:0,cred:0};saldos[l.conta_debito].deb+=vl;}
    if(l.conta_credito){if(!saldos[l.conta_credito])saldos[l.conta_credito]={deb:0,cred:0};saldos[l.conta_credito].cred+=vl;}
  });

  const grupoLabels={1:'ATIVO',2:'PASSIVO',3:'PATRIMÔNIO LÍQUIDO',4:'RECEITAS',5:'CUSTOS',6:'DESPESAS',7:'RESULTADO'};
  const grupoAccent={1:'var(--pos)',2:'var(--neg)',3:'var(--info)',4:'var(--gold)',5:'var(--warn)',6:'var(--warn)',7:'var(--text-dim)'};
  const grupoBg={1:'var(--pos-bg)',2:'var(--neg-bg)',3:'var(--info-bg)',4:'var(--gold-bg)',5:'var(--warn-bg)',6:'var(--warn-bg)',7:'var(--surface3)'};

  let plano=_relPlano;
  if(grpFil)plano=plano.filter(c=>c.grupo===grpFil||(c.codigo&&c.codigo.charAt(0)===grpFil));

  let totDeb=0,totCred=0,totSD=0,totSC=0;
  let html='',lastGrp='';

  plano.forEach(c=>{
    const grp=c.grupo||(c.codigo?.charAt(0)||'');
    const s=saldos[c.codigo]||{deb:0,cred:0};
    if(soMov&&s.deb===0&&s.cred===0)return;

    if(grp!==lastGrp){
      const gNum=parseInt(grp);
      const acc=grupoAccent[gNum]||'var(--text-dim)';
      const bg=grupoBg[gNum]||'var(--surface3)';
      html+=`<tr>
        <td colspan="7" style="background:${bg};padding:7px 14px 6px;
          font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
          color:${acc};border-left:3px solid ${acc}">
          ${gNum}. ${grupoLabels[gNum]||grp}
        </td></tr>`;
      lastGrp=grp;
    }

    const nat=c.natureza||'Devedora';
    const sd=nat==='Devedora'?Math.max(0,s.deb-s.cred):Math.max(0,s.cred-s.deb);
    const sc=nat==='Credora'?Math.max(0,s.cred-s.deb):Math.max(0,s.deb-s.cred);
    totDeb+=s.deb;totCred+=s.cred;totSD+=sd;totSC+=sc;

    const nivel=c.nivel||1;
    const pad=(nivel-1)*14;
    const icon=nivel===1?'▸':nivel===2?'◦':'·';
    const rowStyle=nivel===1?'background:var(--surface3);font-weight:700;':nivel===2?'background:var(--surface2);font-weight:600;':'';
    const codStyle=`padding-left:${pad+14}px;font-family:monospace;font-size:11px;color:var(--text-dim)`;
    const debColor=s.deb>0?'var(--pos)':'var(--text-dim)';
    const credColor=s.cred>0?'var(--neg)':'var(--text-dim)';
    const natColor=nat==='Devedora'?'var(--pos)':'var(--neg)';

    html+=`<tr style="${rowStyle}">
      <td style="${codStyle}">${c.codigo||''}</td>
      <td style="padding-left:${pad+14}px">${icon} ${c.descricao||''}</td>
      <td><span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;
        background:${nat==='Devedora'?'color-mix(in srgb,var(--pos-bg) 80%,transparent)':'color-mix(in srgb,var(--neg-bg) 80%,transparent)'};
        color:${natColor}">${nat==='Devedora'?'D':'C'}</span></td>
      <td style="text-align:right;font-family:monospace;font-size:12px;color:${debColor}">${s.deb>0?fmt(s.deb):'—'}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;color:${credColor}">${s.cred>0?fmt(s.cred):'—'}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;font-weight:${sd>0?'600':'400'};color:${sd>0?'var(--pos)':'var(--text-dim)'}">${sd>0?fmt(sd):'—'}</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;font-weight:${sc>0?'600':'400'};color:${sc>0?'var(--neg)':'var(--text-dim)'}">${sc>0?fmt(sc):'—'}</td>
    </tr>`;
  });

  const body=document.getElementById('balancete-body');
  if(body)body.innerHTML=html||`<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:32px;font-style:italic">Nenhuma conta encontrada para os filtros selecionados</td></tr>`;

  const foot=document.getElementById('balancete-foot');
  const diff=Math.abs(totSD-totSC);
  const balMsg=diff>0.01
    ?`<tr><td colspan="7" style="text-align:center;background:var(--neg-bg);color:var(--neg);padding:8px;font-size:11px;font-weight:600;border-top:1px solid var(--border)">⚠️ Diferença de R$ ${fmt(diff)} — verifique os lançamentos</td></tr>`
    :`<tr><td colspan="7" style="text-align:center;background:var(--pos-bg);color:var(--pos);padding:8px;font-size:11px;font-weight:600;border-top:1px solid var(--border)">✅ Balancete Balanceado — Débitos = Créditos</td></tr>`;
  if(foot)foot.innerHTML=`<tr>
    <td colspan="2" style="font-weight:700;font-size:11px;letter-spacing:.5px;text-transform:uppercase">TOTAIS GERAIS</td>
    <td></td>
    <td style="text-align:right;font-family:monospace;font-weight:700;color:var(--pos)">${fmt(totDeb)}</td>
    <td style="text-align:right;font-family:monospace;font-weight:700;color:var(--neg)">${fmt(totCred)}</td>
    <td style="text-align:right;font-family:monospace;font-weight:700;color:var(--pos)">${fmt(totSD)}</td>
    <td style="text-align:right;font-family:monospace;font-weight:700;color:var(--neg)">${fmt(totSC)}</td>
  </tr>${balMsg}`;
}

// ── DRE — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO ─────────────────────────────
function renderDRE(lancFiltrado){
  const lanc=lancFiltrado||_relLancFiltrado||_relLanc;
  const saldos={};
  lanc.forEach(l=>{
    const vl=Number(l.valor||0);
    if(l.conta_debito){if(!saldos[l.conta_debito])saldos[l.conta_debito]={deb:0,cred:0};saldos[l.conta_debito].deb+=vl;}
    if(l.conta_credito){if(!saldos[l.conta_credito])saldos[l.conta_credito]={deb:0,cred:0};saldos[l.conta_credito].cred+=vl;}
  });

  const soma=(prefixos)=>{
    let t=0;
    _relPlano.filter(c=>c.tipo==='Analítica'&&prefixos.some(p=>c.codigo?.startsWith(p))).forEach(c=>{
      const s=saldos[c.codigo]||{deb:0,cred:0};
      const nat=c.natureza||'Devedora';
      t+=nat==='Credora'?s.cred-s.deb:s.deb-s.cred;
    });
    return t;
  };

  const recBruta=soma(['4.1','4.2'])||soma(['4']);
  const deduRec=soma(['4.3','4.4','4.5','4.6']);
  const recLiq=recBruta-Math.abs(deduRec);
  const cmv=soma(['5.1','5.2'])||soma(['5']);
  const lucroBruto=recLiq-Math.abs(cmv);
  const despVend=soma(['6.1'])||0;
  const despAdm=soma(['6.2'])||soma(['6']);
  const despFin=soma(['6.3'])||0;
  const outrasDespesas=soma(['6.4'])||0;
  const totalDesp=Math.abs(despVend)+Math.abs(despAdm)+Math.abs(despFin)+Math.abs(outrasDespesas);
  const ebitda=lucroBruto-totalDesp;
  const ir=soma(['7.1'])||0;
  const csll=soma(['7.2'])||0;
  const lucroLiq=ebitda-Math.abs(ir)-Math.abs(csll);

  // Builders com classes CSS (não inline styles de cor de fundo)
  const sep=(label)=>`<tr class="dre-sep"><td colspan="3">${label}</td></tr>`;

  const linha=(label,valor,destaque=false,sepLine=false)=>{
    const cor=valor===0?'var(--text-dim)':valor>0?'var(--pos)':'var(--neg)';
    const seta=valor===0?'●':valor>0?'▲':'▼';
    const cls=`dre-row${destaque?' destaque':''}${sepLine?' linha':''}`;
    return `<tr class="${cls}">
      <td>${label}</td>
      <td style="text-align:right;font-family:monospace;color:${cor}">${valor!==0?fmt(Math.abs(valor)):'—'}</td>
      <td style="text-align:right;font-size:10px;color:${cor};padding-right:16px">${seta}</td>
    </tr>`;
  };

  const ini=document.getElementById('rel-fil-inicio')?.value||'';
  const fim=document.getElementById('rel-fil-fim')?.value||'';
  const periodo=ini&&fim?`${new Date(ini+'T12:00').toLocaleDateString('pt-BR')} a ${new Date(fim+'T12:00').toLocaleDateString('pt-BR')}`:'Período selecionado';

  const lucroClass=lucroLiq>=0?'positivo':'negativo';
  const lucroLabel=lucroLiq>=0?'(=) LUCRO LÍQUIDO DO EXERCÍCIO':'(=) PREJUÍZO LÍQUIDO DO EXERCÍCIO';
  const lucroCor=lucroLiq>=0?'var(--pos)':'var(--neg)';

  const html=`
    <div class="rel-header" style="text-align:center">
      <h3>DRE — Demonstração do Resultado do Exercício</h3>
      <p>${periodo}</p>
    </div>
    <div style="overflow-x:auto"><table class="tbl" style="max-width:720px;margin:0 auto">
      <colgroup><col style="width:68%"><col style="width:22%"><col style="width:10%"></colgroup>
      <tbody>
        ${sep('RECEITAS OPERACIONAIS')}
        ${linha('Receita Bruta de Vendas e Serviços',recBruta)}
        ${linha('(-) Deduções da Receita Bruta',-Math.abs(deduRec))}
        ${linha('(=) RECEITA OPERACIONAL LÍQUIDA',recLiq,true,true)}
        ${sep('CUSTOS')}
        ${linha('(-) CMV / Custo dos Serviços Prestados',-Math.abs(cmv))}
        ${linha('(=) LUCRO BRUTO',lucroBruto,true,true)}
        ${sep('DESPESAS OPERACIONAIS')}
        ${linha('Despesas com Vendas e Marketing',-Math.abs(despVend))}
        ${linha('Despesas Administrativas e Gerais',-Math.abs(despAdm))}
        ${linha('Despesas Financeiras Líquidas',-Math.abs(despFin))}
        ${linha('Outras Despesas Operacionais',-Math.abs(outrasDespesas))}
        ${linha('(=) RESULTADO OPERACIONAL (EBITDA)',ebitda,true,true)}
        ${sep('TRIBUTOS SOBRE O LUCRO')}
        ${linha('(-) IRPJ — Imposto de Renda PJ',-Math.abs(ir))}
        ${linha('(-) CSLL — Contribuição Social sobre o Lucro',-Math.abs(csll))}
        <tr class="dre-total ${lucroClass}">
          <td style="font-size:14px">${lucroLabel}</td>
          <td style="text-align:right;font-family:monospace;font-size:16px;font-weight:800;color:${lucroCor}">${fmt(Math.abs(lucroLiq))}</td>
          <td style="text-align:right;font-size:12px;color:${lucroCor};padding-right:16px">${lucroLiq>=0?'▲':'▼'}</td>
        </tr>
      </tbody>
    </table></div>`;

  const el=document.getElementById('dre-content');if(el)el.innerHTML=html;
}

// ── BALANÇO PATRIMONIAL ──────────────────────────────────────────────────────
function renderBalanco(lancFiltrado){
  const lanc=lancFiltrado||_relLancFiltrado||_relLanc;
  const saldos={};
  lanc.forEach(l=>{
    const vl=Number(l.valor||0);
    if(l.conta_debito){if(!saldos[l.conta_debito])saldos[l.conta_debito]={deb:0,cred:0};saldos[l.conta_debito].deb+=vl;}
    if(l.conta_credito){if(!saldos[l.conta_credito])saldos[l.conta_credito]={deb:0,cred:0};saldos[l.conta_credito].cred+=vl;}
  });

  const saldoConta=(c)=>{
    const s=saldos[c.codigo]||{deb:0,cred:0};
    const nat=c.natureza||'Devedora';
    return nat==='Devedora'?s.deb-s.cred:s.cred-s.deb;
  };

  const somaGrupo=(pref)=>_relPlano
    .filter(c=>c.tipo==='Analítica'&&(c.grupo===pref||c.codigo?.startsWith(pref)))
    .reduce((s,c)=>s+saldoConta(c),0);

  const atvCirc=somaGrupo('1.1');
  const atvNC=somaGrupo('1.2');
  const totalAtivo=atvCirc+atvNC;
  const passCirc=somaGrupo('2.1');
  const passNC=somaGrupo('2.2');
  const pl=somaGrupo('3');
  const totalPassPL=passCirc+passNC+Math.abs(pl);

  const ini=document.getElementById('rel-fil-inicio')?.value||'';
  const fim=document.getElementById('rel-fil-fim')?.value||'';
  const dataBASE=fim?new Date(fim+'T12:00').toLocaleDateString('pt-BR'):'Data-base';

  // Builders com classes CSS
  const sep2=(t)=>`<tr class="sep"><td colspan="2">${t}</td></tr>`;
  const row=(label,val,sub=false)=>`<tr class="${sub?'sub':''}">
    <td>${label}</td>
    <td style="text-align:right;font-family:monospace">${val!==0?fmt(Math.abs(val)):'—'}</td>
  </tr>`;
  const subtotal=(label,val)=>`<tr class="subtotal">
    <td>${label}</td>
    <td style="text-align:right;font-family:monospace">${fmt(Math.abs(val))}</td>
  </tr>`;

  const ativoRows=`<tbody>
    ${sep2('Ativo Circulante')}
    ${row('Caixa e Equivalentes de Caixa',somaGrupo('1.1.1'),true)}
    ${row('Contas a Receber',somaGrupo('1.1.2'),true)}
    ${row('Estoques',somaGrupo('1.1.3'),true)}
    ${row('Tributos a Recuperar',somaGrupo('1.1.4'),true)}
    ${row('Outros Créditos Circulantes',somaGrupo('1.1.5'),true)}
    ${subtotal('Subtotal Circulante',atvCirc)}
    ${sep2('Ativo Não Circulante')}
    ${row('Realizável a Longo Prazo',somaGrupo('1.2.1'),true)}
    ${row('Investimentos',somaGrupo('1.2.2'),true)}
    ${row('Imobilizado (líquido)',somaGrupo('1.2.3'),true)}
    ${row('Intangível (líquido)',somaGrupo('1.2.4'),true)}
    ${subtotal('Subtotal Não Circulante',atvNC)}
  </tbody>
  <tfoot><tr>
    <td>TOTAL DO ATIVO</td>
    <td style="text-align:right;font-family:monospace;color:var(--pos)">${fmt(totalAtivo)}</td>
  </tr></tfoot>`;

  const passRows=`<tbody>
    ${sep2('Passivo Circulante')}
    ${row('Obrigações Trabalhistas e Sociais',somaGrupo('2.1.1'),true)}
    ${row('Obrigações Tributárias',somaGrupo('2.1.2'),true)}
    ${row('Fornecedores',somaGrupo('2.1.3'),true)}
    ${row('Empréstimos e Financiamentos CP',somaGrupo('2.1.4'),true)}
    ${row('Outras Obrigações',somaGrupo('2.1.5'),true)}
    ${subtotal('Subtotal Circulante',passCirc)}
    ${sep2('Passivo Não Circulante')}
    ${row('Empréstimos e Financiamentos LP',somaGrupo('2.2.1'),true)}
    ${row('Provisões de Longo Prazo',somaGrupo('2.2.2'),true)}
    ${subtotal('Subtotal Não Circulante',passNC)}
    ${sep2('Patrimônio Líquido')}
    ${row('Capital Social',somaGrupo('3.1'),true)}
    ${row('Reservas de Capital e Lucros',somaGrupo('3.2'),true)}
    ${row('Lucros / Prejuízos Acumulados',somaGrupo('3.3'),true)}
    ${subtotal('Subtotal Patrimônio Líquido',Math.abs(pl))}
  </tbody>
  <tfoot><tr>
    <td>TOTAL PASSIVO + PL</td>
    <td style="text-align:right;font-family:monospace;color:var(--neg)">${fmt(totalPassPL)}</td>
  </tr></tfoot>`;

  const diff=Math.abs(totalAtivo-totalPassPL);
  const difMsg=diff>0.01
    ?`<div style="text-align:center;background:var(--neg-bg);color:var(--neg);border:1px solid var(--border);border-radius:6px;padding:8px;margin-top:10px;font-size:11px;font-weight:600">⚠️ Desequilíbrio: R$ ${fmt(diff)} — verifique os lançamentos</div>`
    :`<div style="text-align:center;background:var(--pos-bg);color:var(--pos);border:1px solid var(--border);border-radius:6px;padding:8px;margin-top:10px;font-size:11px;font-weight:600">✅ Balanço Equilibrado — Ativo = Passivo + PL</div>`;

  const el=document.getElementById('balanco-content');
  if(el)el.innerHTML=`
    <div class="rel-header">
      <h3>Balanço Patrimonial</h3>
      <p>Data-base: ${dataBASE}</p>
    </div>
    <div style="padding:16px;display:flex;gap:14px;align-items:flex-start">
      <div class="balanco-col">
        <div class="balanco-col-head" style="color:var(--pos);border-bottom:2px solid var(--pos)">📊 ATIVO</div>
        <table class="tbl">${ativoRows}</table>
      </div>
      <div class="balanco-col">
        <div class="balanco-col-head" style="color:var(--neg);border-bottom:2px solid var(--neg)">📋 PASSIVO + PL</div>
        <table class="tbl">${passRows}</table>
      </div>
    </div>
    <div style="padding:0 16px 16px">${difMsg}</div>`;
}

// ── RAZÃO CONTÁBIL ───────────────────────────────────────────────────────────
function renderRazao(lancFiltrado){
  const lanc=lancFiltrado||_relLancFiltrado||_relLanc;
  const contaSel=document.getElementById('razao-conta-sel')?.value||'';
  const body=document.getElementById('razao-body');
  const foot=document.getElementById('razao-foot');
  if(!contaSel){if(body)body.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px">Selecione uma conta para visualizar o razão</td></tr>';return;}

  const conta=_relPlano.find(c=>c.codigo===contaSel);
  const nat=conta?.natureza||'Devedora';

  const movs=lanc.filter(l=>l.conta_debito===contaSel||l.conta_credito===contaSel)
    .sort((a,b)=>a.data_lanc>b.data_lanc?1:-1);

  let saldo=0,totDeb=0,totCred=0;
  const rows=movs.map(l=>{
    const deb=l.conta_debito===contaSel?Number(l.valor||0):0;
    const cred=l.conta_credito===contaSel?Number(l.valor||0):0;
    saldo+=nat==='Devedora'?deb-cred:cred-deb;
    totDeb+=deb;totCred+=cred;
    const data=l.data_lanc?new Date(l.data_lanc+'T12:00').toLocaleDateString('pt-BR'):'—';
    const cli=l.clientes?.razao_social||'—';
    const saldoCor=saldo>=0?'var(--pos)':'var(--neg)';
    const rowClass=deb>0?'razao-entrada':cred>0?'razao-saida':'';
    return `<tr class="${rowClass}">
      <td style="font-family:monospace;font-size:11px">${data}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--text-dim)">${l.nr_documento||'—'}</td>
      <td>${l.historico||'—'}</td>
      <td style="font-size:11px;color:var(--text-dim)">${cli}</td>
      <td style="text-align:right;font-family:monospace;font-weight:${deb>0?'600':'400'};color:${deb>0?'var(--pos)':'var(--text-dim)'}">${deb>0?fmt(deb):'—'}</td>
      <td style="text-align:right;font-family:monospace;font-weight:${cred>0?'600':'400'};color:${cred>0?'var(--neg)':'var(--text-dim)'}">${cred>0?fmt(cred):'—'}</td>
      <td style="text-align:right;font-family:monospace;font-weight:700;color:${saldoCor}">${fmt(Math.abs(saldo))} <span style="font-size:9px">${saldo>=0?nat==='Devedora'?'D':'C':nat==='Devedora'?'C':'D'}</span></td>
    </tr>`;
  });

  if(body)body.innerHTML=rows.length?rows.join(''):'<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:24px">Nenhum movimento nesta conta no período</td></tr>';
  if(foot)foot.innerHTML=`<tr style="background:var(--surface3);font-weight:700">
    <td colspan="3" style="padding:10px 14px">TOTAIS — ${conta?.descricao||contaSel}</td><td></td>
    <td style="text-align:right;font-family:monospace;color:var(--pos)">${fmt(totDeb)}</td>
    <td style="text-align:right;font-family:monospace;color:var(--neg)">${fmt(totCred)}</td>
    <td style="text-align:right;font-family:monospace">${fmt(Math.abs(saldo))}</td>
  </tr>`;
}

// ── OBRIGAÇÕES ACESSÓRIAS ────────────────────────────────────────────────────
function renderObrigacoes(){
  const cliId=document.getElementById('obrig-cli-fil')?.value||'';
  const statusFil=document.getElementById('obrig-status-fil')?.value||'';
  let obs=_relObrig;
  if(cliId)obs=obs.filter(o=>o.cliente_id===cliId);
  if(statusFil)obs=obs.filter(o=>o.status===statusFil);

  const el=document.getElementById('obrig-grid');if(!el)return;
  if(!obs.length){el.innerHTML='<div style="text-align:center;color:var(--text-dim);padding:32px">Nenhuma obrigação encontrada</div>';return;}

  const badgeMap={
    pendente:'<span class="badge b-pend">Pendente</span>',
    transmitido:'<span class="badge b-ok">Transmitido</span>',
    atrasado:'<span class="badge b-late">Atrasado</span>'
  };
  const iconMap={pendente:'🧾',transmitido:'✅',atrasado:'⚠️'};
  const bgMap={pendente:'var(--warn-bg)',transmitido:'var(--pos-bg)',atrasado:'var(--neg-bg)'};

  el.innerHTML=`<table class="tbl"><thead><tr>
    <th></th><th>Obrigação</th><th>Cliente</th><th>Competência</th><th>Vencimento</th><th>Responsável</th><th>Status</th><th>Ações</th>
  </tr></thead><tbody>${obs.map(o=>{
    const venc=o.vencimento?new Date(o.vencimento+'T12:00').toLocaleDateString('pt-BR'):'—';
    const hoje=new Date().toISOString().slice(0,10);
    const atrasado=o.vencimento&&o.vencimento<hoje&&o.status==='pendente';
    return `<tr style="${atrasado?'background:var(--neg-bg)':''}">
      <td style="text-align:center;font-size:16px">${iconMap[o.status]||'📋'}</td>
      <td style="font-weight:600">${o.tipo||'—'}</td>
      <td>${o.clientes?.razao_social||'—'}</td>
      <td style="font-family:monospace">${o.competencia||'—'}</td>
      <td style="font-family:monospace;${atrasado?'color:var(--neg);font-weight:600':''}">${venc}${atrasado?' ⚠️':''}</td>
      <td style="font-size:11px;color:var(--text-dim)">${o.responsavel||'—'}</td>
      <td>${badgeMap[o.status]||o.status}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="editObrigacao('${o.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="marcarTransmitido('${o.id}')" title="Marcar transmitido">✅</button>
        <button class="btn btn-ghost btn-sm" onclick="delObrigacao('${o.id}')" style="color:var(--neg)">🗑️</button>
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

async function openNovaObrigacao(){
  document.getElementById('obrig-id').value='';
  ['obrig-comp','obrig-venc','obrig-resp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('obrig-tipo').selectedIndex=0;
  document.getElementById('obrig-status').value='pendente';
  const sel=document.getElementById('obrig-cliente-sel');
  sel.innerHTML='<option value="">Selecione…</option>';
  const {data}=await sb.from('clientes').select('id,razao_social').eq('escritorio_id',escritorioId).order('razao_social');
  (data||[]).forEach(c=>{
    const opt=document.createElement('option');
    opt.value=c.id;opt.textContent=c.razao_social;
    sel.appendChild(opt);
  });
  openM('m-relatorio');
}

async function saveObrigacao(){
  const id=document.getElementById('obrig-id')?.value||'';
  const cliId=document.getElementById('obrig-cliente-sel')?.value||'';
  const tipo=document.getElementById('obrig-tipo')?.value||'';
  const comp=document.getElementById('obrig-comp')?.value||'';
  const venc=document.getElementById('obrig-venc')?.value||'';
  const resp=document.getElementById('obrig-resp')?.value?.trim()||'';
  const status=document.getElementById('obrig-status')?.value||'pendente';
  if(!cliId){toast('⚠️ Selecione o cliente');return;}
  if(!tipo||!venc){toast('⚠️ Preencha tipo e vencimento');return;}
  const obj={cliente_id:cliId,tipo,competencia:comp,vencimento:venc,responsavel:resp,status,escritorio_id:escritorioId};
  let error;
  if(id)({error}=await sb.from('obrigacoes').update(obj).eq('id',id));
  else({error}=await sb.from('obrigacoes').insert(obj));
  if(error){toast('❌ Erro: '+error.message);return;}
  toast(id?'✅ Obrigação atualizada':'✅ Obrigação salva');
  closeM('m-relatorio');
  await loadObrigacoes();
  await loadRelatorios();
}

async function editObrigacao(id){
  const o=_relObrig.find(x=>x.id===id);if(!o)return;
  document.getElementById('obrig-id').value=id;
  document.getElementById('obrig-cliente-sel').value=o.cliente_id||'';
  document.getElementById('obrig-tipo').value=o.tipo||'';
  document.getElementById('obrig-comp').value=o.competencia||'';
  document.getElementById('obrig-venc').value=o.vencimento||'';
  document.getElementById('obrig-resp').value=o.responsavel||'';
  document.getElementById('obrig-status').value=o.status||'pendente';
  openM('m-relatorio');
}

async function marcarTransmitido(id){
  const {error}=await sb.from('obrigacoes').update({status:'transmitido'}).eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('✅ Marcada como transmitida');
  await loadRelatorios();
}

async function delObrigacao(id){
  const o=_relObrig.find(x=>x.id===id);
  if(!confirm(`Excluir obrigação "${o?.tipo}"?`))return;
  const {error}=await sb.from('obrigacoes').delete().eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('🗑️ Obrigação excluída');
  await loadRelatorios();
}

// ── EXPORTAR / IMPRIMIR ──────────────────────────────────────────────────────
function exportarRelCSV(){
  const aba=_relTabAtiva;
  let csv='',nome='relatorio';
  if(aba==='balancete'){
    nome='balancete';
    csv='Código,Conta,Natureza,Débitos,Créditos,Saldo Devedor,Saldo Credor\n';
    document.querySelectorAll('#balancete-body tr').forEach(tr=>{
      const cells=[...tr.querySelectorAll('td')];
      if(cells.length>=7)csv+=cells.map(c=>'"'+c.textContent.replace(/"/g,'""').trim()+'"').join(',')+'\n';
    });
  }else if(aba==='dre'){
    nome='dre';
    csv='Descrição,Valor\n';
    document.querySelectorAll('#dre-content tr').forEach(tr=>{
      const cells=[...tr.querySelectorAll('td')];
      if(cells.length>=2)csv+=cells.slice(0,2).map(c=>'"'+c.textContent.replace(/"/g,'""').trim()+'"').join(',')+'\n';
    });
  }else if(aba==='razao'){
    nome='razao-contabil';
    csv='Data,Documento,Histórico,Cliente,Débito,Crédito,Saldo\n';
    document.querySelectorAll('#razao-body tr').forEach(tr=>{
      const cells=[...tr.querySelectorAll('td')];
      if(cells.length>=7)csv+=cells.map(c=>'"'+c.textContent.replace(/"/g,'""').trim()+'"').join(',')+'\n';
    });
  }else if(aba==='obrig'){
    nome='obrigacoes';
    csv='Obrigação,Cliente,Competência,Vencimento,Responsável,Status\n';
    _relObrig.forEach(o=>{
      const venc=o.vencimento?new Date(o.vencimento+'T12:00').toLocaleDateString('pt-BR'):'';
      csv+=`"${o.tipo}","${o.clientes?.razao_social||''}","${o.competencia||''}","${venc}","${o.responsavel||''}","${o.status}"\n`;
    });
  }
  if(!csv){toast('Nada para exportar');return;}
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=nome+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  URL.revokeObjectURL(url);toast('⬇ CSV exportado');
}

function imprimirRel(){
  window.print();
}

async function exportarBalancoPDF(){
  toast('⏳ Gerando Balanço Patrimonial…');
  const [rLanc,rPlano]=await Promise.all([
    sb.from('lancamentos').select('*').eq('escritorio_id',escritorioId).order('data_lanc',{ascending:true}),
    sb.from('plano_contas').select('*').eq('escritorio_id',escritorioId).order('codigo',{ascending:true})
  ]);
  const lanc=rLanc.data||[];
  const plano=rPlano.data||[];
  const hoje=new Date().toLocaleDateString('pt-BR');
  const fmt=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});

  const saldos={};
  lanc.forEach(l=>{
    const vl=Number(l.valor||0);
    if(l.conta_debito){if(!saldos[l.conta_debito])saldos[l.conta_debito]={deb:0,cred:0};saldos[l.conta_debito].deb+=vl;}
    if(l.conta_credito){if(!saldos[l.conta_credito])saldos[l.conta_credito]={deb:0,cred:0};saldos[l.conta_credito].cred+=vl;}
  });
  const saldoConta=c=>{const s=saldos[c.codigo]||{deb:0,cred:0};return(c.natureza||'Devedora')==='Devedora'?s.deb-s.cred:s.cred-s.deb;};
  const somaGrupo=pref=>plano.filter(c=>c.tipo==='Analítica'&&(c.grupo===pref||c.codigo?.startsWith(pref))).reduce((s,c)=>s+saldoConta(c),0);

  const atvCirc=somaGrupo('1.1'),atvNC=somaGrupo('1.2'),totalAtivo=atvCirc+atvNC;
  const passCirc=somaGrupo('2.1'),passNC=somaGrupo('2.2'),pl=somaGrupo('3'),totalPassPL=passCirc+passNC+Math.abs(pl);

  const row=(label,val)=>`<tr><td style="padding:4px 8px;font-size:12px">${label}</td><td style="padding:4px 8px;text-align:right;font-family:monospace;font-size:12px">${val!==0?fmt(Math.abs(val)):'—'}</td></tr>`;
  const sep=t=>`<tr style="background:#f0f4f8"><td colspan="2" style="padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555">${t}</td></tr>`;
  const subtot=(label,val)=>`<tr style="background:#e8f0e8"><td style="padding:5px 8px;font-size:12px;font-weight:600">${label}</td><td style="padding:5px 8px;text-align:right;font-family:monospace;font-size:12px;font-weight:600">${fmt(Math.abs(val))}</td></tr>`;

  const ativoHTML=`
    ${sep('Ativo Circulante')}
    ${row('Caixa e Equivalentes',somaGrupo('1.1.1'))}
    ${row('Contas a Receber',somaGrupo('1.1.2'))}
    ${row('Estoques',somaGrupo('1.1.3'))}
    ${row('Tributos a Recuperar',somaGrupo('1.1.4'))}
    ${row('Outros Créditos',somaGrupo('1.1.5'))}
    ${subtot('Subtotal Circulante',atvCirc)}
    ${sep('Ativo Não Circulante')}
    ${row('Realizável LP',somaGrupo('1.2.1'))}
    ${row('Investimentos',somaGrupo('1.2.2'))}
    ${row('Imobilizado',somaGrupo('1.2.3'))}
    ${row('Intangível',somaGrupo('1.2.4'))}
    ${subtot('Subtotal Não Circulante',atvNC)}
    <tr style="background:#1a5c3a;color:#fff"><td style="padding:6px 8px;font-weight:700">TOTAL DO ATIVO</td><td style="padding:6px 8px;text-align:right;font-family:monospace;font-weight:700">${fmt(totalAtivo)}</td></tr>`;

  const passHTML=`
    ${sep('Passivo Circulante')}
    ${row('Obrigações Trabalhistas',somaGrupo('2.1.1'))}
    ${row('Obrigações Tributárias',somaGrupo('2.1.2'))}
    ${row('Fornecedores',somaGrupo('2.1.3'))}
    ${row('Empréstimos CP',somaGrupo('2.1.4'))}
    ${row('Outras Obrigações',somaGrupo('2.1.5'))}
    ${subtot('Subtotal Circulante',passCirc)}
    ${sep('Passivo Não Circulante')}
    ${row('Empréstimos LP',somaGrupo('2.2.1'))}
    ${row('Provisões LP',somaGrupo('2.2.2'))}
    ${subtot('Subtotal Não Circulante',passNC)}
    ${sep('Patrimônio Líquido')}
    ${row('Capital Social',somaGrupo('3.1'))}
    ${row('Reservas de Capital e Lucros',somaGrupo('3.2'))}
    ${row('Lucros/Prejuízos Acumulados',somaGrupo('3.3'))}
    ${subtot('Subtotal PL',Math.abs(pl))}
    <tr style="background:#c0392b;color:#fff"><td style="padding:6px 8px;font-weight:700">TOTAL PASSIVO + PL</td><td style="padding:6px 8px;text-align:right;font-family:monospace;font-weight:700">${fmt(totalPassPL)}</td></tr>`;

  const diff=Math.abs(totalAtivo-totalPassPL);
  const statusMsg=diff>0.01
    ?`<div style="color:#c0392b;font-weight:700;text-align:center;padding:8px;border:1px solid #c0392b;border-radius:4px;margin-top:12px">⚠️ Desequilíbrio: ${fmt(diff)}</div>`
    :`<div style="color:#1a5c3a;font-weight:700;text-align:center;padding:8px;border:1px solid #1a5c3a;border-radius:4px;margin-top:12px">✅ Balanço Equilibrado — Ativo = Passivo + PL</div>`;

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Balanço Patrimonial</title>
  <style>body{font-family:Arial,sans-serif;margin:20px;color:#222}h2{margin:0 0 4px;font-size:16px}p{margin:0 0 16px;font-size:12px;color:#666}
  .wrap{display:flex;gap:20px}.col{flex:1;border:1px solid #ddd;border-radius:6px;overflow:hidden}
  table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #eee}
  .head{background:#1a5c3a;color:#fff;padding:8px 10px;font-weight:700;font-size:13px}
  .head2{background:#c0392b;color:#fff;padding:8px 10px;font-weight:700;font-size:13px}
  @media print{body{margin:10px}}</style></head>
  <body>
  <h2>Balanço Patrimonial</h2><p>Data-base: ${hoje} &nbsp;|&nbsp; Gerado em: ${hoje}</p>
  <div class="wrap">
    <div class="col"><div class="head">ATIVO</div><table>${ativoHTML}</table></div>
    <div class="col"><div class="head2">PASSIVO + PATRIMÔNIO LÍQUIDO</div><table>${passHTML}</table></div>
  </div>
  ${statusMsg}
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;

  const w=window.open('','_blank');
  w.document.write(html);
  w.document.close();
}

async function loadFolha(){
  const {data}=await sb.from('colaboradores').select('*, clientes(razao_social)').order('created_at',{ascending:false});
  const colab=data||[];
  const fmt=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  const totalBruto=colab.reduce((s,c)=>s+(Number(c.salario_bruto)||0),0);
  const inss=totalBruto*0.11;
  const irrf=totalBruto*0.113;
  const fgts=totalBruto*0.08;
  const liq=totalBruto-inss-irrf;
  document.getElementById('folha-bruto').textContent=fmt(totalBruto);
  document.getElementById('folha-liq').textContent=fmt(liq);
  document.getElementById('folha-colab').textContent=`${colab.length} colaborador${colab.length!==1?'es':''}`;
  document.getElementById('folha-sub').textContent=colab.length?`${colab.length} colaborador${colab.length!==1?'es':''}`:'Nenhuma folha processada';
  document.getElementById('folha-s-bruto').textContent=fmt(totalBruto);
  document.getElementById('folha-s-inss').textContent='- '+fmt(inss);
  document.getElementById('folha-s-irrf').textContent='- '+fmt(irrf);
  document.getElementById('folha-s-fgts').textContent=fmt(fgts);
  document.getElementById('folha-s-liq').textContent=fmt(liq);
  const lista=document.getElementById('folha-colab-lista');if(!lista)return;
  if(!colab.length){lista.innerHTML='<div style="padding:16px;text-align:center;color:var(--text-dim)">Nenhum colaborador cadastrado ainda</div>';return;}
  const colors=['linear-gradient(135deg,#1a5c3a,#2563a8)','linear-gradient(135deg,#7c5cbf,#2563a8)','linear-gradient(135deg,#c94f1a,#b8860b)','linear-gradient(135deg,#c0392b,#c94f1a)'];
  lista.innerHTML=colab.map((c,i)=>{
    const ini=(c.nome||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const bruto=fmt(c.salario_bruto);
    const liqC=fmt((Number(c.salario_bruto)||0)*0.777);
    const cliente=c.clientes?.razao_social?`<span style="font-size:9.5px;color:var(--text-dim);margin-left:6px">· ${c.clientes.razao_social}</span>`:'';
    return `<div class="emp"><div class="emp-av" style="background:${colors[i%colors.length]}">${ini}</div><div><div class="emp-name">${c.nome}${cliente}</div><div class="emp-cargo">${c.cargo||'—'} · ${c.regime_cont||'CLT'}</div></div><div class="emp-sal"><div class="emp-bruto">${bruto}</div><div class="emp-liq">Líq. ${liqC}</div></div><div style="display:flex;gap:5px;margin-left:10px"><button class="btn btn-ghost btn-sm" onclick="toast('📄 Holerite de ${c.nome}…')">Holerite</button><button class="btn btn-ghost btn-sm" onclick="editColaborador('${c.id}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteColaborador('${c.id}','${c.nome.replace(/'/g,'')}')">🗑</button></div></div>`;
  }).join('');
}

async function loadObrigacoes(){
  const {data}=await sb.from('obrigacoes').select('*, clientes(razao_social)').order('vencimento',{ascending:true});
  const obs=data||[];
  const tbody=document.getElementById('obrig-tbody');if(!tbody)return;
  if(!obs.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:20px">Nenhuma obrigação cadastrada ainda</td></tr>';return;}
  const hoje=new Date();
  tbody.innerHTML=obs.map(o=>{
    const venc=o.vencimento?new Date(o.vencimento):null;
    const diasRestantes=venc?Math.ceil((venc-hoje)/(1000*60*60*24)):null;
    const vencStr=venc?venc.toLocaleDateString('pt-BR'):'—';
    const vencColor=diasRestantes!=null?(diasRestantes<0?'color:var(--neg);font-weight:700':diasRestantes<=3?'color:var(--neg);font-weight:700':diasRestantes<=7?'color:var(--warn);font-weight:700':''):'';
    const badgeMap={'pendente':`<span class="badge b-pend">Pendente${diasRestantes!=null?' ('+diasRestantes+'d)':''}</span>`,'transmitido':'<span class="badge b-ok">Transmitido</span>','atrasado':'<span class="badge b-late">Atrasado</span>'};
    const badge=badgeMap[o.status]||`<span class="badge">${o.status}</span>`;
    const btnMap={'transmitido':`<button class="btn btn-ghost btn-sm" onclick="toast('⬇ Baixando…')">⬇ Baixar</button>`,'atrasado':`<button class="btn btn-danger btn-sm" onclick="toast('⚠️ Regularizando…')">Regularizar</button>`};
    const btn=btnMap[o.status]||`<button class="btn btn-primary btn-sm" onclick="toast('📤 Gerando…')">Gerar</button>`;
    return `<tr><td style="font-weight:600">${o.tipo}</td><td>${o.clientes?.razao_social||'—'}</td><td style="${vencColor}">${vencStr}</td><td>${badge}</td><td style="color:var(--text-dim)">${o.responsavel||'—'}</td><td>${btn}</td></tr>`;
  }).join('');
}

async function loadPlano(){
  const filtro=document.getElementById('plano-filtro')?.value||'';
  let q=sb.from('plano_contas').select('*').eq('escritorio_id',escritorioId).order('codigo',{ascending:true});
  if(filtro)q=q.like('codigo',filtro+'%');
  const {data}=await q;
  const contas=data||[];

  // KPIs
  const analiticas=contas.filter(c=>c.tipo==='Analítica').length;
  const sinteticas=contas.filter(c=>c.tipo==='Sintética').length;
  const grupos=new Set(contas.map(c=>(c.codigo||'').charAt(0)).filter(Boolean)).size;
  setKpi('plano-kpi-total',contas.length);
  setKpi('plano-kpi-analiticas',analiticas);
  setKpi('plano-kpi-sinteticas',sinteticas);
  setKpi('plano-kpi-grupos',grupos);

  const tbody=document.getElementById('plano-tbody');if(!tbody)return;
  if(!contas.length){
    tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:30px">Nenhuma conta cadastrada. Use <strong>⚡ Popular Padrão CFC</strong> para inserir a estrutura base ou clique em <strong>+ Nova Conta</strong>.</td></tr>`;
    return;
  }

  const fmt=v=>v!=null?'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—';
  const grupoLabels={'1':'ATIVO','2':'PASSIVO','3':'PATRIMÔNIO LÍQUIDO','4':'RECEITAS','5':'CUSTOS','6':'DESPESAS','7':'RESULTADO'};
  const grupoColors={'1':'var(--pos-bg)','2':'var(--neg-bg)','3':'var(--info-bg)','4':'var(--gold-bg)','5':'var(--warn-bg)','6':'var(--warn-bg)','7':'var(--surface3)'};

  // Inject group dividers
  let lastGrupo='';
  tbody.innerHTML=contas.map(c=>{
    const nivel=c.nivel||(c.codigo?c.codigo.split('.').length:1);
    const grp=(c.codigo||'').charAt(0);
    const isSin=c.tipo==='Sintética';
    const pad=nivel>1?(nivel-1)*14:4;
    const fw=nivel<=2?700:nivel===3?600:400;
    const rowBg=nivel===1?`background:${grupoColors[grp]||'var(--surface2)'};`:(nivel===2?'background:var(--surface2);':'');
    const icon=isSin?(nivel===1?'📁':(nivel===2?'📂':'📂')):'📄';
    const natBadge=c.natureza==='Devedora'?'<span class="badge b-ok" style="font-size:9px;padding:1px 5px">D</span>':'<span class="badge b-late" style="font-size:9px;padding:1px 5px">C</span>';
    const tipoBadge=isSin?`<span class="badge b-info" style="font-size:9px;padding:1px 5px">Sintética</span>`:`<span class="badge" style="font-size:9px;padding:1px 5px;background:var(--surface3);color:var(--text-dim)">Analítica</span>`;
    const saldo=fmt(c.saldo);
    const saldoColor=(c.natureza==='Devedora'&&Number(c.saldo||0)>=0)||(c.natureza==='Credora'&&Number(c.saldo||0)<=0)?'color:var(--pos)':'color:var(--neg)';

    let divider='';
    if(grp&&grp!==lastGrupo){
      lastGrupo=grp;
      if(!filtro)divider=`<tr><td colspan="7" style="background:var(--surface3);padding:5px 14px;font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-dim)">${grupoLabels[grp]||grp}</td></tr>`;
    }

    const row=`<tr style="${rowBg}cursor:pointer" onclick="editConta('${c.id}')">
      <td style="padding-left:${pad}px;font-weight:${fw};font-size:12px;font-family:monospace">${icon} ${c.codigo}</td>
      <td style="font-weight:${fw}">${c.descricao}</td>
      <td>${tipoBadge}</td>
      <td>${natBadge}</td>
      <td style="text-align:center;color:var(--text-dim);font-size:11.5px">${nivel}</td>
      <td style="text-align:right;${saldoColor};font-weight:${nivel<=2?700:400}">${saldo}</td>
      <td style="text-align:center">
        <div style="display:flex;gap:4px;justify-content:center">
          <button class="btn btn-ghost btn-sm" style="padding:3px 7px;font-size:10px" onclick="event.stopPropagation();editConta('${c.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" style="padding:3px 7px;font-size:10px" onclick="event.stopPropagation();deleteConta('${c.id}','${c.codigo}')">🗑</button>
        </div>
      </td>
    </tr>`;
    return divider+row;
  }).join('');
}

function onCodigoChange(codigo){
  const nivel=codigo?codigo.trim().split('.').length:1;
  const el=document.getElementById('conta-nivel');if(el)el.value=nivel;
  const g=codigo.charAt(0);
  if(g>='1'&&g<='7'){
    const grpEl=document.getElementById('conta-grupo');
    if(grpEl&&!grpEl.value){grpEl.value=g;onGrupoChange(g);}
  }
}

function onGrupoChange(grupo){
  const nat=document.getElementById('conta-natureza');
  if(!nat)return;
  if(['1','5','6'].includes(grupo))nat.value='Devedora';
  else if(['2','3','4'].includes(grupo))nat.value='Credora';
  populatePaiSelect(grupo);
}

async function populatePaiSelect(grupo){
  const sel=document.getElementById('conta-pai');if(!sel)return;
  let q=sb.from('plano_contas').select('id,codigo,descricao').eq('tipo','Sintética').eq('escritorio_id',escritorioId).order('codigo');
  if(grupo)q=q.like('codigo',grupo+'%');
  const {data}=await q;
  sel.innerHTML='<option value="">— Conta de nível superior —</option>'+(data||[]).map(c=>`<option value="${c.id}">${c.codigo} — ${c.descricao}</option>`).join('');
}

function openNovaConta(){
  document.getElementById('conta-id').value='';
  document.getElementById('m-conta-titulo').textContent='Nova Conta Contábil';
  ['conta-codigo','conta-descricao'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('conta-nivel').value='1';
  document.getElementById('conta-grupo').value='';
  document.getElementById('conta-tipo').value='Analítica';
  document.getElementById('conta-natureza').value='Devedora';
  document.getElementById('conta-pai').innerHTML='<option value="">— Conta de nível superior —</option>';
  openM('m-conta');
}

async function editConta(id){
  const {data:c}=await sb.from('plano_contas').select('*').eq('id',id).single();
  if(!c)return;
  document.getElementById('conta-id').value=c.id;
  document.getElementById('m-conta-titulo').textContent='Editar Conta — '+c.codigo;
  document.getElementById('conta-codigo').value=c.codigo||'';
  document.getElementById('conta-nivel').value=c.nivel||1;
  document.getElementById('conta-descricao').value=c.descricao||'';
  const grp=c.grupo||(c.codigo?.charAt(0)||'');
  document.getElementById('conta-grupo').value=grp;
  document.getElementById('conta-tipo').value=c.tipo||'Analítica';
  document.getElementById('conta-natureza').value=c.natureza||'Devedora';
  await populatePaiSelect(grp);
  openM('m-conta');
}

async function deleteConta(id,codigo){
  if(!confirm(`Excluir a conta ${codigo}?\n\nAtenção: verifique se não há lançamentos vinculados a esta conta.`))return;
  const {error}=await sb.from('plano_contas').delete().eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('🗑 Conta '+codigo+' excluída');
  await loadPlano();
}

async function saveConta(){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const id=g('conta-id');
  const codigo=g('conta-codigo');
  const descricao=g('conta-descricao');
  const grupo=document.getElementById('conta-grupo')?.value||'';
  const tipo=document.getElementById('conta-tipo')?.value||'Analítica';
  const natureza=document.getElementById('conta-natureza')?.value||'Devedora';
  const nivel=parseInt(document.getElementById('conta-nivel')?.value)||1;

  if(!codigo){toast('⚠️ Informe o código da conta');return;}
  if(!descricao){toast('⚠️ Informe a descrição da conta');return;}
  if(!grupo){toast('⚠️ Selecione o grupo CFC');return;}
  if(codigo.charAt(0)!==grupo){toast('⚠️ O código deve iniciar com '+grupo+' (grupo selecionado)');return;}

  const obj={codigo,descricao,tipo,natureza,nivel,grupo,saldo:0,escritorio_id:escritorioId};
  let error;
  if(id){({error}=await sb.from('plano_contas').update({codigo,descricao,tipo,natureza,nivel,grupo}).eq('id',id));}
  else{({error}=await sb.from('plano_contas').insert(obj));}
  if(error){toast('❌ '+error.message);return;}
  closeM('m-conta');
  toast(id?'✅ Conta atualizada!':'✅ Conta cadastrada!');
  await loadPlano();
}

async function popularPlanoBase(){
  const {data:existe}=await sb.from('plano_contas').select('id',{count:'exact',head:true}).eq('escritorio_id',escritorioId);
  if(existe&&!confirm('Já existem contas cadastradas. Deseja substituir pelo Plano de Contas Referencial CFC?\n\nIsso irá excluir todas as contas atuais e inserir a estrutura padrão.'))return;
  toast('⏳ Aguarde — inserindo plano de contas CFC…');
  await sb.from('plano_contas').delete().eq('escritorio_id',escritorioId);
  const base=[
    // 1 ATIVO
    {codigo:'1',descricao:'ATIVO',tipo:'Sintética',natureza:'Devedora',nivel:1,grupo:'1'},
    {codigo:'1.1',descricao:'ATIVO CIRCULANTE',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'1'},
    {codigo:'1.1.1',descricao:'Caixa e Equivalentes de Caixa',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.1.1.01',descricao:'Caixa',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.1.02',descricao:'Bancos — Conta Movimento',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.1.03',descricao:'Aplicações Financeiras de Liquidez Imediata',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.2',descricao:'Contas a Receber',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.1.2.01',descricao:'Duplicatas a Receber',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.2.02',descricao:'(-) Provisão para Devedores Duvidosos',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'1'},
    {codigo:'1.1.3',descricao:'Estoques',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.1.3.01',descricao:'Mercadorias para Revenda',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.3.02',descricao:'Matérias-Primas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.4',descricao:'Tributos a Recuperar',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.1.4.01',descricao:'ICMS a Recuperar',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.4.02',descricao:'PIS a Recuperar',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.4.03',descricao:'COFINS a Recuperar',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.4.04',descricao:'IPI a Recuperar',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.5',descricao:'Outros Créditos Circulantes',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.1.5.01',descricao:'Adiantamentos a Fornecedores',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.1.5.02',descricao:'Despesas Antecipadas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2',descricao:'ATIVO NÃO CIRCULANTE',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'1'},
    {codigo:'1.2.1',descricao:'Realizável a Longo Prazo',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.2.1.01',descricao:'Depósitos Judiciais',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.2',descricao:'Investimentos',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.2.2.01',descricao:'Participações em Coligadas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.2.02',descricao:'Outros Investimentos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.3',descricao:'Imobilizado',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.2.3.01',descricao:'Máquinas e Equipamentos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.3.02',descricao:'Móveis e Utensílios',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.3.03',descricao:'Veículos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.3.04',descricao:'(-) Depreciação Acumulada',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'1'},
    {codigo:'1.2.4',descricao:'Intangível',tipo:'Sintética',natureza:'Devedora',nivel:3,grupo:'1'},
    {codigo:'1.2.4.01',descricao:'Software e Licenças',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'1'},
    {codigo:'1.2.4.02',descricao:'(-) Amortização Acumulada',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'1'},
    // 2 PASSIVO
    {codigo:'2',descricao:'PASSIVO',tipo:'Sintética',natureza:'Credora',nivel:1,grupo:'2'},
    {codigo:'2.1',descricao:'PASSIVO CIRCULANTE',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'2'},
    {codigo:'2.1.1',descricao:'Obrigações Trabalhistas e Sociais',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.1.1.01',descricao:'Salários a Pagar',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.1.02',descricao:'FGTS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.1.03',descricao:'INSS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.1.04',descricao:'Férias a Pagar',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.1.05',descricao:'13º Salário a Pagar',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2',descricao:'Obrigações Fiscais',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.1.2.01',descricao:'ICMS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.02',descricao:'PIS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.03',descricao:'COFINS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.04',descricao:'IRPJ a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.05',descricao:'CSLL a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.06',descricao:'ISS a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.2.07',descricao:'Simples Nacional a Recolher',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.3',descricao:'Fornecedores',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.1.3.01',descricao:'Fornecedores Nacionais',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.4',descricao:'Empréstimos e Financiamentos',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.1.4.01',descricao:'Empréstimos Bancários — Curto Prazo',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.5',descricao:'Outros Passivos Circulantes',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.1.5.01',descricao:'Adiantamentos de Clientes',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.1.5.02',descricao:'Dividendos a Pagar',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.2',descricao:'PASSIVO NÃO CIRCULANTE',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'2'},
    {codigo:'2.2.1',descricao:'Empréstimos e Financiamentos de LP',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.2.1.01',descricao:'Financiamentos Bancários — Longo Prazo',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    {codigo:'2.2.2',descricao:'Provisões de Longo Prazo',tipo:'Sintética',natureza:'Credora',nivel:3,grupo:'2'},
    {codigo:'2.2.2.01',descricao:'Provisão para Contingências',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'2'},
    // 3 PATRIMÔNIO LÍQUIDO
    {codigo:'3',descricao:'PATRIMÔNIO LÍQUIDO',tipo:'Sintética',natureza:'Credora',nivel:1,grupo:'3'},
    {codigo:'3.1',descricao:'Capital Social',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'3'},
    {codigo:'3.1.1.01',descricao:'Capital Social Subscrito',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'3'},
    {codigo:'3.1.1.02',descricao:'(-) Capital a Integralizar',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'3'},
    {codigo:'3.2',descricao:'Reservas de Capital',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'3'},
    {codigo:'3.2.1.01',descricao:'Ágio na Emissão de Ações',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'3'},
    {codigo:'3.3',descricao:'Reservas de Lucros',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'3'},
    {codigo:'3.3.1.01',descricao:'Reserva Legal (5% do Lucro)',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'3'},
    {codigo:'3.3.1.02',descricao:'Reserva Estatutária',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'3'},
    {codigo:'3.3.1.03',descricao:'Lucros / Prejuízos Acumulados',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'3'},
    // 4 RECEITAS
    {codigo:'4',descricao:'RECEITAS',tipo:'Sintética',natureza:'Credora',nivel:1,grupo:'4'},
    {codigo:'4.1',descricao:'Receita Bruta de Vendas e Serviços',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'4'},
    {codigo:'4.1.1.01',descricao:'Venda de Mercadorias',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    {codigo:'4.1.1.02',descricao:'Prestação de Serviços',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    {codigo:'4.2',descricao:'(-) Deduções da Receita Bruta',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'4'},
    {codigo:'4.2.1.01',descricao:'Devoluções e Abatimentos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'4'},
    {codigo:'4.2.1.02',descricao:'(-) ICMS sobre Vendas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'4'},
    {codigo:'4.2.1.03',descricao:'(-) PIS sobre Receita',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'4'},
    {codigo:'4.2.1.04',descricao:'(-) COFINS sobre Receita',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'4'},
    {codigo:'4.2.1.05',descricao:'(-) ISS sobre Serviços',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'4'},
    {codigo:'4.3',descricao:'Receitas Financeiras',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'4'},
    {codigo:'4.3.1.01',descricao:'Juros Ativos',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    {codigo:'4.3.1.02',descricao:'Rendimentos de Aplicações Financeiras',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    {codigo:'4.4',descricao:'Outras Receitas Operacionais',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'4'},
    {codigo:'4.4.1.01',descricao:'Ganho na Venda de Ativo',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    {codigo:'4.4.1.02',descricao:'Reversão de Provisões',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'4'},
    // 5 CUSTOS
    {codigo:'5',descricao:'CUSTOS',tipo:'Sintética',natureza:'Devedora',nivel:1,grupo:'5'},
    {codigo:'5.1',descricao:'Custo das Mercadorias Vendidas (CMV)',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'5'},
    {codigo:'5.1.1.01',descricao:'CMV — Mercadorias',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'5'},
    {codigo:'5.2',descricao:'Custo dos Serviços Prestados (CSP)',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'5'},
    {codigo:'5.2.1.01',descricao:'Mão de Obra Direta',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'5'},
    {codigo:'5.2.1.02',descricao:'Encargos Sociais — Produção',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'5'},
    {codigo:'5.2.1.03',descricao:'Materiais Aplicados nos Serviços',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'5'},
    // 6 DESPESAS
    {codigo:'6',descricao:'DESPESAS',tipo:'Sintética',natureza:'Devedora',nivel:1,grupo:'6'},
    {codigo:'6.1',descricao:'Despesas com Pessoal',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.1.1.01',descricao:'Salários e Ordenados',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.1.1.02',descricao:'Horas Extras',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.1.1.03',descricao:'Encargos Sociais (INSS + FGTS)',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.1.1.04',descricao:'Férias e 13º Salário',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.1.1.05',descricao:'Vale-Transporte e Vale-Alimentação',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2',descricao:'Despesas Administrativas',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.2.1.01',descricao:'Aluguel e Condomínio',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.02',descricao:'Água, Luz e Telefone',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.03',descricao:'Material de Escritório e Informática',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.04',descricao:'Honorários Contábeis e Jurídicos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.05',descricao:'Seguros',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.06',descricao:'Depreciação e Amortização',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.2.1.07',descricao:'Manutenção e Reparos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.3',descricao:'Despesas Comerciais',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.3.1.01',descricao:'Comissões sobre Vendas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.3.1.02',descricao:'Propaganda e Publicidade',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.3.1.03',descricao:'Fretes e Transportes',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.4',descricao:'Despesas Financeiras',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.4.1.01',descricao:'Juros Passivos',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.4.1.02',descricao:'IOF e Tarifas Bancárias',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.4.1.03',descricao:'Multas e Juros Fiscais',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.5',descricao:'Tributos sobre o Lucro',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.5.1.01',descricao:'IRPJ — Imposto de Renda PJ',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.5.1.02',descricao:'CSLL — Contribuição Social',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.5.1.03',descricao:'Simples Nacional',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.5.1.04',descricao:'IPTU e IPVA',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    {codigo:'6.9',descricao:'Despesas Diversas',tipo:'Sintética',natureza:'Devedora',nivel:2,grupo:'6'},
    {codigo:'6.9.1.01',descricao:'Despesas Diversas',tipo:'Analítica',natureza:'Devedora',nivel:4,grupo:'6'},
    // 7 RESULTADO
    {codigo:'7',descricao:'RESULTADO DO EXERCÍCIO',tipo:'Sintética',natureza:'Credora',nivel:1,grupo:'7'},
    {codigo:'7.1',descricao:'Apuração do Resultado',tipo:'Sintética',natureza:'Credora',nivel:2,grupo:'7'},
    {codigo:'7.1.1.01',descricao:'Lucro / Prejuízo Líquido do Exercício',tipo:'Analítica',natureza:'Credora',nivel:4,grupo:'7'},
  ];
  const inserts=base.map(c=>({...c,saldo:0,escritorio_id:escritorioId}));
  for(let i=0;i<inserts.length;i+=25){
    const batch=inserts.slice(i,i+25);
    const {error}=await sb.from('plano_contas').insert(batch);
    if(error){toast('❌ Erro ao inserir: '+error.message);return;}
  }
  toast('✅ Plano de Contas CFC inserido! '+inserts.length+' contas cadastradas.');
  await loadPlano();
}

async function exportarPlano(){
  const {data}=await sb.from('plano_contas').select('*').eq('escritorio_id',escritorioId).order('codigo',{ascending:true});
  const contas=data||[];
  if(!contas.length){toast('⚠️ Nenhuma conta para exportar');return;}
  const header='Código;Descrição;Tipo;Natureza;Nível;Grupo;Saldo';
  const rows=contas.map(c=>[c.codigo,`"${c.descricao}"`,c.tipo,c.natureza,c.nivel,c.grupo||'',c.saldo!=null?Number(c.saldo).toFixed(2):'0.00'].join(';'));
  const csv='\uFEFF'+header+'\n'+rows.join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='plano_contas.csv';a.click();
  URL.revokeObjectURL(url);
  toast('✅ Plano de contas exportado! ('+contas.length+' contas)');
}

async function populateClienteSelects(){
  const {data}=await sb.from('clientes').select('id,razao_social');
  document.querySelectorAll('.sel-cliente').forEach(sel=>{
    sel.innerHTML='<option value="">Selecione…</option>'+(data||[]).map(c=>`<option value="${c.id}">${c.razao_social}</option>`).join('');
  });
}

function populateResponsavelSelect(){
  const nome=currentUser?.user_metadata?.nome_completo||currentUser?.email||'';
  document.querySelectorAll('.sel-responsavel').forEach(sel=>{
    sel.innerHTML=`<option value="${nome}">${nome}</option>`;
  });
}

init();

// ── CONCILIAÇÃO BANCÁRIA ───────────────────────────────────────────────────────
function importarOFX(){
  document.getElementById('ofx-cliente-sel').value='';
  document.getElementById('ofx-input-modal').value='';
  openM('m-importar-ofx');
}

async function confirmarImportarOFX(){
  const clienteId=document.getElementById('ofx-cliente-sel').value;
  const file=document.getElementById('ofx-input-modal').files[0];
  if(!clienteId){toast('⚠️ Selecione o cliente');return;}
  if(!file){toast('⚠️ Selecione o arquivo OFX');return;}
  closeM('m-importar-ofx');
  await processarArquivoOFX(file,clienteId);
}

function parseOFX(text){
  const txs=[];
  const raw=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const re=/<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  let m;
  while((m=re.exec(raw))!==null){
    const blk=m[1];
    const get=tag=>{const r=blk.match(new RegExp('<'+tag+'>([^<\n\r]*)','i'));return r?r[1].trim():'';};
    const dtRaw=get('DTPOSTED')||get('DTUSER')||'';
    const dt=dtRaw.replace(/^(\d{4})(\d{2})(\d{2}).*/,'$1-$2-$3');
    if(!dt||dt.length<10)continue;
    const valorRaw=parseFloat((get('TRNAMT')||'0').replace(',','.'))||0;
    const memo=(get('MEMO')||get('NAME')||'Sem descrição').substring(0,200);
    txs.push({data_transacao:dt,descricao:memo,valor:Math.abs(valorRaw),tipo:valorRaw>=0?'credito':'debito'});
  }
  return txs;
}

async function processarArquivoOFX(file,clienteId){
  if(!file)return;
  toast('⏳ Lendo arquivo OFX…');
  const text=await file.text();
  const txs=parseOFX(text);
  if(!txs.length){toast('⚠️ Nenhuma transação encontrada no arquivo');return;}
  const {data:existing}=await sb.from('transacoes_bancarias').select('data_transacao,valor,descricao').eq('escritorio_id',escritorioId);
  const existSet=new Set((existing||[]).map(e=>`${e.data_transacao}|${e.valor}|${e.descricao}`));
  const novas=txs.filter(t=>!existSet.has(`${t.data_transacao}|${t.valor}|${t.descricao}`)).map(t=>({...t,escritorio_id:escritorioId,cliente_id:clienteId||null,conciliado:false}));
  if(!novas.length){toast('ℹ️ Todas as transações já foram importadas antes');return;}
  const {error}=await sb.from('transacoes_bancarias').insert(novas);
  if(error){toast('❌ Erro ao importar: '+error.message);return;}
  toast(`✅ ${novas.length} transação${novas.length!==1?'ões':''} importada${novas.length!==1?'s':''}!`);
  await loadConciliacao();
}

function abrirFiltroCliente(){
  const sel=document.getElementById('filtro-cliente-conc-sel');
  if(sel)sel.value=filtroClienteConcId||'';
  openM('m-filtro-cliente-conc');
}

async function aplicarFiltroCliente(){
  const sel=document.getElementById('filtro-cliente-conc-sel');
  filtroClienteConcId=sel.value||null;
  filtroClienteConcNome=sel.options[sel.selectedIndex]?.text||'';
  closeM('m-filtro-cliente-conc');
  await loadConciliacao();
}

async function limparFiltroCliente(){
  filtroClienteConcId=null;
  filtroClienteConcNome='';
  closeM('m-filtro-cliente-conc');
  await loadConciliacao();
}

async function loadConciliacao(){
  let query=sb.from('transacoes_bancarias').select('*').eq('escritorio_id',escritorioId).order('data_transacao',{ascending:false});
  if(filtroClienteConcId)query=query.eq('cliente_id',filtroClienteConcId);
  const {data,error}=await query;
  const label=document.getElementById('conc-filtro-label');
  if(label)label.textContent=filtroClienteConcId?`Exibindo: ${filtroClienteConcNome}`:'Importe um extrato OFX para iniciar';
  if(error){toast('❌ Erro ao carregar: '+error.message);return;}
  const txs=data||[];
  // Busca manual dos lançamentos vinculados (evita depender de FK no Supabase)
  const lancIds=txs.filter(t=>t.lancamento_id).map(t=>t.lancamento_id);
  let lancsMap={};
  if(lancIds.length){
    const {data:lancs}=await sb.from('lancamentos').select('id,historico,valor').in('id',lancIds);
    (lancs||[]).forEach(l=>{lancsMap[l.id]=l;});
  }
  const txsComLanc=txs.map(t=>({...t,lancamentos:t.lancamento_id?lancsMap[t.lancamento_id]||null:null}));
  const fmtVal=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  const totalCredito=txs.filter(t=>t.tipo==='credito').reduce((s,t)=>s+Number(t.valor||0),0);
  const totalDebito=txs.filter(t=>t.tipo==='debito').reduce((s,t)=>s+Number(t.valor||0),0);
  document.getElementById('conc-total').textContent=txs.length;
  document.getElementById('conc-pend').textContent=txs.filter(t=>!t.conciliado).length;
  document.getElementById('conc-total-credito').textContent=fmtVal(totalCredito);
  document.getElementById('conc-total-debito').textContent=fmtVal(totalDebito);
  renderConciliacao(txsComLanc);
}

function renderConciliacao(txs){
  const tbody=document.getElementById('conc-tbody');if(!tbody)return;
  if(!txs.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:20px">Nenhuma transação importada ainda. Clique em "Importar OFX" para começar.</td></tr>';return;}
  const fmt=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  tbody.innerHTML=txs.map(t=>{
    const dt=t.data_transacao?new Date(t.data_transacao+'T12:00:00').toLocaleDateString('pt-BR'):'—';
    const valColor=t.tipo==='credito'?'color:var(--pos)':'color:var(--neg)';
    const valSign=t.tipo==='credito'?'+':'−';
    const badge=t.conciliado?'<span class="badge b-ok">Conciliado</span>':'<span class="badge b-pend">Pendente</span>';
    const lanc=t.lancamentos?`<span style="font-size:11px">${t.lancamentos.historico||'Lançamento vinculado'}</span>`:'<span style="color:var(--text-dim);font-size:11px">—</span>';
    const descEsc=(t.descricao||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const acoes=t.conciliado
      ?`<button class="btn btn-ghost btn-sm" onclick="desconciliar('${t.id}')">Desfazer</button>`
      :`<div style="display:flex;gap:4px"><button class="btn btn-primary btn-sm" onclick="criarLancamentoDaConciliacao('${t.id}',${t.valor},'${t.tipo}','${t.data_transacao}','${descEsc}')">+ Lançamento</button><button class="btn btn-ghost btn-sm" onclick="conciliarManual('${t.id}')">Vincular</button></div>`;
    const btn=`<div style="display:flex;gap:4px;align-items:center">${acoes}<button class="btn btn-ghost btn-sm" onclick="abrirEdicaoTransacao('${t.id}','${t.data_transacao}','${descEsc}',${t.valor},'${t.tipo}',${t.conciliado})">✏️</button><button class="btn btn-ghost btn-sm" style="color:var(--neg)" onclick="confirmarExcluirTransacao('${t.id}','${descEsc}')">🗑</button></div>`;
    const tipoBadge=t.tipo==='credito'?'<span class="badge b-ok">Crédito</span>':'<span class="badge b-pend" style="background:rgba(220,53,69,.12);color:var(--neg)">Débito</span>';
    return `<tr><td>${dt}</td><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtmlConc(t.descricao)}">${escHtmlConc(t.descricao)}</td><td style="${valColor};font-weight:600">${valSign} ${fmt(t.valor)}</td><td>${tipoBadge}</td><td>${lanc}</td><td>${badge}</td><td>${btn}</td></tr>`;
  }).join('');
}
function escHtmlConc(t){return(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

async function conciliarManual(id){
  const {error}=await sb.from('transacoes_bancarias').update({conciliado:true}).eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('✅ Marcada como conciliada');
  await loadConciliacao();
}

async function desconciliar(id){
  const {error}=await sb.from('transacoes_bancarias').update({conciliado:false,lancamento_id:null}).eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('↩️ Conciliação desfeita');
  await loadConciliacao();
}

async function limparConciliacao(){
  closeM('m-limpar-conciliacao');
  toast('⏳ Excluindo dados…');
  const {error}=await sb.from('transacoes_bancarias').delete().eq('escritorio_id',escritorioId);
  if(error){toast('❌ Erro ao excluir: '+error.message);return;}
  toast('🗑 Conciliação bancária limpa com sucesso');
  await loadConciliacao();
}

function abrirEdicaoTransacao(id,data,descricao,valor,tipo,conciliado){
  document.getElementById('edit-tx-id').value=id;
  document.getElementById('edit-tx-data').value=data;
  document.getElementById('edit-tx-descricao').value=descricao;
  document.getElementById('edit-tx-valor').value=valor;
  document.getElementById('edit-tx-tipo').value=tipo;
  document.getElementById('edit-tx-conciliado').value=String(conciliado);
  openM('m-editar-tx');
}

async function salvarEdicaoTransacao(){
  const id=document.getElementById('edit-tx-id').value;
  const obj={
    data_transacao:document.getElementById('edit-tx-data').value,
    descricao:document.getElementById('edit-tx-descricao').value.trim(),
    valor:parseFloat(document.getElementById('edit-tx-valor').value)||0,
    tipo:document.getElementById('edit-tx-tipo').value,
    conciliado:document.getElementById('edit-tx-conciliado').value==='true'
  };
  if(!obj.descricao){toast('⚠️ Informe a descrição');return;}
  if(!obj.valor){toast('⚠️ Informe o valor');return;}
  const {error}=await sb.from('transacoes_bancarias').update(obj).eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  closeM('m-editar-tx');
  toast('✅ Transação atualizada!');
  await loadConciliacao();
}

let pendingExcluirTxId=null;

function confirmarExcluirTransacao(id,descricao){
  pendingExcluirTxId=id;
  document.getElementById('excluir-tx-desc').textContent=descricao||'';
  openM('m-excluir-tx');
}

async function excluirTransacao(){
  if(!pendingExcluirTxId)return;
  const {error}=await sb.from('transacoes_bancarias').delete().eq('id',pendingExcluirTxId);
  pendingExcluirTxId=null;
  closeM('m-excluir-tx');
  if(error){toast('❌ Erro ao excluir: '+error.message);return;}
  toast('🗑 Transação excluída');
  await loadConciliacao();
}

async function autoConciliar(){
  toast('⏳ Processando conciliação…');
  const [{data:txs,error:e1},{data:lancs,error:e2}]=await Promise.all([
    sb.from('transacoes_bancarias').select('id,valor,tipo,data_transacao,cliente_id,descricao').eq('escritorio_id',escritorioId).eq('conciliado',false),
    sb.from('lancamentos').select('id,valor,tipo,data_lanc,cliente_id').eq('escritorio_id',escritorioId)
  ]);
  if(e1){toast('❌ Erro ao buscar transações: '+e1.message);return;}
  if(e2){toast('❌ Erro ao buscar lançamentos: '+e2.message);return;}
  if(!txs?.length){toast('ℹ️ Nenhuma transação pendente');return;}
  const usados=new Set();
  let matched=0;
  let criados=0;
  for(const tx of txs){
    // Tenta encontrar lançamento existente com mesmo cliente, valor e data próxima
    const match=lancs?.find(l=>
      !usados.has(l.id)&&
      l.cliente_id===tx.cliente_id&&
      Math.abs(Number(l.valor)-Number(tx.valor))<0.01&&
      Math.abs(new Date(l.data_lanc)-new Date(tx.data_transacao))<=3*86400000
    );
    if(match){
      const {error}=await sb.from('transacoes_bancarias').update({conciliado:true,lancamento_id:match.id}).eq('id',tx.id);
      if(!error){usados.add(match.id);matched++;}
    }else{
      // Cria lançamento automaticamente a partir da transação bancária
      // credito (entrada): D 1.1.1.02 Bancos / C 4.1.1.02 Prestação de Serviços
      // debito  (saída):   D 6.9.1.01 Despesas Diversas / C 1.1.1.02 Bancos
      const isCredito=tx.tipo==='credito';
      const contaDeb=isCredito?'1.1.1.02':'6.9.1.01';
      const contaCred=isCredito?'4.1.1.02':'1.1.1.02';
      const {data:novo,error:eCriar}=await sb.from('lancamentos').insert({
        historico:tx.descricao||'Lançamento automático',
        valor:tx.valor,
        tipo:tx.tipo,
        data_lanc:tx.data_transacao,
        cliente_id:tx.cliente_id||null,
        escritorio_id:escritorioId,
        conta_debito:contaDeb,
        conta_credito:contaCred
      }).select('id').single();
      if(!eCriar&&novo){
        await sb.from('transacoes_bancarias').update({conciliado:true,lancamento_id:novo.id}).eq('id',tx.id);
        criados++;
      }
    }
  }
  const total=matched+criados;
  let msg=`✅ ${total} transação${total!==1?'ões':''} conciliada${total!==1?'s':''}!`;
  if(criados)msg+=` (${criados} lançamento${criados!==1?'s':''} criado${criados!==1?'s':''} automaticamente)`;
  toast(total?msg:'ℹ️ Nenhuma transação pendente para conciliar');
  await loadConciliacao();
}

// ── SPED / DCTF ───────────────────────────────────────────────────────────────
function downloadTxt(conteudo,nomeArquivo){
  const blob=new Blob(['\uFEFF'+conteudo],{type:'application/octet-stream'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=nomeArquivo;a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},300);
}

function fmtDataSped(iso){return iso?iso.replace(/-/g,''):'00000000';}
function fmtValorSped(v){return Number(v||0).toFixed(2).replace('.',',');}

async function gerarSPED(){
  const tipo=document.getElementById('sped-tipo').value;
  const clienteId=document.getElementById('sped-cliente').value;
  const competencia=document.getElementById('sped-competencia').value;
  if(!clienteId){toast('⚠️ Selecione o cliente');return;}
  if(!competencia){toast('⚠️ Informe a competência');return;}
  toast('⏳ Gerando arquivo SPED…');
  const [ano,mes]=competencia.split('-');
  const dtIni=`${ano}-${mes}-01`;
  const dtFim=new Date(ano,mes,0).toISOString().split('T')[0];
  const [{data:cli},{data:lancs},{data:contas}]=await Promise.all([
    sb.from('clientes').select('*').eq('id',clienteId).single(),
    sb.from('lancamentos').select('*').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).gte('data_lanc',dtIni).lte('data_lanc',dtFim).order('data_lanc'),
    sb.from('plano_contas').select('*').eq('escritorio_id',escritorioId).order('codigo')
  ]);
  if(!cli){toast('❌ Cliente não encontrado');return;}
  // Diagnóstico: alertar campos faltando
  const camposFalt=[];
  if(!cli.cnpj) camposFalt.push('CNPJ');
  if(!cli.uf) camposFalt.push('UF');
  if(!cli.cod_municipio) camposFalt.push('Cód. IBGE');
  if(!cli.cnae) camposFalt.push('CNAE');
  if(!cli.natureza_juridica) camposFalt.push('Natureza Jurídica');
  if(camposFalt.length){
    toast('⚠️ Campos incompletos no cadastro: '+camposFalt.join(', ')+'. Edite o cliente antes de gerar.');
    return;
  }
  const cnpj=(cli.cnpj||'').replace(/\D/g,'');
  const linhas=[];
  if(tipo==='ecd'){
    // SPED Contábil (ECD)
    linhas.push(`|0000|LECD|0|${fmtDataSped(dtIni)}|${fmtDataSped(dtFim)}|${cli.razao_social||''}|${cnpj}|${cli.uf||'SP'}|${cli.cod_municipio||'0000000'}|1|0|0|1|S||`);
    linhas.push(`|0001|0|`);
    linhas.push(`|0007|${cli.razao_social||''}|${cnpj}|`);
    linhas.push(`|0999|2|`);
    linhas.push(`|I001|0|`);
    linhas.push(`|I010|${cli.razao_social||''}|${cnpj}|${fmtDataSped(dtIni)}|${fmtDataSped(dtFim)}|${cli.regime||''}|${cli.natureza_juridica||''}|${cli.cnae||''}|${cli.inscricao_estadual||''}|${cli.municipio||''}|${cli.uf||''}|`);
    (contas||[]).forEach(c=>{
      linhas.push(`|I050|${c.codigo||''}|${c.descricao||''}|${c.tipo==='sintetica'?'S':'A'}|${c.natureza==='Credora'?'C':'D'}||0||`);
    });
    let seqLanc=1;
    (lancs||[]).forEach(l=>{
      const seq=String(seqLanc++).padStart(5,'0');
      linhas.push(`|I200|${seq}|${fmtDataSped(l.data_lanc)}|${l.historico||'Lançamento'}|${fmtValorSped(l.valor)}|${l.conta_debito||''}|${l.conta_credito||''}||`);
    });
    linhas.push(`|I999|${2+( contas||[]).length+(lancs||[]).length}|`);
    linhas.push(`|9001|0|`);
    linhas.push(`|9900|0000|1|`);
    linhas.push(`|9900|0001|1|`);
    linhas.push(`|9900|I001|1|`);
    linhas.push(`|9900|I999|1|`);
    linhas.push(`|9900|9001|1|`);
    linhas.push(`|9900|9900|${6+(contas||[]).length+(lancs||[]).length}|`);
    linhas.push(`|9900|9999|1|`);
    linhas.push(`|9999|${linhas.length+1}|`);
  }else if(tipo==='efd'){
    // SPED Fiscal (EFD ICMS/IPI)
    linhas.push(`|0000|${fmtDataSped(dtIni)}|${fmtDataSped(dtFim)}|${cli.razao_social||''}|${cnpj}|${cli.inscricao_estadual||''}|${cli.cnae||''}|${cli.uf||'SP'}|${cli.municipio||''}|${cli.cod_municipio||''}|1|A|||`);
    linhas.push(`|0001|0|`);
    linhas.push(`|0150|001|${cli.razao_social||''}|${cnpj}|||${cli.uf||'SP'}|||`);
    linhas.push(`|0990|4|`);
    linhas.push(`|C001|0|`);
    (lancs||[]).forEach((l,i)=>{
      const num=String(i+1).padStart(6,'0');
      linhas.push(`|C100|E|0|${num}|55|00|000|${fmtDataSped(l.data_lanc)}||${fmtValorSped(l.valor)}||001||||||||||`);
    });
    linhas.push(`|C990|${2+(lancs||[]).length}|`);
    linhas.push(`|9001|0|`);
    linhas.push(`|9900|0000|1|`);
    linhas.push(`|9900|0001|1|`);
    linhas.push(`|9900|C001|1|`);
    linhas.push(`|9900|9001|1|`);
    linhas.push(`|9900|9900|${5+(lancs||[]).length}|`);
    linhas.push(`|9900|9999|1|`);
    linhas.push(`|9999|${linhas.length+1}|`);
  }else{
    // ECF
    linhas.push(`|0000|ECF|002|${fmtDataSped(new Date().toISOString().split('T')[0])}|${ano}0101|${ano}1231|${cli.razao_social||''}|${cnpj}|${cli.uf||''}|${cli.inscricao_estadual||''}|${cli.cnae||''}|${cli.natureza_juridica||''}|N||0|N|N|N||`);
    linhas.push(`|0001|0|`);
    linhas.push(`|0010|${cnpj}|${cli.razao_social||''}|${cli.uf||''}|${cli.inscricao_estadual||''}|${cli.cnae||''}|${cli.municipio||''}|${cli.cod_municipio||''}|${cli.regime||''}|${ano}|`);
    linhas.push(`|0020|${cli.regime==='Lucro Real'?'2':cli.regime==='Lucro Presumido'?'3':'9'}|N|N|N|N|N|N|N|N|N|`);
    linhas.push(`|0990|4|`);
    const totalReceita=(lancs||[]).filter(l=>l.tipo==='credito').reduce((s,l)=>s+Number(l.valor||0),0);
    const totalDespesa=(lancs||[]).filter(l=>l.tipo==='debito').reduce((s,l)=>s+Number(l.valor||0),0);
    const lucro=totalReceita-totalDespesa;
    linhas.push(`|P001|0|`);
    linhas.push(`|P100|${ano}|${fmtValorSped(totalReceita)}|${fmtValorSped(totalDespesa)}|${fmtValorSped(Math.max(lucro,0))}|${fmtValorSped(totalReceita*(Number(cli.aliq_irpj||0)/100))}|${fmtValorSped(totalReceita*(Number(cli.aliq_csll||0)/100))}|`);
    linhas.push(`|P999|3|`);
    linhas.push(`|9001|0|`);
    linhas.push(`|9900|0000|1|`);
    linhas.push(`|9900|0001|1|`);
    linhas.push(`|9900|0010|1|`);
    linhas.push(`|9900|0020|1|`);
    linhas.push(`|9900|0990|1|`);
    linhas.push(`|9900|P001|1|`);
    linhas.push(`|9900|P999|1|`);
    linhas.push(`|9900|9001|1|`);
    linhas.push(`|9900|9900|${9}|`);
    linhas.push(`|9900|9999|1|`);
    linhas.push(`|9999|${linhas.length+1}|`);
  }
  const nomes={ecd:'SPED_Contabil',efd:'SPED_Fiscal',ecf:'ECF'};
  closeM('m-sped');
  downloadTxt(linhas.join('\n'),`${nomes[tipo]}_${cnpj}_${ano}${mes}.txt`);
  toast(`✅ ${nomes[tipo]} gerado com sucesso!`);
}

async function gerarDCTF(){
  const clienteId=document.getElementById('dctf-cliente').value;
  const competencia=document.getElementById('dctf-competencia').value;
  const tipo=document.getElementById('dctf-tipo').value;
  if(!clienteId){toast('⚠️ Selecione o cliente');return;}
  if(!competencia){toast('⚠️ Informe a competência');return;}
  toast('⏳ Gerando DCTF…');
  const [ano,mes]=competencia.split('-');
  const dtIni=`${ano}-${mes}-01`;
  const dtFim=new Date(ano,mes,0).toISOString().split('T')[0];
  const [{data:cli},{data:lancs}]=await Promise.all([
    sb.from('clientes').select('*').eq('id',clienteId).single(),
    sb.from('lancamentos').select('*').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).gte('data_lanc',dtIni).lte('data_lanc',dtFim)
  ]);
  if(!cli){toast('❌ Cliente não encontrado');return;}
  const cnpj=(cli.cnpj||'').replace(/\D/g,'');
  const totalReceita=(lancs||[]).filter(l=>l.tipo==='credito').reduce((s,l)=>s+Number(l.valor||0),0);
  const irpj=totalReceita*(Number(cli.aliq_irpj||0)/100);
  const csll=totalReceita*(Number(cli.aliq_csll||0)/100);
  const pis=totalReceita*(Number(cli.aliq_pis||0)/100);
  const cofins=totalReceita*(Number(cli.aliq_cofins||0)/100);
  const linhas=[
    `|DCTF|${tipo.toUpperCase()}|${mes}/${ano}|`,
    `|CONTRIBUINTE|${cli.razao_social||''}|${cnpj}|`,
    `|IRPJ|1599|${fmtValorSped(irpj)}|0,00|${fmtValorSped(irpj)}|`,
    `|CSLL|2372|${fmtValorSped(csll)}|0,00|${fmtValorSped(csll)}|`,
    `|PIS|8109|${fmtValorSped(pis)}|0,00|${fmtValorSped(pis)}|`,
    `|COFINS|2172|${fmtValorSped(cofins)}|0,00|${fmtValorSped(cofins)}|`,
    `|TOTAL|${fmtValorSped(irpj+csll+pis+cofins)}|`,
  ];
  closeM('m-dctf');
  downloadTxt(linhas.join('\n'),`DCTF_${cnpj}_${ano}${mes}.txt`);
  toast('✅ DCTF gerada com sucesso!');
}

// CHATBOT
let chatOpen=false,chatHistory=[],isTyping=false;
const SYSTEM_PROMPT=`Você é o TEUBot, assistente de suporte do TEUcontador — o sistema contábil SaaS mais completo do Brasil.\n\nVocê auxilia contadores e escritórios de contabilidade com dúvidas sobre:\n- Uso do sistema TEUcontador (navegação, funcionalidades, módulos)\n- Obrigações fiscais: SPED Fiscal (EFD ICMS/IPI), SPED Contábil (ECD), ECF, DCTF, PGDAS, EFD Contribuições\n- eSocial e folha de pagamento\n- Conciliação bancária e importação de OFX\n- Plano de Contas CFC e lançamentos em partida dobrada\n- Regimes tributários: Simples Nacional, Lucro Presumido, Lucro Real\n- Planos e preços: Starter R$149, Pro R$349, Enterprise R$699\n\nPersonalidade: profissional, objetivo e acolhedor. Respostas concisas (3–5 linhas no máximo). Use emojis com moderação. Sempre ofereça próximos passos concretos. Responda sempre em português brasileiro.\n\nSe não souber algo, oriente o usuário a contatar: suporte@teucontador.com.br`;

function toggleChat(){
  chatOpen=!chatOpen;
  const win=document.getElementById('chatWin'),fab=document.getElementById('chatFab'),fabIcon=document.getElementById('fabIcon'),fabNotif=document.getElementById('fabNotif');
  win.classList.toggle('open',chatOpen);fab.classList.toggle('open',chatOpen);
  if(chatOpen){fabNotif.style.display='none';fabIcon.innerHTML='<line x1="18" y1="6" x2="6" y2="18" stroke-width="2.5"/><line x1="6" y1="6" x2="18" y2="18" stroke-width="2.5"/>';if(chatHistory.length===0)showWelcome();setTimeout(()=>document.getElementById('chatInput').focus(),300);}
  else{fabIcon.innerHTML='<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>';}
}
function showWelcome(){const h=new Date().getHours();const g=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';addBotMsg(`${g}! 👋 Sou o **TEUBot**, assistente do TEUcontador.\n\nComo posso te ajudar? Pergunte sobre SPED, DCTF, folha de pagamento ou qualquer funcionalidade.`);}
function addBotMsg(text){const msgs=document.getElementById('chatMsgs');const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const div=document.createElement('div');div.className='msg bot';div.innerHTML=`<div class="msg-av">🤖</div><div><div class="msg-bubble">${formatMsg(text)}</div><span class="msg-time">${now}</span></div>`;msgs.appendChild(div);chatHistory.push({role:'assistant',content:text});scrollBottom();}
function addUserMsg(text){const msgs=document.getElementById('chatMsgs');const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const div=document.createElement('div');div.className='msg user';div.innerHTML=`<div><div class="msg-bubble">${escHtml(text)}</div><span class="msg-time">${now}</span></div><div class="msg-av" style="font-size:11px;font-weight:700;color:#fff">RO</div>`;msgs.appendChild(div);scrollBottom();}
function formatMsg(text){return escHtml(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');}
function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function showTyping(){const msgs=document.getElementById('chatMsgs');const div=document.createElement('div');div.className='msg bot';div.id='typingIndicator';div.innerHTML=`<div class="msg-av">🤖</div><div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;msgs.appendChild(div);scrollBottom();}
function hideTyping(){document.getElementById('typingIndicator')?.remove();}
function scrollBottom(){const msgs=document.getElementById('chatMsgs');msgs.scrollTo({top:msgs.scrollHeight,behavior:'smooth'});}
async function sendMsg(){const input=document.getElementById('chatInput');const text=input.value.trim();if(!text||isTyping)return;input.value='';input.style.height='auto';addUserMsg(text);chatHistory.push({role:'user',content:text});await askClaude();}
function sendTopic(text){document.getElementById('chatInput').value=text;sendMsg();}
async function askClaude(){
  isTyping=true;document.getElementById('chatSend').disabled=true;showTyping();
  const userMsg=(chatHistory.filter(m=>m.role==='user').slice(-1)[0]?.content||'').toLowerCase();
  await new Promise(r=>setTimeout(r,700));
  hideTyping();
  addBotMsg(respostaLocal(userMsg));
  isTyping=false;document.getElementById('chatSend').disabled=false;document.getElementById('chatInput').focus();
}

function respostaLocal(q){
  if(q.match(/sped|ecd|efd|ecf/))
    return '📊 Para gerar o **SPED**, acesse **Ações Rápidas → Emitir SPED** ou vá em **Integrações**. Selecione o tipo (Contábil/Fiscal/ECF), o cliente e a competência. O arquivo .txt será baixado automaticamente.\n\nCertifique-se de que o cliente tem CNPJ, UF, CNAE e Cód. IBGE preenchidos no cadastro.';
  if(q.match(/dctf/))
    return '🧾 A **DCTF** é gerada em **Ações Rápidas → Gerar DCTF**. Selecione o cliente e a competência. Os valores de IRPJ, CSLL, PIS e COFINS são calculados automaticamente pelas alíquotas do cadastro do cliente.';
  if(q.match(/concilia|ofx|extrato/))
    return '🏦 Para a **Conciliação Bancária**:\n1. Acesse o módulo **Conciliação**\n2. Clique em **📂 Importar OFX** e selecione o cliente\n3. Após importar, clique em **⚡ Auto-conciliar**\n\nO sistema cria os lançamentos automaticamente com as contas contábeis corretas.';
  if(q.match(/lançamento|lancamento|partida|debito|credito/))
    return '📒 Em **Lançamentos**, clique em **+ Novo Lançamento**. Preencha:\n- **Conta Débito e Crédito**: use o autocomplete digitando o código (ex: `1.1.1`) ou o nome da conta\n- O **Plano de Contas CFC** deve estar populado (Plano de Contas → ⚡ Popular Padrão CFC)';
  if(q.match(/plano.*conta|conta.*plano|cfc/))
    return '📋 Para configurar o **Plano de Contas**:\n1. Acesse **Plano de Contas** no menu\n2. Clique em **⚡ Popular Padrão CFC** para inserir toda a estrutura NBC TG 26\n3. Após isso, os lançamentos e relatórios funcionarão corretamente.';
  if(q.match(/cliente|empresa|cadastr/))
    return '👥 Para cadastrar um cliente, acesse **Clientes/Empresas → + Novo Cliente**. Preencha todos os campos fiscais (CNPJ, IE, CNAE, Município, UF, Cód. IBGE) para que o SPED e NFS-e funcionem corretamente.';
  if(q.match(/nfs|nota.*servi|servi.*nota/))
    return '🧾 Para emitir **NFS-e**, acesse **Configurações → Integrações → NFS-e → Emitir XML**. Preencha os dados do serviço e baixe o XML ABRASF 2.01 para importar no sistema da prefeitura e assinar digitalmente.';
  if(q.match(/esocial|e-social|social/))
    return '👥 Para gerar eventos **eSocial**, acesse **Configurações → Integrações → eSocial → Gerar Evento**. Selecione o evento (S-1200 Remuneração, S-2200 Admissão, S-2299 Desligamento), preencha os dados e baixe o XML para enviar no portal gov.br.';
  if(q.match(/balanc|balanço|patrimonial/))
    return '📊 O **Balanço Patrimonial** fica em **Relatórios → Balanço Patrimonial**. Para exportar em PDF, acesse **Ações Rápidas → Balanço → Exportar PDF**.\n\n⚠️ Requer: Plano de Contas CFC populado + lançamentos com Conta Débito/Crédito preenchidos.';
  if(q.match(/relat|dre|balancete|razão|razao/))
    return '📈 Os **Relatórios Contábeis** estão no módulo **Relatórios**: Balancete de Verificação, DRE, Balanço Patrimonial, Razão e Obrigações. Use os filtros de data e cliente para segmentar os dados.';
  if(q.match(/simples|lucro.*presum|lucro.*real|regime/))
    return '🏛️ O **regime tributário** define as alíquotas:\n- **Simples Nacional**: PIS 0,65% / COFINS 3%\n- **Lucro Presumido**: PIS 0,65% / COFINS 3% / IRPJ 15% / CSLL 9%\n- **Lucro Real**: PIS 1,65% / COFINS 7,6% / IRPJ 15% / CSLL 9%\n\nConfigure as alíquotas no cadastro de cada cliente.';
  if(q.match(/folha|colaborad|salario|salário|holerite/))
    return '👥 A **Folha de Pagamento** está no módulo **Folha**. Cadastre colaboradores com cargo, regime (CLT/PJ) e salário bruto. O sistema calcula automaticamente INSS (11%), IRRF (11,3%) e FGTS (8%).';
  if(q.match(/obrigac|vencimento|prazo|fiscal/))
    return '📅 As **Obrigações Fiscais** ficam no módulo **Obrigações**. Cadastre prazos e o dashboard exibirá alertas automáticos de vencimento com 3 dias de antecedência.';
  if(q.match(/config|escritorio|escritório/))
    return '⚙️ Em **Configurações** você pode:\n- Atualizar dados do escritório (CNPJ, CRC, responsável)\n- Configurar dados bancários (Open Finance)\n- Acessar integrações (NFS-e, eSocial, SPED)';
  if(q.match(/oi|olá|ola|bom dia|boa tarde|boa noite|hello/))
    return `Olá! 👋 Como posso te ajudar hoje?\n\nPosso responder sobre: **SPED**, **DCTF**, **Conciliação OFX**, **Lançamentos**, **NFS-e**, **eSocial**, **Relatórios** ou qualquer funcionalidade do TEUcontador.`;
  if(q.match(/obrigado|obrigada|valeu|thanks/))
    return 'Fico feliz em ajudar! 😊 Se tiver mais dúvidas, é só perguntar.';
  if(q.match(/preço|plano|quanto.*custa|valor.*plano/))
    return '💳 Planos do TEUcontador:\n- **Starter** R$ 149/mês — até 10 clientes\n- **Pro** R$ 349/mês — até 50 clientes\n- **Enterprise** R$ 699/mês — clientes ilimitados\n\nPara contratar: **suporte@teucontador.com.br**';
  return 'Não encontrei uma resposta específica para isso. 🤔\n\nPosso ajudar com: **SPED**, **DCTF**, **Conciliação OFX**, **Lançamentos**, **NFS-e**, **eSocial**, **Plano de Contas**, **Relatórios** ou **Folha de Pagamento**.\n\nOu entre em contato: **suporte@teucontador.com.br**';
}
function handleKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}
setTimeout(()=>{if(!chatOpen){const n=document.getElementById('fabNotif');n.style.display='flex';}},3000);

// ── COLABORADORES ─────────────────────────────────────────────────────────────
async function popularClientesColab(selectedId=''){
  const sel=document.getElementById('colab-cliente');
  sel.innerHTML='<option value="">Nenhum</option>';
  const {data}=await sb.from('clientes').select('id,razao_social').order('razao_social');
  (data||[]).forEach(c=>{
    const opt=document.createElement('option');
    opt.value=c.id;opt.textContent=c.razao_social;
    if(c.id===selectedId)opt.selected=true;
    sel.appendChild(opt);
  });
}

async function openNovoColaborador(){
  document.getElementById('colab-id').value='';
  document.getElementById('m-colab-titulo').textContent='Novo Colaborador';
  ['colab-nome','colab-cpf','colab-cargo','colab-email','colab-salario'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  document.getElementById('colab-regime').value='CLT';
  document.getElementById('colab-admissao').value=new Date().toISOString().split('T')[0];
  await popularClientesColab();
  openM('m-colaborador');
}

async function saveColaborador(){
  const id=document.getElementById('colab-id')?.value||'';
  const nome=document.getElementById('colab-nome')?.value.trim()||'';
  const cpf=document.getElementById('colab-cpf')?.value.trim()||'';
  const cargo=document.getElementById('colab-cargo')?.value.trim()||'';
  const regime=document.getElementById('colab-regime')?.value||'CLT';
  const salario=parseFloat(document.getElementById('colab-salario')?.value||'0')||0;
  const admissao=document.getElementById('colab-admissao')?.value||'';
  const clienteId=document.getElementById('colab-cliente')?.value||null;
  const email=document.getElementById('colab-email')?.value.trim()||'';

  if(!nome){toast('⚠️ Informe o nome do colaborador');return;}
  if(!cargo){toast('⚠️ Informe o cargo');return;}
  if(!salario){toast('⚠️ Informe o salário bruto');return;}

  const obj={
    nome,cpf,cargo,regime_cont:regime,
    salario_bruto:salario,
    data_admissao:admissao||null,
    cliente_id:clienteId||null,
    email:email||null,
    escritorio_id:escritorioId
  };

  let error;
  if(id){
    ({error}=await sb.from('colaboradores').update(obj).eq('id',id));
  } else {
    ({error}=await sb.from('colaboradores').insert(obj));
  }
  if(error){toast('❌ '+error.message);return;}
  toast(id?'✅ Colaborador atualizado!':'✅ Colaborador cadastrado!');
  closeM('m-colaborador');
  await loadFolha();
  await loadDashboard();
}

async function editColaborador(id){
  const {data:c}=await sb.from('colaboradores').select('*').eq('id',id).single();
  if(!c)return;
  document.getElementById('colab-id').value=c.id;
  document.getElementById('m-colab-titulo').textContent='Editar Colaborador';
  document.getElementById('colab-nome').value=c.nome||'';
  document.getElementById('colab-cpf').value=c.cpf||'';
  document.getElementById('colab-cargo').value=c.cargo||'';
  document.getElementById('colab-regime').value=c.regime_cont||'CLT';
  document.getElementById('colab-salario').value=c.salario_bruto||'';
  document.getElementById('colab-admissao').value=c.data_admissao||'';
  document.getElementById('colab-email').value=c.email||'';
  await popularClientesColab(c.cliente_id||'');
  openM('m-colaborador');
}

async function deleteColaborador(id,nome){
  if(!confirm(`Excluir o colaborador "${nome}"?`))return;
  const {error}=await sb.from('colaboradores').delete().eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  toast('🗑 Colaborador excluído');
  await loadFolha();
  await loadDashboard();
}
