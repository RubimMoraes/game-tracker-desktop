const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const DEFAULT_GAMES = [
  {
    id: "hades",
    name: "Hades",
    cover: "",
    hoursPlayed: 48,
    rating: 9.5,
    comment: "Loop viciante, combate impecavel e trilha sonora absurdamente boa.",
    completed: true,
    createdAt: "2026-04-22T10:00:00.000Z"
  },
  {
    id: "celeste",
    name: "Celeste",
    cover: "",
    hoursPlayed: 14,
    rating: 10,
    comment: "Plataforma precisa e uma historia que bate forte.",
    completed: true,
    createdAt: "2026-04-22T10:05:00.000Z"
  },
  {
    id: "death-stranding",
    name: "Death Stranding",
    cover: "",
    hoursPlayed: 27,
    rating: "",
    comment: "Ainda no meio da jornada, mas o clima do jogo ja me ganhou.",
    completed: false,
    createdAt: "2026-04-22T10:10:00.000Z"
  }
];

function getDataFilePath() {
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), "dados.json");
  }

  return path.join(__dirname, "dados.json");
}

function normalizeGame(game, index = 0) {
  const hoursValue = Number(game?.hoursPlayed);
  const rawRatingValue = game?.rating;
  const ratingValue = rawRatingValue === "" || rawRatingValue === null || rawRatingValue === undefined
    ? null
    : Number(rawRatingValue);
  const normalizedName = String(game?.name ?? "").trim();
  const createdAt = typeof game?.createdAt === "string" ? game.createdAt : new Date().toISOString();

  return {
    id: String(game?.id ?? `${Date.now()}-${index}`),
    name: normalizedName || "Jogo sem nome",
    cover: String(game?.cover ?? "").trim(),
    hoursPlayed: Number.isFinite(hoursValue) && hoursValue >= 0 ? hoursValue : 0,
    rating: Number.isFinite(ratingValue) ? ratingValue : "",
    comment: String(game?.comment ?? "").trim(),
    completed: Boolean(game?.completed),
    createdAt
  };
}

function normalizeGameList(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((game, index) => normalizeGame(game, index));
}

function writeJsonAtomic(filePath, data) {
  const temporaryFilePath = `${filePath}.tmp`;
  const json = `${JSON.stringify(data, null, 2)}\n`;

  fs.writeFileSync(temporaryFilePath, json, "utf8");
  fs.renameSync(temporaryFilePath, filePath);
}

function ensureDataFile() {
  const filePath = getDataFilePath();

  if (!fs.existsSync(filePath)) {
    writeJsonAtomic(filePath, DEFAULT_GAMES);
  }
}

function recoverInvalidJson(error) {
  const filePath = getDataFilePath();
  const backupFilePath = filePath.replace(".json", `.corrompido-${Date.now()}.json`);

  try {
    fs.copyFileSync(filePath, backupFilePath);
  } catch (copyError) {
    console.error("Nao foi possivel criar backup do JSON invalido.", copyError);
  }

  console.error("JSON invalido detectado. Restaurando arquivo padrao.", error);
  writeJsonAtomic(filePath, DEFAULT_GAMES);

  return DEFAULT_GAMES;
}

function readGamesFromDisk() {
  const filePath = getDataFilePath();
  ensureDataFile();

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    return normalizeGameList(parsed);
  } catch (error) {
    return recoverInvalidJson(error);
  }
}

function saveGamesToDisk(payload) {
  const filePath = getDataFilePath();
  const normalizedGames = normalizeGameList(payload);

  writeJsonAtomic(filePath, normalizedGames);

  return normalizedGames;
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1040,
    minHeight: 720,
    show: false,
    backgroundColor: "#07111f",
    title: "Gerenciador de Jogos Zerados",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  ipcMain.handle("games:load", () => readGamesFromDisk());
  ipcMain.handle("games:save", (_event, payload) => saveGamesToDisk(payload));

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
