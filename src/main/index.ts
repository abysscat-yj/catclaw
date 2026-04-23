// Electron main process entry point

import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerIpcHandlers } from "./ipc-handlers.js";
import { closeDb } from "./agent/conversation-store.js";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

function getAppIcon(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "catclaw-icon.png")
    : path.join(app.getAppPath(), "assets", "catclaw-icon.png");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // need false for better-sqlite3 native module
      preload: path.join(__dirname, "preload.js"),
    },
  });

  registerIpcHandlers(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    app.dock.setIcon(getAppIcon());
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  closeDb();
  app.quit();
});

process.on("uncaughtException", (err) => {
  console.error("[CatClaw] Uncaught exception:", err);
});
