/* =====================================================
   STORAGE KEY + HELPERS
   JSON array: [{id,category,location,datetime,description,technicianName,status:"Pending",timestamp,amount}]
===================================================== */
const STORAGE_KEY = 'repairbuddy_bookings';
let bookingFilter = 'all';
let bookingIdCounter = 1;

function getBookings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e) { return []; }
}
function saveBookings(b) { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); }
function devReset() {
  if(confirm('âš  Clear all Repair Buddy data?')) {
    localStorage.clear(); renderDashboard(); alert('Data cleared.');
  }
}

// ===== NEXT BOOKING ID =====
function getNextId() {
  const bk = getBookings();
  if(!bk.length) return 'RB-0001';
  const maxNum = bk.reduce((m,b) => {
    const n = parseInt(b.id.replace('RB-','')) || 0;
    return Math.max(m, n);
  }, 0);
  return 'RB-' + String(maxNum+1).padStart(4,'0');
}

/* =====================================================
   TECHNICIAN DATA
===================================================== */
const TECHNICIANS = [
  { name:'Ramesh Kumar',  avatar:'ðŸ‘·', rating:4.9, jobs:847, eta:22, exp:'9yr' },
  { name:'Suresh Patel',  avatar:'ðŸ§‘â€ðŸ”§', rating:4.8, jobs:623, eta:18, exp:'6yr' },
  { name:'Vikram Singh',  avatar:'ðŸ‘¨â€ðŸ”§', rating:4.9, jobs:1102, eta:25, exp:'11yr' },
  { name:'Rajesh Gupta',  avatar:'ðŸ”§', rating:4.7, jobs:534, eta:30, exp:'7yr' },
  { name:'Arun Sharma',   avatar:'âš™ï¸', rating:4.8, jobs:789, eta:20, exp:'8yr' },
  { name:'Manoj Yadav',   avatar:'ðŸ› ï¸', rating:4.6, jobs:412, eta:28, exp:'5yr' },
];
const BASE_PRICES = {
  'AC Repair':299, 'Refrigerator':249, 'Washing Machine':349,
  'Plumbing':199, 'Electrical':249, 'Geyser':279
};

/* =====================================================
   CUSTOM CURSOR
===================================================== */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; curDot.style.cssText+=`;left:${mx}px;top:${my}px`; });
(function curLoop(){
  rx += (mx-rx)*.12; ry += (my-ry)*.12;
  curRing.style.left=rx+'px'; curRing.style.top=ry+'px';
  requestAnimationFrame(curLoop);
})();
document.querySelectorAll('button,a,select,input,textarea,.service-card,.why-card,.review-card,.booking-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('chover'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('chover'));
});

// Wrench trail
let lastT=0;
document.addEventListener('mousemove',e=>{
  const now=Date.now();
  if(now-lastT>70){ createTrail(e.clientX,e.clientY); lastT=now; }
});
function createTrail(x,y){
  const d=document.createElement('div');
  d.textContent='ðŸ”§';
  d.style.cssText=`position:fixed;left:${x}px;top:${y}px;font-size:.7rem;pointer-events:none;z-index:9990;transform:translate(-50%,-50%);`;
  document.body.appendChild(d);
  gsap.to(d,{opacity:0,scale:0,duration:.5,ease:'power2.out',onComplete:()=>d.remove()});
}

/* =====================================================
   BURST CANVAS
===================================================== */
const bc=document.getElementById('burst-canvas');
const bx=bc.getContext('2d');
bc.width=window.innerWidth; bc.height=window.innerHeight;
window.addEventListener('resize',()=>{bc.width=window.innerWidth;bc.height=window.innerHeight;});
let bps=[];
document.addEventListener('click',e=>burst(e.clientX,e.clientY,'#F97316',18));
function burst(x,y,col,n){
  for(let i=0;i<n;i++){
    const a=(Math.PI*2/n)*i+Math.random()*.5;
    const s=2+Math.random()*7;
    bps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:.025+Math.random()*.02,size:2+Math.random()*4,col});
  }
}
(function bLoop(){
  bx.clearRect(0,0,bc.width,bc.height);
  bps=bps.filter(p=>p.life>0);
  bps.forEach(p=>{
    bx.save(); bx.globalAlpha=p.life; bx.fillStyle=p.col;
    bx.shadowBlur=8; bx.shadowColor=p.col;
    bx.beginPath(); bx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); bx.fill(); bx.restore();
    p.x+=p.vx; p.y+=p.vy; p.vy+=.1; p.vx*=.98; p.life-=p.decay;
  });
  requestAnimationFrame(bLoop);
})();

/* =====================================================
   SCROLL PROGRESS
===================================================== */
window.addEventListener('scroll',()=>{
  const t=document.documentElement.scrollTop;
  const h=document.documentElement.scrollHeight-window.innerHeight;
  document.getElementById('sprogress').style.width=(t/h*100)+'%';
});

/* =====================================================
   THREE.JS HERO â€” 3D Neighborhood with Repair Icons
===================================================== */
(function(){
  const canvas=document.getElementById('hero-canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x0A1628,.015);
  const camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,.1,500);
  camera.position.set(0,10,35);
  camera.lookAt(0,2,0);
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });

  // Lighting
  scene.add(new THREE.AmbientLight(0x0a1628,3));
  const ol=new THREE.PointLight(0xF97316,4,60); ol.position.set(-10,15,5); scene.add(ol);
  const bl=new THREE.PointLight(0x0EA5E9,2.5,50); bl.position.set(10,12,-5); scene.add(bl);
  const wl=new THREE.PointLight(0xffffff,1,40); wl.position.set(0,5,15); scene.add(wl);

  // Ground
  const gMesh=new THREE.Mesh(
    new THREE.PlaneGeometry(200,200,30,30),
    new THREE.MeshLambertMaterial({color:0x0A1628,wireframe:true,opacity:.2,transparent:true})
  );
  gMesh.rotation.x=-Math.PI/2; gMesh.position.y=-2; scene.add(gMesh);

  // Street grid
  const roadMat=new THREE.MeshLambertMaterial({color:0x0F172A,emissive:0x0F172A,emissiveIntensity:.5});
  const mkRoad=(w,h,x,z)=>{
    const r=new THREE.Mesh(new THREE.BoxGeometry(w,.02,h),roadMat);
    r.position.set(x,-.5,z); scene.add(r);
  };
  mkRoad(60,.02,-2,0); mkRoad(60,.02,0,-5); mkRoad(.02,60,0,0); mkRoad(.02,60,8,0);

  // Houses
  const houseMat=(c)=>new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:.08});
  const mkHouse=(x,z,h,c)=>{
    const body=new THREE.Mesh(new THREE.BoxGeometry(5,h,5),houseMat(c));
    body.position.set(x,h/2-2,z); scene.add(body);
    // Roof
    const roof=new THREE.Mesh(new THREE.ConeGeometry(4,2,4),houseMat(0x1E293B));
    roof.position.set(x,h-2+.9,z); roof.rotation.y=Math.PI/4; scene.add(roof);
    // Window lights
    for(let i=0;i<4;i++){
      const wm=new THREE.Mesh(
        new THREE.BoxGeometry(.8,.6,.1),
        new THREE.MeshBasicMaterial({color:Math.random()>.4?0xF97316:0x0EA5E9,transparent:true,opacity:.7+Math.random()*.3})
      );
      wm.position.set(x+(Math.random()-.5)*3, (Math.random()-.3)*h*.4, z+2.55);
      scene.add(wm);
      setInterval(()=>{wm.material.opacity=.4+Math.random()*.6;},800+Math.random()*2000);
    }
    // Edge lines
    const eg=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5,h,5)),
      new THREE.LineBasicMaterial({color:0x334155,opacity:.3,transparent:true}));
    eg.position.copy(body.position); scene.add(eg);
    return body;
  };
  mkHouse(-18,-8,8,0x0D1A30); mkHouse(-10,-10,10,0x0A1520);
  mkHouse(0,-12,12,0x0D1A30); mkHouse(10,-8,7,0x0A1520);
  mkHouse(18,-10,9,0x0D1A30); mkHouse(-24,-2,7,0x08121E);
  mkHouse(24,-6,8,0x0D1A30); mkHouse(-6,-4,6,0x0A1520);
  mkHouse(6,-3,7,0x0D1A30);

  // Floating repair icons (beacons)
  const beacons=[];
  const mkBeacon=(x,y,z)=>{
    const g=new THREE.OctahedronGeometry(.35);
    const m=new THREE.MeshBasicMaterial({color:0xF97316,transparent:true,opacity:.9});
    const mesh=new THREE.Mesh(g,m); mesh.position.set(x,y,z); scene.add(mesh);
    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(.7,.05,8,24),
      new THREE.MeshBasicMaterial({color:0xF97316,transparent:true,opacity:.35})
    );
    ring.position.set(x,y,z); scene.add(ring);
    // Glow sphere
    const glow=new THREE.Mesh(
      new THREE.SphereGeometry(1,12,12),
      new THREE.MeshBasicMaterial({color:0xF97316,transparent:true,opacity:.05,side:THREE.BackSide})
    );
    glow.position.set(x,y,z); scene.add(glow);
    beacons.push({mesh,ring,glow,base:y,phase:Math.random()*Math.PI*2});
  };
  mkBeacon(-18,4,-8); mkBeacon(0,8,-12); mkBeacon(18,5,-10);
  mkBeacon(-10,3,-4); mkBeacon(10,6,-3); mkBeacon(6,4,0);

  // Service request particles
  const pCount=250;
  const pPos=new Float32Array(pCount*3);
  for(let i=0;i<pCount;i++){
    pPos[i*3]=(Math.random()-.5)*70;
    pPos[i*3+1]=(Math.random()-.5)*25;
    pPos[i*3+2]=(Math.random()-.5)*50;
  }
  const pGeo=new THREE.BufferGeometry();
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  const pts=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xF97316,size:.14,transparent:true,opacity:.5}));
  scene.add(pts);

  // Stars
  const sPos=new Float32Array(400*3);
  for(let i=0;i<400;i++){
    sPos[i*3]=(Math.random()-.5)*180; sPos[i*3+1]=Math.random()*50+5; sPos[i*3+2]=(Math.random()-.5)*150;
  }
  const sGeo=new THREE.BufferGeometry();
  sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
  scene.add(new THREE.Points(sGeo,new THREE.PointsMaterial({color:0x0EA5E9,size:.09,transparent:true,opacity:.45})));

  // Animate
  let t=0;
  (function anim(){
    requestAnimationFrame(anim); t+=.01;
    const scroll=window.scrollY/Math.max(1,document.getElementById('hero').offsetHeight);
    camera.position.x=Math.sin(t*.08)*4+scroll*12;
    camera.position.y=10+Math.cos(t*.07)*.8-scroll*4;
    camera.position.z=35-scroll*12;
    camera.lookAt(0,scroll*3,0);
    beacons.forEach(b=>{
      b.mesh.position.y=b.base+Math.sin(t*1.3+b.phase)*.7;
      b.mesh.rotation.y=t*1.5;
      b.ring.position.y=b.mesh.position.y;
      b.ring.rotation.x=t*.9; b.ring.rotation.z=t*.6;
      b.glow.position.y=b.mesh.position.y;
      b.mesh.material.opacity=.6+Math.sin(t*2+b.phase)*.35;
      b.glow.material.opacity=.03+Math.sin(t*2+b.phase)*.04;
    });
    ol.intensity=3+Math.sin(t*2.5)*1.5;
    pts.rotation.y=t*.015;
    renderer.render(scene,camera);
  })();
})();

/* =====================================================
   TRACKING CANVAS â€” animated technician route map
===================================================== */
(function(){
  const canvas=document.getElementById('tracking-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  // Route path points
  const route=[
    {x:80,y:80},{x:200,y:80},{x:200,y:180},{x:380,y:180},
    {x:380,y:280},{x:500,y:280},{x:580,y:340}
  ];
  // Customer home
  const home={x:580,y:340};
  let progress=0;

  function drawMap(){
    // Background
    ctx.fillStyle='#0A1628'; ctx.fillRect(0,0,W,H);
    // Grid lines (street simulation)
    ctx.strokeStyle='rgba(14,165,233,0.1)'; ctx.lineWidth=1;
    for(let gx=0;gx<W;gx+=50){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(let gy=0;gy<H;gy+=50){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

    // Buildings (rectangles)
    const blds=[
      {x:50,y:100,w:100,h:60},{x:220,y:40,w:80,h:60},
      {x:300,y:200,w:60,h:70},{x:440,y:100,w:100,h:60},
      {x:100,y:240,w:80,h:70},{x:440,y:230,w:60,h:40},
    ];
    ctx.fillStyle='rgba(15,23,42,0.9)';
    ctx.strokeStyle='rgba(14,165,233,0.15)'; ctx.lineWidth=1;
    blds.forEach(b=>{
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,6);
      ctx.fill(); ctx.stroke();
      // windows
      for(let i=0;i<3;i++){
        for(let j=0;j<2;j++){
          ctx.fillStyle=Math.random()>.5?'rgba(249,115,22,0.5)':'rgba(14,165,233,0.4)';
          ctx.fillRect(b.x+8+i*30,b.y+8+j*25,14,10);
        }
      }
    });

    // Route path (full grey)
    ctx.beginPath(); ctx.moveTo(route[0].x,route[0].y);
    route.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(100,116,139,0.4)'; ctx.lineWidth=4; ctx.setLineDash([8,6]);
    ctx.stroke(); ctx.setLineDash([]);

    // Route path (progress â€” orange)
    const totalLen=route.reduce((s,p,i)=>{
      if(!i)return 0;
      const pp=route[i-1];
      return s+Math.hypot(p.x-pp.x,p.y-pp.y);
    },0);
    let drawn=0, done=totalLen*progress;
    ctx.beginPath(); ctx.moveTo(route[0].x,route[0].y);
    for(let i=1;i<route.length;i++){
      const seg=Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);
      if(drawn+seg<=done){
        ctx.lineTo(route[i].x,route[i].y); drawn+=seg;
      } else {
        const rem=done-drawn, frac=rem/seg;
        ctx.lineTo(route[i-1].x+(route[i].x-route[i-1].x)*frac,
                   route[i-1].y+(route[i].y-route[i-1].y)*frac);
        break;
      }
    }
    ctx.strokeStyle='#F97316'; ctx.lineWidth=4; ctx.setLineDash([]);
    ctx.shadowBlur=10; ctx.shadowColor='#F97316'; ctx.stroke(); ctx.shadowBlur=0;

    // Technician dot
    let tdist=totalLen*progress, tDrawn=0, techPos=route[0];
    for(let i=1;i<route.length;i++){
      const seg=Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);
      if(tDrawn+seg<=tdist){ tDrawn+=seg; techPos=route[i]; }
      else {
        const frac=(tdist-tDrawn)/seg;
        techPos={x:route[i-1].x+(route[i].x-route[i-1].x)*frac,
                 y:route[i-1].y+(route[i].y-route[i-1].y)*frac};
        break;
      }
    }
    // Technician glow
    const tg=ctx.createRadialGradient(techPos.x,techPos.y,0,techPos.x,techPos.y,20);
    tg.addColorStop(0,'rgba(249,115,22,0.4)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(techPos.x,techPos.y,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#F97316'; ctx.beginPath(); ctx.arc(techPos.x,techPos.y,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('ðŸ”§',techPos.x,techPos.y);

    // Home beacon (pulsing)
    const pScale=.5+.5*Math.sin(Date.now()*.003);
    const hg=ctx.createRadialGradient(home.x,home.y,0,home.x,home.y,25+pScale*15);
    hg.addColorStop(0,'rgba(52,211,153,0.5)'); hg.addColorStop(1,'transparent');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(home.x,home.y,25+pScale*15,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#34D399'; ctx.beginPath(); ctx.arc(home.x,home.y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('ðŸ ',home.x,home.y);

    // Labels
    ctx.fillStyle='rgba(249,115,22,0.9)'; ctx.font='bold 11px Poppins,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('ðŸ”§ Technician',techPos.x,techPos.y+14);
    ctx.fillStyle='rgba(52,211,153,0.9)';
    ctx.fillText('ðŸ  Your Home',home.x,home.y+14);

    progress+=.001;
    if(progress>=1) progress=0;
    requestAnimationFrame(drawMap);
  }
  drawMap();

  // ETA countdown
  let etaSecs=12*60+34;
  setInterval(()=>{
    if(etaSecs>0) etaSecs--;
    const m=Math.floor(etaSecs/60), s=etaSecs%60;
    const el=document.getElementById('track-eta');
    if(el) el.textContent=m+':'+(s<10?'0':'')+s;
    if(etaSecs<=0) etaSecs=15*60;
  },1000);
})();

/* =====================================================
   LENIS SMOOTH SCROLL
===================================================== */
gsap.registerPlugin(ScrollTrigger);
const lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
gsap.ticker.add(t=>lenis.raf(t*1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll',ScrollTrigger.update);

// Scroll utility
function navScrollTo(sel){
  const el=document.querySelector(sel);
  if(el) lenis.scrollTo(el,{offset:-80,duration:1.5});
  burst(window.innerWidth/2,window.innerHeight/2,'#F97316',15);
}

/* =====================================================
   GSAP ANIMATIONS â€” Hero entrance
===================================================== */
const heroTL=gsap.timeline({delay:.3});
heroTL
  .from('.hero-badge',  {opacity:0,y:20,duration:.6,ease:'power3.out'})
  .from('.hero-h1',     {opacity:0,y:30,duration:.9,ease:'power3.out'},'<.1')
  .from('.hero-problem',{opacity:0,y:20,duration:.7,ease:'power3.out'},'<.2')
  .from('.hero-btns',   {opacity:0,y:20,duration:.6,ease:'power3.out'},'<.15')
  .from('.hero-counters',{opacity:0,y:20,duration:.6,ease:'power3.out'},'<.1')
  .from('.scroll-ind',  {opacity:0,duration:.4},'<.1');

// SplitType hero headline
try {
  const split=new SplitType('#hero-h1',{types:'chars'});
  gsap.from(split.chars,{opacity:0,y:50,stagger:.025,duration:.55,ease:'power4.out',delay:.4});
} catch(e){}

// Hero counters
function animCount(el,target,dur,decimals){
  let v=0,step=target/(dur/16);
  const t=setInterval(()=>{
    v=Math.min(v+step,target);
    el.textContent=decimals?v.toFixed(1):Math.round(v).toLocaleString();
    if(v>=target)clearInterval(t);
  },16);
}
setTimeout(()=>{
  animCount(document.getElementById('c1'),10000,2500,false);
  animCount(document.getElementById('c2'),4.9,1500,true);
  animCount(document.getElementById('c4'),500,2000,false);
},1800);

/* =====================================================
   SCROLL ANIMATIONS
   All use gsap.from() â€” elements are VISIBLE by default,
   GSAP animates them IN when scrolled into view.
   onEnter only fires once (once:true).
===================================================== */
function revealST(trigger, targets, fromVars, stagger){
  ScrollTrigger.create({
    trigger, start:'top 80%', once:true,
    onEnter:()=>{
      gsap.from(targets, Object.assign({
        duration:.7, ease:'power3.out',
        stagger: stagger||0,
        clearProps:'all'   // remove inline styles after animation so CSS takes over
      }, fromVars));
    }
  });
}

// Section 2 â€” Problem
revealST('#problem', '.section-badge',  {opacity:0,y:20},0);
revealST('#problem', '.section-h2',     {opacity:0,y:30},0);
revealST('#problem', '.pain-icon',      {opacity:0,y:30},.1);
revealST('#problem', '.prob-box',       {opacity:0,y:40},.15);

// Section 3 â€” How It Works
revealST('#howitworks', '.step-card',   {opacity:0,y:40},.12);

// Section 4 â€” Booking form (light, just a subtle slide)
revealST('#booking', '#booking-form-card', {opacity:0,y:25},0);

// Section 5 â€” Dashboard
ScrollTrigger.create({trigger:'#dashboard', start:'top 80%', once:true,
  onEnter:()=>{ renderDashboard(); }
});

// Section 6 â€” Tracking
revealST('#tracking', '.tracking-side', {opacity:0,x:30},0);

// Section 7 â€” Services
revealST('#services', '.service-card',  {opacity:0,y:30},.1);

// Section 8 â€” Why Choose
revealST('#why', '.why-card',           {opacity:0,y:30},.1);

// Section 9 â€” Impact (count-up on enter)
ScrollTrigger.create({trigger:'#impact', start:'top 80%', once:true,
  onEnter:()=>{
    gsap.from('.impact-card',{opacity:0,scale:.85,duration:.65,stagger:.1,ease:'back.out(1.5)',clearProps:'all'});
    document.querySelectorAll('.ic').forEach(el=>{
      const t=parseInt(el.dataset.t);
      const div=el.dataset.div?parseInt(el.dataset.div):1;
      animCount(el,t/div,2000,div>1);
    });
  }
});

// Section 11 â€” Outro
ScrollTrigger.create({trigger:'#outro', start:'top 80%', once:true,
  onEnter:()=>{
    gsap.from(['.outro-h2','.outro-sub','.outro-btns','.trust-badges'],
      {opacity:0,y:30,duration:.7,stagger:.15,ease:'power3.out',clearProps:'all'});
    setTimeout(()=>{
      for(let i=0;i<4;i++) setTimeout(()=>{
        burst(window.innerWidth/2+(Math.random()-.5)*300,window.innerHeight/2,'#F97316',20);
        burst(window.innerWidth/2+(Math.random()-.5)*300,window.innerHeight/2,'#0EA5E9',12);
      },i*150);
    },400);
  }
});

// Parallax hero content
window.addEventListener('scroll',()=>{
  const y=window.scrollY,h=document.getElementById('hero').offsetHeight;
  const hc=document.querySelector('.hero-content');
  if(hc&&y<h){ hc.style.transform=`translateY(${y*.22}px)`; hc.style.opacity=1-(y/(h*.8)); }
});

/* =====================================================
   FORM LOGIC
===================================================== */
let selCategory='', selTimeSlot='';

function selCat(pill){
  document.querySelectorAll('.cat-pill').forEach(p=>p.classList.remove('active'));
  pill.classList.add('active');
  selCategory=pill.dataset.cat;
  document.getElementById('f-category').value=selCategory;
  burst(pill.getBoundingClientRect().left+pill.offsetWidth/2,
        pill.getBoundingClientRect().top+pill.offsetHeight/2,'#F97316',8);
}
function selSlot(btn){
  document.querySelectorAll('.time-slot').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selTimeSlot=btn.dataset.slot;
  document.getElementById('f-timeslot').value=selTimeSlot;
}

document.getElementById('f-description').addEventListener('input',function(){
  document.getElementById('desc-count').textContent=this.value.length;
});

// Set default date
(()=>{ const d=new Date(); d.setDate(d.getDate()+1);
  document.getElementById('f-date').value=d.toISOString().split('T')[0]; })();

/* =====================================================
   SUBMIT BOOKING
   Saves to localStorage as: [{id,category,location,datetime,description,technicianName,status:"Pending",timestamp,amount}]
===================================================== */
function submitBooking(e){
  e.preventDefault();
  const cat=document.getElementById('f-category').value;
  const loc=document.getElementById('f-location').value.trim();
  const date=document.getElementById('f-date').value;
  const slot=selTimeSlot;
  const desc=document.getElementById('f-description').value.trim();

  if(!cat){ shakeCard('Select a service category!'); return; }
  if(!loc){ shakeCard('Enter your address!'); document.getElementById('f-location').focus(); return; }
  if(!date){ shakeCard('Pick a date!'); return; }
  if(!slot){ shakeCard('Choose a time slot!'); return; }
  if(!desc||desc.length<5){ shakeCard('Describe the issue briefly!'); document.getElementById('f-description').focus(); return; }

  // Pick random technician
  const tech=TECHNICIANS[Math.floor(Math.random()*TECHNICIANS.length)];
  const basePrice=BASE_PRICES[cat]||299;
  const gst=Math.round(basePrice*.18);
  const total=basePrice+gst;
  const id=getNextId();
  const datetime=date+' | '+slot;

  // BOOKING OBJECT â€” exact structure
  const booking={
    id,
    category:cat,
    location:loc,
    datetime,
    description:desc,
    technicianName:tech.name,
    status:'Pending',   // Initial status
    timestamp:new Date().toISOString(),
    amount:total
  };

  // Save to localStorage
  const bks=getBookings();
  bks.unshift(booking);
  saveBookings(bks);

  // === FORCE SHOW booking-right panel (in case ScrollTrigger hasn't fired) ===
  const bRight=document.getElementById('booking-right');
  bRight.style.opacity='1';
  bRight.style.transform='none';

  // === SHOW TECHNICIAN CARD ===
  document.getElementById('bright-placeholder').style.display='none';
  const tc=document.getElementById('tech-card');
  tc.style.display='block';
  tc.style.opacity='0';
  gsap.to(tc,{opacity:1,y:0,duration:.6,ease:'back.out(1.4)'});
  gsap.from(tc,{y:30,duration:.6});

  document.getElementById('tech-name').textContent=tech.name;
  document.getElementById('tech-avatar').textContent=tech.avatar;
  document.getElementById('tech-rating').textContent=tech.rating;
  document.getElementById('tech-jobs').textContent=tech.jobs;
  document.getElementById('tech-stars').textContent='â˜…'.repeat(Math.floor(tech.rating))+'â˜†'.repeat(5-Math.floor(tech.rating));

  // ETA Countdown
  let etaS=tech.eta*60;
  const etaEl=document.getElementById('eta-countdown');
  const etaInt=setInterval(()=>{
    if(etaS>0) etaS--;
    const m=Math.floor(etaS/60), s=etaS%60;
    etaEl.textContent=m+':'+(s<10?'0':'')+s;
    if(etaS<=0){ clearInterval(etaInt); etaEl.textContent='ARRIVED!'; }
  },1000);
  etaEl.textContent=tech.eta+':00';

  // === SHOW INVOICE CARD ===
  const ic=document.getElementById('invoice-card');
  ic.style.display='block';
  ic.style.opacity='0';
  gsap.to(ic,{opacity:1,duration:.6,delay:.3,ease:'power3.out'});
  gsap.from(ic,{y:20,duration:.6,delay:.3});

  document.getElementById('inv-id').textContent=id;
  document.getElementById('inv-service').textContent=cat;
  document.getElementById('inv-location').textContent=loc.length>25?loc.substring(0,25)+'...':loc;
  document.getElementById('inv-datetime').textContent=datetime;
  document.getElementById('inv-tech').textContent=tech.name;
  document.getElementById('inv-base').textContent='â‚¹'+basePrice;
  document.getElementById('inv-gst').textContent='â‚¹'+gst;
  document.getElementById('inv-total').textContent='â‚¹'+total;

  // Track tech name update
  document.getElementById('track-tech-name').textContent=tech.name;

  // === PARTICLE BURST (orange on submit) ===
  burst(window.innerWidth/2,window.innerHeight/2,'#F97316',50);
  burst(window.innerWidth/2,window.innerHeight/2,'#F59E0B',30);
  setTimeout(()=>burst(window.innerWidth/2,window.innerHeight/2,'#34D399',20),200);

  // Audio feedback (Web Audio API)
  playConfirmChime();

  // === SUCCESS STATE ===
  gsap.to('#bform-fields',{opacity:0,y:-20,duration:.3,ease:'power2.in',onComplete:()=>{
    document.getElementById('bform-fields').style.display='none';
    const succ=document.getElementById('bform-success');
    succ.style.display='block';
    gsap.from(succ,{opacity:0,scale:.9,duration:.5,ease:'back.out(1.5)'});
  }});

  // Refresh dashboard
  renderDashboard();
}

function shakeCard(msg){
  gsap.to('#booking-form-card',{keyframes:{x:[-10,10,-8,8,-5,0]},duration:.35});
  alert('âš  '+msg);
}

function resetBookingForm(){
  document.getElementById('bform-fields').style.display='block';
  document.getElementById('bform-success').style.display='none';
  document.getElementById('f-category').value='';
  document.getElementById('f-location').value='';
  document.getElementById('f-description').value='';
  document.getElementById('desc-count').textContent='0';
  document.querySelectorAll('.cat-pill').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.time-slot').forEach(b=>b.classList.remove('active'));
  selCategory=''; selTimeSlot='';
  document.getElementById('f-timeslot').value='';
  document.getElementById('bright-placeholder').style.display='flex';
  document.getElementById('tech-card').style.display='none';
  document.getElementById('invoice-card').style.display='none';
  gsap.fromTo('#bform-fields',{opacity:0,y:20},{opacity:1,y:0,duration:.4});
}

/* =====================================================
   DASHBOARD RENDER
   Status cycle: Pending â†’ In Progress â†’ Resolved â†’ Pending
===================================================== */
let currentFilter='all', searchQuery='';

function setFilter(f,btn){
  currentFilter=f;
  document.querySelectorAll('.dash-stat-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderDashboard();
}
function filterBookings(){
  searchQuery=document.getElementById('dash-search-input').value.toLowerCase();
  renderDashboard();
}

function getCatClass(cat){
  const m={'AC Repair':'bcat-ac','Refrigerator':'bcat-fridge','Washing Machine':'bcat-washing',
    'Plumbing':'bcat-plumbing','Electrical':'bcat-electrical','Geyser':'bcat-geyser'};
  return m[cat]||'bcat-ac';
}
function getCatIcon(cat){
  const m={'AC Repair':'â„ï¸','Refrigerator':'ðŸ§Š','Washing Machine':'ðŸ«§','Plumbing':'ðŸ”©','Electrical':'âš¡','Geyser':'ðŸ”¥'};
  return m[cat]||'ðŸ”§';
}
function getStatusClass(s){
  return s==='Pending'?'s-pending':s==='In Progress'?'s-progress':'s-resolved';
}
function getCardClass(s){
  return s==='Pending'?'bc-pending':s==='In Progress'?'bc-progress':'bc-resolved';
}
function fmtTime(iso){
  const d=new Date(iso);
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})+' '+
         d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}
function safeHTML(s){
  const d=document.createElement('div');
  d.appendChild(document.createTextNode(s)); return d.innerHTML;
}

// STATUS CYCLE: Pending â†’ In Progress â†’ Resolved â†’ Pending
function cycleStatus(id){
  const bks=getBookings();
  const idx=bks.findIndex(b=>b.id===id);
  if(idx<0)return;
  const next=bks[idx].status==='Pending'?'In Progress':bks[idx].status==='In Progress'?'Resolved':'Pending';
  bks[idx].status=next;
  saveBookings(bks);

  // Visual feedback
  const col=next==='Resolved'?'#34D399':next==='In Progress'?'#F97316':'#F87171';
  burst(window.innerWidth/2,window.innerHeight/2,col,20);
  if(next==='Resolved') playConfirmChime();

  renderDashboard();
}

function updateDashSummary(bks){
  const p=bks.filter(b=>b.status==='Pending').length;
  const r=bks.filter(b=>b.status==='In Progress').length;
  const d=bks.filter(b=>b.status==='Resolved').length;
  document.getElementById('ds-total').textContent=bks.length;
  document.getElementById('ds-pending').textContent=p;
  document.getElementById('ds-progress').textContent=r;
  document.getElementById('ds-resolved').textContent=d;
}

function renderDashboard(){
  const allBks=getBookings();
  updateDashSummary(allBks);

  let filtered=allBks;
  if(currentFilter!=='all') filtered=filtered.filter(b=>b.status===currentFilter);
  if(searchQuery) filtered=filtered.filter(b=>
    (b.category+b.location+b.description+b.id+b.technicianName).toLowerCase().includes(searchQuery)
  );

  const grid=document.getElementById('bookings-grid');
  if(!filtered.length){
    grid.innerHTML=`<div class="empty-bookings">
      <span class="ei">ðŸ“­</span>
      <p style="font-family:'Satoshi',sans-serif;color:var(--muted);">
        No bookings ${currentFilter!=='all'?'with status "'+currentFilter+'"':''} yet.<br>
        Submit a booking above to see it here.
      </p>
    </div>`; return;
  }

  grid.innerHTML=filtered.map((b,i)=>`
    <div class="booking-card ${getCardClass(b.status)}" style="animation-delay:${i*.07}s">
      <div class="bc-top">
        <span class="bc-cat ${getCatClass(b.category)}">${getCatIcon(b.category)} ${safeHTML(b.category)}</span>
        <!-- STATUS BADGE: red=Pending, orange=In Progress, green=Resolved -->
        <span class="bc-status ${getStatusClass(b.status)}">${safeHTML(b.status)}</span>
      </div>
      <div class="bc-location">ðŸ“ ${safeHTML(b.location)}</div>
      <div class="bc-desc">${safeHTML(b.description)}</div>
      <div class="bc-meta">
        <div class="bc-meta-item">
          <span class="ml">Booking ID</span>
          <span class="mv" style="font-family:'JetBrains Mono',monospace;font-size:.8rem;">${safeHTML(b.id)}</span>
        </div>
        <div class="bc-meta-item">
          <span class="ml">Technician</span>
          <span class="mv">${safeHTML(b.technicianName)}</span>
        </div>
        <div class="bc-meta-item">
          <span class="ml">Date & Slot</span>
          <span class="mv">${safeHTML(b.datetime)}</span>
        </div>
        <div class="bc-meta-item">
          <span class="ml">Amount</span>
          <span class="mv" style="color:var(--orange);">â‚¹${b.amount}</span>
        </div>
      </div>
      <div class="bc-footer">
        <div class="bc-time">ðŸ• ${fmtTime(b.timestamp)}</div>
        <!-- UPDATE STATUS BUTTON â€” cycles Pending â†’ In Progress â†’ Resolved -->
        <button class="bc-update-btn" onclick="cycleStatus('${b.id}')">Update Status â†»</button>
      </div>
    </div>
  `).join('');
}

/* =====================================================
   WEB AUDIO API â€” ambient sounds
===================================================== */
let audioCtx=null, masterGain=null, audioEnabled=false;

function initAudio(){
  if(audioCtx)return;
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();
    masterGain.gain.setValueAtTime(0,audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }catch(e){}
}

function playConfirmChime(){
  if(!audioCtx||!audioEnabled)return;
  try{
    // Success confirmation chime
    const freqs=[523,659,784,1047];
    freqs.forEach((f,i)=>{
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.connect(g); g.connect(masterGain);
      o.frequency.value=f; o.type='sine';
      g.gain.setValueAtTime(0,audioCtx.currentTime+i*.12);
      g.gain.linearRampToValueAtTime(.2,audioCtx.currentTime+i*.12+.05);
      g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+i*.12+.4);
      o.start(audioCtx.currentTime+i*.12); o.stop(audioCtx.currentTime+i*.12+.5);
    });
  }catch(e){}
}
function playClick(){
  if(!audioCtx||!audioEnabled)return;
  try{
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.connect(g); g.connect(masterGain);
    o.frequency.value=800; o.type='sine';
    g.gain.setValueAtTime(.15,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.08);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime+.1);
  }catch(e){}
}

document.getElementById('audio-toggle').addEventListener('click',()=>{
  initAudio(); audioEnabled=!audioEnabled;
  document.getElementById('audio-toggle').textContent=audioEnabled?'ðŸ”Š':'ðŸ”‡';
  if(audioEnabled){ masterGain.gain.setTargetAtTime(.5,audioCtx.currentTime,.3); playClick(); }
  else masterGain.gain.setTargetAtTime(0,audioCtx.currentTime,.3);
  burst(window.innerWidth-25,window.innerHeight-60,'#0EA5E9',8);
});

// Tool click sound on form interactions
document.querySelectorAll('.cat-pill,.time-slot').forEach(el=>{
  el.addEventListener('click',playClick);
});

/* =====================================================
   TSPARTICLES â€” ambient background
===================================================== */
(async()=>{
  try{
    await tsParticles.load({id:'tsparticles',options:{
      fullScreen:{enable:true,zIndex:1},
      background:{color:'transparent'},
      particles:{
        number:{value:35,density:{enable:true,area:900}},
        color:{value:['#F97316','#0EA5E9','#F59E0B']},
        shape:{type:'circle'},
        opacity:{value:{min:.04,max:.18},animation:{enable:true,speed:.4,sync:false}},
        size:{value:{min:1,max:3},animation:{enable:true,speed:.8,sync:false}},
        links:{enable:true,distance:160,color:'#1E293B',opacity:.18,width:1},
        move:{enable:true,speed:.3,direction:'none',random:true,outModes:'bounce'}
      },
      interactivity:{events:{onHover:{enable:true,mode:'grab'}},modes:{grab:{distance:150,links:{opacity:.35}}}},
      detectRetina:true
    }});
  }catch(e){}
})();

/* =====================================================
   MAGNETIC EFFECT on primary CTA
===================================================== */
document.querySelectorAll('.btn-orange,.nav-cta').forEach(btn=>{
  btn.addEventListener('mousemove',function(e){
    const r=this.getBoundingClientRect();
    gsap.to(this,{x:(e.clientX-r.left-r.width/2)*.2,y:(e.clientY-r.top-r.height/2)*.2,duration:.3,ease:'power2.out'});
  });
  btn.addEventListener('mouseleave',function(){
    gsap.to(this,{x:0,y:0,duration:.5,ease:'elastic.out(1,.4)'});
  });
});

/* =====================================================
   DEV RESET visibility
===================================================== */
const devBtn=document.getElementById('dev-reset');
document.addEventListener('mousemove',e=>{
  devBtn.style.opacity=(e.clientX>window.innerWidth-130&&e.clientY>window.innerHeight-55)?'0.6':'0';
});

/* =====================================================
   INITIAL RENDER
===================================================== */
renderDashboard();

console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘   ðŸ”§  REPAIR BUDDY â€” Team CODE IT  ðŸ”§        â•‘
â•‘   Storage: repairbuddy_bookings               â•‘
â•‘   Structure: [{id,category,location,          â•‘
â•‘     datetime,description,technicianName,      â•‘
â•‘     status,timestamp,amount}]                 â•‘
â•‘   IDs: RB-0001 format                         â•‘
â•‘   Status: Pendingâ†’In Progressâ†’Resolvedâ†’â†©     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
`);
