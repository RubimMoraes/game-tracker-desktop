const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jogosAPI', {
  carregarJogos: () => ipcRenderer.invoke('jogos:carregar'),
  salvarJogos: (jogos) => ipcRenderer.invoke('jogos:salvar', jogos)
});
