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
  $('communityBtn').addEventListener('click', () => notify('Community posting is a mockup for now. No data is sent anywhere.'));
})();