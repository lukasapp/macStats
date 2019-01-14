'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');

// Check if it is a production build.
const production = process.env.ELECTRON_ENV === 'production';

// App settings.
app.dock.hide();
const options = {
    height: 600,
    width: 800,
    show: !production,
    webPreferences: {
        contextIsolation: true,
        nodeIntegration: true
    }
};

/**
 * Is called once the app is ready.
 */
app.on('ready', () => {
    // Render window with file.
    const mainWindow = new BrowserWindow(options);
    mainWindow.loadFile(__dirname + '/src/index.html');

    if (!production) {
        // Open "developer options" for debugging.
        mainWindow.webContents.openDevTools();
    }
});

/**
 * Is called when the main window closes.
 */
ipcMain.on('close-main-window', () => {
    app.quit();
});