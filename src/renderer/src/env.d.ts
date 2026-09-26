export {}

// Interface Response Standar dari Backend IPC
interface IpcResponse<T = any> {
  success: boolean
  data?: T
  paymentStatus?: string
  message?: string
  error?: string
}

// Interface API IPC yang Dikekspos oleh Preload Script
export interface ElectronAPI {
  // 1. MODULE SESSION & PAYMENT
  createSession: () => Promise<IpcResponse>
  checkPaymentStatus: (sessionId: string) => Promise<IpcResponse>
  updateSessionFrame: (sessionId: string, frameId: string) => Promise<IpcResponse>
  generatePaymentQrCode: (sessionId: string) => Promise<IpcResponse & { qrDataUrl?: string }>

  // 2. MODULE FRAME
  getAllActiveFrames: () => Promise<IpcResponse>

  // 3. MODULE PHOTO & CAPTURE
  saveRawPhoto: (
    sessionId: string,
    photoOrder: number,
    base64Image: string
  ) => Promise<IpcResponse>
  saveFinalComposite: (
    sessionId: string,
    base64CompositeImage: string
  ) => Promise<IpcResponse>

  // 4. MODULE PRINT & EMAIL
  printPhoto: (sessionId: string, copyCount?: number) => Promise<IpcResponse>
  sendSoftcopyEmail: (sessionId: string, userEmail: string) => Promise<IpcResponse>

  // 5. QR CODE & COMPOSITION
  generateDownloadQrCode: (sessionCode: string) => Promise<IpcResponse & { qrDataUrl?: string }>
  renderFinalComposition: (params: { sessionId: string | null; frameId: string | undefined; photos: string[]; filter: string }) => Promise<IpcResponse & { finalImagePath?: string }>
}

// Deklarasi Global ke Window Object
declare global {
  interface Window {
    api: ElectronAPI
  }
}