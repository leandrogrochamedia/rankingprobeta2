// =====================================================
// Ranking Pro — Configuração Global
// =====================================================

const APP_NAME = 'Ranking Pro';
const APP_ICON = '🏆';
const APP_SCORE_LABEL = 'Ranking Pro Score';

const SUPABASE_URL = "https://pyywdhjstvhmarvzijji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg";

/** URL pública do app — detecta automaticamente (GitHub Pages, preview local, etc.) */
const APP_PUBLIC_BASE_URL = (() => {
  if (typeof location === 'undefined') return 'http://127.0.0.1:8790/app';
  const origin = location.origin;
  const path = location.pathname.includes('/rankingprobeta2/') ? '/rankingprobeta2' : '';
  return `${origin}${path}`;
})();

const DEBUG_MODE = true;
/** Menu dev oculto em produção (GitHub Pages) — visível em localhost e file:// */
const PROOFLY_DEV_MENU = typeof location !== 'undefined' && (
  location.protocol === 'file:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]'
);
/** Shark Mode — Investor Blueprint; congela marketplace na UI pública */
const SHARK_MODE = true;
const LIMITE_PAGINA = 10;
/** Bump ao alterar menu flutuante / CSS global — força reload de stylesheets cacheados */
const ASSET_VERSION = '20260628-top-places-employees';

window.APP_NAME = APP_NAME;
window.SHARK_MODE = SHARK_MODE;
window.APP_ICON = APP_ICON;
window.APP_SCORE_LABEL = APP_SCORE_LABEL;
window.APP_PUBLIC_BASE_URL = APP_PUBLIC_BASE_URL;
window.DEBUG_MODE = DEBUG_MODE;
window.PROOFLY_DEV_MENU = PROOFLY_DEV_MENU;
window.ASSET_VERSION = ASSET_VERSION;

(function bustAppStylesheets() {
  if (typeof document === 'undefined') return;
  const stamp = ASSET_VERSION;
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.includes(`v=${stamp}`)) return;
    if (!/(^|\/)(base|style|proofly-glass)\.css/.test(href)) return;
    const base = href.split('?')[0];
    const fresh = document.createElement('link');
    fresh.rel = 'stylesheet';
    fresh.href = `${base}?v=${stamp}`;
    fresh.onload = () => link.remove();
    link.parentNode.insertBefore(fresh, link.nextSibling);
  });
})();

(function injectIosMeta() {
  if (typeof document === 'undefined') return;
  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) return;
  if (!document.querySelector('meta[name="theme-color"]')) {
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#08080f';
    head.appendChild(theme);
  }
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const scheme = document.createElement('meta');
    scheme.name = 'color-scheme';
    scheme.content = 'dark';
    head.appendChild(scheme);
  }
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && !/viewport-fit=cover/.test(vp.content)) {
    vp.content = vp.content.replace(/\s*$/, '') + ', viewport-fit=cover';
  }
})();