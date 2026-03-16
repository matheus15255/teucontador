gsap.registerPlugin(ScrollTrigger);

// CURSOR
const cur=document.getElementById('cursor'),ring=document.getElementById('cursorRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function ar(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(ar);})();

window.addEventListener('scroll',()=>document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>60));

gsap.timeline({delay:0.1})
  .from('nav',{y:-30,opacity:0,duration:.6,ease:'power2.out'})
  .from('.hero-badge',{y:20,opacity:0,duration:.5,ease:'power2.out'},'-=.2')
  .from('#heroTitle',{y:40,opacity:0,duration:.8,ease:'power3.out'},'-=.3')
  .from('.hero-desc',{y:20,opacity:0,duration:.5,ease:'power2.out'},'-=.4')
  .from('.hero-actions',{y:20,opacity:0,duration:.5,ease:'power2.out'},'-=.3')
  .from('.hero-stats',{y:20,opacity:0,duration:.5,ease:'power2.out'},'-=.3');

document.querySelectorAll('.reveal').forEach(el=>{
  ScrollTrigger.create({trigger:el,start:'top 88%',onEnter:()=>el.classList.add('in')});
});

document.querySelectorAll('.stat-num[data-val]').forEach(el=>{
  const target=parseInt(el.dataset.val),suffix=el.dataset.suffix||'';
  ScrollTrigger.create({trigger:el,start:'top 85%',once:true,onEnter:()=>{
    const obj={v:0};
    gsap.to(obj,{v:target,duration:2,ease:'power2.out',onUpdate:()=>{
      const v=Math.round(obj.v);
      el.textContent=v>=1000?(v/1000).toFixed(v>=10000?0:1)+'K'+suffix:v+suffix;
    }});
  }});
});

function scrollToLogin(){window.location.href='login.html';}
function scrollToRegister(){window.location.href='login.html';}
function toggleFaq(el){
  const item=el.closest('.faq-item'),was=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f=>f.classList.remove('open'));
  if(!was)item.classList.add('open');
}
let toastT;
function showToast(msg){const el=document.getElementById('toastEl');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2800);}
