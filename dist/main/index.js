"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const ipc_1 = require("./ipc");
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Shortcut Fullscreen & Windowed Mode
    mainWindow.webContents.on('before-input-event', (event, input) => {
        const isF11 = input.key === 'F11';
        const isAltEnter = input.key === 'Enter' && input.alt;
        const isAltF4 = input.key === 'F4' && input.alt;
        if ((isF11 || isAltEnter) && input.type === 'keyDown') {
            if (mainWindow)
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
            event.preventDefault();
        }
        if (isAltF4 && input.type === 'keyDown') {
            electron_1.app.quit(); // Force keluar total dari aplikasi
        }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    // Panggil IPC handler backend di sini
    (0, ipc_1.registerIpcHandlers)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=index.js.map