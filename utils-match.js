// ========================================
// PROOFLY — MATCH ENGINE + LOCALIZAÇÃO
// ========================================
// Carregado após utils.js. Depende de TAG_MAP e funções de texto.

(function () {
  'use strict';

  // ========================================
  // MATCH ENGINE (robusto e limpo)
  // ========================================

  const MATCH_WEIGHTS = {
    music: 2,
    visual: 2,
    personality: 3,
    lifestyle: 2,
    work: 3,
    location: 4,
    price: 2,
    rating: 3
  };

  const MATCH_WEIGHTS_EST = {
    infra: 2,
    music: 2,
    positioning: 3,
    audience: 3,
    vibe: 3,
    rating: 3
  };

  const PROF_TAG_CATEGORY_MAP = {
    'Música': 'music',
    'Visual': 'visual',
    'Personalidade': 'personality',
    'Estilo de Vida': 'lifestyle',
    'Trabalho': 'work'
  };

  const EST_TAG_CATEGORY_MAP = {
    'Infraestrutura': 'infra',
    'Música Ambiente': 'music',
    'Posicionamento': 'positioning',
    'Público': 'audience',
    'Vibe': 'vibe'
  };

  window.MATCH_WEIGHTS = MATCH_WEIGHTS;
  window.MATCH_WEIGHTS_EST = MATCH_WEIGHTS_EST;

  // ========================================
  // Localização do cliente (GPS + proximidade)
  // ========================================

  const CLIENT_LOCATION_KEY = 'proofly_client_location';
  const LOCATION_CACHE_MS = 30 * 60 * 1000;
  const LOCATION_STALE_MS = 24 * 60 * 60 * 1000;

  const BR_CITY_COORDS = {
    'sao paulo': { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'belo horizonte': { lat: -19.9167, lng: -43.9345 },
    'brasilia': { lat: -15.7939, lng: -47.8828 },
    'curitiba': { lat: -25.4284, lng: -49.2733 },
    'porto alegre': { lat: -30.0346, lng: -51.2177 },
    'salvador': { lat: -12.9777, lng: -38.5016 },
    'recife': { lat: -8.0476, lng: -34.877 },
    'fortaleza': { lat: -3.7319, lng: -38.5267 },
    'campinas': { lat: -22.9099, lng: -47.0626 },
    'santos': { lat: -23.9608, lng: -46.3336 },
    'guarulhos': { lat: -23.4628, lng: -46.5333 },
    'niteroi': { lat: -22.8832, lng: -43.1034 },
    'florianopolis': { lat: -27.5954, lng: -48.548 },
    'goiania': { lat: -16.6869, lng: -49.2648 }
  };

  function normalizeCityKey(city) {
    return String(city || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function hashToUnit(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
    return (Math.abs(hash) % 10000) / 10000;
  }

  function getStoredClientLocation() {
    try {
      const raw = localStorage.getItem(CLIENT_LOCATION_KEY);
      if (!raw) return null;
      const loc = JSON.parse(raw);
      if (loc?.lat == null || loc?.lng == null) return null;
      if (Date.now() - (loc.at || 0) > LOCATION_STALE_MS) return null;
      return loc;
    } catch {
      return null;
    }
  }

  function storeClientLocation(loc) {
    if (!loc?.lat || !loc?.lng) return;
    try {
      localStorage.setItem(CLIENT_LOCATION_KEY, JSON.stringify(loc));
    } catch { /* noop */ }
  }

  function detectClientLocation(options = {}) {
    const cached = getStoredClientLocation();
    if (cached && !options.force && Date.now() - (cached.at || 0) < LOCATION_CACHE_MS) {
      return Promise.resolve(cached);
    }

    if (!navigator.geolocation) {
      return Promise.resolve(cached);
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            at: Date.now(),
            source: 'gps'
          };
          storeClientLocation(loc);
          resolve(loc);
        },
        () => resolve(cached),
        {
          enableHighAccuracy: false,
          timeout: options.timeout || 12000,
          maximumAge: LOCATION_CACHE_MS
        }
      );
    });
  }

  function haversineKm(a, b) {
    if (!a?.lat || !b?.lat) return null;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function offsetFromCenter(center, seed, minKm, maxKm) {
    const u1 = hashToUnit(seed + ':a');
    const u2 = hashToUnit(seed + ':b');
    const angle = u1 * 2 * Math.PI;
    const radiusKm = minKm + u2 * (maxKm - minKm);
    const cosLat = Math.cos(center.lat * Math.PI / 180) || 1;
    return {
      lat: center.lat + (radiusKm / 111) * Math.cos(angle),
      lng: center.lng + (radiusKm / (111 * cosLat)) * Math.sin(angle)
    };
  }

  function getItemCity(item, tipo) {
    if (tipo === 'est') return item?.city || null;
    return item?.current_establishment?.city || item?.city || null;
  }

  function estimateItemCoords(item, tipo, userLoc) {
    const seed = item?.id || item?.name || 'item';
    const cityKey = normalizeCityKey(getItemCity(item, tipo));
    const cityCenter = BR_CITY_COORDS[cityKey];

    if (cityCenter) {
      const coords = offsetFromCenter(cityCenter, seed, 0.4, 8);
      return { ...coords, precision: 'city' };
    }

    if (userLoc?.lat != null) {
      const coords = offsetFromCenter(
        { lat: userLoc.lat, lng: userLoc.lng },
        seed,
        1.5,
        28
      );
      return { ...coords, precision: 'estimate' };
    }

    return null;
  }

  function anexarDistancias(lista, userLoc, tipo) {
    if (!userLoc?.lat) {
      return (lista || []).map(item => ({ ...item, _distanceKm: null }));
    }
    const origin = { lat: userLoc.lat, lng: userLoc.lng };
    return (lista || []).map(item => {
      const coords = estimateItemCoords(item, tipo, userLoc);
      const km = coords ? haversineKm(origin, coords) : null;
      return {
        ...item,
        _distanceKm: km != null ? Math.round(km * 10) / 10 : null,
        _locationPrecision: coords?.precision || null
      };
    });
  }

  function formatDistanceKm(km) {
    if (km == null || Number.isNaN(km)) return null;
    if (km < 1) return `${Math.max(100, Math.round(km * 1000))} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }

  function intersect(arr1 = [], arr2 = []) {
    if (!arr1 || !arr2) return 0;
    return arr1.filter(x => arr2.includes(x)).length;
  }

  function calcularProximidade(userLoc, itemLoc) {
    if (!userLoc || !itemLoc) return 0;
    return userLoc === itemLoc ? 1 : 0;
  }

  function calcularCompatibilidadePreco(userPrice, itemPrice) {
    if (!userPrice || !itemPrice) return 0;
    return userPrice === itemPrice ? 1 : 0;
  }

  function calcularMatchScore(userPrefs, item) {
    let score = 0;

    score += intersect(userPrefs.music, item.music_tags || []) * MATCH_WEIGHTS.music;
    score += intersect(userPrefs.visual, item.visual_tags || []) * MATCH_WEIGHTS.visual;
    score += intersect(userPrefs.personality, item.personality_tags || []) * MATCH_WEIGHTS.personality;
    score += intersect(userPrefs.lifestyle, item.lifestyle_tags || []) * MATCH_WEIGHTS.lifestyle;
    score += intersect(userPrefs.work, item.work_tags || []) * MATCH_WEIGHTS.work;

    score += calcularProximidade(userPrefs.location, item.location) * MATCH_WEIGHTS.location;
    score += calcularCompatibilidadePreco(userPrefs.price, item.price_range) * MATCH_WEIGHTS.price;

    score += (item.avg_rating || 0) * MATCH_WEIGHTS.rating;

    return score;
  }

  function normalizarScore(score) {
    return Math.min(100, Math.round(score));
  }

  function calcularMatchScoreEst(userPrefs, item) {
    let score = 0;

    score += intersect(userPrefs.infra, item.infra_tags || []) * MATCH_WEIGHTS_EST.infra;
    score += intersect(userPrefs.music, item.music_tags || []) * MATCH_WEIGHTS_EST.music;
    score += intersect(userPrefs.positioning, item.positioning_tags || []) * MATCH_WEIGHTS_EST.positioning;
    score += intersect(userPrefs.audience, item.audience_tags || []) * MATCH_WEIGHTS_EST.audience;
    score += intersect(userPrefs.vibe, item.vibe_tags || []) * MATCH_WEIGHTS_EST.vibe;

    score += (item.avg_rating || 0) * MATCH_WEIGHTS_EST.rating;

    return score;
  }

  function buildUserPrefsFromTags(activeTags, tipo) {
    if (tipo === 'prof') {
      const prefs = { music: [], visual: [], personality: [], lifestyle: [], work: [], location: null, price: null };
      (activeTags || []).forEach(tag => {
        const cat = (window.TAG_MAP || {})[tag]?.category;
        const key = PROF_TAG_CATEGORY_MAP[cat];
        if (key) prefs[key].push(tag);
      });
      return prefs;
    }

    const prefs = { infra: [], music: [], positioning: [], audience: [], vibe: [] };
    (activeTags || []).forEach(tag => {
      const cat = (window.TAG_MAP || {})[tag]?.category;
      const key = EST_TAG_CATEGORY_MAP[cat];
      if (key) prefs[key].push(tag);
    });
    return prefs;
  }

  function getAllProfileTags(item, tipo) {
    if (tipo === 'prof') {
      return [
        ...(item.music_tags || []),
        ...(item.visual_tags || []),
        ...(item.personality_tags || []),
        ...(item.lifestyle_tags || []),
        ...(item.work_tags || [])
      ];
    }
    return [
      ...(item.infra_tags || []),
      ...(item.music_tags || []),
      ...(item.positioning_tags || []),
      ...(item.audience_tags || []),
      ...(item.vibe_tags || [])
    ];
  }

  function buildMatchBreakdown(item, tipo, activeTags) {
    const tags = activeTags || [];
    const insight = buildMatchInsight(item, tipo, tags);
    if (insight.needsPrefs) {
      return { ...insight, components: [], prefsTags: tags };
    }

    const prefs = buildUserPrefsFromTags(tags, tipo);
    const components = [];

    if (tipo === 'prof') {
      const add = (key, label, userArr, itemArr, weight) => {
        const hits = intersect(userArr, itemArr || []);
        if (!hits && !(itemArr || []).length) return;
        components.push({
          key, label, hits, weight,
          points: hits * weight,
          userTags: userArr,
          profileTags: (itemArr || []).filter(t => userArr.includes(t))
        });
      };
      add('music', 'Música', prefs.music, item.music_tags, MATCH_WEIGHTS.music);
      add('visual', 'Visual', prefs.visual, item.visual_tags, MATCH_WEIGHTS.visual);
      add('personality', 'Personalidade', prefs.personality, item.personality_tags, MATCH_WEIGHTS.personality);
      add('lifestyle', 'Estilo de vida', prefs.lifestyle, item.lifestyle_tags, MATCH_WEIGHTS.lifestyle);
      add('work', 'Trabalho', prefs.work, item.work_tags, MATCH_WEIGHTS.work);
      const locPts = calcularProximidade(prefs.location, item.location) * MATCH_WEIGHTS.location;
      if (locPts) components.push({ key: 'location', label: 'Localização', hits: 1, weight: MATCH_WEIGHTS.location, points: locPts });
      const pricePts = calcularCompatibilidadePreco(prefs.price, item.price_range) * MATCH_WEIGHTS.price;
      if (pricePts) components.push({ key: 'price', label: 'Preço', hits: 1, weight: MATCH_WEIGHTS.price, points: pricePts });
      const ratingPts = (item.avg_rating || 0) * MATCH_WEIGHTS.rating;
      components.push({
        key: 'rating', label: 'Nota média', hits: item.avg_rating || 0,
        weight: MATCH_WEIGHTS.rating, points: ratingPts,
        profileTags: [`${item.avg_rating || 0}★ (${item.total_reviews || 0} reviews)`]
      });
    } else {
      const add = (key, label, userArr, itemArr, weight) => {
        const hits = intersect(userArr, itemArr || []);
        components.push({
          key, label, hits, weight,
          points: hits * weight,
          userTags: userArr,
          profileTags: (itemArr || []).filter(t => userArr.includes(t))
        });
      };
      add('infra', 'Infra', prefs.infra, item.infra_tags, MATCH_WEIGHTS_EST.infra);
      add('music', 'Música', prefs.music, item.music_tags, MATCH_WEIGHTS_EST.music);
      add('positioning', 'Posicionamento', prefs.positioning, item.positioning_tags, MATCH_WEIGHTS_EST.positioning);
      add('audience', 'Público', prefs.audience, item.audience_tags, MATCH_WEIGHTS_EST.audience);
      add('vibe', 'Vibe', prefs.vibe, item.vibe_tags, MATCH_WEIGHTS_EST.vibe);
      components.push({
        key: 'rating', label: 'Nota média', hits: item.avg_rating || 0,
        weight: MATCH_WEIGHTS_EST.rating,
        points: (item.avg_rating || 0) * MATCH_WEIGHTS_EST.rating,
        profileTags: [`${item.avg_rating || 0}★`]
      });
    }

    return {
      percent: insight.percent,
      rawScore: insight.rawScore,
      sharedTags: insight.sharedTags,
      tier: insight.tier,
      needsPrefs: false,
      prefsTags: tags,
      components: components.sort((a, b) => (b.points || 0) - (a.points || 0))
    };
  }

  function buildMatchInsight(item, tipo, activeTags) {
    const tags = activeTags || [];
    if (!tags.length) {
      return {
        percent: null,
        sharedTags: [],
        headline: 'Melhore seus resultados',
        subline: 'Escolha seu estilo para ver compatibilidade real',
        tier: 'cool',
        rawScore: 0,
        needsPrefs: true
      };
    }

    const prefs = buildUserPrefsFromTags(tags, tipo);
    const calc = tipo === 'prof' ? calcularMatchScore : calcularMatchScoreEst;
    const rawScore = calc(prefs, item);
    const percent = normalizarScore(rawScore);
    const profileTags = getAllProfileTags(item, tipo);
    const sharedTags = tags.filter(t => profileTags.includes(t));

    let headline = '';
    let subline = '';
    let tier = 'cool';

    if (percent >= 80) tier = 'hot';
    else if (percent >= 55) tier = 'warm';

    if (sharedTags.length) {
      headline = 'Combina com você';
      subline = sharedTags.length === 1
        ? '1 coisa em comum com o que você busca'
        : `${sharedTags.length} coisas em comum com o que você busca`;
    } else if (percent >= 72) {
      headline = 'Combina com você';
      subline = 'Reputação e estilo alinhados ao seu perfil';
    } else if (percent >= 50) {
      headline = 'Boa chance de conexão';
      subline = 'Vale explorar o perfil completo';
    } else {
      headline = 'Descubra se combina';
      subline = 'Toque nas tags — pode surpreender';
    }

    return { percent, sharedTags, headline, subline, tier, rawScore, needsPrefs: false };
  }

  function anexarMatchScores(lista, userPrefs, tipo) {
    const calc = tipo === 'prof' ? calcularMatchScore : calcularMatchScoreEst;
    return lista.map(item => {
      const score = calc(userPrefs, item);
      return { ...item, _matchScore: score, _matchPercent: normalizarScore(score) };
    });
  }

  function comparadorQualificacao(a, b, tipo) {
    const ratingDiff = (b.avg_rating || 0) - (a.avg_rating || 0);
    if (ratingDiff !== 0) return ratingDiff;

    const reviewsDiff = (b.total_reviews || 0) - (a.total_reviews || 0);
    if (reviewsDiff !== 0) return reviewsDiff;

    if (tipo === 'prof') {
      const expA = a.profile?.years_experience || 0;
      const expB = b.profile?.years_experience || 0;
      return expB - expA;
    }

    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  }

  function aplicarOrdenacao(lista, sortModes, userPrefs, tipo) {
    const modes = sortModes?.length ? sortModes : ['proximity', 'match'];
    let withScores = anexarMatchScores(lista, userPrefs, tipo);
    const userLoc = getStoredClientLocation();
    if (userLoc || modes.includes('proximity')) {
      withScores = anexarDistancias(withScores, userLoc, tipo);
    }

    const comparators = modes.map(mode => {
      switch (mode) {
        case 'proximity':
          return (a, b) => {
            const da = a._distanceKm;
            const db = b._distanceKm;
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return da - db;
          };
        case 'match':
          return (a, b) => (b._matchScore || 0) - (a._matchScore || 0);
        case 'name':
          return (a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
        case 'qualification':
          return (a, b) => comparadorQualificacao(a, b, tipo);
        default:
          return () => 0;
      }
    });

    return withScores.sort((a, b) => {
      for (const cmp of comparators) {
        const result = cmp(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
  }

  function ordenarPorMatch(lista, userPrefs) {
    return aplicarOrdenacao(lista, ['match'], userPrefs, 'prof');
  }

  const SORT_MODE_LABELS = {
    proximity: '📍 Proximidade',
    match: '🎯 Match',
    name: '🔤 Alfabético',
    qualification: '⭐ Qualificação'
  };

  function formatSortHint(sortModes) {
    if (!sortModes?.length) return '';
    return sortModes.map(m => SORT_MODE_LABELS[m] || m).join(' → ');
  }

  window.calcularMatchScore = calcularMatchScore;
  window.calcularMatchScoreEst = calcularMatchScoreEst;
  window.buildUserPrefsFromTags = buildUserPrefsFromTags;
  window.buildMatchInsight = buildMatchInsight;
  window.buildMatchBreakdown = buildMatchBreakdown;
  window.getAllProfileTags = getAllProfileTags;
  window.aplicarOrdenacao = aplicarOrdenacao;
  window.ordenarPorMatch = ordenarPorMatch;
  window.formatSortHint = formatSortHint;
  window.SORT_MODE_LABELS = SORT_MODE_LABELS;
  window.CLIENT_LOCATION_KEY = CLIENT_LOCATION_KEY;
  window.getStoredClientLocation = getStoredClientLocation;
  window.detectClientLocation = detectClientLocation;
  window.anexarDistancias = anexarDistancias;
  window.formatDistanceKm = formatDistanceKm;
  window.haversineKm = haversineKm;
  window.estimateItemCoords = estimateItemCoords;

  console.log('utils-match.js carregado');
})();
