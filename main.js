const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function createCustomerWindow() {

    const window = new BrowserWindow({
        width: 1000,
        height: 700,
    
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
    
            preload: path.join(__dirname, "preload.js")
        }
    });

    window.loadFile(
        path.join(__dirname, "index.html")
    );
}

const { exec } = require("child_process");

ipcMain.handle("launch-game", async function(event, game) {

    console.log("Game requested:", game);

    const gamesPath =
        path.join(__dirname, "games.json");

    const gamesData =
        fs.readFileSync(gamesPath, "utf8");

    const games =
        JSON.parse(gamesData);

    const selectedGame =
        games[game];

    if (!selectedGame) {

        return {
            success: false,
            message: "Game not found."
        };

    }

    if (!selectedGame.enabled) {

        return {
            success: false,
            message: selectedGame.name + " is currently unavailable."
        };
    
    }
    
    if (!selectedGame.launchCommand) {
    
        return {
            success: false,
            message: selectedGame.name + " is not configured yet."
        };
    
    }

    exec(selectedGame.launchCommand);

    return {
        success: true,
        game: selectedGame.name
    };

});

ipcMain.handle("get-games", async function() {

    const gamesPath =
        path.join(__dirname, "games.json");

    const gamesData =
        fs.readFileSync(gamesPath, "utf8");

    const games =
        JSON.parse(gamesData);

    return games;

});

function createAdminWindow() {

    const window = new BrowserWindow({
        width: 1000,
        height: 700,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    window.loadFile(
        path.join(__dirname, "admin.html")
    );
}

app.whenReady().then(() => {

    createCustomerWindow();
    createAdminWindow();

});