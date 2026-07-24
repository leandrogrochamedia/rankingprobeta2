// =====================================================
// PROOFLY — Perfil em página dedicada (menor RAM que drawer persistente)
// =====================================================

(function(global) {
  'use strict';

  let drawerTipo = null;
  let drawerId = null;
  let avaliacaoProfId = null;
  let avaliacaoRating = 0;
  let avaliacaoEstabId = null;
  let avaliacaoEstabRating = 0;
  let currentPageEstReviews = 0;
  const EST_REVIEWS_PER_PAGE = 10;

  const els = {
    content: null,
    actions: null
  };

  function getMatchTagsProf() {
    return typeof getEffectiveClientTags === 'function'
      ? getEffectiveClientTags('prof', [])
      : (typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs().profTags || [] : []);
  }

  function getMatchTagsEst() {
    return typeof getEffectiveClientTags === 'function'
      ? getEffectiveClientTags('est', [])
      : (typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs().estTags || [] : []);
  }

  function getUserPrefsProf() {
    return typeof buildUserPrefsFromTags === 'function'
      ? buildUserPrefsFromTags(getMatchTagsProf(), 'prof')
      : { music: [], visual: [], personality: [], lifestyle: [], work: [], location: null, price: null };
  }

  function getUserPrefsEst() {
    return typeof buildUserPrefsFromTags === 'function'
      ? buildUserPrefsFromTags(getMatchTagsEst(), 'est')
      : { infra: [], music: [], positioning: [], audience: [], vibe: [] };
  }

  function computeDrawerMatchPercent(item, isProf) {
    if (item._matchPercent != null) return item._matchPercent;
    if (typeof calcularMatchScore !== 'function' || typeof calcularMatchScoreEst !== 'function') return null;
    const prefs = isProf ? getUserPrefsProf() : getUserPrefsEst();
    const score = isProf ? calcularMatchScore(prefs, item) : calcularMatchScoreEst(prefs, item);
    return Math.min(100, Math.round(score));
  }

  function setPageActions(html) {
    if (els.actions) els.actions.innerHTML = html || '';
  }

  function tagCategoriesForDrawer(categories, sharedTags) {
    const withTags = (categories || []).filter(c => c.tags?.length);
    if (!withTags.length) {
      return '<div class="tinder-section"><div class="tinder-section-title">Estilo</div><p class="text-glass-muted" style="font-size:14px;">Nenhuma tag cadastrada ainda.</p></div>';
    }
    return ProfileCard.renderTagCategories(withTags, sharedTags);
  }

  function profilePageUrl(tipo, id) {
    return `./profile-page.html?tipo=${encodeURIComponent(tipo)}&id=${encodeURIComponent(id)}`;
  }

  function isViewerContratante() {
    const sess = typeof getSession === 'function' ? getSession() : null;
    return !!(sess && (sess.role === 'estabelecimento' || sess.provider === 'dev-simulation') && sess.establishmentId);
  }

  async function loadViewerEstablishment() {
    const sess = typeof getSession === 'function' ? getSession() : null;
    if (!sess?.establishmentId) return null;
    try {
      const data = await fetchAPI(
        `/rest/v1/establishments?id=eq.${sess.establishmentId}&select=id,name,city,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags`
      );
      return data?.[0] || null;
    } catch {
      return null;
    }
  }

  global.navigateToProfile = function(tipo, id) {
    global.location.href = profilePageUrl(tipo, id);
  };

  async function loadProfessionalProfile(id) {
    avaliacaoProfId = id;
    drawerTipo = 'profissional';
    drawerId = id;
    els.content.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
    setPageActions('');

    try {
      const profData = await fetchAPI(
        `/rest/v1/professionals?id=eq.${id}&select=*,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name),profile:professional_profiles(*),music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,work_style_tags,price_range,previous_workplaces,gallery_urls,available_now,seeking_work,salary_expectation,average_job_duration_months,client_portfolio_count,igv_score,availability`
      );
      if (!profData.length) {
        els.content.innerHTML = '<p style="color:red;">Profissional não encontrado.</p>';
        return;
      }
      let prof = profData[0];
      let hiringPrivate = null;
      try {
        const priv = await fetchAPI(`/rest/v1/professional_private_data?professional_id=eq.${id}&select=birth_date`);
        if (priv?.[0]) hiringPrivate = priv[0];
      } catch { /* noop */ }
      const viewerEst = isViewerContratante() ? await loadViewerEstablishment() : null;
      let matchInsight;
      if (viewerEst && typeof enrichProfForContratante === 'function') {
        const enriched = enrichProfForContratante(prof, viewerEst);
        const cm = enriched._contratanteMatch;
        matchInsight = cm ? {
          percent: cm.percent,
          headline: cm.headline || '',
          subline: (cm.sharedTags || []).slice(0, 2).join(' · '),
          sharedTags: cm.sharedTags || [],
          tier: cm.tier === 'high' ? 'hot' : cm.tier === 'mid' ? 'warm' : 'cool'
        } : { percent: 0, sharedTags: [], headline: '', subline: '', tier: 'cool' };
        prof = enriched;
      } else {
        matchInsight = typeof buildMatchInsight === 'function'
          ? buildMatchInsight(prof, 'prof', getMatchTagsProf())
          : { percent: computeDrawerMatchPercent(prof, true), sharedTags: [], headline: '', subline: '', tier: 'cool' };
      }

      const allReviewsRaw = typeof fetchReviews === 'function'
        ? await fetchReviews(`professional_id=eq.${id}`, { viewContext: { entityType: 'prof', targetProfName: prof.name } })
        : await fetchAPI(`/rest/v1/reviews?professional_id=eq.${id}&select=rating,comment,created_at,verified,review_type,source&order=created_at.desc`);
      const prooflyData = typeof calcularProoflyScoreFromReviews === 'function'
        ? calcularProoflyScoreFromReviews(allReviewsRaw, id, 'prof')
        : { score: calcularProoflyScoreRapido?.(prof, 'prof'), groups: {}, clientStats: {}, estabStats: {}, social: getMockSocialSignals?.(id, 'prof') };
      const clientReviewsAll = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.CLIENT_TO_PROF)
        : allReviewsRaw.filter(r => r.review_type === 'client_to_professional' || !r.review_type);
      const ratingStats = prooflyData.clientStats?.total ? prooflyData.clientStats : computeRatingStats(clientReviewsAll);
      const avgRating = ratingStats.total ? ratingStats.avg : (prof.avg_rating || 0);
      const totalReviews = ratingStats.total || prof.total_reviews || 0;

      const estabReviewsForHistory = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF)
        : [];
      let workHistory = [];
      try {
        const vinculos = await fetchAPI(
          `/rest/v1/professional_establishment?professional_id=eq.${id}&select=*,establishment:establishment_id(id,name)&order=started_at.desc`
        );
        workHistory = typeof buildWorkHistory === 'function'
          ? buildWorkHistory(vinculos, estabReviewsForHistory, prof.previous_workplaces)
          : [];
      } catch { workHistory = []; }

      const badges = typeof getProoflyBadges === 'function'
        ? getProoflyBadges(prof, prooflyData.score, { clientTotal: ratingStats.total })
        : [];
      const strengths = typeof buildStrengthPoints === 'function'
        ? buildStrengthPoints(prof, 'prof', prooflyData.score, prooflyData.groups)
        : [];

      const heroLines = [];
      if (prof.current_establishment?.name) {
        const estId = prof.current_establishment.id;
        heroLines.push(`📍 <span class="estab-link" style="cursor:pointer;" onclick="navigateToProfile('estabelecimento','${estId}')">${escapeHtml(prof.current_establishment.name)}</span>`);
      } else {
        heroLines.push('📍 Autônomo');
      }
      if (prof.profile?.years_experience) heroLines.push(`⏳ ${prof.profile.years_experience} anos de experiência`);
      if (prof.price_range) heroLines.push(`💰 ${escapeHtml(prof.price_range)}`);
      if (prof.profile?.instagram) {
        const ig = prof.profile.instagram.replace('@', '');
        heroLines.push(`📷 <a href="https://instagram.com/${ig}" target="_blank" rel="noopener" style="color:#f9a8d4;">@${escapeHtml(ig)}</a>`);
      }

      const atendimentosLabel = totalReviews >= 50 ? 'Mais de 50 clientes atendidos' :
        totalReviews >= 20 ? 'Mais de 20 clientes atendidos' :
        totalReviews >= 10 ? 'Mais de 10 clientes atendidos' :
        totalReviews > 0 ? `${totalReviews} clientes atendidos` : 'Ainda sem atendimentos registrados';

      const photos = getProfilePhotos(prof);
      let html = ProfileCard.renderHero({
        name: prof.name,
        subtitle: prof.profile?.specialty || prof.specialty || 'Profissional',
        lines: heroLines,
        avatarUrl: prof.avatar_url,
        photos,
        entityId: prof.id,
        matchPercent: matchInsight.percent,
        matchInsight,
        prooflyScore: prooflyData.score,
        badges,
        type: 'prof',
        avgRating,
        totalReviews
      });

      const estabReviewsRaw = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF).slice(0, 5)
        : [];
      const profReviewCtx = { entityType: 'prof', targetProfName: prof.name };
      if (viewerEst && typeof renderContratanteMatchBlock === 'function') {
        html += renderContratanteMatchBlock(prof, viewerEst);
      }
      html += ProfileCard.buildProfessionalProfileBody({
        prof, matchInsight, prooflyData, allReviewsRaw, clientReviewsAll,
        estabReviewsRaw, avgRating, totalReviews, strengths, workHistory, profReviewCtx,
        hiringPrivate
      });

      els.content.innerHTML = html;
      document.title = `${prof.name} — Ranking Pro`;
      if (viewerEst && typeof HiringFlow !== 'undefined') {
        window._hiringDrawerProf = prof;
        window._hiringDrawerEst = viewerEst;
        const existing = HiringFlow.getActiveProposal(viewerEst.id, prof.id);
        const hireLabel = existing ? '📋 Ver proposta de contratação' : '🤝 Propor contratação';
        setPageActions(`
          <div class="drawer-actions-inner" style="display:flex;flex-direction:column;gap:10px;">
            <button type="button" class="btn btn-tinder-primary btn-tinder-xl" onclick="HiringFlow.openProposalModal('${prof.id}')">${hireLabel}</button>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.abrirAvaliacaoProf('${prof.id}')">⭐ Avaliar profissional</button>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.compartilharPerfil('profissional','${prof.id}','${escapeHtml(prof.name)}')">🔗 Compartilhar</button>
          </div>
        `);
      } else {
        setPageActions(ProfileCard.renderDrawerActions({
          primaryLabel: '⭐ Avaliar este profissional',
          primaryOnclick: `ProfilePageView.abrirAvaliacaoProf('${prof.id}')`,
          likeType: 'prof',
          likeId: prof.id,
          favType: 'prof',
          favId: prof.id,
          favName: prof.name,
          showReviewsBtn: true,
          shareOnclick: `ProfilePageView.compartilharPerfil('profissional','${prof.id}','${escapeHtml(prof.name)}')`
        }));
      }
    } catch (e) {
      els.content.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
      console.error(e);
    }
  }

  async function loadEstablishmentProfile(id) {
    drawerTipo = 'estabelecimento';
    drawerId = id;
    els.content.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
    setPageActions('');

    try {
      const data = await fetchAPI(
        `/rest/v1/establishments?id=eq.${id}&select=*,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,target_audience,gallery_urls,owner_user_id`
      );
      if (!data.length) {
        els.content.innerHTML = '<p style="color:red;">Estabelecimento não encontrado.</p>';
        return;
      }
      const e = data[0];
      const session = typeof getSession === 'function' ? getSession() : null;
      const viewerId = session?.userId || null;
      const viewerProfId = session?.professionalId || null;
      const isOwner = viewerId && e.owner_user_id === viewerId;
      const isProfessional = !!viewerProfId;

      const matchInsight = typeof buildMatchInsight === 'function'
        ? buildMatchInsight(e, 'est', getMatchTagsEst())
        : { percent: computeDrawerMatchPercent(e, false), sharedTags: [], headline: '', subline: '', tier: 'cool' };

      const allReviewsRaw = typeof fetchReviews === 'function'
        ? await fetchReviews(`establishment_id=eq.${id}`, { viewContext: { entityType: 'est', establishmentId: id, targetEstName: e.name } })
        : await fetchAPI(`/rest/v1/reviews?establishment_id=eq.${id}&select=rating,comment,created_at,verified,review_type,source&order=created_at.desc`);
      const prooflyData = typeof calcularProoflyScoreFromReviews === 'function'
        ? calcularProoflyScoreFromReviews(allReviewsRaw, id, 'est')
        : { score: calcularProoflyScoreRapido?.(e, 'est'), groups: {}, clientStats: {}, estabStats: {}, social: getMockSocialSignals?.(id, 'est') };
      let allReviews = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.CLIENT_TO_EST)
        : allReviewsRaw.filter(r => r.review_type === 'client_to_establishment' || !r.review_type);
      if (!allReviews.length) allReviews = allReviewsRaw.filter(r => !r.professional_id);

      const ratingStats = prooflyData.clientStats?.total ? prooflyData.clientStats : computeRatingStats(allReviews);
      const avgRating = ratingStats.total ? ratingStats.avg : (e.avg_rating || 0);
      const totalReviews = ratingStats.total || e.total_reviews || 0;
      const badges = typeof getProoflyBadges === 'function'
        ? getProoflyBadges(e, prooflyData.score, { clientTotal: ratingStats.total })
        : [];
      const strengths = typeof buildStrengthPoints === 'function'
        ? buildStrengthPoints(e, 'est', prooflyData.score, prooflyData.groups)
        : [];

      const reviewOffset = currentPageEstReviews * EST_REVIEWS_PER_PAGE;
      const reviewsPage = allReviews.slice(reviewOffset, reviewOffset + EST_REVIEWS_PER_PAGE);
      const endereco = e.address || [e.street, e.number, e.neighborhood, e.city, e.state, e.country].filter(Boolean).join(', ');
      const heroLines = [];
      if (endereco) heroLines.push(`📍 ${escapeHtml(endereco)}`);
      if (e.phone) heroLines.push(`📞 ${escapeHtml(e.phone)}`);
      if (e.target_audience) heroLines.push(`🎯 ${escapeHtml(e.target_audience)}`);
      if (e.instagram) {
        const ig = e.instagram.replace('@', '');
        heroLines.push(`📷 <a href="https://instagram.com/${ig}" target="_blank" rel="noopener" style="color:#f9a8d4;">@${escapeHtml(ig)}</a>`);
      }

      const photos = getProfilePhotos(e);
      let html = ProfileCard.renderHero({
        name: e.name,
        subtitle: e.type || 'Estabelecimento',
        lines: heroLines,
        avatarUrl: e.avatar_url,
        photos,
        entityId: e.id,
        matchPercent: !isOwner ? matchInsight.percent : null,
        matchInsight: !isOwner ? matchInsight : null,
        prooflyScore: prooflyData.score,
        badges,
        type: 'est',
        avgRating,
        totalReviews
      });

      // ===== OWNER SECTION =====
      if (isOwner) {
        let prosHere = [];
        let pendingRequests = [];
        try {
          const links = await fetchAPI(
            `/rest/v1/professional_establishments?establishment_id=eq.${id}&select=professional_id,is_current,professional:professional_id(id,name,avatar_url,specialty)&is_current=eq.true&limit=50`
          );
          prosHere = (links || []).map(l => l.professional).filter(Boolean);
        } catch {}
        try {
          const reqs = await fetchAPI(
            `/rest/v1/work_interest_requests?establishment_id=eq.${id}&select=*,professional:professional_id(name,specialty,avatar_url)&order=created_at.desc&limit=20`
          );
          pendingRequests = (reqs || []).filter(Boolean);
        } catch {}

        html += `
        <div class="tinder-profile-content">
          <div class="profile-decision-stack">
            <div class="tinder-section glass-surface" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;">
              <div style="text-align:center;padding:8px 0;">
                <div style="font-size:32px;margin-bottom:4px;">🏪</div>
                <div style="font-weight:700;font-size:18px;">Seu estabelecimento</div>
                <div style="font-size:14px;opacity:0.9;">${prosHere.length} profissional(is) alocado(s) aqui</div>
              </div>
            </div>`;

        if (prosHere.length) {
          html += `<div class="tinder-section glass-surface"><div class="tinder-section-title">👥 Equipe atual</div>`;
          prosHere.forEach(p => {
            html += `
            <div class="tinder-prof-row" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;" onclick="navigateToProfile('profissional','${p.id}')">
              <img src="${avatarSrc(p.avatar_url)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%2290%22 font-size=%2290%22>👤</text></svg>'">
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${esc(p.name)}</div>
                <div style="font-size:12px;color:#64748b;">${esc(p.specialty || 'Profissional')}</div>
              </div>
              <span style="font-size:18px;">→</span>
            </div>`;
          });
          html += `</div>`;
        }

        if (pendingRequests.length) {
          html += `<div class="tinder-section glass-surface"><div class="tinder-section-title">📋 Interessados em trabalhar aqui</div>`;
          pendingRequests.forEach(req => {
            const p = req.professional || {};
            html += `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.04);">
              <img src="${avatarSrc(p.avatar_url)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%2290%22 font-size=%2290%22>👤</text></svg>'">
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${esc(p.name || 'Profissional')}</div>
                <div style="font-size:12px;color:#64748b;">${esc(p.specialty || '')}</div>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-small" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;" onclick="ProfilePageView.responderInteresse('${req.id}','accepted','${p.id}')">✓ Aceitar</button>
                <button class="btn btn-small" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;" onclick="ProfilePageView.responderInteresse('${req.id}','rejected','${p.id}')">✕ Recusar</button>
              </div>
            </div>`;
          });
          html += `</div>`;
        }

        html += `
            <div class="tinder-section glass-surface">
              <div class="tinder-section-title">📊 Estatísticas</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#6366f1;">${avgRating}</div>
                  <div style="font-size:12px;color:#64748b;">⭐ Avaliação média</div>
                </div>
                <div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#6366f1;">${totalReviews}</div>
                  <div style="font-size:12px;color:#64748b;">📝 Avaliações</div>
                </div>
                <div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#6366f1;">${prosHere.length}</div>
                  <div style="font-size:12px;color:#64748b;">👥 Profissionais</div>
                </div>
                <div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#6366f1;">${badges.length}</div>
                  <div style="font-size:12px;color:#64748b;">🏅 Credenciais</div>
                </div>
              </div>
            </div>
          </div>
          <div id="drawer-reviews-section" class="profile-reviews-zone">
            ${renderOwnerReviews(allReviews, e)}
          </div>
        </div>`;

        els.content.innerHTML = html;
        document.title = `${e.name} — Meu estabelecimento`;
        setPageActions(`
          <div class="drawer-actions-inner" style="display:flex;flex-direction:column;gap:10px;">
            <a href="./establishment-dashboard.html" class="btn btn-tinder-primary btn-tinder-xl" style="text-decoration:none;text-align:center;">📊 Ir para dashboard</a>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.abrirAvaliacaoEst('${e.id}')">⭐ Ver avaliações recebidas</button>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.compartilharPerfil('estabelecimento','${e.id}','${escapeHtml(e.name)}')">🔗 Compartilhar</button>
          </div>
        `);
        return;
      }

      // ===== CLIENT / PROFESSIONAL VIEW =====
      const estReviewCtx = { entityType: 'est', establishmentId: id, targetEstName: e.name };
      let paginationHtml = '';
      if (totalReviews > EST_REVIEWS_PER_PAGE) {
        const totalPages = Math.ceil(totalReviews / EST_REVIEWS_PER_PAGE);
        paginationHtml = '<div class="pagination" style="margin-top:12px;">';
        if (currentPageEstReviews > 0) {
          paginationHtml += `<button class="btn btn-outline btn-small" onclick="ProfilePageView.irPaginaEstReviews(${currentPageEstReviews - 1})">← Anterior</button>`;
        }
        paginationHtml += `<span class="text-glass-muted" style="font-size:13px;padding:0 8px;">${currentPageEstReviews + 1} / ${totalPages}</span>`;
        if (currentPageEstReviews < totalPages - 1) {
          paginationHtml += `<button class="btn btn-outline btn-small" onclick="ProfilePageView.irPaginaEstReviews(${currentPageEstReviews + 1})">Próxima →</button>`;
        }
        paginationHtml += '</div>';
      }
      html += ProfileCard.buildEstablishmentProfileBody({
        estab: e, matchInsight, prooflyData, allReviews: reviewsPage, avgRating, totalReviews,
        strengths, estReviewCtx, paginationHtml,
        tagCategories: [
          { icon: '🏗️', label: 'Infraestrutura', tags: e.infra_tags },
          { icon: '🎵', label: 'Música Ambiente', tags: e.music_tags },
          { icon: '💎', label: 'Posicionamento', tags: e.positioning_tags },
          { icon: '👥', label: 'Público', tags: e.audience_tags },
          { icon: '🌟', label: 'Vibe', tags: e.vibe_tags }
        ]
      });

      els.content.innerHTML = html;
      document.title = `${e.name} — Ranking Pro`;

      // ===== ACTIONS: professional vs client =====
      if (isProfessional) {
        setPageActions(`
          <div class="drawer-actions-inner" style="display:flex;flex-direction:column;gap:10px;">
            <button type="button" class="btn btn-tinder-primary btn-tinder-xl" onclick="ProfilePageView.quererTrabalhar('${e.id}','${esc(e.name)}')">
              💼 Quero trabalhar aqui
            </button>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.abrirAvaliacaoEst('${e.id}')">⭐ Avaliar este local</button>
            <button type="button" class="btn btn-outline btn-tinder-xl" onclick="ProfilePageView.compartilharPerfil('estabelecimento','${e.id}','${escapeHtml(e.name)}')">🔗 Compartilhar</button>
          </div>
        `);
      } else {
        setPageActions(ProfileCard.renderDrawerActions({
          primaryLabel: '⭐ Avaliar este estabelecimento',
          primaryOnclick: `ProfilePageView.abrirAvaliacaoEst('${e.id}')`,
          likeType: 'est',
          likeId: e.id,
          favType: 'est',
          favId: e.id,
          favName: e.name,
          showReviewsBtn: true,
          shareOnclick: `ProfilePageView.compartilharPerfil('estabelecimento','${e.id}','${escapeHtml(e.name)}')`
        }));
      }
    } catch (err) {
      els.content.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
      console.error(err);
    }
  }

  function renderOwnerReviews(reviews, estab) {
    if (!reviews.length) return '<div class="tinder-section glass-surface"><p class="text-glass-muted" style="text-align:center;padding:20px;">Nenhuma avaliação recebida ainda.</p></div>';
    let html = '<div class="tinder-section-glass-surface"><div class="tinder-section-title">📝 Últimas avaliações</div>';
    reviews.slice(0, 5).forEach(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const date = r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '';
      html += `
      <div style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.04);">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#f59e0b;font-size:16px;">${stars}</span>
          <span style="font-size:12px;color:#94a3b8;">${date}</span>
        </div>
        ${r.comment ? `<div style="font-size:14px;color:#475569;margin-top:4px;">${esc(r.comment)}</div>` : ''}
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${r.review_type === 'client_to_establishment' ? 'Cliente' : 'Profissional'}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function abrirAvaliacaoProf(id) {
    const session = getSession();
    if (!session?.userId) {
      localStorage.setItem('avaliarProfId', id);
      global.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(`profile-page.html?tipo=profissional&id=${id}`)}`;
      return;
    }
    document.getElementById('avaliarDrawerForm')?.remove();
    avaliacaoProfId = id;
    avaliacaoRating = 0;
    els.content.insertAdjacentHTML('beforeend', `
      <div id="avaliarDrawerForm" class="perfil-avaliar-form">
        <h4>⭐ Avaliar profissional</h4>
        <div class="stars-input" id="starsInputDrawer">
          ${[1,2,3,4,5].map(n => `<span class="star-input" data-value="${n}" onclick="ProfilePageView.setRatingProf(${n})">☆</span>`).join('')}
        </div>
        <textarea id="avaliarCommentDrawer" placeholder="Deixe seu comentário..."></textarea>
        <button class="btn btn-green btn-full" onclick="ProfilePageView.confirmarAvaliacaoProf()">✅ Enviar avaliação</button>
      </div>
    `);
    document.getElementById('avaliarDrawerForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function abrirAvaliacaoEst(id) {
    const session = getSession();
    if (!session?.userId) {
      global.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(`profile-page.html?tipo=estabelecimento&id=${id}`)}`;
      return;
    }
    document.getElementById('avaliarEstabDrawerForm')?.remove();
    avaliacaoEstabId = id;
    avaliacaoEstabRating = 0;
    els.content.insertAdjacentHTML('beforeend', `
      <div id="avaliarEstabDrawerForm" class="perfil-avaliar-form">
        <h4>⭐ Avaliar estabelecimento</h4>
        <div class="stars-input" id="starsInputEstabDrawer">
          ${[1,2,3,4,5].map(n => `<span class="star-input" data-value="${n}" onclick="ProfilePageView.setRatingEst(${n})">☆</span>`).join('')}
        </div>
        <textarea id="avaliarEstabCommentDrawer" placeholder="Deixe seu comentário sobre o estabelecimento..."></textarea>
        <button class="btn btn-green btn-full" onclick="ProfilePageView.confirmarAvaliacaoEst()">✅ Enviar avaliação</button>
      </div>
    `);
    document.getElementById('avaliarEstabDrawerForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function confirmarAvaliacaoProf() {
    if (!avaliacaoProfId || !avaliacaoRating) {
      await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
      return;
    }
    const ok = await showConfirm({
      title: '⭐ Confirmar avaliação',
      message: `Avaliar com ${avaliacaoRating} estrela${avaliacaoRating > 1 ? 's' : ''}?`,
      confirmText: 'Sim, avaliar',
      cancelText: 'Cancelar',
      danger: false
    });
    if (!ok) return;
    const comment = document.getElementById('avaliarCommentDrawer')?.value.trim() || '';
    await submitReview({ rating: avaliacaoRating, comment, professionalId: avaliacaoProfId });
    await showAlert('✅ Sucesso!', 'Avaliação registrada!');
    document.getElementById('avaliarDrawerForm')?.remove();
    loadProfessionalProfile(avaliacaoProfId);
  }

  async function confirmarAvaliacaoEst() {
    if (!avaliacaoEstabId || !avaliacaoEstabRating) {
      await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
      return;
    }
    const ok = await showConfirm({
      title: '⭐ Confirmar avaliação',
      message: `Avaliar com ${avaliacaoEstabRating} estrela${avaliacaoEstabRating > 1 ? 's' : ''}?`,
      confirmText: 'Sim, avaliar',
      cancelText: 'Cancelar',
      danger: false
    });
    if (!ok) return;
    const comment = document.getElementById('avaliarEstabCommentDrawer')?.value.trim() || '';
    await submitReview({ rating: avaliacaoEstabRating, comment, establishmentId: avaliacaoEstabId });
    await showAlert('✅ Sucesso!', 'Avaliação registrada!');
    document.getElementById('avaliarEstabDrawerForm')?.remove();
    loadEstablishmentProfile(avaliacaoEstabId);
  }

  async function compartilharPerfil(tipo, id, nome) {
    const url = profilePageUrl(tipo, id);
    const texto = `Confira o perfil de ${nome} no Ranking Pro!\n${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${nome} — Ranking Pro`, text: texto, url });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      if (typeof showAlert === 'function') {
        await showAlert('🔗 Link copiado!', 'Link do perfil copiado para a área de transferência.');
      }
    } catch {
      if (typeof showAlert === 'function') {
        await showAlert('📋 Copie o link', url);
      }
    }
  }

  async function quererTrabalhar(estabId, estabName) {
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.professionalId) {
      await showAlert('⚠️ Atenção', 'Você precisa estar logado como profissional para usar esta funcionalidade.');
      return;
    }
    const ok = await showConfirm({
      title: '💼 Quero trabalhar aqui',
      message: `Confirmar interesse em trabalhar em "${estabName}"? O proprietário será notificado.`,
      confirmText: 'Sim, quero!',
      cancelText: 'Cancelar',
      danger: false
    });
    if (!ok) return;
    try {
      const existing = await fetchAPI(`/rest/v1/professional_establishments?professional_id=eq.${session.professionalId}&establishment_id=eq.${estabId}&limit=1`);
      if (existing?.length) {
        await showAlert('ℹ️', 'Você já tem vínculo ou já manifestou interesse neste local.');
        return;
      }
      await fetchAPI('/rest/v1/professional_establishments', 'POST', {
        professional_id: session.professionalId,
        establishment_id: estabId,
        is_current: false,
        started_at: new Date().toISOString()
      });
      await showAlert('✅ Interesse registrado!', 'O proprietário receberá sua manifestação de interesse.');
    } catch (e) {
      await showAlert('❌ Erro', 'Não foi possível registrar seu interesse: ' + e.message);
    }
  }

  async function responderInteresse(reqId, status, profId) {
    await showAlert('ℹ️', status === 'accepted' ? '✅ Profissional aceito! Em breve vocês serão conectados.' : '❌ Solicitação recusada.');
  }

  global.ProfilePageView = {
    init(contentId, actionsId) {
      els.content = document.getElementById(contentId);
      els.actions = document.getElementById(actionsId);
      global.scrollDrawerToReviews = function() {
        document.getElementById('drawer-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    },
    loadFromUrl() {
      const params = new URLSearchParams(global.location.search);
      let tipo = params.get('tipo');
      let id = params.get('id');
      if (!id && params.get('professionalId')) {
        tipo = 'profissional';
        id = params.get('professionalId');
      } else if (!id && params.get('establishmentId')) {
        tipo = 'estabelecimento';
        id = params.get('establishmentId');
      }
      if (!tipo || !id) {
        const back = typeof defaultSearchPageUrl === 'function' ? defaultSearchPageUrl() : './discover.html';
        els.content.innerHTML = `<p class="empty-msg">Perfil não informado. <a href="${back}">Voltar à busca</a></p>`;
        return;
      }
      if (typeof incrementProfileView === 'function') {
        incrementProfileView(id, tipo === 'profissional' ? 'prof' : 'est');
      }
      if (tipo === 'profissional') loadProfessionalProfile(id);
      else loadEstablishmentProfile(id);
    },
    abrirAvaliacaoProf,
    abrirAvaliacaoEst,
    setRatingProf(v) {
      avaliacaoRating = v;
      document.querySelectorAll('#starsInputDrawer .star-input').forEach((el, i) => {
        el.textContent = i < v ? '★' : '☆';
        el.classList.toggle('active', i < v);
      });
    },
    setRatingEst(v) {
      avaliacaoEstabRating = v;
      document.querySelectorAll('#starsInputEstabDrawer .star-input').forEach((el, i) => {
        el.textContent = i < v ? '★' : '☆';
        el.classList.toggle('active', i < v);
      });
    },
    confirmarAvaliacaoProf,
    confirmarAvaliacaoEst,
    irPaginaEstReviews(page) {
      currentPageEstReviews = page;
      if (drawerTipo === 'estabelecimento' && drawerId) loadEstablishmentProfile(drawerId);
    },
    quererTrabalhar,
    responderInteresse,
    compartilharPerfil
  };
})(window);