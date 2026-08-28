let sb=null;
if(window.SUPABASE_URL && !window.SUPABASE_URL.includes("YOUR-PROJECT") && window.SUPABASE_PUBLISHABLE_KEY && !window.SUPABASE_PUBLISHABLE_KEY.includes("YOUR-PUBLISHABLE")) {
  sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
}
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const avatar=u=>u||"https://api.dicebear.com/9.x/shapes/svg?seed=hyrspace";
const roleHtml=r=>{const c=r==="Администратор"?"admin":r==="VIP"?"vip":r==="Мем Года"?"meme":"";const e=r==="Администратор"?"🛡️":r==="VIP"?"💎":r==="Мем Года"?"😂":"👤";return `<span class="role ${c}">${e} ${esc(r)}</span>`};

function setupAuth(){
 const modal=document.getElementById("authModal");if(!modal)return;
 document.getElementById("navAuth").onclick=()=>modal.classList.add("open");
 document.getElementById("closeModal").onclick=()=>modal.classList.remove("open");
 let login=false;
 document.getElementById("switchAuth").onclick=()=>{login=!login;document.getElementById("authTitle").textContent=login?"Вход":"Регистрация";document.getElementById("submitAuth").textContent=login?"Войти":"Зарегистрироваться";document.getElementById("switchAuth").textContent=login?"Создать новый аккаунт →":"У меня уже есть аккаунт → Войти";document.getElementById("authUsername").style.display=login?"none":"block"};
 document.getElementById("submitAuth").onclick=async()=>{
  const m=document.getElementById("authMessage");if(!sb){m.style.color="#ff7181";m.textContent="Заполни config.js данными Supabase.";return}
  const username=document.getElementById("authUsername").value.trim(),email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value;
  if(!email||password.length<6||(!login&&username.length<3)){m.style.color="#ff7181";m.textContent="Проверь ник, email и пароль.";return}
  const r=login?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password,options:{data:{username}}});
  if(r.error){m.style.color="#ff7181";m.textContent=r.error.message;return}
  m.style.color="#8bff98";m.textContent=login?"Вход выполнен!":"Аккаунт создан!";
  setTimeout(()=>location.href="profile.html",600);
 };
}

async function profilesPage(){
 const box=document.getElementById("users");if(!box)return;
 if(!sb){box.innerHTML='<div class="panel glass empty">Заполни config.js для подключения Supabase.</div>';return}
 const {data,error}=await sb.from("profiles").select("*").order("created_at",{ascending:false});
 if(error){box.innerHTML=`<div class="panel glass empty">${esc(error.message)}</div>`;return}
 const render=()=>{
  const q=document.getElementById("search").value.trim().toLowerCase(),rf=document.getElementById("roleFilter").value;
  const list=data.filter(u=>u.username.toLowerCase().includes(q)&&(!rf||u.role===rf));document.getElementById("count").textContent=`${list.length} профилей`;
  box.innerHTML=list.length?list.map(u=>`<a class="user-card glass" href="user.html?id=${encodeURIComponent(u.id)}"><div class="user-row"><img class="mini-avatar" src="${esc(avatar(u.avatar_url))}"><div><h3>${esc(u.username)}</h3><p class="muted">${esc(u.about||"Пользователь пока ничего о себе не написал.")}</p>${roleHtml(u.role)}</div></div></a>`).join(""):'<div class="panel glass empty">Ничего не найдено.</div>';
 };
 document.getElementById("search").oninput=render;document.getElementById("roleFilter").onchange=render;render();
}

async function loadProfile(id){
 const {data:p,error}=await sb.from("profiles").select("*").eq("id",id).single();if(error||!p)return null;
 document.getElementById("profile").innerHTML=`<section class="profile-head glass"><img class="avatar" src="${esc(avatar(p.avatar_url))}"><div class="profile-info"><div class="eyebrow">PUBLIC PROFILE</div><h1>${esc(p.username)}</h1>${roleHtml(p.role)}<p class="muted" style="margin-top:12px">${esc(p.about||"Этот пользователь ещё ничего о себе не написал.")}</p><div class="stats"><span>⚡ MEMBER</span><span>📅 ${new Date(p.created_at).toLocaleDateString("ru-RU")}</span></div></div></section>`;
 return p;
}

async function renderComments(postId){
 const {data,error}=await sb.from("post_comments").select("*").eq("post_id",postId).order("created_at",{ascending:true});
 if(error)return "";
 return data.map(c=>`<div class="comment"><div class="comment-top"><b>⚡ ${esc(c.author_name)}</b><span class="post-time">${new Date(c.created_at).toLocaleString("ru-RU")}</span></div><div class="comment-text">${esc(c.text)}</div></div>`).join("");
}

async function renderPosts(container,filterAuthor=null){
 const {data:posts,error}=await sb.from("posts").select("*").order("created_at",{ascending:false});
 if(error){container.innerHTML=`<div class="empty">${esc(error.message)}</div>`;return}
 const list=filterAuthor?posts.filter(p=>p.author_id===filterAuthor):posts;
 if(!list.length){container.innerHTML='<div class="glass empty">Пока здесь нет постов. Напиши первый 🚀</div>';return}
 const ids=[...new Set(list.map(p=>p.author_id))];
 const {data:authors}=await sb.from("profiles").select("id,username,avatar_url,role").in("id",ids);
 const map=Object.fromEntries((authors||[]).map(a=>[a.id,a]));
 container.innerHTML="";
 for(const p of list){
  const a=map[p.author_id]||{username:"user",avatar_url:"",role:"Пользователь"};
  const article=document.createElement("article");article.className="post glass";
  article.innerHTML=`<div class="post-author"><a class="author" href="user.html?id=${encodeURIComponent(p.author_id)}"><img class="post-avatar" src="${esc(avatar(a.avatar_url))}"><div><h3>${esc(a.username)}</h3>${roleHtml(a.role)}</div></a><span class="post-time">${new Date(p.created_at).toLocaleString("ru-RU")}</span></div><div class="post-text">${esc(p.text)}</div><div class="post-comments"><div class="comments-list"></div><div class="comment-form"><input class="input comment-input" maxlength="500" placeholder="Комментарий к посту..."><button class="btn primary comment-send">Отправить</button></div><div class="message"></div></div>`;
  container.appendChild(article);
  const comments=await renderComments(p.id);article.querySelector(".comments-list").innerHTML=comments||'<div class="muted">Комментариев пока нет.</div>';
  article.querySelector(".comment-send").onclick=async()=>{
   const {data:s}=await sb.auth.getSession();const text=article.querySelector(".comment-input").value.trim();const msg=article.querySelector(".message");
   if(!s.session){msg.style.color="#ff7181";msg.textContent="Войди в аккаунт, чтобы комментировать.";return}
   if(!text)return;
   const me=await sb.from("profiles").select("username").eq("id",s.session.user.id).single();
   const r=await sb.from("post_comments").insert({post_id:p.id,author_id:s.session.user.id,author_name:me.data?.username||"user",text});
   if(r.error){msg.style.color="#ff7181";msg.textContent=r.error.message;return}
   article.querySelector(".comment-input").value="";article.querySelector(".comments-list").innerHTML=await renderComments(p.id);
  };
 }
}

async function feedPage(){
 const feed=document.getElementById("feed");if(!feed)return;
 if(!sb){feed.innerHTML='<div class="glass empty">Заполни config.js для подключения Supabase.</div>';return}
 const {data:s}=await sb.auth.getSession();
 if(!s.session)document.getElementById("newPostBox").innerHTML='<div class="empty">Войди в аккаунт, чтобы создавать посты. Читать ленту сможет только авторизованный пользователь.</div>';
 else document.getElementById("publish").onclick=async()=>{
   const text=document.getElementById("postText").value.trim(),m=document.getElementById("postMessage");if(!text)return;
   const r=await sb.from("posts").insert({author_id:s.session.user.id,text});
   if(r.error){m.style.color="#ff7181";m.textContent=r.error.message;return}
   document.getElementById("postText").value="";m.textContent="Пост опубликован ✓";renderPosts(feed);
 };
 renderPosts(feed);
}

async function publicUserPage(){
 const box=document.getElementById("profile");if(!box)return;
 if(!sb){box.innerHTML='<div class="empty">Заполни config.js.</div>';return}
 const id=new URLSearchParams(location.search).get("id");if(!id){box.innerHTML='<div class="glass empty">Профиль не указан.</div>';return}
 const p=await loadProfile(id);if(!p){box.innerHTML='<div class="glass empty">Профиль не найден.</div>';return}
 const posts=document.getElementById("userPosts");await renderPosts(posts,id);
 const {count}=await sb.from("posts").select("*",{count:"exact",head:true}).eq("author_id",id);document.getElementById("postCount").textContent=`${count||0} постов`;
}

async function myProfile(){
 const name=document.getElementById("name");if(!name)return;
 if(!sb){document.getElementById("message").textContent="Заполни config.js.";return}
 const {data:s}=await sb.auth.getSession();if(!s.session){location.href="index.html";return}
 const uid=s.session.user.id,{data:p}=await sb.from("profiles").select("*").eq("id",uid).single();
 name.value=p?.username||s.session.user.user_metadata?.username||"user";document.getElementById("about").value=p?.about||"";document.getElementById("avatarUrl").value=p?.avatar_url||"";document.getElementById("role").value=p?.role||"Пользователь";document.getElementById("publicLink").href=`user.html?id=${uid}`;
 document.getElementById("save").onclick=async()=>{const r=await sb.from("profiles").update({username:name.value.trim(),about:document.getElementById("about").value.trim(),avatar_url:document.getElementById("avatarUrl").value.trim(),role:document.getElementById("role").value}).eq("id",uid);const m=document.getElementById("message");m.style.color=r.error?"#ff7181":"#8bff98";m.textContent=r.error?r.error.message:"Профиль сохранён ✓"};
 document.getElementById("logout").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
}

setupAuth();profilesPage();feedPage();publicUserPage();myProfile();
