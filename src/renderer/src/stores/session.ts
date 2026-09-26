import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Interface Data
export interface FrameData {
  id: string
  name: string
  imagePath: string
  previewPath?: string
  slotCount: number
  aspectRatio: string
}

export interface PhotoData {
  id?: string
  filePath: string
  photoOrder: number
}

export const useSessionStore = defineStore('session', () => {
  // ==========================================
  // STATE
  // ==========================================
  const currentSessionId = ref<string | null>(null)
  const sessionCode = ref<string | null>(null)
  const paymentStatus = ref<'UNPAID' | 'PAID' | 'EXPIRED'>('UNPAID')
  const paymentAmount = ref<number>(35000)

  const selectedFrame = ref<FrameData | null>(null)
  const capturedPhotos = ref<PhotoData[]>([])
  const finalImagePath = ref<string | null>(null)
  const finalComposedImagePath = ref<string | null>(null)
  const userEmail = ref<string>('')
  const selectedFilter = ref<string>('normal')

  // ==========================================
  // GETTERS (COMPUTED)
  // ==========================================
  const isPaid = computed(() => paymentStatus.value === 'PAID')
  const totalSlotsRequired = computed(() => selectedFrame.value?.slotCount || 4)
  const isCaptureComplete = computed(
    () => capturedPhotos.value.length >= totalSlotsRequired.value
  )

  // ==========================================
  // ACTIONS
  // ==========================================

  /**
   * 1. Mulai Sesi Baru (Welcome View)
   */
  async function startNewSession() {
    resetSession()
    const res = await window.api.createSession()
    if (res.success && res.data) {
      currentSessionId.value = res.data.id
      sessionCode.value = res.data.sessionCode
      paymentAmount.value = res.data.paymentAmount
      paymentStatus.value = 'UNPAID'
    } else {
      console.error('Gagal membuat sesi baru:', res.error)
    }
    return res
  }

  /**
   * 2. Periksa Status Pembayaran (Payment View)
   */
  async function checkPayment() {
    if (!currentSessionId.value) return false
    const res = await window.api.checkPaymentStatus(currentSessionId.value)
    if (res.success && res.paymentStatus) {
      paymentStatus.value = res.paymentStatus as 'UNPAID' | 'PAID' | 'EXPIRED'
    }
    return paymentStatus.value === 'PAID'
  }

  /**
   * 3. Set Frame Pilihan (Frame Selection View)
   */
  async function selectFrame(frame: FrameData) {
    if (!currentSessionId.value) return
    selectedFrame.value = frame
    await window.api.updateSessionFrame(currentSessionId.value, frame.id)
  }

  /**
   * 4. Simpan Jepretan Foto Mentah (Photo Capture Loop)
   */
  async function addCapturedPhoto(base64Image: string) {
    if (!currentSessionId.value) return
    const photoOrder = capturedPhotos.value.length + 1

    const res = await window.api.saveRawPhoto(
      currentSessionId.value,
      photoOrder,
      base64Image
    )

    if (res.success && res.data) {
      capturedPhotos.value.push({
        id: res.data.id,
        filePath: res.data.filePath,
        photoOrder,
      })
    }
    return res
  }

  /**
   * 5. Simpan Hasil Komposisi Akhir (Composition View)
   */
  async function saveFinalCompositeImage(base64Composite: string) {
    if (!currentSessionId.value) return
    const res = await window.api.saveFinalComposite(
      currentSessionId.value,
      base64Composite
    )

    if (res.success && res.data) {
      finalImagePath.value = res.data.finalImagePath
      finalComposedImagePath.value = res.data.finalImagePath
    }
    return res
  }

  /**
   * 6. Cetak Foto (Print View)
   */
  async function print(copyCount: number = 1) {
    if (!currentSessionId.value) return
    return await window.api.printPhoto(currentSessionId.value, copyCount)
  }

  /**
   * 7. Kirim Email Softcopy (Send Email View)
   */
  async function sendEmail(email: string) {
    if (!currentSessionId.value) return
    userEmail.value = email
    return await window.api.sendSoftcopyEmail(currentSessionId.value, email)
  }

  /**
   * Hapus foto yang sudah di-capture (untuk retake)
   */
  function clearCapturedPhotos() {
    capturedPhotos.value = []
  }

  /**
   * Set filter yang dipilih
   */
  function setFilter(filter: string) {
    selectedFilter.value = filter
  }

  /**
   * Reset Seluruh State ke Default (Setelah transaksi selesai / Timeout)
   */
  function resetSession() {
    currentSessionId.value = null
    sessionCode.value = null
    paymentStatus.value = 'UNPAID'
    paymentAmount.value = 35000
    selectedFrame.value = null
    capturedPhotos.value = []
    finalImagePath.value = null
    finalComposedImagePath.value = null
    userEmail.value = ''
    selectedFilter.value = 'normal'
  }

  return {
    // State
    currentSessionId,
    sessionCode,
    paymentStatus,
    paymentAmount,
    selectedFrame,
    capturedPhotos,
    finalImagePath,
    finalComposedImagePath,
    userEmail,
    selectedFilter,

    // Getters
    isPaid,
    totalSlotsRequired,
    isCaptureComplete,

    // Actions
    startNewSession,
    checkPayment,
    selectFrame,
    addCapturedPhoto,
    saveFinalCompositeImage,
    print,
    sendEmail,
    clearCapturedPhotos,
    setFilter,
    resetSession,
  }
})