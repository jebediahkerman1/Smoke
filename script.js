(() => {
  const $ = (id) => document.getElementById(id);
  const toast = $('toast');
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
      const matchesName = card.dataset.name.toLowerCase().includes(query);
      const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
      const show = matchesName && matchesFilter;
      card.hidden = !show;
      if (show) visible++;
    });
    $('noResults').hidden = visible !== 0;
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