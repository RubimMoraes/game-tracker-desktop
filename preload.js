const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gameLibrary", {
  loadGames: () => ipcRenderer.invoke("games:load"),
  saveGames: (games) => ipcRenderer.invoke("games:save", games)
});
