"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Mengekspos API backend ke window.api agar dapat dipanggil langsung dari Vue 3
electron_1.contextBridge.exposeInMainWorld('api', {
    // 1. MODULE SESSION & PAYMENT
    createSession: () => electron_1.ipcRenderer.invoke('session:create'),
    checkPaymentStatus: (sessionId) => electron_1.ipcRenderer.invoke('payment:check-status', sessionId),
    updateSessionFrame: (sessionId, frameId) => electron_1.ipcRenderer.invoke('session:update-frame', { sessionId, frameId }),
    // 2. MODULE FRAME
    getAllActiveFrames: () => electron_1.ipcRenderer.invoke('frame:get-all-active'),
    // 3. MODULE PHOTO & CAPTURE
    saveRawPhoto: (sessionId, photoOrder, base64Image) => electron_1.ipcRenderer.invoke('photo:save-raw', { sessionId, photoOrder, base64Image }),
    saveFinalComposite: (sessionId, base64CompositeImage) => electron_1.ipcRenderer.invoke('photo:save-final', { sessionId, base64CompositeImage }),
    // 4. MODULE PRINT & EMAIL
    printPhoto: (sessionId, copyCount = 1) => electron_1.ipcRenderer.invoke('printer:print-photo', { sessionId, copyCount }),
    sendSoftcopyEmail: (sessionId, userEmail) => electron_1.ipcRenderer.invoke('mailer:send-softcopy', { sessionId, userEmail }),
    // 5. QR CODE & COMPOSITION
    generatePaymentQrCode: (sessionId) => electron_1.ipcRenderer.invoke('payment:generate-qr', sessionId),
    generateDownloadQrCode: (sessionCode) => electron_1.ipcRenderer.invoke('download:generate-qr', sessionCode),
    renderFinalComposition: (params) => electron_1.ipcRenderer.invoke('composition:render', params),
});
//# sourceMappingURL=index.js.map