const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#10223d" />
        <stop offset="100%" stop-color="#07111f" />
      </linearGradient>
      <linearGradient id="shine" x1="0%" x2="100%">
        <stop offset="0%" stop-color="#5fe3ff" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#c9ff05" stop-opacity="0.95" />
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#bg)" />
    <circle cx="114" cy="86" r="64" fill="#5fe3ff" fill-opacity="0.12" />
    <circle cx="536" cy="314" r="74" fill="#c9ff05" fill-opacity="0.1" />
    <rect x="96" y="98" width="448" height="204" rx="28" fill="#0d1e34" stroke="url(#shine)" stroke-width="3" />
    <path d="M244 200h152" stroke="url(#shine)" stroke-linecap="round" stroke-width="20" />
    <path d="M320 124v152" stroke="url(#shine)" stroke-linecap="round" stroke-width="20" />
    <text x="320" y="350" fill="#eff6ff" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="28" text-anchor="middle">
      Sem capa
    </text>
  </svg>
`)}`;

const state = {
  games: [],
  selectedGameId: null
};

const elements = {
  formPanel: document.querySelector("#form-panel"),
  gameForm: document.querySelector("#game-form"),
  gamesGrid: document.querySelector("#games-grid"),
  emptyState: document.querySelector("#empty-state"),
  feedbackBanner: document.querySelector("#feedback-banner"),
  openFormButton: document.querySelector("#open-form-button"),
  closeFormButton: document.querySelector("#close-form-button"),
  resetFormButton: document.querySelector("#reset-form-button"),
  totalGames: document.querySelector("#total-games"),
  completedGames: document.querySelector("#completed-games"),
  playedHours: document.querySelector("#played-hours"),
  detailsBackdrop: document.querySelector("#details-backdrop"),
  closeDetailsButton: document.querySelector("#close-details-button"),
  detailsCover: document.querySelector("#details-cover"),
  detailsStatus: document.querySelector("#details-status"),
  detailsTitle: document.querySelector("#details-title"),
  detailsMeta: document.querySelector("#details-meta"),
  detailsComment: document.querySelector("#details-comment"),
  detailsHours: document.querySelector("#details-hours"),
  detailsRating: document.querySelector("#details-rating"),
  detailsCreatedAt: document.querySelector("#details-created-at")
};

function normalizeCoverSource(source) {
  const value = String(source ?? "").trim();

  if (!value) {
    return FALLBACK_IMAGE;
  }

  if (/^(https?:|data:|file:|blob:)/i.test(value)) {
    return value;
  }

  if (/^[A-Za-z]:\\/.test(value) || value.startsWith("\\\\")) {
    return `file:///${value.replace(/\\/g, "/")}`;
  }

  return value;
}

function formatHours(hours) {
  const value = Number(hours);

  if (!Number.isFinite(value)) {
    return "0h";
  }

  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
}

function formatRating(rating) {
  const value = rating === "" || rating === null || rating === undefined ? NaN : Number(rating);

  if (!Number.isFinite(value)) {
    return "Sem nota";
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function showFeedback(message, isError = false) {
  elements.feedbackBanner.textContent = message;
  elements.feedbackBanner.classList.remove("is-hidden");
  elements.feedbackBanner.classList.toggle("is-error", isError);

  window.clearTimeout(showFeedback.timeoutId);
  showFeedback.timeoutId = window.setTimeout(() => {
    elements.feedbackBanner.classList.add("is-hidden");
  }, 2600);
}

function updateStats() {
  const totalGames = state.games.length;
  const completedGames = state.games.filter((game) => game.completed).length;
  const playedHours = state.games.reduce((total, game) => total + Number(game.hoursPlayed || 0), 0);

  elements.totalGames.textContent = String(totalGames);
  elements.completedGames.textContent = String(completedGames);
  elements.playedHours.textContent = formatHours(playedHours);
}

function getSummaryText(game) {
  const comment = String(game.comment ?? "").trim();

  if (!comment) {
    return "Sem comentario salvo ainda.";
  }

  if (comment.length <= 90) {
    return comment;
  }

  return `${comment.slice(0, 87)}...`;
}

function createCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  if (game.completed) {
    card.classList.add("is-completed");
  }

  const statusLabel = game.completed ? "Zerado" : "Em andamento";
  const ratingValue = game.rating === "" || game.rating === null || game.rating === undefined ? NaN : Number(game.rating);
  const ratingLabel = Number.isFinite(ratingValue) ? `${formatRating(game.rating)}/10` : "Sem nota";
  const coverSource = escapeHtml(normalizeCoverSource(game.cover));
  const safeGameId = escapeHtml(game.id);

  card.innerHTML = `
    <button class="game-card-button" type="button" data-game-id="${safeGameId}">
      <img class="game-cover" src="${coverSource}" alt="Capa de ${escapeHtml(game.name)}" />
      <div class="game-card-content">
        <span class="status-chip ${game.completed ? "is-completed" : "is-progress"}">${statusLabel}</span>
        <h3 class="game-title">${escapeHtml(game.name)}</h3>
        <p class="game-summary">${escapeHtml(getSummaryText(game))}</p>
        <div class="game-footer">
          <span>${formatHours(game.hoursPlayed)}</span>
          <span>${ratingLabel}</span>
        </div>
      </div>
    </button>
  `;

  const image = card.querySelector(".game-cover");
  image.addEventListener("error", () => {
    image.src = FALLBACK_IMAGE;
  });

  const button = card.querySelector(".game-card-button");
  button.addEventListener("click", () => openDetails(game.id));

  return card;
}

function renderGames() {
  elements.gamesGrid.innerHTML = "";

  const sortedGames = [...state.games].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  sortedGames.forEach((game) => {
    elements.gamesGrid.appendChild(createCard(game));
  });

  elements.emptyState.classList.toggle("is-hidden", state.games.length > 0);
  updateStats();
}

function toggleFormPanel(shouldShow) {
  elements.formPanel.classList.toggle("is-hidden", !shouldShow);
  elements.formPanel.setAttribute("aria-hidden", String(!shouldShow));

  if (shouldShow) {
    document.querySelector("#name").focus();
  }
}

function resetForm() {
  elements.gameForm.reset();
  document.querySelector("#hoursPlayed").value = "0";
}

function closeDetails() {
  state.selectedGameId = null;
  elements.detailsBackdrop.classList.add("is-hidden");
}

function openDetails(gameId) {
  const game = state.games.find((item) => item.id === gameId);

  if (!game) {
    return;
  }

  state.selectedGameId = gameId;
  elements.detailsCover.src = normalizeCoverSource(game.cover);
  elements.detailsCover.alt = `Capa de ${game.name}`;
  elements.detailsStatus.textContent = game.completed ? "Jogo zerado" : "Ainda em andamento";
  elements.detailsTitle.textContent = game.name;
  elements.detailsMeta.textContent = game.completed
    ? "Este jogo esta marcado como concluido na sua biblioteca."
    : "Este jogo ainda nao foi marcado como zerado.";
  elements.detailsComment.textContent = game.comment || "Nenhum comentario salvo para este jogo.";
  elements.detailsHours.textContent = formatHours(game.hoursPlayed);
  elements.detailsRating.textContent = formatRating(game.rating);
  elements.detailsCreatedAt.textContent = formatDate(game.createdAt);
  elements.detailsBackdrop.classList.remove("is-hidden");
}

async function persistGames() {
  state.games = await window.gameLibrary.saveGames(state.games);
  renderGames();
}

function buildGameFromForm(formData) {
  const ratingValue = formData.get("rating");

  return {
    id: crypto.randomUUID(),
    name: String(formData.get("name") ?? "").trim(),
    cover: String(formData.get("cover") ?? "").trim(),
    hoursPlayed: Number(formData.get("hoursPlayed") ?? 0),
    rating: ratingValue === "" ? "" : Number(ratingValue),
    comment: String(formData.get("comment") ?? "").trim(),
    completed: formData.get("completed") === "on",
    createdAt: new Date().toISOString()
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.gameForm);
  const newGame = buildGameFromForm(formData);

  if (!newGame.name) {
    showFeedback("Informe ao menos o nome do jogo antes de salvar.", true);
    return;
  }

  state.games = [newGame, ...state.games];

  try {
    await persistGames();
    resetForm();
    toggleFormPanel(false);
    showFeedback(`"${newGame.name}" foi salvo com sucesso.`);
  } catch (error) {
    state.games = state.games.filter((game) => game.id !== newGame.id);
    showFeedback("Nao foi possivel salvar o jogo agora.", true);
    console.error(error);
  }
}

async function loadGames() {
  try {
    state.games = await window.gameLibrary.loadGames();
    renderGames();
  } catch (error) {
    state.games = [];
    renderGames();
    showFeedback("Falha ao carregar a biblioteca local.", true);
    console.error(error);
  }
}

function registerEvents() {
  elements.openFormButton.addEventListener("click", () => toggleFormPanel(true));
  elements.closeFormButton.addEventListener("click", () => toggleFormPanel(false));
  elements.resetFormButton.addEventListener("click", resetForm);
  elements.gameForm.addEventListener("submit", handleSubmit);
  elements.closeDetailsButton.addEventListener("click", closeDetails);
  elements.detailsCover.addEventListener("error", () => {
    elements.detailsCover.src = FALLBACK_IMAGE;
  });
  elements.detailsBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.detailsBackdrop) {
      closeDetails();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetails();
      toggleFormPanel(false);
    }
  });
}

registerEvents();
loadGames();
