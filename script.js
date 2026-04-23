/* ── ZOOM LOCK ── */
try {
  const { webFrame } = require('electron');
  webFrame.setVisualZoomLevelLimits(1, 1);
} catch (_) {}

/* ── FALLBACK COVER ── */
const FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1e1e"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#g)"/>
  <text x="200" y="290" fill="#333" font-family="sans-serif" font-size="52" text-anchor="middle">🎮</text>
  <text x="200" y="340" fill="#444" font-family="sans-serif" font-size="18" text-anchor="middle">Sem capa</text>
</svg>
`)}`;

/* ── STATE ── */
const state = {
  games: [],
  filter: 'all',         // 'all' | 'completed' | 'playing'
  sort: 'recent',        // 'recent' | 'name' | 'hours' | 'rating'
  selectedGameId: null,
  pendingDeleteId: null,
  editingId: null,
};

/* ── ELEMENTS ── */
const el = {
  // nav
  navTabs:           document.querySelectorAll('.nav-tab'),
  totalHours:        document.getElementById('total-hours'),
  openFormBtn:       document.getElementById('open-form-button'),
  // toolbar
  gameCount:         document.getElementById('game-count'),
  sortSelect:        document.getElementById('sort-select'),
  feedbackBanner:    document.getElementById('feedback-banner'),
  // drawer
  formDrawer:        document.getElementById('form-drawer'),
  drawerOverlay:     document.getElementById('drawer-overlay'),
  drawerTitle:       document.getElementById('drawer-title'),
  closeFormBtn:      document.getElementById('close-form-button'),
  gameForm:          document.getElementById('game-form'),
  editId:            document.getElementById('edit-id'),
  nameInput:         document.getElementById('name'),
  coverInput:        document.getElementById('cover'),
  coverPreviewWrap:  document.getElementById('cover-preview-wrap'),
  coverPreview:      document.getElementById('cover-preview'),
  hoursInput:        document.getElementById('hoursPlayed'),
  ratingInput:       document.getElementById('rating'),
  commentInput:      document.getElementById('comment'),
  completedCheck:    document.getElementById('completed'),
  resetFormBtn:      document.getElementById('reset-form-button'),
  submitBtn:         document.getElementById('submit-button'),
  // library
  gamesGrid:         document.getElementById('games-grid'),
  emptyState:        document.getElementById('empty-state'),
  // detail modal
  detailsBackdrop:   document.getElementById('details-backdrop'),
  closeDetailsBtn:   document.getElementById('close-details-button'),
  closeDetailsBtn2:  document.getElementById('close-details-button2'),
  detailsCover:      document.getElementById('details-cover'),
  detailsBadge:      document.getElementById('details-badge'),
  detailsHours:      document.getElementById('details-hours'),
  detailsTitle:      document.getElementById('details-title'),
  detailsComment:    document.getElementById('details-comment'),
  detailsRating:     document.getElementById('details-rating'),
  detailsCreatedAt:  document.getElementById('details-created-at'),
  detailsEditBtn:    document.getElementById('details-edit-button'),
  detailsDeleteBtn:  document.getElementById('details-delete-button'),
  // confirm modal
  confirmBackdrop:   document.getElementById('confirm-backdrop'),
  confirmGameName:   document.getElementById('confirm-game-name'),
  confirmCancel:     document.getElementById('confirm-cancel'),
  confirmDelete:     document.getElementById('confirm-delete'),
};

/* ── UTILS ── */
function escHtml(v) {
  return String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtHours(h) {
  const v = Number(h);
  if (!Number.isFinite(v)) return '0h';
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`;
}

function fmtRating(r) {
  const v = (r === '' || r === null || r === undefined) ? NaN : Number(r);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + '/10';
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function normCover(src) {
  const v = String(src ?? '').trim();
  if (!v) return FALLBACK;
  if (/^(https?:|data:|file:|blob:)/i.test(v)) return v;
  if (/^[A-Za-z]:\\/.test(v) || v.startsWith('\\\\')) return `file:///${v.replace(/\\/g, '/')}`;
  return v;
}

/* ── FEEDBACK ── */
let feedbackTimer;
function showFeedback(msg, isError = false) {
  el.feedbackBanner.textContent = msg;
  el.feedbackBanner.classList.remove('is-hidden', 'is-error');
  if (isError) el.feedbackBanner.classList.add('is-error');
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => el.feedbackBanner.classList.add('is-hidden'), 2800);
}

/* ── STATS ── */
function updateStats() {
  const total = state.games.reduce((s, g) => s + Number(g.hoursPlayed || 0), 0);

  if (el.totalHours) {
    el.totalHours.textContent = `${fmtHours(total)} jogadas`;
  }
}
/* ── FILTER + SORT ── */
function getVisibleGames() {
  let list = [...state.games];

  if (state.filter === 'completed') list = list.filter(g => g.completed);
  if (state.filter === 'playing')   list = list.filter(g => !g.completed);

  list.sort((a, b) => {
    switch (state.sort) {
      case 'name':    return a.name.localeCompare(b.name, 'pt-BR');
      case 'hours':   return Number(b.hoursPlayed) - Number(a.hoursPlayed);
      case 'rating': {
        const ra = (a.rating === '' || a.rating === null) ? -1 : Number(a.rating);
        const rb = (b.rating === '' || b.rating === null) ? -1 : Number(b.rating);
        return rb - ra;
      }
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return list;
}

/* ── RENDER ── */
function renderGames() {
  const visible = getVisibleGames();
  el.gamesGrid.innerHTML = '';

  const filterLabel = state.filter === 'all' ? 'jogos' : state.filter === 'completed' ? 'zerados' : 'em andamento';
  el.gameCount.textContent = `${visible.length} ${filterLabel}`;

  if (visible.length === 0) {
    el.emptyState.classList.remove('is-hidden');
    return;
  }

  el.emptyState.classList.add('is-hidden');

  visible.forEach((game, i) => {
    el.gamesGrid.appendChild(createCard(game, i));
  });

  updateStats();
}

function createCard(game, index) {
  const wrap = document.createElement('div');
  wrap.className = `game-card${game.completed ? ' is-completed' : ''}`;
  wrap.style.animationDelay = `${Math.min(index * 30, 300)}ms`;

  const coverSrc = escHtml(normCover(game.cover));
  const safeId   = escHtml(game.id);
  const badgeClass = game.completed ? 'zerado' : 'playing';
  const badgeText  = game.completed ? 'Zerado' : 'Jogando';
  const hasRating  = game.rating !== '' && game.rating !== null && game.rating !== undefined && Number.isFinite(Number(game.rating));

  wrap.innerHTML = `
    <div class="game-card-inner">
      <img class="game-cover-img" src="${coverSrc}" alt="${escHtml(game.name)}" data-id="${safeId}" />
      <div class="card-overlay"></div>
      <span class="card-badge ${badgeClass}">${badgeText}</span>
      <div class="card-quick-actions">
        <button class="card-action-btn edit" data-id="${safeId}" title="Editar">✏️</button>
        <button class="card-action-btn delete" data-id="${safeId}" title="Remover">🗑</button>
      </div>
      <div class="card-info">
        ${hasRating ? `<div class="card-rating">★ ${fmtRating(game.rating)}</div>` : ''}
        <div class="card-hours">${fmtHours(game.hoursPlayed)}</div>
      </div>
    </div>
    <div class="card-name">${escHtml(game.name)}</div>
    ${game.completed ? '<div class="card-sub">Zerado</div>' : `<div class="card-sub">${fmtHours(game.hoursPlayed)}</div>`}
  `;

  // open detail on cover click
  wrap.querySelector('.game-cover-img').addEventListener('click', () => openDetails(game.id));

  // quick edit
  wrap.querySelector('.card-action-btn.edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditForm(game.id);
  });

  // quick delete
  wrap.querySelector('.card-action-btn.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    askDeleteConfirm(game.id);
  });

  // fallback image
  wrap.querySelector('.game-cover-img').addEventListener('error', (e) => {
    e.target.src = FALLBACK;
  });

  return wrap;
}

/* ── DRAWER ── */
function openDrawer() {
  el.formDrawer.classList.add('is-open');
  el.formDrawer.setAttribute('aria-hidden', 'false');
  el.drawerOverlay.classList.add('is-visible');
  setTimeout(() => el.nameInput.focus(), 280);
}

function closeDrawer() {
  el.formDrawer.classList.remove('is-open');
  el.formDrawer.setAttribute('aria-hidden', 'true');
  el.drawerOverlay.classList.remove('is-visible');
  state.editingId = null;
}

function resetForm() {
  el.gameForm.reset();
  el.editId.value = '';
  el.hoursInput.value = '0';
  el.coverPreviewWrap.classList.add('is-hidden');
  el.drawerTitle.textContent = 'Adicionar Jogo';
  el.submitBtn.textContent = 'Salvar Jogo';
  state.editingId = null;
}

function openEditForm(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;

  closeDetails();
  state.editingId = gameId;
  el.editId.value = gameId;
  el.drawerTitle.textContent = 'Editar Jogo';
  el.submitBtn.textContent = 'Atualizar Jogo';

  el.nameInput.value      = game.name;
  el.coverInput.value     = game.cover;
  el.hoursInput.value     = game.hoursPlayed;
  el.ratingInput.value    = (game.rating === '' || game.rating === null) ? '' : game.rating;
  el.commentInput.value   = game.comment;
  el.completedCheck.checked = game.completed;

  updateCoverPreview(game.cover);
  openDrawer();
}

function updateCoverPreview(url) {
  const src = normCover(url);
  if (!url.trim()) {
    el.coverPreviewWrap.classList.add('is-hidden');
    return;
  }
  el.coverPreview.src = src;
  el.coverPreviewWrap.classList.remove('is-hidden');
}

/* ── DETAIL MODAL ── */
function openDetails(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  state.selectedGameId = gameId;

  el.detailsCover.src = normCover(game.cover);
  el.detailsCover.alt = game.name;

  const isComplete = game.completed;
  el.detailsBadge.textContent  = isComplete ? 'Zerado' : 'Em andamento';
  el.detailsBadge.className    = `modal-badge ${isComplete ? 'zerado' : 'playing'}`;
  el.detailsHours.textContent  = fmtHours(game.hoursPlayed);
  el.detailsTitle.textContent  = game.name;
  el.detailsComment.textContent = game.comment || 'Nenhum comentário salvo.';
  el.detailsRating.textContent  = fmtRating(game.rating);
  el.detailsCreatedAt.textContent = fmtDate(game.createdAt);

  el.detailsBackdrop.classList.remove('is-hidden');
}

function closeDetails() {
  state.selectedGameId = null;
  el.detailsBackdrop.classList.add('is-hidden');
}

/* ── DELETE ── */
function askDeleteConfirm(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  state.pendingDeleteId = gameId;
  el.confirmGameName.textContent = `"${game.name}"`;
  el.confirmBackdrop.classList.remove('is-hidden');
  closeDetails();
}

async function executeDelete() {
  const gameId = state.pendingDeleteId;
  if (!gameId) return;

  const game = state.games.find(g => g.id === gameId);
  const name = game?.name ?? 'Jogo';

  state.games = state.games.filter(g => g.id !== gameId);
  state.pendingDeleteId = null;
  el.confirmBackdrop.classList.add('is-hidden');

  try {
    await persistGames();
    showFeedback(`"${name}" removido com sucesso.`);
  } catch (err) {
    showFeedback('Erro ao remover o jogo.', true);
    console.error(err);
  }
}

/* ── PERSIST ── */
async function persistGames() {
  state.games = await window.gameLibrary.saveGames(state.games);
  renderGames();
}

/* ── SUBMIT ── */
async function handleSubmit(e) {
  e.preventDefault();

  const fd      = new FormData(el.gameForm);
  const name    = String(fd.get('name') ?? '').trim();
  const editId  = el.editId.value.trim();
  const ratingRaw = fd.get('rating');

  if (!name) {
    showFeedback('Informe o nome do jogo.', true);
    return;
  }

  const gameData = {
    name,
    cover:       String(fd.get('cover') ?? '').trim(),
    hoursPlayed: Number(fd.get('hoursPlayed') ?? 0),
    rating:      ratingRaw === '' ? '' : Number(ratingRaw),
    comment:     String(fd.get('comment') ?? '').trim(),
    completed:   fd.get('completed') === 'on',
  };

  if (editId) {
    // UPDATE
    const idx = state.games.findIndex(g => g.id === editId);
    if (idx === -1) { showFeedback('Jogo não encontrado.', true); return; }
    state.games[idx] = { ...state.games[idx], ...gameData };
  } else {
    // ADD
    state.games.unshift({ id: crypto.randomUUID(), ...gameData, createdAt: new Date().toISOString() });
  }

  try {
    await persistGames();
    resetForm();
    closeDrawer();
    showFeedback(editId ? `"${name}" atualizado!` : `"${name}" adicionado!`);
  } catch (err) {
    showFeedback('Erro ao salvar o jogo.', true);
    console.error(err);
  }
}

/* ── LOAD ── */
async function loadGames() {
  try {
    state.games = await window.gameLibrary.loadGames();
    renderGames();
    updateStats();
  } catch (err) {
    state.games = [];
    renderGames();
    showFeedback('Falha ao carregar a biblioteca.', true);
    console.error(err);
  }
}

/* ── EVENTS ── */
function registerEvents() {
  // nav filter tabs
  el.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      el.navTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.filter = tab.dataset.filter;
      renderGames();
    });
  });

  // sort
  el.sortSelect.addEventListener('change', () => {
    state.sort = el.sortSelect.value;
    renderGames();
  });

  // open drawer
  el.openFormBtn.addEventListener('click', () => {
    resetForm();
    openDrawer();
  });

  // close drawer
  el.closeFormBtn.addEventListener('click', () => { closeDrawer(); resetForm(); });
  el.drawerOverlay.addEventListener('click', () => { closeDrawer(); resetForm(); });

  // reset form
  el.resetFormBtn.addEventListener('click', resetForm);

  // cover preview on input
  el.coverInput.addEventListener('input', () => updateCoverPreview(el.coverInput.value));

  // submit
  el.gameForm.addEventListener('submit', handleSubmit);

  // detail modal close
  el.closeDetailsBtn.addEventListener('click', closeDetails);
  el.closeDetailsBtn2.addEventListener('click', closeDetails);
  el.detailsBackdrop.addEventListener('click', (e) => { if (e.target === el.detailsBackdrop) closeDetails(); });
  el.detailsCover.addEventListener('error', () => { el.detailsCover.src = FALLBACK; });

  // detail modal actions
  el.detailsEditBtn.addEventListener('click', () => {
    if (state.selectedGameId) openEditForm(state.selectedGameId);
  });
  el.detailsDeleteBtn.addEventListener('click', () => {
    if (state.selectedGameId) askDeleteConfirm(state.selectedGameId);
  });

  // confirm modal
  el.confirmCancel.addEventListener('click', () => {
    state.pendingDeleteId = null;
    el.confirmBackdrop.classList.add('is-hidden');
  });
  el.confirmDelete.addEventListener('click', executeDelete);
  el.confirmBackdrop.addEventListener('click', (e) => {
    if (e.target === el.confirmBackdrop) {
      state.pendingDeleteId = null;
      el.confirmBackdrop.classList.add('is-hidden');
    }
  });

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetails();
      if (el.formDrawer.classList.contains('is-open')) { closeDrawer(); resetForm(); }
      if (!el.confirmBackdrop.classList.contains('is-hidden')) {
        state.pendingDeleteId = null;
        el.confirmBackdrop.classList.add('is-hidden');
      }
    }
  });
}

registerEvents();
loadGames();