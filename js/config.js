window.NEWSFY_CONFIG = {
  // Worker confirmado online e com estas rotas:
  // /noticias | /noticia/:id | /publicidade
  API_BASE: "https://newfy.ricardorodrigues0671.workers.dev",

  ENDPOINTS: {
    noticias: "/noticias",
    noticia: "/noticia/",
    publicidade: "/publicidade"
  },

  // Se seu Worker exigir parâmetros extras, você pode ajustá-los aqui.
  REQUEST_TIMEOUT: 12000
};
