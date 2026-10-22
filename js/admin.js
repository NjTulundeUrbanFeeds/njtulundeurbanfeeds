/* NJ Tulunde Urban Feeds admin. Only the admin email set in supabase-setup.sql can change anything (enforced by the database). */
(()=>{'use strict';
const C=window.SB_CONFIG||{},$=s=>document.querySelector(s),CATS=window.CATS||[],TABS=window.TABS||[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeImg=u=>{u=String(u||'').trim();if(/^https:\/\//i.test(u))return u;if(u[0]==='/'&&u[1]!=='/')return u;if(u&&!/^[a-z][a-z0-9+.-]*:/i.test(u)&&u.slice(0,2)!=='//')return'/'+u;return'/images/logo.png'};
if(!C.url||!C.key||/YOUR_/.test(C.url+C.key)){document.body.innerHTML='<main><section><h2>Supabase not connected</h2><p>Open <code>js/config.js</code> and paste your Supabase URL and anon key.</p></section></main>';return}
const sb=supabase.createClient(C.url,C.key);
const say=(t,bad)=>{const m=$('#m');m.textContent=t;m.style.display='block';m.style.background=bad?'#f8c9c4':'#FFD700';scrollTo(0,0)};
const LEG={feeds:'animal-feeds',equipment:'farm-tools',inputs:'supplements'},nc=c=>CATS.some(x=>x.k===c)?c:(LEG[c]||'animal-feeds');
const tabName=k=>(TABS.find(t=>t.k===k)||{}).label||k;
// category dropdown, grouped by the Products-page tab it appears under
$('#catsel').innerHTML=TABS.filter(t=>t.k!=='all').map(t=>`<optgroup label="${esc(t.label)} tab">${CATS.filter(c=>c.tab===t.k).map(c=>`<option value="${c.k}">${esc(c.label)}</option>`).join('')}</optgroup>`).join('');
// ---- session: auto log out after 30 minutes without activity
let idle;const bump=()=>{clearTimeout(idle);idle=setTimeout(async()=>{await sb.auth.signOut();show(false);say('You were logged out after 30 minutes of no activity.')},30*60*1000)};
['click','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{if(!$('#app').hidden)bump()},{passive:true}));
const show=on=>{$('#login').hidden=on;$('#app').hidden=!on;$('#out').hidden=!on;if(on){bump();refresh()}else clearTimeout(idle)};
sb.auth.getSession().then(({data})=>show(!!data.session));
$('#lf').onsubmit=async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});$('#pw').value='';error?say('Login failed: '+error.message,1):show(true)};
$('#out').onclick=async()=>{await sb.auth.signOut();show(false)};
let P=[],B=[];
const fld=(f,o)=>Object.entries(o).forEach(([k,v])=>{const el=f.querySelector('[name='+k+']');if(!el)return;if(el.type==='checkbox')el.checked=!!v;else el.value=v??''});
const prev=$('#prev'),imgf=$('#imgf');
const setPrev=u=>{if(u){prev.src=u;prev.hidden=false}else{prev.removeAttribute('src');prev.hidden=true}};
imgf.onchange=()=>{const f=imgf.files[0];setPrev(f?URL.createObjectURL(f):null)};
const endP=()=>{$('#pf').reset();$('#pf').querySelector('[name=id]').value='';setPrev(null);$('#pt').textContent='Add product';$('#ps').textContent='Add product';$('#pc').hidden=true};
const endB=()=>{$('#bf').reset();$('#bt').textContent='Add blog article / video link';$('#bs').textContent='Publish article';$('#bc').hidden=true};
$('#pc').onclick=endP;$('#bc').onclick=endB;
// Photos are resized and re-saved as JPEG in the browser: faster pages, and phone GPS/EXIF data is removed.
async function prepPhoto(file){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Please use a JPG, PNG or WebP photo.');
 if(file.size>15e6)throw new Error('Photo is too large (max 15MB).');
 try{const bmp=await createImageBitmap(file,{imageOrientation:'from-image'}),s=Math.min(1,1400/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
  c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);
  const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));if(b)return{blob:b,type:'image/jpeg',ext:'jpg'}}catch(e){}
 if(file.size>5e6)throw new Error('Photo is too large (max 5MB).');
 return{blob:file,type:file.type,ext:file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}}
const storagePath=u=>{const m=String(u||'').split('/product-images/')[1];return m?decodeURIComponent(m.split('?')[0]):''};
async function refresh(){
 const[p,b,s]=await Promise.all([sb.from('products').select('*').order('id'),sb.from('posts').select('*').order('id',{ascending:false}),sb.from('settings').select('*').eq('key','intro_video')]);
 if(p.error)return say('Could not load: '+p.error.message+' (If it mentions a missing column, run supabase-setup.sql again.)',1);
 P=p.data.map(x=>({...x,category:nc(x.category)}));B=b.data||[];
 $('#iv').value=(s.data&&s.data[0]&&s.data[0].value)||'';
 $('#cats').innerHTML=CATS.map(c=>{const n=P.filter(x=>x.category===c.k).length;return`<div class="cc"><b>${esc(c.label)}</b><small>${n} product${n===1?'':'s'} &middot; ${esc(tabName(c.tab))} tab</small><button type="button" class="a" data-add="${c.k}">+ Add</button></div>`}).join('');
 const row=x=>`<div class="row${x.published===false?' off':''}"><span><img src="${esc(safeImg(x.image))}" alt=""> <b>${esc(x.name)}</b>${x.published===false?'<span class="badge">Hidden</span>':''} <small>${esc(x.price)}</small></span><span><button class="e" data-t="products" data-id="${x.id}">Edit</button> <button class="h" data-pub="${x.id}">${x.published===false?'Show':'Hide'}</button> <button class="d" data-t="products" data-id="${x.id}" data-img="${esc(x.image||'')}">Remove</button></span></div>`;
 $('#pl').innerHTML=CATS.map(c=>{const ps=P.filter(x=>x.category===c.k);return`<h3>${esc(c.label)} (${ps.length})</h3>${ps.map(row).join('')||'<p class="hint">No products yet.</p>'}`}).join('');
 $('#bl').innerHTML=B.map(x=>`<div class="row"><span><b>${esc(x.title)}</b> <small>${esc((x.created_at||'').slice(0,10))} | <a href="/blog/${encodeURIComponent(x.slug)}" target="_blank" rel="noopener">view</a></small></span><span><button class="e" data-t="posts" data-id="${x.id}">Edit</button> <button class="d" data-t="posts" data-id="${x.id}">Remove</button></span></div>`).join('')||'<p>No articles.</p>'}
document.addEventListener('click',async e=>{
 const add=e.target.closest('[data-add]');
 if(add){endP();$('#catsel').value=add.dataset.add;const c=CATS.find(x=>x.k===add.dataset.add);$('#pt').textContent='Add product to '+(c?c.label:'category');$('#pf').scrollIntoView({behavior:'smooth'});$('#pf').querySelector('[name=name]').focus();return}
 const pub=e.target.closest('[data-pub]');
 if(pub){const x=P.find(r=>r.id==pub.dataset.pub),{error}=await sb.from('products').update({published:x.published===false}).eq('id',x.id);if(error)return say(error.message,1);say(x.published===false?'Product is now visible on the website.':'Product hidden from the website.');return refresh()}
 const ed=e.target.closest('button.e');
 if(ed){if(ed.dataset.t==='products'){const x=P.find(r=>r.id==ed.dataset.id);fld($('#pf'),{id:x.id,name:x.name,price:x.price==='Call for Price'?'':x.price,tag:x.tag,cat:x.category,desc:x.description,pub:x.published!==false});setPrev(x.image?safeImg(x.image):null);
   $('#pt').textContent='Edit product';$('#ps').textContent='Save changes';$('#pc').hidden=false;$('#pf').scrollIntoView({behavior:'smooth'})}
  else{const x=B.find(r=>r.id==ed.dataset.id);fld($('#bf'),{id:x.id,title:x.title,video:x.video,desc:x.description});
   $('#bt').textContent='Edit article';$('#bs').textContent='Save changes';$('#bc').hidden=false;$('#bf').scrollIntoView({behavior:'smooth'})}return}
 const b=e.target.closest('button.d');if(!b||!b.dataset.t||!confirm('Remove this item?'))return;
 const{error}=await sb.from(b.dataset.t).delete().eq('id',b.dataset.id);if(error)return say(error.message,1);
 const old=storagePath(b.dataset.img);if(old)await sb.storage.from('product-images').remove([old]);say('Removed.');refresh()});
$('#sf').onsubmit=async e=>{e.preventDefault();const{error}=await sb.from('settings').upsert({key:'intro_video',value:$('#iv').value.trim()});error?say(error.message,1):say('Intro video saved.')};
$('#pf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get('img'),id=f.get('id'),cur=id?P.find(r=>r.id==id):null;
 let image=cur?cur.image:'/images/logo.png';
 try{if(file&&file.size){const ph=await prepPhoto(file),path=Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ph.ext;
   const up=await sb.storage.from('product-images').upload(path,ph.blob,{contentType:ph.type,upsert:false});if(up.error)return say(up.error.message,1);
   const old=cur&&storagePath(cur.image);image=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;if(old)await sb.storage.from('product-images').remove([old])}}
 catch(err){return say(err.message,1)}
 const row={name:f.get('name').trim(),description:f.get('desc').trim(),price:f.get('price').trim()||'Call for Price',category:f.get('cat'),image:image||'/images/logo.png',tag:f.get('tag').trim(),published:f.get('pub')==='on'};
 const{error}=id?await sb.from('products').update(row).eq('id',id):await sb.from('products').insert(row);
 if(error)return say(error.message+(/category/i.test(error.message)?' (Run supabase-setup.sql once to enable the new categories.)':''),1);
 endP();say(id?'Product updated.':'Product added. It is now live on the website.');refresh()};
$('#bf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),t=f.get('title').trim(),id=f.get('id');
 const body={title:t,video:f.get('video').trim(),description:f.get('desc').trim()};
 if(id){const{error}=await sb.from('posts').update(body).eq('id',id);if(error)return say(error.message,1);endB();say('Article updated.');return refresh()}
 const slug=t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'post';
 let r=await sb.from('posts').insert({slug,...body});
 if(r.error&&r.error.code==='23505')r=await sb.from('posts').insert({slug:slug+'-'+Date.now().toString(36),...body});
 if(r.error)return say(r.error.message,1);endB();say('Article published. It is now live on the website.');refresh()};
})();
