(() => {
  const CFG = window.NEWSFY_CONFIG;
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const demoNews = [
    {id:"demo-1", titulo:"NEWSFY: informação em movimento", categoria:"Brasil", resumo:"Conteúdo demonstrativo enquanto as notícias reais são carregadas pelo Worker.", imagem:"", data:"Agora", destaque:true},
    {id:"demo-2", titulo:"Tecnologia transforma a forma de consumir informação", categoria:"Tecnologia", resumo:"Uma experiência digital moderna aproxima leitores das notícias que importam.", imagem:"", data:"Hoje"},
    {id:"demo-3", titulo:"Brasil e mundo em um só lugar", categoria:"Mundo", resumo:"Acompanhe acontecimentos e histórias com uma navegação rápida e organizada.", imagem:"", data:"Hoje"}
  ];

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function pick(o, keys, fallback="") {
    for (const k of keys) {
      if (o && o[k] !== undefined && o[k] !== null && String(o[k]).trim() !== "") return o[k];
    }
    return fallback;
  }

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

  async function fetchJSON(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CFG.REQUEST_TIMEOUT);
    try {
      const r = await fetch(CFG.API_BASE + path, {
        headers: {Accept: "application/json"},
        signal: controller.signal,
        cache: "no-store"
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function getNews() {
    try {
      const data = await fetchJSON(CFG.ENDPOINTS.noticias);
      const arr = Array.isArray(data) ? data : (data.results || data.data || data.noticias || []);
      return arr.map(normalize).filter(n => {
        const s = String(n.status || "").toLowerCase();
        return !s || !["rascunho","draft","inativo","inactiva","inativo"].includes(s);
      });
    } catch (e) {
      console.warn("NEWSFY: não foi possível carregar /noticias. Usando conteúdo de demonstração.", e);
      return demoNews;
    }
  }

  async function getAds() {
    try {
      const data = await fetchJSON(CFG.ENDPOINTS.publicidade);
      return Array.isArray(data) ? data : (data.results || data.data || data.publicidade || []);
    } catch (e) {
      return [];
    }
  }

  function imageBlock(n, cls="") {
    if (n.imagem_capa || n.imagem) {
      return `<img class="${cls}" src="${esc(n.imagem_capa || n.imagem)}" alt="${esc(n.titulo)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')">`;
    }
    return "";
  }

  function placeholder(n, cls="") {
    const letter = (n.categoria || "N").slice(0,1).toUpperCase();
    return `<div class="image-placeholder ${cls}"><div class="watermark-letter">${esc(letter)}</div><span>NEWSFY</span></div>`;
  }

  function dateLabel(v) {
    if (!v) return "Agora";
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("pt-BR", {day:"2-digit", month:"short", year:"numeric"}).format(d).replace(".", "");
    }
    return String(v);
  }

  function card(n, featured=false, i=0) {
    return `<article class="news-card ${featured ? "featured-card" : ""} reveal delay-${Math.min(i,4)}" data-id="${esc(n.id)}">
      <a class="card-image ${featured ? "large" : ""}" href="noticia.html?id=${encodeURIComponent(n.id)}">
        ${n.imagem ? imageBlock(n) : placeholder(n)}
        <span class="category-badge">${esc(n.categoria)}</span>
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${esc(dateLabel(n.data))}</span><i></i><span>${esc(n.autor)}</span></div>
        <h3><a href="noticia.html?id=${encodeURIComponent(n.id)}">${esc(n.titulo)}</a></h3>
        <p>${esc(n.resumo)}</p>
        <a class="read-link" href="noticia.html?id=${encodeURIComponent(n.id)}">Ler notícia <span>→</span></a>
      </div>
    </article>`;
  }

  function latestItem(n, i) {
    return `<article class="latest-item reveal delay-${Math.min(i,4)}">
      <a class="latest-thumb" href="noticia.html?id=${encodeURIComponent(n.id)}">
        ${n.imagem ? `<img src="${esc(n.imagem_capa || n.imagem)}" alt="" loading="lazy">` : placeholder(n)}
      </a>
      <div><span class="tiny-category">${esc(n.categoria)}</span><h3><a href="noticia.html?id=${encodeURIComponent(n.id)}">${esc(n.titulo)}</a></h3><small>${esc(dateLabel(n.data))}</small></div>
    </article>`;
  }

  function renderTrending(news) {
    const el = $("#trendingList");
    if (!el) return;
    el.innerHTML = news.slice(0,5).map((n,i) => `<a class="trend-item" href="noticia.html?id=${encodeURIComponent(n.id)}"><b>${String(i+1).padStart(2,"0")}</b><div><span>${esc(n.categoria)}</span><strong>${esc(n.titulo)}</strong></div></a>`).join("");
  }

  function renderAds(ads) {
    const el = $("#adContent");
    if (!el || !ads.length) return;
    const valid = ads.map(a => a.fields || a).filter(a => {
      const ativo = a.ativo === true || a.ativo === 1 || String(a.ativo).toLowerCase() === "true" || String(a.ativo).toLowerCase() === "sim";
      const pos = String(a.posicao || "").toLowerCase();
      return ativo && (pos === "home_sidebar" || !pos);
    });
    const f = valid[0];
    if (!f) return;
    const title = pick(f, ["nome"], "Seu anúncio aqui");
    const img = pick(f, ["imagem"], "");
    const link = pick(f, ["link"], "#");
    el.innerHTML = `${img ? `<img src="${esc(img)}" alt="${esc(title)}">` : `<span class="ad-icon">✦</span>`}<strong>${esc(title)}</strong><small>${esc(pick(f,["texto"],"Publicidade NEWSFY"))}</small><a href="${esc(link)}" target="_blank" rel="noopener">Saiba mais →</a>`;
  }

  async function init() {
    const news = await getNews();
    const ads = await getAds();
    const visibleNews = news.filter(n => {
      const status = String(n.status || "").toLowerCase().trim();
      return !status || ["publicado", "publicada", "ativo", "ativa", "published"].includes(status);
    });
    const featured = visibleNews.filter(n => n.destaque).concat(visibleNews.filter(n => !n.destaque)).slice(0,4);
    const latest = visibleNews.slice(0,8);

    if ($("#newsCount")) $("#newsCount").textContent = visibleNews.length;
    if ($("#featuredGrid")) {
      $("#featuredGrid").innerHTML = featured.length
        ? featured.map((n,i) => card(n,true,i)).join("")
        : `<div class="empty-state"><div>✦</div><h2>Sem destaques</h2><p>As próximas notícias aparecerão aqui.</p></div>`;
    }
    if ($("#latestList")) $("#latestList").innerHTML = latest.map(latestItem).join("");
    renderTrending(visibleNews);
    renderAds(ads);
    bindSearch(news);
  }

  function bindSearch(news) {
    const input = $("#globalSearch");
    if (!input) return;
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const q = input.value.trim();
        location.href = "noticias.html" + (q ? "?busca=" + encodeURIComponent(q) : "");
      }
    });
  }

  function setupMenu() {
    const sidebar = $("#leftSidebar"), overlay = $("#mobileOverlay"), btn = $("#menuToggle");
    if (!sidebar || !overlay || !btn) return;
    const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };
    btn.addEventListener("click", () => { sidebar.classList.toggle("open"); overlay.classList.toggle("show"); });
    overlay.addEventListener("click", close);
    $$(".nav-category").forEach(b => b.addEventListener("click", () => location.href = "noticias.html?categoria=" + encodeURIComponent(b.dataset.category)));
  }

  function setupTheme() {
    const btn = $("#themeBtn");
    const saved = localStorage.getItem("newsfy-theme");
    if (saved === "soft") document.body.classList.add("soft-theme");
    btn?.addEventListener("click", () => {
      document.body.classList.toggle("soft-theme");
      localStorage.setItem("newsfy-theme", document.body.classList.contains("soft-theme") ? "soft" : "dark");
    });
  }

  function setupNewsletter() {
    $("#newsletterForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const msg = $("#newsletterMsg");
      if (msg) { msg.textContent = "Inscrição registrada nesta demonstração."; msg.classList.add("success"); }
      e.target.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#year") && ($("#year").textContent = new Date().getFullYear());
    setupMenu(); setupTheme(); setupNewsletter(); init();
  });
})();
