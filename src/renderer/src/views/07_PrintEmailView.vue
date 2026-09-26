<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isPrinting = ref<boolean>(false)
const printCopies = ref<number>(1)
const qrCodeUrl = ref<string>('')
const isEmailing = ref<boolean>(false)
const userEmail = ref<string>('')

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
      // Pindah ke Halaman Terima Kasih & Penutup (Step 7 complete)
      router.push('/thankyou')
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

// Kirim Email Softcopy
const handleSendEmail = async () => {
  if (isEmailing.value || !finalImage || !userEmail.value.trim()) return
  isEmailing.value = true

  try {
    const res = await window.api.sendSoftcopyEmail(
      sessionStore.currentSessionId,
      userEmail.value.trim()
    )

    if (res.success) {
      alert('Email berhasil dikirim!')
      userEmail.value = ''
    } else {
      alert('Gagal mengirim email: ' + res.error)
    }
  } catch (error) {
    console.error('Error saat mengirim email:', error)
    alert('Terjadi kesalahan saat mengirim email.')
  } finally {
    isEmailing.value = false
  }
}

onMounted(() => {
  generateQrCode()
})
</script>

<template>
  <div class="print-email-container">
    <!-- Top Step Header -->
    <div class="step-header">
      <span class="step-badge">LANGKAH 7 DARI 7</span>
      <h2 class="step-title">Cetak & Kirim Email</h2>
      <p class="step-subtitle">Cetak foto fisik dan/atau kirim softcopy ke email Anda</p>
    </div>

    <!-- Main Workspace Area -->
    <div class="workspace">
      <!-- Left: Final Image Preview -->
      <div class="preview-section">
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

        <div class="session-info">
          <p>Sesi: <strong>#{{ sessionCode }}</strong></p>
        </div>
      </div>

      <!-- Right: Options Panel -->
      <div class="options-panel">
        <!-- Print Section -->
        <div class="print-section">
          <h3 class="panel-section-title">🖨️ Cetak Foto</h3>
          
          <div class="print-counter-control">
            <span class="counter-label">Jumlah Cetak:</span>
            <div class="counter-input-group">
              <button 
                class="btn-counter" 
                :disabled="printCopies <= 1" 
                @click="decreaseCopies"
                aria-label="Kurangi jumlah cetak"
              >
                -
              </button>
              <span class="copies-count">{{ printCopies }} Lembar</span>
              <button 
                class="btn-counter" 
                :disabled="printCopies >= 4" 
                @click="increaseCopies"
                aria-label="Tambah jumlah cetak"
              >
                +
              </button>
            </div>
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

        <!-- Divider -->
        <div class="divider">
          <span>ATAU</span>
        </div>

        <!-- Email Section -->
        <div class="email-section">
          <h3 class="panel-section-title">📧 Kirim Softcopy ke Email</h3>
          
          <div class="email-input-group">
            <input
              type="email"
              v-model="userEmail"
              placeholder="Masukkan alamat email Anda"
              class="email-input"
              :disabled="isEmailing"
              @keyup.enter="handleSendEmail"
            />
            <button
              class="btn-email"
              :disabled="isEmailing || !userEmail.trim() || !finalImage"
              @click="handleSendEmail"
            >
              <span v-if="!isEmailing">Kirim Email</span>
              <span v-else class="emailing-state">
                <span class="spinner-sm"></span> Mengirim...
              </span>
            </button>
          </div>
          
          <p class="email-note">Softcopy akan dikirim sebagai lampiran PNG</p>
        </div>

        <!-- QR Download Section -->
        <div class="qr-section">
          <h3 class="panel-section-title">📱 Unduh Langsung (QR Code)</h3>
          <div class="qr-card">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code Download" class="qr-img" />
            <div v-else class="qr-skeleton">Memuat QR...</div>
            <p class="qr-instruction">Scan dengan kamera HP untuk menyimpan foto</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
      <button class="btn-finish" @click="$router.push('/welcome')">
        Selesai & Kembali ke Awal
      </button>
    </div>
  </div>
</template>

<style scoped>
.print-email-container {
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
  margin-bottom: 1rem;
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
.workspace {
  display: flex;
  gap: 3.5rem;
  width: 100%;
  max-width: 1200px;
  flex: 1;
  height: calc(100% - 140px);
  align-items: center;
  justify-content: center;
}

/* Preview Section */
.preview-section {
  flex: 1;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

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
  width: 100%;
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

.session-info {
  margin-top: 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.95rem;
}

.session-info strong {
  color: #38bdf8;
}

/* Options Panel */
.options-panel {
  width: 380px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Print Section */
.print-section,
.email-section,
.qr-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #cbd5e1;
  margin: 0;
}

.print-counter-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.counter-label {
  font-size: 0.9rem;
  color: #94a3b8;
}

.counter-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.75rem;
  padding: 0.5rem;
}

.btn-counter {
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  border: none;
  background: #334155;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-counter:hover:not(:disabled) {
  background: #475569;
}

.btn-counter:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.copies-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f8fafc;
  min-width: 80px;
  text-align: center;
}

.btn-primary-print {
  width: 100%;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
  transition: all 0.2s;
}

.btn-primary-print:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.7);
}

.btn-primary-print:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.printing-state {
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #64748b;
  font-size: 0.85rem;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

/* Email Section */
.email-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.email-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.email-input:focus {
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.email-input::placeholder {
  color: #64748b;
}

.email-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-email {
  width: 100%;
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: white;
  border: none;
  padding: 0.85rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  transition: all 0.2s;
}

.btn-email:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.6);
}

.btn-email:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emailing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite.
}

.email-note {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

/* QR Section */
.qr-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
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
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.3;
}

/* Action Bar */
.action-bar {
  width: 100%;
  max-width: 1200px;
  padding-top: 1rem;
}

.btn-finish {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-finish:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>