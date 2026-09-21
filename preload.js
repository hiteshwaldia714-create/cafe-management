const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

    launchGame: function(game) {

        return ipcRenderer.invoke("launch-game", game);

    },

    getGames: function() {

        return ipcRenderer.invoke("get-games");

    }

});