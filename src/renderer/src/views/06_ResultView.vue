<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isPrinting = ref<boolean>(false)
const printCopies = ref<number>(1)
const qrCodeUrl = ref<string>('')

// Ambil data hasil komposisi akhir dari Pinia Store
const finalImage = sessionStore.finalComposedImagePath
const sessionCode = sessionStore.sessionCode

// Generate URL QR Code untuk download digital via HP/Web
const generateQrCode = async () => {
  if (!sessionCode) return
  try {
    const res = await window.api.generateDownloadQrCode(sessionCode)
    if (res.success && res.qrDataUrl) {
      qrCodeUrl.value = res.qrDataUrl
    }
  } catch (error) {
    console.error('Gagal membuat QR Code:', error)
  }
}

// Tambah / Kurang Jumlah Cetak
const increaseCopies = () => {
  if (printCopies.value < 4) printCopies.value += 1
}

const decreaseCopies = () => {
  if (printCopies.value > 1) printCopies.value -= 1
}

// Perintah Cetak Foto via Backend IPC (Printer Spooler)
const handlePrintPhoto = async () => {
  if (isPrinting.value || !finalImage) return
  isPrinting.value = true

  try {
    const res = await window.api.printPhoto(
      sessionStore.currentSessionId,
      printCopies.value
    )

    if (res.success) {
      // Pindah ke Halaman Terima Kasih & Penutup (Step 7)
      router.push('/print-email')
    } else {
      alert('Gagal mencetak foto: ' + res.message)
    }
  } catch (error) {
    console.error('Error saat mengirim perintah cetak:', error)
    alert('Terjadi kesalahan pada mesin printer.')
  } finally {
    isPrinting.value = false
  }
}

onMounted(() => {
  generateQrCode()
})
</script>

<template>
  <div class="result-container">
    <!-- Top Step Header -->
    <div class="step-header">
      <span class="step-badge">LANGKAH 6 DARI 7</span>
      <h2 class="step-title">Pratinjau & Cetak Foto</h2>
      <p class="step-subtitle">Pindai QR Code untuk mengunduh softcopy dan cetak cetakan fisik Anda</p>
    </div>

    <!-- Main Workspace Area -->
    <div class="result-workspace">
      <!-- Final Image Display -->
      <div class="image-preview-card">
        <img
          v-if="finalImage"
          :src="finalImage"
          alt="Hasil Foto Photobooth"
          class="final-composed-img"
        />
        <div v-else class="placeholder-box">
          <span>Gambar tidak ditemukan</span>
        </div>
      </div>

      <!-- Right Panel: QR Download & Print Settings -->
      <div class="options-panel">
        <!-- Digital Download QR Code -->
        <div class="qr-section">
          <h3 class="panel-section-title">Unduh Softcopy</h3>
          <div class="qr-card">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code Download" class="qr-img" />
            <div v-else class="qr-skeleton">Memuat QR...</div>
            <p class="qr-instruction">Scan dengan kamera HP untuk menyimpan foto & GIF</p>
          </div>
        </div>

        <!-- Print Counter Selector -->
        <div class="print-counter-section">
          <h3 class="panel-section-title">Jumlah Cetak (Print)</h3>
          <div class="counter-control">
            <button class="btn-counter" :disabled="printCopies <= 1" @click="decreaseCopies">
              -
            </button>
            <span class="copies-count">{{ printCopies }} Lembar</span>
            <button class="btn-counter" :disabled="printCopies >= 4" @click="increaseCopies">
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
      <div class="session-tag">
        Sesi: <strong>#{{ sessionCode }}</strong>
      </div>

      <button
        class="btn-primary-print"
        :disabled="isPrinting || !finalImage"
        @click="handlePrintPhoto"
      >
        <span v-if="!isPrinting">🖨️ Cetak Foto Sekarang</span>
        <span v-else class="printing-state">
          <span class="spinner"></span> Mengirim ke Printer...
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.result-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #ffffff;
  user-select: none;
  padding: 2rem 3rem;
  box-sizing: border-box;
}

.step-header {
  text-align: center;
}

.step-badge {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.4);
  padding: 0.35rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.step-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0.5rem 0 0.2rem;
}

.step-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
}

/* Workspace Layout */
.result-workspace {
  display: flex;
  gap: 3.5rem;
  width: 100%;
  max-width: 1000px;
  height: 60vh;
  align-items: center;
  justify-content: center;
}

/* Image Card */
.image-preview-card {
  height: 100%;
  aspect-ratio: 1 / 3;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  border: 3px solid rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
}

.final-composed-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder-box {
  color: #64748b;
  font-size: 0.9rem;
}

/* Options Right Panel */
.options-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 320px;
}

.panel-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #cbd5e1;
  margin: 0 0 0.75rem;
}

/* QR Code Section */
.qr-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.qr-img {
  width: 160px;
  height: 160px;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 8px;
}

.qr-skeleton {
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #64748b;
  font-size: 0.85rem;
}

.qr-instruction {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.75rem 0 0;
  line-height: 1.3;
}

/* Print Counter Section */
.print-counter-section {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.counter-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.75rem;
  padding: 0.5rem;
}

.btn-counter {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  border: none;
  background: #334155;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-counter:hover:not(:disabled) {
  background: #475569;
}

.btn-counter:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.copies-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
}

/* Action Bar */
.action-bar {
  width: 100%;
  max-width: 1000px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.25rem;
}

.session-tag {
  color: #94a3b8;
  font-size: 0.95rem;
}

.session-tag strong {
  color: #38bdf8;
}

.btn-primary-print {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
  transition: all 0.2s;
}

.btn-primary-print:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.7);
}

.btn-primary-print:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.printing-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>