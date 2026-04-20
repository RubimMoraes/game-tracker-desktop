const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_FILE = path.join(app.getPath('userData'), 'dados.json');

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  janela.loadFile(path.join(__dirname, 'index.html'));
}

function normalizarJogo(jogo) {
  return {
    id: Number(jogo.id) || Date.now(),
    nome: String(jogo.nome || '').trim(),
    imagem: String(jogo.imagem || '').trim(),
    tempo: Number.isFinite(Number(jogo.tempo)) ? Number(jogo.tempo) : 0,
    nota:
      jogo.nota === '' || jogo.nota === null || jogo.nota === undefined
        ? null
        : Number(jogo.nota),
    comentario: String(jogo.comentario || '').trim(),
    zerado: Boolean(jogo.zerado)
  };
}

function validarLista(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return lista.map(normalizarJogo).filter((jogo) => jogo.nome.length > 0);
}

async function garantirArquivoInicial() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const exemplo = [
      {
        id: 1,
        nome: 'The Witcher 3',
        imagem:
          'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
        tempo: 95,
        nota: 10,
        comentario: 'História fantástica',
        zerado: true
      }
    ];
    await fs.writeFile(DATA_FILE, JSON.stringify(exemplo, null, 2), 'utf-8');
  }
}

async function lerJogos() {
  await garantirArquivoInicial();

  try {
    const dados = await fs.readFile(DATA_FILE, 'utf-8');
    const jogos = validarLista(JSON.parse(dados));
    return jogos;
  } catch {
    // Evita quebra caso o JSON esteja corrompido
    const backup = `${DATA_FILE}.corrompido.${Date.now()}`;
    try {
      await fs.copyFile(DATA_FILE, backup);
    } catch {
      // ignore
    }
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
    return [];
  }
}

async function salvarJogos(lista) {
  const jogos = validarLista(lista);
  const tempFile = `${DATA_FILE}.tmp`;
  const payload = JSON.stringify(jogos, null, 2);

  // Escrita atômica reduz risco de corrupção
  await fs.writeFile(tempFile, payload, 'utf-8');
  await fs.rename(tempFile, DATA_FILE);

  return jogos;
}

ipcMain.handle('jogos:carregar', async () => {
  return lerJogos();
});

ipcMain.handle('jogos:salvar', async (_event, jogos) => {
  return salvarJogos(jogos);
});

app.whenReady().then(() => {
  criarJanela();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      criarJanela();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
