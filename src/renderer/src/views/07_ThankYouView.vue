<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const countdown = ref(10)
const TOTAL_SECONDS = 10
const RING_RADIUS = 19
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ~119.38
const ringOffset = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const finalImage = sessionStore.finalComposedImagePath
const sessionCode = sessionStore.sessionCode
const sentEmail = sessionStore.userEmail || 'your email'

const triggerReset = () => {
  if (timer) clearInterval(timer)
  sessionStore.resetSession()
  router.push('/')
}

onMounted(() => {
  ringOffset.value = CIRCUMFERENCE - (countdown.value / TOTAL_SECONDS) * CIRCUMFERENCE
  timer = setInterval(() => {
    countdown.value -= 1
    ringOffset.value = CIRCUMFERENCE - (countdown.value / TOTAL_SECONDS) * CIRCUMFERENCE
    if (countdown.value < 0) {
      triggerReset()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Keyboard: Space untuk reset cepat
const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    triggerReset()
  }
}

// Panggil di onMounted setelah timer
// window.addEventListener('keydown', handleKeydown)
// onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="fixed inset-0 bg-background font-body-md text-on-surface antialiased select-none flex flex-col p-margin">
    
    <div class="flex items-center justify-between z-50 pointer-events-none mb-space-md">
      <div class="flex items-center gap-space-sm pointer-events-auto">
        <div class="flex items-center gap-space-xs">
          <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
        </div>
        <div class="w-1.5 h-1.5 rounded-full bg-primary/40 ml-space-xs"></div>
        <span class="font-label-md text-label-md text-on-surface-variant/50 tracking-widest uppercase">Lumina Studio</span>
      </div>
      <div class="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-sm pointer-events-auto">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span class="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase">Live Kiosk</span>
      </div>
    </div>

    <main class="relative flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-space-xl overflow-hidden">
      
      <!-- Background blobs -->
      <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[720px] bg-gradient-to-b from-primary-fixed/30 via-tertiary-fixed/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 -right-20 w-[420px] h-[420px] bg-secondary-fixed/25 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center px-space-md">
        
        <!-- Floating photo cards -->
        <div class="relative w-full max-w-lg h-64 sm:h-72 mb-space-lg flex items-center justify-center select-none">
          <svg class="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewbox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            <circle cx="90" cy="50" fill="#2170e4" opacity="0.45" r="3"></circle>
            <path d="M190 20 L193 28 L201 31 L193 34 L190 42 L187 34 L179 31 L187 28 Z" fill="#0058be" opacity="0.55"></path>
            <path d="M70 190 L72 195 L77 197 L72 199 L70 204 L68 199 L63 197 L68 195 Z" fill="#1d4ed8" opacity="0.4"></path>
            <path d="M320 60 L322.5 67 L330 69.5 L322.5 72 L320 79 L317.5 72 L310 69.5 L317.5 67 Z" fill="#2151da" opacity="0.6"></path>
            <circle cx="330" cy="180" fill="#9ccaff" opacity="0.6" r="4"></circle>
            <circle cx="280" cy="220" fill="#0037b0" opacity="0.3" r="2.5"></circle>
          </svg>

          <!-- Card 1 -->
          <div class="absolute transform -rotate-8 -translate-x-14 sm:-translate-x-20 translate-y-2 hover:rotate-0 transition-transform duration-500 ease-out">
            <div class="bg-surface-container-lowest p-3 pb-8 rounded-xl shadow-xl w-36 sm:w-44 flex flex-col">
              <div class="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container">
                <img v-if="finalImage" :src="finalImage" alt="Photo 1" class="w-full h-full object-cover" />
                <img v-else src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSNgA610-umWqEhlnqLGDcRiEeDEb14y0T-dm7zOFEA6lhumvrXZn-4b0RO9NgzdgN_qLWMlPfBmK27pX5bN-pe1qbRsQP-feNDW7WKgp9e8ThZATPdCfkzctlld1ywosoZFFwSq9SJKOsJbzGLFpRxl_92fOJzpXkkcoVDD_YziGx_VxN5LvtkIq_-E3axB4XKuDYFO8IkrFLFC7a93MPwfG2aIUy8AiP_Y-gpNUOtYUqG9bznwGa" alt="Sample 1" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
              </div>
              <div class="flex items-center justify-between mt-3 px-1">
                <span class="font-label-md text-label-md text-on-surface-variant/70 tracking-wider">#{{ sessionCode }} • Printed</span>
                <span class="material-symbols-outlined text-[14px] text-secondary">favorite</span>
              </div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="absolute transform rotate-6 translate-x-14 sm:translate-x-20 -translate-y-2 hover:rotate-0 transition-transform duration-500 ease-out z-10">
            <div class="bg-surface-container-lowest p-3 pb-8 rounded-xl shadow-xl w-36 sm:w-44 flex flex-col">
              <div class="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container">
                <img v-if="finalImage" :src="finalImage" alt="Photo 2" class="w-full h-full object-cover" />
                <img v-else src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdcM23zNalwqrv1Chm4WrXuYxJos33fFaH0gKXg3cE9cDPpD66MkjRPMIY7sB-HfPNeFnWnjmjKfvV4Lht6kM41YKY6_I_XZxk5nh02aXqCcY0S8eQoSC5FE2rw5DpuXDnyyXtPhk4ubzEuwVX1l3VbYnes0hDHn66pgGn76SPaz7pdGkRxyR-9-KGb9mWSoKlam4TFu8-T3sqPltFKmDCmVrq6Z2RxpAVQlHlMzfNNXaZkxnI-k6O" alt="Sample 2" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-secondary-container/20 via-transparent to-transparent"></div>
              </div>
              <div class="flex items-center justify-between mt-3 px-1">
                <span class="font-label-md text-label-md text-on-surface-variant/70 tracking-wider">Digital Sent</span>
                <span class="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
              </div>
            </div>
          </div>

          <!-- Premium gloss badge bottom -->
          <div class="absolute -bottom-2 z-20 flex items-center justify-center">
            <div class="bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-1.5 rounded-full shadow-md flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              <span class="font-label-md text-label-md text-primary tracking-wide font-semibold">PREMIUM GLOSS PRINT</span>
            </div>
          </div>
        </div>

        <!-- Thank you text -->
        <div class="space-y-space-sm max-w-2xl mb-space-lg">
          <h1 class="font-display-sm text-display-sm sm:font-display-lg sm:text-display-lg text-on-surface tracking-tight">Thank You for Snapping!</h1>
          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">Your photo strips are ready in the tray below, and digital copies are flying to your inbox.</p>
        </div>

        <!-- Status badges -->
        <div class="flex flex-wrap items-center justify-center gap-space-sm mb-space-xl">
          <div class="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-2.5 rounded-full shadow-sm">
            <span class="material-symbols-outlined text-[20px] text-primary-container" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <span class="font-label-lg text-label-lg text-on-surface font-semibold tracking-wide">2 Prints Dispensed</span>
          </div>
          <div class="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-2.5 rounded-full shadow-sm">
            <span class="material-symbols-outlined text-[20px] text-primary-container" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <span class="font-label-lg text-label-lg text-on-surface font-semibold tracking-wide">Email Sent to <span class="text-secondary font-medium">{{ sentEmail }}</span></span>
          </div>
        </div>

        <!-- Countdown + Start New Session -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-space-lg sm:gap-space-xl">
          <div class="flex items-center gap-space-md bg-surface-container-low/70 px-space-md py-2.5 rounded-full">
            <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
              <svg class="w-12 h-12 -rotate-90" viewbox="0 0 48 48">
                <circle class="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="19" stroke="currentColor" stroke-width="3"></circle>
                <circle class="text-primary-container transition-all duration-1000 ease-linear" cx="24" cy="24" fill="transparent" r="19" stroke="currentColor" :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="ringOffset" stroke-linecap="round" stroke-width="3.5"></circle>
              </svg>
              <span class="absolute font-headline-md text-headline-md text-primary font-bold text-center leading-none">{{ countdown > 0 ? countdown : 0 }}</span>
            </div>
            <div class="text-left pr-space-xs">
              <span class="block font-label-md text-label-md text-on-surface-variant/70 uppercase tracking-wider">Session Reset</span>
              <span class="block font-label-lg text-label-lg text-on-surface font-semibold">Returning to start in <span>{{ countdown > 0 ? countdown : 0 }}s</span></span>
            </div>
          </div>

          <button type="button" @click="triggerReset" class="group relative inline-flex items-center justify-center gap-space-sm bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-semibold px-space-lg py-4 min-h-[56px] rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-180">refresh</span>
            <span>Start New Session</span>
            <span class="ml-1 px-2 py-0.5 rounded-md bg-on-primary/20 text-on-primary font-label-md text-label-md font-mono uppercase tracking-wider">Space</span>
          </button>
        </div>

        <!-- Tray sensor status -->
        <div class="mt-space-xl flex items-center gap-space-xs text-on-surface-variant/40">
          <span class="material-symbols-outlined text-[16px]">sensors</span>
          <span class="font-label-md text-label-md tracking-wider uppercase">Tray Sensor Active • Retrieval Confirmed</span>
        </div>
      </div>
    </main>

    <footer class="fixed bottom-margin left-margin right-margin z-40 pointer-events-none">
      <div class="max-w-7xl mx-auto flex items-center justify-between font-label-md text-label-md text-on-surface-variant/60">
        <div class="flex items-center gap-space-xs pointer-events-auto">
          <span class="material-symbols-outlined text-[14px] text-primary">photo_camera</span>
          <span>Touchscreen Ready</span>
        </div>
        <div class="pointer-events-auto flex items-center gap-space-md">
          <span class="uppercase tracking-wider">Lumina OS • 60 FPS</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Semua via Tailwind global */
</style>