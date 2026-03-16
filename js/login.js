// CURSOR
const cur=document.getElementById('cursor'),ring=document.getElementById('cursorRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function raf(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(raf);})();

// SUPABASE
const SUPA_URL='https://qyjpuisuwaroftoilrvc.supabase.co';
const SUPA_KEY='sb_publishable_17OQIf-VNA-yFWUh7FfqNQ_5zZ9Nh8y';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);

sb.auth.getSession().then(({data:{session}})=>{
  if(session) window.location.href='dashboard.html';
});

// GSAP
gsap.from('#leftPanel',{x:-40,opacity:0,duration:0.8,ease:'power3.out'});
gsap.from('#brand',{y:-20,opacity:0,duration:0.5,delay:0.3,ease:'power2.out'});
gsap.from('#heroContent .hero-badge',{x:-20,opacity:0,duration:0.5,delay:0.5,ease:'power2.out'});
gsap.from('#heroContent .hero-title',{y:24,opacity:0,duration:0.7,delay:0.6,ease:'power2.out'});
gsap.from('#heroContent .hero-desc',{y:16,opacity:0,duration:0.5,delay:0.75,ease:'power2.out'});
gsap.from('#heroContent .feat',{x:-16,opacity:0,duration:0.4,delay:0.85,stagger:0.08,ease:'power2.out'});
gsap.from('#leftBottom',{y:14,opacity:0,duration:0.4,delay:1.1,ease:'power2.out'});
gsap.from('#formCard',{x:30,opacity:0,duration:0.7,delay:0.25,ease:'power3.out'});

function switchView(v){
  const current=document.querySelector('.view.active');
  gsap.to(current,{opacity:0,y:-12,duration:0.2,ease:'power2.in',onComplete:()=>{
    document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
    const next=document.getElementById('view-'+v);
    next.classList.add('active');
    gsap.fromTo(next,{opacity:0,y:16},{opacity:1,y:0,duration:0.35,ease:'power2.out'});
  }});
}
function togglePwd(id,btn){
  const inp=document.getElementById(id);
  if(inp.type==='password'){inp.type='text';btn.innerHTML='<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="2"/></svg>';}
  else{inp.type='password';btn.innerHTML='<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';}
}
function checkStrength(val){
  const wrap=document.getElementById('pwd-strength'),lbl=document.getElementById('strength-txt');
  wrap.classList.toggle('show',val.length>0);if(!val)return;
  let s=0;if(val.length>=8)s++;if(/[A-Z]/.test(val))s++;if(/[0-9]/.test(val))s++;if(/[^A-Za-z0-9]/.test(val))s++;
  const colors=['#d94040','#e87d1a','#e8c91a','#1a7a4a'];
  const labels=['Muito fraca','Fraca','Boa','Forte 🔒'];
  ['sb1','sb2','sb3','sb4'].forEach((id,i)=>{document.getElementById(id).style.background=i<s?colors[s-1]:'var(--border)';});
  lbl.textContent=labels[s-1]||'';
}
let selectedPlan='pro';
function selectPlan(plan){
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('plan-'+plan).classList.add('selected');
  selectedPlan=plan;
}
function nextStep(to){
  for(let i=1;i<=3;i++){
    const s=document.getElementById('step-'+i),dot=s.querySelector('.step-dot');
    s.classList.remove('active','done');
    if(i<to){s.classList.add('done');dot.textContent='✓';}
    else if(i===to){s.classList.add('active');dot.textContent=i;}
    else dot.textContent=i;
    if(i<3)document.getElementById('line-'+i).classList.toggle('done',i<to);
  }
  for(let i=1;i<=3;i++){
    const el=document.getElementById('reg-step-'+i);
    if(i===to){el.style.display='block';gsap.fromTo(el,{opacity:0,y:14},{opacity:1,y:0,duration:0.35,ease:'power2.out'});}
    else el.style.display='none';
  }
}
async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pwd=document.getElementById('login-pwd').value;
  let ok=true;
  ['login-email-err','login-pwd-err'].forEach(id=>document.getElementById(id).classList.remove('show'));
  ['login-email','login-pwd'].forEach(id=>document.getElementById(id).classList.remove('error'));
  if(!email||!/\S+@\S+\.\S+/.test(email)){document.getElementById('login-email-err').classList.add('show');document.getElementById('login-email').classList.add('error');ok=false;}
  if(!pwd||pwd.length<4){document.getElementById('login-pwd-err').classList.add('show');document.getElementById('login-pwd').classList.add('error');ok=false;}
  if(!ok)return;
  const btn=document.getElementById('loginBtn');
  btn.classList.add('loading');
  const {error}=await sb.auth.signInWithPassword({email,password:pwd});
  btn.classList.remove('loading');
  if(error){
    const msg=error.message.includes('Invalid')?'E-mail ou senha incorretos':error.message;
    document.getElementById('login-pwd-err').textContent=msg;
    document.getElementById('login-pwd-err').classList.add('show');
    document.getElementById('login-pwd').classList.add('error');
  } else window.location.href='dashboard.html';
}
async function doRegister(){
  if(!document.getElementById('terms').checked){showToast('⚠️ Aceite os termos de uso');return;}
  const email=document.getElementById('reg-email').value.trim();
  const pwd=document.getElementById('reg-pwd').value;
  const nome=document.getElementById('reg-nome').value.trim();
  const sob=document.getElementById('reg-sobrenome').value.trim();
  const escr=document.getElementById('reg-escritorio')?.value.trim()||'';
  if(!email||!pwd||!nome){showToast('⚠️ Preencha nome, e-mail e senha');return;}
  const btn=document.getElementById('finishBtn');btn.classList.add('loading');
  const {data,error}=await sb.auth.signUp({email,password:pwd,options:{data:{nome_completo:`${nome} ${sob}`.trim(),plano:selectedPlan}}});
  btn.classList.remove('loading');
  if(error){showToast('❌ '+error.message);return;}
  if(data.user){await sb.from('escritorios').insert({user_id:data.user.id,nome:escr||`${nome} ${sob}`.trim(),plano:selectedPlan,email});}
  switchView('success');
}
async function doForgot(){
  const email=document.getElementById('forgot-email').value.trim();
  if(!email||!/\S+@\S+\.\S+/.test(email)){showToast('⚠️ Digite um e-mail válido');return;}
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/login.html'});
  if(error){showToast('❌ '+error.message);return;}
  switchView('forgot-ok');
}
function goToDashboard(){
  const btn=document.querySelector('#view-success .btn-submit');
  btn.classList.add('loading');
  setTimeout(()=>window.location.href='dashboard.html',1400);
}
async function loginOAuth(provider){
  await sb.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+'/dashboard.html'}});
}
let toastTimer;
function showToast(msg){
  const el=document.getElementById('toastEl');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const active=document.querySelector('.view.active');
  if(active.id==='view-login')doLogin();
  else if(active.id==='view-forgot')doForgot();
});
