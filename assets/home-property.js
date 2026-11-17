(() => {
  const values=[146.1,147.1,148.6,148.2,149.4,151.8,152.0,151.7,154.5,156.1,156.1,156.8,158.3,159.8,158.2,158.6];
  const dates=values.map((_,i)=>`${2025+Math.floor(i/12)}.${String(i%12+1).padStart(2,'0')}`);
  const svg=document.getElementById('priceSvg');if(!svg)return;
  const ns='http://www.w3.org/2000/svg';
  const make=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;svg.append(n);return n;};
  const x=i=>65+i*58, y=v=>295-(v-140)*12;
  [140,145,150,155,160].forEach(v=>{make('line',{x1:65,y1:y(v),x2:935,y2:y(v),class:'chart-grid'});make('text',{x:12,y:y(v)+5,class:'chart-label'},String(v));});
  [0,5,11,15].forEach(i=>make('text',{x:x(i),y:335,'text-anchor':i===0?'start':i===15?'end':'middle',class:'chart-label'},dates[i]));
  const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  make('polygon',{points:`65,295 ${points} 935,295`,fill:'#eaf2f7'});
  const line=make('polyline',{points,class:'chart-line'});
  const readout=document.getElementById('chartReadout');
  values.forEach((v,i)=>{const dot=make('circle',{cx:x(i),cy:y(v),r:5,class:'chart-point',tabindex:0,role:'button','aria-label':`${dates[i]} 지수 ${v.toFixed(1)}`});const show=()=>readout.textContent=`${dates[i]} · ${v.toFixed(1)}`;dot.addEventListener('focus',show);dot.addEventListener('pointerenter',show);dot.addEventListener('click',show);dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(){if(reduced||!line.animate)return;const length=line.getTotalLength();line.animate([{strokeDasharray:length,strokeDashoffset:length},{strokeDasharray:length,strokeDashoffset:0}],{duration:1800,easing:'ease-out'});const target=(values.at(-1)/values[0]-1)*100;const start=performance.now();const number=document.getElementById('priceGrowth');function tick(now){const progress=Math.min((now-start)/1800,1);number.textContent=`+${(target*(1-Math.pow(1-progress,3))).toFixed(1)}%`;if(progress<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){animate();observer.disconnect();}},{threshold:.25});observer.observe(document.getElementById('priceChart'));}else animate();
})();

(() => {
  const hero=document.querySelector('.home-hero');if(!hero)return;
  const slides=[...hero.querySelectorAll('.home-hero-photo')];
  const dots=[...hero.querySelectorAll('[data-home-slide]')];
  const pause=hero.querySelector('[data-home-pause]');
  if(slides.length<2||!pause)return;
  let current=0,timer,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show=i=>{current=(i+slides.length)%slides.length;slides.forEach((slide,n)=>{slide.classList.toggle('active',n===current);slide.setAttribute('aria-hidden',String(n!==current));});dots.forEach((dot,n)=>dot.setAttribute('aria-pressed',String(n===current)));};
  const schedule=()=>{clearInterval(timer);if(!paused&&!document.hidden)timer=setInterval(()=>show(current+1),6000);pause.textContent=paused?'자동재생':'일시정지';};
  const move=i=>{show(i);schedule();};
  hero.querySelector('[data-home-prev]').addEventListener('click',()=>move(current-1));
  hero.querySelector('[data-home-next]').addEventListener('click',()=>move(current+1));
  dots.forEach((dot,n)=>dot.addEventListener('click',()=>move(n)));
  pause.addEventListener('click',()=>{paused=!paused;schedule();});
  hero.addEventListener('focusin',()=>{paused=true;schedule();});
  hero.addEventListener('mouseenter',()=>clearInterval(timer));hero.addEventListener('mouseleave',schedule);
  hero.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(current+(e.key==='ArrowLeft'?-1:1));}});
  let start=null;
  hero.addEventListener('touchstart',e=>{start={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
  hero.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))move(current+(dx<0?1:-1));start=null;},{passive:true});
  document.addEventListener('visibilitychange',schedule);show(0);schedule();
})();
