(() => {
  const $ = (id) => document.getElementById(id);
  const toast = $('toast');

  // Site-wide language selector. Choice is shared by the store and workshop.
  const languageSelect = $('languageSelect');
  const translations = {
    en: {
      languageLabel:'Language', store:'STORE', community:'COMMUNITY', about:'ABOUT', support:'SUPPORT',
      freeGames:'＋ Free Games', signIn:'Sign in', yourStore:'Your Store', newNoteworthy:'New & Noteworthy', categories:'Categories', pointsShop:'Points Shop', news:'News', labs:'Labs',
      yourStoreSide:'YOUR STORE', browse:'BROWSE CATEGORIES', features:'SMOKE FEATURES', home:'Home', discovery:'Discovery Queue', wishlist:'Wishlist', points:'Points Shop', stats:'Stats', topSellers:'Top Sellers', newReleases:'New Releases', upcoming:'Upcoming', specials:'Specials', vr:'Virtual Reality', controller:'Controller Friendly',
      search:'search the store', discover:'DISCOVER YOUR NEXT GAME', seeMore:'See more　›', action:'Action', adventure:'Adventure', casual:'Casual', noGames:'No games found. Try another search.',
      disclaimer:'The euro prices are fictional parody jokes. Games still launch directly in your browser; no checkout, purchases, or downloads are enabled.',
      workshop:'SMOKE Workshop', workshopDesc:'Create and share your own games with the community.', exploreWorkshop:'Explore Workshop　›',
      communityTitle:'SMOKE COMMUNITY', playTogether:'Play together ↗', communityIntro:'Talk games, share opinions, and post your latest gaming chaos. Posts are shared with everyone visiting SMOKE.',
      displayName:'Display name', category:'Category', discussionTitle:'Discussion title', message:'Message', postDiscussion:'Post discussion', recent:'Recent discussions', refresh:'↻ Refresh',
      communityFootnote:'SMOKE is a parody project. Do not post passwords, private information, or harmful content. Public posts are visible to all visitors.',
      footerDesc:'A free browser gaming hub. Play original games instantly — no purchases, subscriptions, or downloads required.',
      workshopPage:'Workshop Games', workshopIntro:'Every game currently featured on SMOKE, collected in one place. Pick a game to launch it in your browser — no downloads or purchases.',
      searchAll:'Search all games…', emptySearch:'No games match that search.', createGame:'CREATE A GAME', online:'SMOKE ONLINE',
      gamesFound:n=>n+' games', gameFound:n=>n+' game'
    },
    sq: {
      languageLabel:'Gjuha', store:'DYQANI', community:'KOMUNITETI', about:'RRETH NESH', support:'NDIHMË',
      freeGames:'＋ Lojëra falas', signIn:'Hyr', yourStore:'Dyqani yt', newNoteworthy:'Të reja dhe të veçanta', categories:'Kategoritë', pointsShop:'Dyqani i pikëve', news:'Lajme', labs:'Laboratori',
      yourStoreSide:'DYQANI YT', browse:'SHF shfleto kategoritë'.replace('SHF shfleto','SHFLETO'), features:'VEÇORITË E SMOKE', home:'Kryefaqja', discovery:'Radha e zbulimit', wishlist:'Lista e dëshirave', points:'Dyqani i pikëve', stats:'Statistikat', topSellers:'Më të shiturat', newReleases:'Publikimet e reja', upcoming:'Së shpejti', specials:'Oferta', vr:'Realitet virtual', controller:'Mbështetje për kontrollues',
      search:'kërko lojëra', discover:'ZBULO LOJËN TËNDE TË RADHËS', seeMore:'Shiko më shumë　›', action:'Aksion', adventure:'Aventurë', casual:'Rastësore', noGames:'Nuk u gjet asnjë lojë. Provo një kërkim tjetër.',
      disclaimer:'Çmimet në euro janë shaka parodike. Lojërat hapen drejtpërdrejt në shfletues; nuk ka blerje apo shkarkime.',
      workshop:'SMOKE Workshop', workshopDesc:'Krijo dhe ndaj lojërat e tua me komunitetin.', exploreWorkshop:'Eksploro Workshop　›',
      communityTitle:'KOMUNITETI SMOKE', playTogether:'Luaj së bashku ↗', communityIntro:'Diskuto lojërat, ndaj mendimet dhe publiko aventurat e tua. Postimet janë të dukshme për vizitorët e SMOKE.',
      displayName:'Emri i shfaqur', category:'Kategoria', discussionTitle:'Titulli i diskutimit', message:'Mesazhi', postDiscussion:'Publiko diskutimin', recent:'Diskutimet e fundit', refresh:'↻ Rifresko',
      communityFootnote:'SMOKE është një projekt parodik. Mos publiko fjalëkalime ose informacione private. Postimet publike shihen nga të gjithë.',
      footerDesc:'Një qendër falas lojërash në shfletues. Luaj menjëherë — pa blerje, abonime apo shkarkime.',
      workshopPage:'Lojërat e Workshop', workshopIntro:'Të gjitha lojërat e SMOKE në një vend. Zgjidh një lojë për ta hapur në shfletues — pa shkarkime apo blerje.',
      searchAll:'Kërko të gjitha lojërat…', emptySearch:'Nuk ka lojëra që përputhen me kërkimin.', createGame:'KRIJO LOJË', online:'SMOKE ONLINE',
      gamesFound:n=>n+' lojëra', gameFound:n=>n+' lojë'
    },
    mk: {
      languageLabel:'Јазик', store:'ПРОДАВНИЦА', community:'ЗАЕДНИЦА', about:'ЗА НАС', support:'ПОДДРШКА',
      freeGames:'＋ Бесплатни игри', signIn:'Најава', yourStore:'Твоја продавница', newNoteworthy:'Ново и интересно', categories:'Категории', pointsShop:'Продавница за поени', news:'Вести', labs:'Лабораторија',
      yourStoreSide:'ТВОЈА ПРОДАВНИЦА', browse:'ПРЕБАРАЈ КАТЕГОРИИ', features:'SMOKE ФУНКЦИИ', home:'Почетна', discovery:'Ред за откривање', wishlist:'Листа на желби', points:'Продавница за поени', stats:'Статистика', topSellers:'Најпродавани', newReleases:'Нови изданија', upcoming:'Наскоро', specials:'Попусти', vr:'Виртуелна реалност', controller:'Поддршка за контролер',
      search:'пребарај игри', discover:'ОТКРИЈ ЈА СЛЕДНАТА ИГРА', seeMore:'Види повеќе　›', action:'Акција', adventure:'Авантура', casual:'Опуштени', noGames:'Не се пронајдени игри. Обиди се повторно.',
      disclaimer:'Цените во евра се пародија. Игрите се отвораат во прелистувачот; нема купување или преземање.',
      workshop:'SMOKE Workshop', workshopDesc:'Создавај и споделувај игри со заедницата.', exploreWorkshop:'Истражи Workshop　›',
      communityTitle:'SMOKE ЗАЕДНИЦА', playTogether:'Играјте заедно ↗', communityIntro:'Разговарај за игри, споделувај мислења и објавувај новости. Објавите се видливи за посетителите на SMOKE.',
      displayName:'Име за прикажување', category:'Категорија', discussionTitle:'Наслов на дискусијата', message:'Порака', postDiscussion:'Објави дискусија', recent:'Неодамнешни дискусии', refresh:'↻ Освежи',
      communityFootnote:'SMOKE е пародичен проект. Не објавувај лозинки или приватни информации. Јавните објави се видливи за сите.',
      footerDesc:'Бесплатна веб-игрална платформа. Играј веднаш — без купувања, претплати или преземања.',
      workshopPage:'Workshop игри', workshopIntro:'Сите игри на SMOKE на едно место. Избери игра за да ја отвориш во прелистувачот — без преземања или купувања.',
      searchAll:'Пребарај ги сите игри…', emptySearch:'Нема игри што одговараат на пребарувањето.', createGame:'КРЕИРАЈ ИГРА', online:'SMOKE ONLINE',
      gamesFound:n=>n+' игри', gameFound:n=>n+' игра'
    },
    es: {
      languageLabel:'Idioma', store:'TIENDA', community:'COMUNIDAD', about:'ACERCA DE', support:'AYUDA',
      freeGames:'＋ Juegos gratis', signIn:'Iniciar sesión', yourStore:'Tu tienda', newNoteworthy:'Novedades', categories:'Categorías', pointsShop:'Tienda de puntos', news:'Noticias', labs:'Laboratorio',
      yourStoreSide:'TU TIENDA', browse:'EXPLORAR CATEGORÍAS', features:'FUNCIONES DE SMOKE', home:'Inicio', discovery:'Cola de descubrimiento', wishlist:'Lista de deseos', points:'Tienda de puntos', stats:'Estadísticas', topSellers:'Más vendidos', newReleases:'Nuevos lanzamientos', upcoming:'Próximamente', specials:'Ofertas', vr:'Realidad virtual', controller:'Compatible con mando',
      search:'buscar juegos', discover:'DESCUBRE TU PRÓXIMO JUEGO', seeMore:'Ver más　›', action:'Acción', adventure:'Aventura', casual:'Casual', noGames:'No se encontraron juegos. Prueba otra búsqueda.',
      disclaimer:'Los precios en euros son bromas ficticias. Los juegos se ejecutan en el navegador; no hay compras ni descargas.',
      workshop:'SMOKE Workshop', workshopDesc:'Crea y comparte tus propios juegos con la comunidad.', exploreWorkshop:'Explorar Workshop　›',
      communityTitle:'COMUNIDAD SMOKE', playTogether:'Jugar juntos ↗', communityIntro:'Habla de juegos, comparte opiniones y publica tus aventuras. Las publicaciones son visibles para quienes visitan SMOKE.',
      displayName:'Nombre visible', category:'Categoría', discussionTitle:'Título del debate', message:'Mensaje', postDiscussion:'Publicar debate', recent:'Debates recientes', refresh:'↻ Actualizar',
      communityFootnote:'SMOKE es un proyecto paródico. No publiques contraseñas ni información privada. Las publicaciones son públicas.',
      footerDesc:'Un portal gratuito de juegos para navegador. Juega al instante, sin compras, suscripciones ni descargas.',
      workshopPage:'Juegos del Workshop', workshopIntro:'Todos los juegos de SMOKE reunidos en un solo lugar. Elige uno para abrirlo en tu navegador, sin descargas ni compras.',
      searchAll:'Buscar todos los juegos…', emptySearch:'Ningún juego coincide con la búsqueda.', createGame:'CREAR UN JUEGO', online:'SMOKE ONLINE',
      gamesFound:n=>n+' juegos', gameFound:n=>n+' juego'
    },
    fr: {
      languageLabel:'Langue', store:'BOUTIQUE', community:'COMMUNAUTÉ', about:'À PROPOS', support:'ASSISTANCE',
      freeGames:'＋ Jeux gratuits', signIn:'Connexion', yourStore:'Votre boutique', newNoteworthy:'Nouveautés', categories:'Catégories', pointsShop:'Boutique de points', news:'Actualités', labs:'Laboratoire',
      yourStoreSide:'VOTRE BOUTIQUE', browse:'PARCOURIR LES CATÉGORIES', features:'FONCTIONS SMOKE', home:'Accueil', discovery:'File de découverte', wishlist:'Liste de souhaits', points:'Boutique de points', stats:'Statistiques', topSellers:'Meilleures ventes', newReleases:'Nouveautés', upcoming:'À venir', specials:'Promotions', vr:'Réalité virtuelle', controller:'Compatible manette',
      search:'rechercher des jeux', discover:'DÉCOUVREZ VOTRE PROCHAIN JEU', seeMore:'Voir plus　›', action:'Action', adventure:'Aventure', casual:'Détente', noGames:'Aucun jeu trouvé. Essayez une autre recherche.',
      disclaimer:'Les prix en euros sont des plaisanteries fictives. Les jeux se lancent dans le navigateur, sans achat ni téléchargement.',
      workshop:'SMOKE Workshop', workshopDesc:'Créez et partagez vos jeux avec la communauté.', exploreWorkshop:'Explorer Workshop　›',
      communityTitle:'COMMUNAUTÉ SMOKE', playTogether:'Jouer ensemble ↗', communityIntro:'Parlez de jeux, partagez vos avis et publiez vos aventures. Les publications sont visibles par tous les visiteurs de SMOKE.',
      displayName:'Nom affiché', category:'Catégorie', discussionTitle:'Titre de la discussion', message:'Message', postDiscussion:'Publier la discussion', recent:'Discussions récentes', refresh:'↻ Actualiser',
      communityFootnote:'SMOKE est un projet parodique. Ne publiez pas de mots de passe ni de données privées. Les publications sont publiques.',
      footerDesc:'Un portail gratuit de jeux dans le navigateur. Jouez instantanément, sans achat, abonnement ni téléchargement.',
      workshopPage:'Jeux Workshop', workshopIntro:'Tous les jeux présentés sur SMOKE, réunis au même endroit. Choisissez un jeu pour le lancer dans le navigateur, sans téléchargement ni achat.',
      searchAll:'Rechercher tous les jeux…', emptySearch:'Aucun jeu ne correspond à cette recherche.', createGame:'CRÉER UN JEU', online:'SMOKE ONLINE',
      gamesFound:n=>n+' jeux', gameFound:n=>n+' jeu'
    },
    de: {
      languageLabel:'Sprache', store:'STORE', community:'COMMUNITY', about:'ÜBER UNS', support:'HILFE',
      freeGames:'＋ Gratis-Spiele', signIn:'Anmelden', yourStore:'Dein Store', newNoteworthy:'Neu und bemerkenswert', categories:'Kategorien', pointsShop:'Punkteshop', news:'Neuigkeiten', labs:'Labor',
      yourStoreSide:'DEIN STORE', browse:'KATEGORIEN DURCHSUCHEN', features:'SMOKE-FUNKTIONEN', home:'Startseite', discovery:'Entdeckungswarteschlange', wishlist:'Wunschliste', points:'Punkteshop', stats:'Statistiken', topSellers:'Bestseller', newReleases:'Neuerscheinungen', upcoming:'Demnächst', specials:'Angebote', vr:'Virtuelle Realität', controller:'Controllerfreundlich',
      search:'Spiele suchen', discover:'ENTDECKE DEIN NÄCHSTES SPIEL', seeMore:'Mehr anzeigen　›', action:'Action', adventure:'Abenteuer', casual:'Gelegenheitsspiele', noGames:'Keine Spiele gefunden. Versuche eine andere Suche.',
      disclaimer:'Die Europreise sind fiktive Parodie-Witze. Spiele starten im Browser; es gibt keine Käufe oder Downloads.',
      workshop:'SMOKE Workshop', workshopDesc:'Erstelle und teile deine eigenen Spiele mit der Community.', exploreWorkshop:'Workshop erkunden　›',
      communityTitle:'SMOKE COMMUNITY', playTogether:'Zusammen spielen ↗', communityIntro:'Sprich über Spiele, teile Meinungen und poste dein Gaming-Chaos. Beiträge sind für alle SMOKE-Besucher sichtbar.',
      displayName:'Anzeigename', category:'Kategorie', discussionTitle:'Diskussionstitel', message:'Nachricht', postDiscussion:'Diskussion veröffentlichen', recent:'Neueste Diskussionen', refresh:'↻ Aktualisieren',
      communityFootnote:'SMOKE ist ein Parodieprojekt. Veröffentliche keine Passwörter oder privaten Informationen. Öffentliche Beiträge sind für alle sichtbar.',
      footerDesc:'Ein kostenloses Browser-Spieleportal. Spiele sofort – ohne Käufe, Abos oder Downloads.',
      workshopPage:'Workshop-Spiele', workshopIntro:'Alle aktuell auf SMOKE vorgestellten Spiele an einem Ort. Wähle ein Spiel, um es im Browser zu starten – ohne Downloads oder Käufe.',
      searchAll:'Alle Spiele suchen…', emptySearch:'Keine Spiele passen zu dieser Suche.', createGame:'SPIEL ERSTELLEN', online:'SMOKE ONLINE',
      gamesFound:n=>n+' Spiele', gameFound:n=>n+' Spiel'
    }
  };
  function applyLanguage(code) {
    const lang = translations[code] ? code : 'en';
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key] && typeof t[key] === 'string') el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (t[key]) el.placeholder = t[key];
    });
    const label = $('languageLabel');
    if (label) label.textContent = t.languageLabel;
    const count = $('count');
    if (count) {
      const n = document.querySelectorAll('.card').length;
      count.textContent = lang === 'en' ? n + ' games' : t.gamesFound(n);
    }
    const empty = $('empty');
    if (empty && empty.style.display !== 'none') empty.textContent = t.emptySearch;
    try { localStorage.setItem('smoke-language', lang); } catch (e) {}
    if (languageSelect) languageSelect.value = lang;
  }
  if (languageSelect) {
    let savedLanguage = 'en';
    try { savedLanguage = localStorage.getItem('smoke-language') || 'en'; } catch (e) {}
    languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
    applyLanguage(savedLanguage);
  }

  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  const nav = $('mainNav');
  $('menuToggle').addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    $('menuToggle').setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    $('menuToggle').setAttribute('aria-expanded', 'false');
  }));
  let activeFilter = 'all';
  const search = $('gameSearch');
  function filterGames() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('.game-card').forEach(card => {
      const normalize = value => value.toLowerCase().replace(/[^\\p{L}\\p{N}\\s]/gu, ' ').replace(/\\s+/g, ' ').trim();
      const searchableText = normalize((card.dataset.name || '') + ' ' + card.innerText);
      const matchesQuery = searchableText.includes(normalize(query));
      // A search checks the full catalog, regardless of the currently selected category.
      const matchesFilter = query !== '' || activeFilter === 'all' || card.dataset.category === activeFilter;
      const show = matchesQuery && matchesFilter;
      card.hidden = !show;
      if (show) visible++;
    });
    $('noResults').hidden = visible !== 0;
    const count = $('searchCount');
    if (count) {
      count.hidden = query === '';
      count.textContent = query === '' ? '' : visible + ' game' + (visible === 1 ? '' : 's') + ' found';
    }
  }
  search.addEventListener('input', filterGames);
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === button));
    filterGames();
  }));
  const dialog = $('gameDialog');
  const descriptions = {
    'Neon Drift': 'A high-speed arcade racer through a neon-soaked city. Brake lights are optional; vibes are mandatory.',
    'Mossbound': 'Wander through a strange, overgrown world where every path leads somewhere unexpected.',
    'Desk Goblin': 'A cozy little creature helps you procrastinate with extraordinary efficiency.',
    'Last Braincell': 'A chaotic multiplayer party game about teamwork, bad plans, and the last thought in your head.'
  };
  document.querySelectorAll('.details-btn').forEach(button => button.addEventListener('click', event => {
    if (!button.dataset.game || button.dataset.game === 'cross the hill') return;
    event.preventDefault();
    const name = button.dataset.game;
    $('dialogTitle').textContent = name;
    $('dialogText').textContent = descriptions[name] || 'A fictional SMOKE store listing.';
    dialog.showModal();
  }));
  $('dialogClose').addEventListener('click', () => dialog.close());
  $('dialogOk').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  $('loginBtn').addEventListener('click', () => notify('Sign-in is disabled in this parody demo. No accounts or passwords are collected.'));
  $('libraryBtn').addEventListener('click', () => notify('Your demo library is currently empty. No sign-in required — or available!'));
  // Public community discussion feed backed by the configured Supabase project.
  const communityForm = $('communityForm');
  const communityFeed = $('communityFeed');
  const communityStatus = $('communityStatus');
  const communitySubmit = $('communitySubmit');
  const communityConfig = window.SMOKE_SUPABASE_CONFIG || {};
  const communityReady = Boolean(communityConfig.url && communityConfig.anonKey &&
    !communityConfig.url.includes('YOUR_PROJECT') && !communityConfig.anonKey.includes('YOUR_SUPABASE'));
  const communityEndpoint = communityReady
    ? communityConfig.url.replace(/\/$/, '') + '/rest/v1/community_posts'
    : '';

  function communityHeaders(extra = {}) {
    return { apikey: communityConfig.anonKey, Authorization: 'Bearer ' + communityConfig.anonKey,
      'Content-Type': 'application/json', ...extra };
  }
  function safeText(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    return node;
  }
  function prettyDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }
  function renderCommunityPosts(posts) {
    communityFeed.replaceChildren();
    if (!posts.length) {
      communityFeed.append(safeText('p', 'community-loading', 'No discussions yet. Be the first to start one!'));
      return;
    }
    posts.forEach(post => {
      const card = safeText('article', 'community-post');
      const top = safeText('div', 'community-post-top');
      const meta = safeText('div', 'community-post-meta');
      meta.append(safeText('strong', 'community-author', post.display_name || 'Anonymous'), safeText('span', 'community-post-date', prettyDate(post.created_at)));
      top.append(safeText('span', 'community-category', post.category || 'General Discussion'), meta);
      const title = safeText('h4', 'community-post-title', post.title);
      const body = safeText('p', 'community-post-body', post.body);
      card.append(top, title, body);
      communityFeed.append(card);
    });
  }
  async function loadCommunity() {
    if (!communityReady) {
      communityStatus.textContent = 'Community database needs setup.';
      communityFeed.replaceChildren(safeText('p', 'community-error', 'The community database is not configured yet. Check supabase-config.js and run the updated supabase-setup.sql in your Supabase SQL Editor.'));
      communitySubmit.disabled = true;
      return;
    }
    communityStatus.textContent = 'Loading discussions…';
    $('communityRefresh').disabled = true;
    try {
      const response = await fetch(communityEndpoint + '?select=id,display_name,category,title,body,created_at&order=created_at.desc&limit=40', {
        headers: communityHeaders()
      });
      if (!response.ok) throw new Error(response.status === 404 || response.status === 400 ? 'Community table not found. Run the updated supabase-setup.sql in Supabase SQL Editor.' : 'Could not load posts (HTTP ' + response.status + ').');
      renderCommunityPosts(await response.json());
      communityStatus.textContent = 'Connected · posts are shared publicly';
      communitySubmit.disabled = false;
    } catch (error) {
      communityStatus.textContent = 'Could not connect';
      communityFeed.replaceChildren(safeText('p', 'community-error', error.message || 'Could not connect to the community database. Check your internet connection and Supabase settings.'));
      communitySubmit.disabled = true;
    } finally {
      $('communityRefresh').disabled = false;
    }
  }
  communityForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!communityReady || communitySubmit.disabled) return;
    const display_name = $('communityName').value.trim();
    const category = $('communityCategory').value;
    const title = $('communityTitle').value.trim();
    const body = $('communityBody').value.trim();
    if (!display_name || !title || !body) return;
    communitySubmit.disabled = true;
    communityStatus.textContent = 'Publishing…';
    try {
      const response = await fetch(communityEndpoint, {
        method: 'POST',
        headers: communityHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ display_name, category, title, body })
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(response.status === 401 || response.status === 403
          ? 'Supabase blocked the post. Check the table policies in supabase-setup.sql.'
          : 'Post failed (HTTP ' + response.status + '). ' + detail.slice(0, 180));
      }
      $('communityTitle').value = '';
      $('communityBody').value = '';
      await loadCommunity();
      notify('Discussion posted to the SMOKE community!');
    } catch (error) {
      communityStatus.textContent = 'Post failed';
      notify(error.message || 'Could not publish your discussion.');
      communitySubmit.disabled = false;
    }
  });
  $('communityRefresh').addEventListener('click', loadCommunity);
  loadCommunity();
})();