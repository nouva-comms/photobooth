<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isLoading = ref(false)

// Dipanggil saat pengguna menyentuh/mengklik layar
const handleStart = async () => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    // 1. Panggil action Pinia Store untuk membuat sesi baru via IPC Backend
    const res = await sessionStore.startNewSession()

    if (res.success) {
      // 2. Berhasil buat sesi -> Pindah ke Halaman Pembayaran (Step 2)
      router.push('/payment')
    } else {
      alert('Gagal memulai sesi baru. Silakan coba lagi.')
    }
  } catch (error) {
    console.error('Error starting session:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div 
    class="welcome-container"
    @click="handleStart"
  >
    <!-- Background Animated Overlay -->
    <div class="bg-overlay"></div>

    <!-- Main Content Box -->
    <div class="content-box">
      <!-- Logo / Header -->
      <div class="logo-wrapper">
        <h1 class="brand-title">NOUVA</h1>
        <p class="brand-subtitle">PHOTOBOOTH STUDIO</p>
      </div>

      <!-- Hero Visual Call to Action -->
      <div class="cta-wrapper">
        <div class="camera-icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        <!-- Touch Instruction Animation -->
        <div v-if="!isLoading" class="touch-prompt">
          <span class="pulse-text">SENTUH LAYAR UNTUK MEMULAI</span>
          <span class="sub-text">Touch Screen to Start</span>
        </div>

        <div v-else class="loading-prompt">
          <span class="spinner"></span>
          <span>MEMIAPKAN SESI...</span>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="footer-info">
        <p>Cetak Foto Instan • Softcopy Email • Banyak Filter</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset Fullscreen Kiosk Layout */
.welcome-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
  color: #ffffff;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
}

/* Background Overlay Effect */
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* Content Container */
.content-box {
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 80%;
  text-align: center;
}

/* Header Styles */
.brand-title {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 0.35em;
  background: linear-gradient(to right, #a855f7, #ec4899, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.brand-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.25em;
  color: #94a3b8;
  margin-top: 0.5rem;
}

/* Call to Action Circle */
.camera-icon-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 2rem;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.2);
  animation: float 3s ease-in-out infinite;
}

.icon-camera {
  width: 70px;
  height: 70px;
  color: #ec4899;
}

/* Touch Prompt Pulse Effect */
.touch-prompt {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pulse-text {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #ffffff;
  animation: pulse 1.8s infinite;
}

.sub-text {
  font-size: 1rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

/* Loading State */
.loading-prompt {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #a855f7;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(168, 85, 247, 0.3);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.footer-info {
  font-size: 0.95rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

/* Keyframe Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.98); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>