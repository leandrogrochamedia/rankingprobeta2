// ============================================================
// Ranking Pro — Registro central de fluxos por persona
// ============================================================
// Fonte única para rotas, intents e entry points.
// Investor Blueprint — Shark congela marketplace/contratar na UI pública.
// ============================================================

const PERSONA_FLOWS = {
  public: {
    label: 'Visitante',
    entry: './index.html',
    routes: {
      qr: './index.html',
      search: './discover.html',
      login: './login.html'
    }
  },
  client: {
    type: 'client',
    role: 'cliente',
    icon: '👤',
    label: 'Cliente',
    intents: ['cliente', 'client'],
    homeLinked: './discover.html',
    homeUnlinked: './select-client.html',
    onboarding: './signup.html',
    guards: ['discover.html', 'favorites.html', 'reviews.html'],
    dock: ['discover.html', 'favorites.html', 'profile-page.html']
  },
  professional: {
    type: 'professional',
    role: 'profissional',
    icon: '💼',
    label: 'Profissional',
    intents: ['professional', 'profissional', 'professional-onboarding'],
    homeLinked: './professional-dashboard.html',
    homeUnlinked: './select-professional.html',
    onboarding: './professional-onboarding.html',
    guards: ['professional-dashboard.html', 'profissional.html'],
    dock: ['professional-dashboard.html', 'reviews.html', 'discover.html']
  },
  establishment: {
    type: 'establishment',
    role: 'estabelecimento',
    icon: '🏢',
    label: 'Estabelecimento',
    intents: ['establishment', 'estabelecimento', 'establishment-onboarding'],
    homeLinked: './establishment-dashboard.html',
    homeUnlinked: './select-establishment.html',
    onboarding: './establishment-onboarding.html',
    /** Marketplace — DEV only quando SHARK_MODE ativo */
    marketplace: './establishment-marketplace.html',
    guardsShark: ['establishment-dashboard.html'],
    guards: ['establishment-dashboard.html', 'establishment-marketplace.html'],
    dockShark: ['establishment-dashboard.html', 'establishment-dashboard.html', 'establishment-dashboard.html'],
    dock: ['establishment-dashboard.html', 'establishment-marketplace.html', 'favorites.html']
  }
};

const LEGACY_REDIRECTS = {
  'hire.html': './establishment-marketplace.html',
  'profissional.html': './login.html?intent=professional',
  'estabelecimento.html': './login.html?intent=establishment',
  'cliente-home.html': './discover.html',
  'index copy.html': './index.html'
};

/** Shark — redirecionamentos de páginas legadas congeladas */
const SHARK_LEGACY_REDIRECTS = {
  'hire.html': './establishment-dashboard.html',
  'establishment-marketplace.html': './establishment-dashboard.html',
  'hirer-report.html': './establishment-dashboard.html'
};

function isSharkModeActive() {
  return typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
}

function isSharkPublicUI() {
  return isSharkModeActive() && !(typeof isSharkDevAccess === 'function' && isSharkDevAccess());
}

function getLegacyRedirect(page) {
  const base = String(page || '').split('?')[0].replace('./', '');
  if (isSharkPublicUI() && SHARK_LEGACY_REDIRECTS[base]) {
    return SHARK_LEGACY_REDIRECTS[base];
  }
  return LEGACY_REDIRECTS[base] || null;
}

function getEstablishmentDock() {
  const flow = PERSONA_FLOWS.establishment;
  if (isSharkPublicUI()) return flow.dockShark;
  return flow.dock;
}

function getEstablishmentGuards() {
  const flow = PERSONA_FLOWS.establishment;
  if (isSharkPublicUI()) return flow.guardsShark;
  return flow.guards;
}

function getPersonaFlow(type) {
  const key = type === 'client' || type === 'cliente' ? 'client'
    : type === 'professional' || type === 'profissional' ? 'professional'
    : type === 'establishment' || type === 'estabelecimento' ? 'establishment'
    : type;
  return PERSONA_FLOWS[key] || null;
}

function resolvePersonaHome(type, session) {
  const flow = getPersonaFlow(type);
  if (!flow) return './select-profile.html';
  const s = session || {};
  switch (flow.type) {
    case 'client':
      return (s.clientId) ? flow.homeLinked : flow.homeUnlinked;
    case 'professional':
      return s.professionalId ? flow.homeLinked : flow.homeUnlinked;
    case 'establishment':
      return s.establishmentId ? flow.homeLinked : flow.homeUnlinked;
    default:
      return './select-profile.html';
  }
}

function intentToPersonaType(intent) {
  if (!intent) return null;
  if (intent === 'professional-onboarding') return 'professional';
  if (intent === 'establishment-onboarding') return 'establishment';
  for (const flow of Object.values(PERSONA_FLOWS)) {
    if (flow.intents && flow.intents.includes(intent)) return flow.type;
  }
  return null;
}

function resolveOnboardingUrl(intent) {
  if (intent === 'professional-onboarding') return './professional-onboarding.html';
  if (intent === 'establishment-onboarding') return './establishment-onboarding.html';
  return null;
}

window.PERSONA_FLOWS = PERSONA_FLOWS;
window.LEGACY_REDIRECTS = LEGACY_REDIRECTS;
window.SHARK_LEGACY_REDIRECTS = SHARK_LEGACY_REDIRECTS;
window.getPersonaFlow = getPersonaFlow;
window.resolvePersonaHome = resolvePersonaHome;
window.intentToPersonaType = intentToPersonaType;
window.resolveOnboardingUrl = resolveOnboardingUrl;
window.getLegacyRedirect = getLegacyRedirect;
window.getEstablishmentDock = getEstablishmentDock;
window.getEstablishmentGuards = getEstablishmentGuards;
window.isSharkPublicUI = isSharkPublicUI;