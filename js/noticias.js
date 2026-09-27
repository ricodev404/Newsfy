(() => {
  const CFG = window.NEWSFY_CONFIG;
  const $ = (s,p=document) => p.querySelector(s);
  const $$ = (s,p=document) => [...p.querySelectorAll(s)];

  let allNews = [];
  let activeCategory = "Todos";
  let search = new URLSearchParams(location.search).get("busca") || "";
  const initialCategory = new URLSearchParams(location.search).get("categoria");
  if (initialCategory) activeCategory = initialCategory;

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function pick(o,keys,f=""){for(const k of keys) if(o?.[k]!==undefined&&o?.[k]!==null&&String(o[k]).trim()!=="") return o[k];return f;}
  function normalize(item, i = 0) {
    const f = item?.fields || item?.field_1 || item || {};
    const raw = {...item, ...f};
    return {
      id: raw.id ?? i,
      titulo: raw.titulo ?? "Sem título",
      slug: raw.slug ?? "",
      resumo: raw.resumo ?? "",
      conteudo: raw.conteudo ?? "",
      categoria: raw.categoria ?? "Geral",
      autor: raw.autor ?? "NEWSFY",
      imagem: raw.imagem ?? "",
      imagem_capa: raw.imagem_capa ?? raw.imagem ?? "",
      data_publicacao: raw.data_publicacao ?? "",
      status: raw.status ?? "",
      destaque: raw.destaque === true || raw.destaque === 1 || raw.destaque === "true" || raw.destaque === "1",
      visualizacoes: Number(raw.visualizacoes ?? 0),
      tags: raw.tags ?? "",
      fonte: raw.fonte ?? "",
      url_fonte: raw.url_fonte ?? "",
      meta_description: raw.meta_description ?? "",
      criado_em: raw.criado_em ?? "",
      atualizado_em: raw.atualizado_em ?? ""
    };
  }
  async function fetchNews(){
    const r=await fetch(CFG.API_BASE+CFG.ENDPOINTS.noticias,{headers:{Accept:"application/json"},cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    const d=await r.json(); const a=Array.isArray(d)?d:(d.results||d.data||d.noticias||[]);
    return a.map(normalize).filter(n=>{const s=String(n.status||"").toLowerCase();return !s||!["rascunho","draft","inativo","inactiva"].includes(s);});
  }
  function dateLabel(v){
    if(!v)return"Agora";const d=new Date(v);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric"}).format(d).replace(".","");
    return String(v);
  }
  function placeholder(n){return `<div class="image-placeholder"><div class="watermark-letter">${esc((n.categoria||"N")[0])}</div><span>NEWSFY</span></div>`;}
  function render(){
    const visible = allNews.filter(n => {
      const status = String(n.status || "").toLowerCase().trim();
      return !status || ["publicado", "publicada", "ativo", "ativa", "published"].includes(status);
    });
    let data=visible.filter(n=>activeCategory==="Todos"||String(n.categoria).toLowerCase()===activeCategory.toLowerCase());
    if(search) data=data.filter(n=>(n.titulo+" "+n.resumo+" "+n.categoria).toLowerCase().includes(search.toLowerCase()));
    $("#resultCount").textContent=data.length;
    const grid=$("#newsGrid"), empty=$("#emptyState");
    if(!data.length){grid.innerHTML="";empty.classList.remove("hidden");return;}
    empty.classList.add("hidden");
    grid.innerHTML=data.map((n,i)=>`<article class="news-card grid-card reveal delay-${Math.min(i%5,4)}">
      <a class="card-image" href="noticia.html?id=${encodeURIComponent(n.id)}">${n.imagem_capa||n.imagem?`<img src="${esc(n.imagem_capa||n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">`:placeholder(n)}<span class="category-badge">${esc(n.categoria)}</span></a>
      <div class="card-body"><div class="card-meta"><span>${esc(dateLabel(n.data))}</span><i></i><span>${esc(n.autor)}</span></div>
      <h3><a href="noticia.html?id=${encodeURIComponent(n.id)}">${esc(n.titulo)}</a></h3><p>${esc(n.resumo)}</p>
      <a class="read-link" href="noticia.html?id=${encodeURIComponent(n.id)}">Ler notícia <span>→</span></a></div></article>`).join("");
  }
  function setup(){
    $$(".filter").forEach(b=>{
      b.classList.toggle("active",b.dataset.filter.toLowerCase()===activeCategory.toLowerCase());
      b.addEventListener("click",()=>{activeCategory=b.dataset.filter;$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render();});
    });
    const input=$("#globalSearch"); if(input){input.value=search;input.addEventListener("input",()=>{search=input.value.trim();render();});input.addEventListener("keydown",e=>{if(e.key==="Enter")history.replaceState(null,"","noticias.html"+(search?"?busca="+encodeURIComponent(search):""));});}
    const sidebar=$("#leftSidebar"),overlay=$("#mobileOverlay"),btn=$("#menuToggle");
    const close=()=>{sidebar?.classList.remove("open");overlay?.classList.remove("show")};
    btn?.addEventListener("click",()=>{sidebar?.classList.toggle("open");overlay?.classList.toggle("show")});
    overlay?.addEventListener("click",close);
    $$(".nav-category").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;render();close();}));
    $("#themeBtn")?.addEventListener("click",()=>{document.body.classList.toggle("soft-theme");localStorage.setItem("newsfy-theme",document.body.classList.contains("soft-theme")?"soft":"dark")});
    if(localStorage.getItem("newsfy-theme")==="soft")document.body.classList.add("soft-theme");
    $("#year")&&($("#year").textContent=new Date().getFullYear());
  }
  document.addEventListener("DOMContentLoaded",async()=>{
    setup();
    try{allNews=await fetchNews();}catch(e){
      allNews=[
        {id:"demo-1",titulo:"NEWSFY: informação em movimento",categoria:"Brasil",resumo:"Conteúdo demonstrativo enquanto o Worker carrega as notícias reais.",autor:"NEWSFY",data:"Agora",imagem:""},
        {id:"demo-2",titulo:"Tecnologia transforma a forma de consumir informação",categoria:"Tecnologia",resumo:"Uma experiência digital moderna aproxima leitores das notícias que importam.",autor:"NEWSFY",data:"Hoje",imagem:""}
      ];
    }
    render();
  });
})();
