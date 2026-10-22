/* NJ Tulunde Urban Feeds - site scripts (final).
   Data comes from Supabase (js/config.js). If Supabase is unreachable the starter files in /data are used. */
(()=>{'use strict';
const WA_MAIN='256751282930',WA_MWERA='256754989053';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const wa=(t,n=WA_MAIN)=>'https://wa.me/'+n+'?text='+encodeURIComponent(t);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=window.CATS||[],TABS=window.TABS||[];
// Only allow https or same-site images (blocks javascript: and other odd URLs)
const safeImg=u=>{u=String(u||'').trim();if(/^https:\/\//i.test(u))return u;if(u[0]==='/'&&u[1]!=='/')return u;if(u&&!/^[a-z][a-z0-9+.-]*:/i.test(u)&&u.slice(0,2)!=='//')return'/'+u;return'/images/logo.png'};
const absUrl=u=>/^https?:\/\//i.test(u)?u:location.origin+u;
const price=p=>{p=String(p||'').trim();return!p||/_{2,}/.test(p)?'Call for Price':p};
const LEG={feeds:'animal-feeds',equipment:'farm-tools',inputs:'supplements'}; // old category names still work
const nc=c=>CATS.some(x=>x.k===c)?c:(LEG[c]||'animal-feeds');
// Data source
const CFG=window.SB_CONFIG||{},useSB=CFG.url&&CFG.key&&!/YOUR_/.test(CFG.url+CFG.key);
const rest=t=>fetch(CFG.url+'/rest/v1/'+t,{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(r=>r.ok?r.json():Promise.reject());
const prod=p=>({id:String(p.id),name:String(p.name||''),desc:String(p.desc||''),price:price(p.price),cat:nc(p.cat),img:safeImg(p.img),tag:String(p.tag||'')});
const map={products:r=>r.map(p=>prod({id:p.id,name:p.name,desc:p.description,price:p.price,cat:p.category,img:p.image,tag:p.tag})),
 posts:r=>r.map(p=>({id:p.id,slug:p.slug,title:p.title,video:p.video,desc:p.description,date:(p.created_at||'').slice(0,10)})),
 settings:r=>({intro_video:(r.find(x=>x.key==='intro_video')||{}).value||''})};
const qs={products:'products?select=*&published=eq.true&order=id.asc',posts:'posts?select=*&order=id.desc',settings:'settings?select=*'};
const norm={products:r=>r.map(prod)};
const load=f=>(useSB?rest(qs[f]).then(map[f]):Promise.reject()).catch(()=>fetch('/data/'+f+'.json').then(r=>r.json()).then(norm[f]||(x=>x)).catch(()=>f==='settings'?{}:[]));
const yid=u=>(String(u||'').match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)||[])[1];
const toast=t=>{let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');document.body.append(e)}e.textContent=t;e.className='show';clearTimeout(e._t);e._t=setTimeout(()=>{e.className=''},3600)};
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,200);
const yr=$('#yr');if(yr)yr.textContent=new Date().getFullYear();

// ---- Mobile menu (closes on link tap, outside tap, Escape, scroll, rotate, back button)
const b=$('.burger'),nav=$('nav'),shut=()=>{nav.classList.remove('open');b.setAttribute('aria-expanded','false')};
b.onclick=e=>{e.stopPropagation();b.setAttribute('aria-expanded',nav.classList.toggle('open'))};
nav.addEventListener('click',e=>{if(e.target.closest('a'))shut()});
document.addEventListener('click',e=>{if(!e.target.closest('header'))shut()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
addEventListener('scroll',()=>{if(nav.classList.contains('open'))shut()},{passive:true});
addEventListener('pageshow',shut);addEventListener('resize',shut);

// ---- Hero slider (auto, pauses on hover/touch, off for reduced-motion)
const sl=$$('.sl');if(sl.length){let i=0,t;const d=$('.dots'),still=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const go=k=>{i=k;sl.forEach((s,j)=>s.classList.toggle('on',j==k));$$('button',d).forEach((x,j)=>x.classList.toggle('on',j==k))};
 const run=()=>{clearInterval(t);if(!still)t=setInterval(()=>go((i+1)%sl.length),4500)};
 sl.forEach((_,k)=>{const x=document.createElement('button');x.setAttribute('aria-label','Show slide '+(k+1));x.onclick=()=>{go(k);run()};d.append(x)});
 go(0);run();const S=$('.slider');S.onmouseenter=()=>clearInterval(t);S.onmouseleave=run;
 let sx=0;S.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
 S.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){go((i+(dx<0?1:sl.length-1))%sl.length);run()}},{passive:true})}

// ---- Products page: categories + cart
const pl=$('#plist');
if(pl){
 let ALL=[],tab='all',target=null;
 const tabOf=k=>(CATS.find(c=>c.k===k)||{}).tab;
 const q=new URLSearchParams(location.search).get('c')||'all';
 if(TABS.some(t=>t.k===q))tab=q;else if(tabOf(q)){tab=tabOf(q);target=q}
 // cart state (kept in this browser only)
 const CK='tf_cart_v1';let cart=[];
 try{cart=JSON.parse(localStorage.getItem(CK)||'[]')}catch(e){}
 cart=(Array.isArray(cart)?cart:[]).slice(0,40).map(i=>({id:String(i&&i.id||'').slice(0,40),name:String(i&&i.name||'').slice(0,120),img:safeImg(i&&i.img),price:String(i&&i.price||'').slice(0,200),qty:Math.min(99,Math.max(1,parseInt(i&&i.qty)||1))})).filter(i=>i.id&&i.name);
 const save=()=>{try{localStorage.setItem(CK,JSON.stringify(cart))}catch(e){}};
 const count=()=>cart.reduce((n,i)=>n+i.qty,0);
 const drawer=$('#cart'),scrim=$('#scrim'),fab=$('#cartBtn'),list=$('#cartItems'),cf=$('#cartForm');
 const card=p=>{const n=(cart.find(i=>i.id===p.id)||{}).qty;
  return`<article class="card" data-id="${esc(p.id)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" width="640" height="400" loading="lazy">${p.tag?`<span class="tag">${esc(p.tag)}</span>`:''}<h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><p class="pr">${esc(p.price)}</p><div class="acts"><button type="button" class="btn g sm add" data-id="${esc(p.id)}"><i class="fa-solid fa-cart-plus"></i> ${n?'Add more ('+n+' in cart)':'Add to Cart'}</button></div></article>`};
 const render=()=>{
  $$('.tabs a').forEach(a=>{const on=a.dataset.f===tab;a.classList.toggle('on',on);on?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current')});
  const cats=CATS.filter(c=>tab==='all'||c.tab===tab);
  const html=cats.map(c=>{const ps=ALL.filter(p=>p.cat===c.k);if(!ps.length&&tab==='all')return'';
   return`<section class="cat" id="cat-${c.k}" aria-labelledby="h-${c.k}"><div class="cat-h"><span class="ico"><i class="fa-solid ${c.icon}"></i></span><div><h2 id="h-${c.k}">${esc(c.label)}</h2><p>${esc(c.blurb)}</p></div></div>${ps.length?`<div class="grid3">${ps.map(card).join('')}</div>`:'<p class="empty">New products coming soon. Call 0751282930 to ask what is available.</p>'}</section>`}).join('');
  pl.innerHTML=html||'<p class="empty">No products to show yet. Please check back soon or call 0751282930.</p>'};
 const badge=()=>{const n=count();$('#cartN').textContent=n;fab.classList.toggle('has',n>0);fab.setAttribute('aria-label','Open cart, '+n+' item'+(n===1?'':'s'))};
 const drawCart=()=>{badge();
  list.innerHTML=cart.length?cart.map(i=>`<div class="it" data-id="${esc(i.id)}"><img src="${esc(i.img)}" alt="" width="64" height="64"><div><b>${esc(i.name)}</b><small>${esc(i.price)}</small><div class="qty"><button type="button" data-a="dec" aria-label="Fewer ${esc(i.name)}">&minus;</button><span>${i.qty}</span><button type="button" data-a="inc" aria-label="More ${esc(i.name)}">+</button></div> <button type="button" class="rm" data-a="del"><i class="fa-solid fa-trash"></i> Remove</button></div></div>`).join(''):'<p class="empty">Your cart is empty. Tap <b>Add to Cart</b> on any product.</p>';
  cf.hidden=!cart.length;$('#cartTotal').textContent=count()+' item'+(count()===1?'':'s')};
 const sync=()=>$$('.add',pl).forEach(a=>{const n=(cart.find(i=>i.id===a.dataset.id)||{}).qty;a.innerHTML='<i class="fa-solid fa-cart-plus"></i> '+(n?'Add more ('+n+' in cart)':'Add to Cart')}); // update buttons only, no full redraw
 const change=()=>{save();drawCart();sync()};
 const openC=()=>{drawer.classList.add('open');scrim.classList.add('open');drawer.removeAttribute('aria-hidden');document.body.classList.add('lock');$('#cartClose').focus()};
 const closeC=()=>{drawer.classList.remove('open');scrim.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('lock');fab.focus()};
 fab.onclick=openC;$('#cartClose').onclick=closeC;scrim.onclick=closeC;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open'))closeC()});
 pl.addEventListener('click',e=>{const a=e.target.closest('.add');if(!a)return;const p=ALL.find(x=>x.id===a.dataset.id);if(!p)return;
  const it=cart.find(i=>i.id===p.id);if(it)it.qty=Math.min(99,it.qty+1);else{if(cart.length>=40)return toast('Your cart is full. Please send this order first.');cart.push({id:p.id,name:p.name,img:p.img,price:p.price,qty:1})}
  change();toast(p.name+' added to cart')});
 list.addEventListener('click',e=>{const x=e.target.closest('[data-a]');if(!x)return;const row=x.closest('.it'),it=cart.find(i=>i.id===row.dataset.id);if(!it)return;
  if(x.dataset.a==='inc')it.qty=Math.min(99,it.qty+1);else if(x.dataset.a==='dec')it.qty=Math.max(1,it.qty-1);else cart=cart.filter(i=>i!==it);change()});
 $('#cartClear').onclick=()=>{if(cart.length&&confirm('Remove all items from your cart?')){cart=[];change()}};
 const RCV={delivery:['Delivery to my location',WA_MAIN],kakiri:['Pick up at Kakiri Main Branch',WA_MAIN],mwera:['Pick up at Mwera Branch',WA_MWERA]};
 cf.onsubmit=e=>{e.preventDefault();if(!cart.length)return toast('Your cart is empty.');
  const f=new FormData(cf),n=clean(f.get('n')),p=clean(f.get('p')),l=clean(f.get('l')),r=RCV[f.get('r')]||RCV.delivery,nt=String(f.get('nt')||'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim().slice(0,500);
  if(n.length<2)return toast('Please enter your full name.');
  if(!/^\+?[0-9][0-9\s-]{7,16}$/.test(p))return toast('Please enter a valid phone number.');
  if(l.length<2)return toast('Please enter your location.');
  let m=`*NEW ORDER REQUEST*\nNJ Tulunde Urban Feeds\n\n*CUSTOMER*\nName: ${n}\nPhone: ${p}\nLocation: ${l}\nReceive: ${r[0]}\n\n*ITEMS (${count()} in total)*\n`;
  cart.forEach((i,k)=>{m+=`\n${k+1}. ${i.name} x ${i.qty}\n   Price: ${i.price}\n   Photo: ${absUrl(i.img)}\n`});
  if(nt)m+=`\n*Notes*\n${nt}\n`;
  m+='\nPlease confirm availability, final price and delivery. Thank you.';
  const w=window.open(wa(m,r[1]),'_blank','noopener');if(!w)location.href=wa(m,r[1]);
  toast('Opening WhatsApp. Your cart stays saved until you clear it.')};
 // tabs
 $('.tabs').addEventListener('click',e=>{const a=e.target.closest('a[data-f]');if(!a)return;e.preventDefault();tab=a.dataset.f;target=null;
  history.replaceState(null,'',tab==='all'?'/products':'/products?c='+tab);render()});
 drawCart();
 load('products').then(ps=>{ALL=ps;
  if(ps.length){const ids=new Set(ps.map(p=>p.id));cart=cart.filter(i=>ids.has(i.id)).map(i=>{const p=ps.find(x=>x.id===i.id);return{...i,name:p.name,img:p.img,price:p.price}});save()}
  render();drawCart();
  if(target){const s=document.getElementById('cat-'+target);if(s)setTimeout(()=>s.scrollIntoView({behavior:'smooth',block:'start'}),60)}
  if(ps.length){const ld=document.createElement('script');ld.type='application/ld+json';
   ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'NJ Tulunde Urban Feeds products',itemListElement:ps.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,image:absUrl(p.img),url:location.origin+'/products?c='+p.cat}))}).replace(/</g,'\\u003c');document.head.append(ld)}})}

// ---- Intro video (home page)
load('settings').then(s=>{const v=$('#intro'),id=yid(s.intro_video);
 if(v&&id)v.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="NJ Tulunde Urban Feeds introduction" allow="encrypted-media;picture-in-picture;fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`});

// ---- Blog (home preview, list, single article at /blog/slug)
const thumb=p=>{const id=yid(p.video);return id?`<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${esc(p.title)}" loading="lazy"><i class="fa-solid fa-circle-play pl"></i>`:`<img class="lg" src="/images/logo.png" alt="" loading="lazy">`};
const pc=p=>`<article class="card post"><a class="th" href="/blog/${encodeURIComponent(p.slug)}">${thumb(p)}</a><h3>${esc(p.title)}</h3><p>${esc((p.desc||'').split('\n')[0])}</p><a class="btn y sm" href="/blog/${encodeURIComponent(p.slug)}">${yid(p.video)?'Watch &amp; Read':'Read More'}</a></article>`;
if($('#hblog')||$('#blog'))load('posts').then(ps=>{ps.sort((a,b)=>b.id-a.id);const hb=$('#hblog'),bl=$('#blog');
 if(hb)hb.innerHTML=ps.slice(0,3).map(pc).join('');
 if(!bl)return;const mm=location.pathname.match(/\/blog\/([^/]+)/),slug=mm?decodeURIComponent(mm[1]):new URLSearchParams(location.search).get('p'),p=ps.find(x=>x.slug===slug);
 if(!slug){bl.innerHTML=ps.map(pc).join('')||'<p>No articles yet.</p>';return}
 bl.className='one';if(!p){bl.innerHTML='<p>Article not found. <a class="lnk" href="/blog">Back to the blog</a></p>';return}
 document.title=p.title+' | NJ Tulunde Urban Feeds';const id=yid(p.video),share=location.origin+'/blog/'+encodeURIComponent(p.slug),e=encodeURIComponent;
 bl.innerHTML=`<a class="lnk" href="/blog">&larr; All articles</a><h1 class="st l">${esc(p.title)}</h1><p class="date">${esc(p.date)}</p>${id?`<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(p.title)}" allow="encrypted-media;picture-in-picture;fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`:''}${(p.desc||'').split('\n').filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join('')}
 <div class="share"><b>Share:</b><a class="btn g sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${e(p.title+' '+share)}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a><a class="btn g sm" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${e(share)}"><i class="fa-brands fa-facebook"></i> Facebook</a><a class="btn g sm" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?url=${e(share)}&text=${e(p.title)}"><i class="fa-brands fa-x-twitter"></i> X</a><button type="button" class="btn o sm" id="cp"><i class="fa-solid fa-link"></i> Copy link</button></div>`;
 $('#cp').onclick=ev=>{const btn=ev.currentTarget;(navigator.clipboard?navigator.clipboard.writeText(share):Promise.reject()).then(()=>{btn.textContent='Link copied!'}).catch(()=>{btn.textContent='Copy it from the address bar'})}});

// ---- Farm outreach booking and contact form -> WhatsApp
const send=t=>{const w=window.open(wa(t),'_blank','noopener');if(!w)location.href=wa(t)};
const of=$('#of');if(of)of.onsubmit=e=>{e.preventDefault();const f=new FormData(of),svc=$$('input[type=checkbox]:checked',of).map(c=>c.value).join(', ')||'Not specified';
 toast('Thank you! We will call you within 2 hours on 0751282930');
 send(`FARM VISIT BOOKING\nName: ${clean(f.get('n'))}\nPhone: ${clean(f.get('p'))}\nLocation: ${clean(f.get('l'))}\nAnimals: ${clean(f.get('a'))||'-'}\nServices: ${svc}\nDate: ${clean(f.get('d'))||'-'}`);of.reset()};
const cf2=$('#cf');if(cf2)cf2.onsubmit=e=>{e.preventDefault();const f=new FormData(cf2);send(`Hello, I am ${clean(f.get('n'))} (${clean(f.get('p'))}).\n${String(f.get('m')||'').trim().slice(0,1000)}`);cf2.reset()};
})();
