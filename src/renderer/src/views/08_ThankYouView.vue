<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const countdown = ref(10)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      if (timer) clearInterval(timer)
      sessionStore.resetSession()
      router.push('/welcome')
    }
  }, 1000)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="thankyou-container">
    <div class="bg-overlay"></div>

    <div class="content-box">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 class="title">TERIMA KASIH!</h1>
      <p class="subtitle">Foto Anda telah selesai diproses</p>

      <div class="session-summary">
        <p>Kode Sesi: <strong>{{ sessionStore.sessionCode }}</strong></p>
        <p v-if="sessionStore.finalComposedImagePath">
          Foto siap dicetak & dikirim ke email
        </p>
      </div>

      <div class="countdown-circle">
        <span class="countdown-number">{{ countdown }}</span>
        <span class="countdown-label">detik menuju sesi baru</span>
      </div>

      <button class="btn-restart" @click="router.push('/welcome')">
        Mulai Sesi Baru
      </button>
    </div>
  </div>
</template>

<style scoped>
.thankyou-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
  color: #ffffff;
  user-select: none;
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.content-box {
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
}

.success-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
  animation: popIn 0.6s ease-out;
}

.success-icon svg {
  width: 60px;
  height: 60px;
  color: #ffffff;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  background: linear-gradient(to right, #10b981, #34d399, #6ee7b7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

.session-summary {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.8;
}

.session-summary strong {
  color: #34d399;
}

.countdown-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(16, 185, 129, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
}

.countdown-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #10b981;
  font-variant-numeric: tabular-nums;
}

.countdown-label {
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

.btn-restart {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
  transition: all 0.2s;
}

.btn-restart:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.7);
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
</style>