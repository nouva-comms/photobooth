import { contextBridge, ipcRenderer } from 'electron'

// Mengekspos API backend ke window.api agar dapat dipanggil langsung dari Vue 3
contextBridge.exposeInMainWorld('api', {
  // 1. MODULE SESSION & PAYMENT
  createSession: () => ipcRenderer.invoke('session:create'),
  checkPaymentStatus: (sessionId: string) => ipcRenderer.invoke('payment:check-status', sessionId),
  updateSessionFrame: (sessionId: string, frameId: string) =>
    ipcRenderer.invoke('session:update-frame', { sessionId, frameId }),

  // 2. MODULE FRAME
  getAllActiveFrames: () => ipcRenderer.invoke('frame:get-all-active'),

  // 3. MODULE PHOTO & CAPTURE
  saveRawPhoto: (sessionId: string, photoOrder: number, base64Image: string) =>
    ipcRenderer.invoke('photo:save-raw', { sessionId, photoOrder, base64Image }),
  saveFinalComposite: (sessionId: string, base64CompositeImage: string) =>
    ipcRenderer.invoke('photo:save-final', { sessionId, base64CompositeImage }),

  // 4. MODULE PRINT & EMAIL
  printPhoto: (sessionId: string, copyCount: number = 1) =>
    ipcRenderer.invoke('printer:print-photo', { sessionId, copyCount }),
  sendSoftcopyEmail: (sessionId: string, userEmail: string) =>
    ipcRenderer.invoke('mailer:send-softcopy', { sessionId, userEmail }),

  // 5. QR CODE & COMPOSITION
  generatePaymentQrCode: (sessionId: string) =>
    ipcRenderer.invoke('payment:generate-qr', sessionId),
  generateDownloadQrCode: (sessionCode: string) =>
    ipcRenderer.invoke('download:generate-qr', sessionCode),
  renderFinalComposition: (params: { sessionId: string | null; frameId: string | undefined; photos: string[]; filter: string }) =>
    ipcRenderer.invoke('composition:render', params),
})