<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isChecking = ref(false)
const qrCodeUrl = ref('')
const errorMessage = ref('')
const countdown = ref(120)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const generatePaymentQr = async () => {
  if (!sessionStore.currentSessionId) return
  try {
    const res = await window.api.generatePaymentQrCode(sessionStore.currentSessionId)
    if (res.success && res.qrDataUrl) {
      qrCodeUrl.value = res.qrDataUrl
    } else {
      errorMessage.value = res.error || 'Gagal membuat QR Code pembayaran'
    }
  } catch (error) {
    console.error('Error generating payment QR:', error)
    errorMessage.value = 'Terjadi kesalahan saat memuat QR Code'
  }
}

const checkPaymentLoop = async () => {
  if (!sessionStore.currentSessionId) return
  isChecking.value = true
  try {
    const res = await window.api.checkPaymentStatus(sessionStore.currentSessionId)
    if (res.success && res.paymentStatus === 'PAID') {
      if (countdownTimer) clearInterval(countdownTimer)
      router.push('/frame-selection')
      return
    }
  } catch (error) {
    console.error('Error checking payment:', error)
  } finally {
    isChecking.value = false
  }
}

const startCountdown = () => {
  countdown.value = 120
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      clearInterval(countdownTimer!)
      sessionStore.resetSession()
      router.push('/welcome')
    }
  }, 1000)
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(async () => {
  if (!sessionStore.currentSessionId) {
    const res = await sessionStore.startNewSession()
    if (!res.success) {
      errorMessage.value = 'Gagal membuat sesi pembayaran'
      return
    }
  }
  await generatePaymentQr()
  startCountdown()
  const checkInterval = setInterval(() => { checkPaymentLoop() }, 5000)
  ;(window as any).__paymentCheckInterval = checkInterval
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if ((window as any).__paymentCheckInterval) {
    clearInterval((window as any).__paymentCheckInterval)
  }
})

const handleManualCheck = async () => {
  const paid = await sessionStore.checkPayment()
  if (paid) {
    if (countdownTimer) clearInterval(countdownTimer)
    router.push('/frame-selection')
  } else {
    errorMessage.value = 'Belum terdeteksi pembayaran. Silakan scan QR Code.'
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}
</script>

<template>
  <div class="payment-container">
    <div class="step-header">
      <span class="step-badge">LANGKAH 2 DARI 7</span>
      <h2 class="step-title">Pembayaran Photobooth</h2>
      <p class="step-subtitle">Scan QR Code untuk membayar Rp {{ sessionStore.paymentAmount.toLocaleString('id-ID') }}</p>
    </div>

    <div v-if="errorMessage" class="error-toast">
      <span>{{ errorMessage }}</span>
    </div>

    <div class="payment-workspace">
      <div class="qr-display-card">
        <div class="qr-header">
          <h3>Metode Pembayaran</h3>
          <div class="payment-methods">
            <span class="method-tag">QRIS</span>
            <span class="method-tag">GoPay</span>
            <span class="method-tag">OVO</span>
            <span class="method-tag">Dana</span>
            <span class="method-tag">ShopeePay</span>
          </div>
        </div>

        <div class="qr-main">
          <div v-if="qrCodeUrl" class="qr-code-wrapper">
            <img :src="qrCodeUrl" alt="QR Code Pembayaran" class="qr-img" />
          </div>
          <div v-else class="qr-skeleton">
            <span class="spinner"></span>
            <p>Memuat QR Code...</p>
          </div>
        </div>

        <div class="qr-footer">
          <p class="amount">Total: <strong>Rp {{ sessionStore.paymentAmount.toLocaleString('id-ID') }}</strong></p>
          <p class="session-code">Kode Sesi: <strong>{{ sessionStore.sessionCode }}</strong></p>
          <p class="timer" :class="{ warning: countdown <= 30 }">
            Waktu tersisa: <strong>{{ formatTime(countdown) }}</strong>
          </p>
        </div>
      </div>

      <div class="instructions-panel">
        <h3 class="panel-title">Cara Bayar</h3>
        <div class="steps-list">
          <div class="step-item">
            <span class="step-number">1</span>
            <div class="step-text">
              <strong>Buka aplikasi e-wallet</strong> (GoPay, OVO, Dana, ShopeePay, atau aplikasi bank)
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">2</span>
            <div class="step-text">
              <strong>Pilih "Bayar QRIS" / "Scan QR"</strong> lalu arahkan kamera ke kode di samping
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">3</span>
            <div class="step-text">
              <strong>Konfirmasi pembayaran</strong> di aplikasi e-wallet Anda
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">4</span>
            <div class="step-text">
              <strong>Tunggu otomatis</strong> - halaman akan pindah ke pemilihan frame saat lunas
            </div>
          </div>
        </div>

        <div class="manual-check">
          <button class="btn-check" :disabled="isChecking" @click="handleManualCheck">
            <span v-if="!isChecking">🔄 Cek Status Pembayaran</span>
            <span v-else class="checking-text">
              <span class="spinner-sm"></span> Mengecek...
            </span>
          </button>
          <p class="auto-note">Sistem mengecek otomatis setiap 5 detik</p>
        </div>

        <div class="cancel-section">
          <button class="btn-cancel" @click="$router.push('/welcome')">
            Batalkan & Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
  color: #ffffff;
  user-select: none;
  padding: 2rem 3rem;
  box-sizing: border-box;
  overflow: hidden;
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
  font-size: 1rem;
  margin: 0;
}

.error-toast {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.payment-workspace {
  display: flex;
  gap: 3rem;
  width: 100%;
  max-width: 1200px;
  flex: 1;
  height: calc(100% - 120px);
  align-items: stretch;
}

.qr-display-card {
  flex: 1;
  max-width: 550px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.qr-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.qr-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #f8fafc;
}

.payment-methods {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.method-tag {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.qr-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.qr-code-wrapper {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.qr-img {
  width: 280px;
  height: 280px;
  border-radius: 0.5rem;
}

.qr-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(168, 85, 247, 0.3);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.qr-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #38bdf8;
}

.session-code {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0 0 1rem;
}

.timer {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.timer.warning {
  color: #f87171;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.instructions-panel {
  width: 380px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  color: #f8fafc;
  text-align: center;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

.step-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #cbd5e1;
}

.step-text strong {
  color: #f8fafc;
  display: block;
  margin-bottom: 0.25rem;
}

.manual-check {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-check {
  width: 100%;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  transition: all 0.2s;
}

.btn-check:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.6);
}

.btn-check:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checking-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.auto-note {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.cancel-section {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  width: 100%;
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.4);
}
</style>