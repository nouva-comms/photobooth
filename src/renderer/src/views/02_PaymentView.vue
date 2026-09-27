<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'
const router = useRouter()
const sessionStore = useSessionStore()
// State
const qrCodeUrl = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const countdown = ref(108) // 1 menit 48 detik
const progressOffset = ref(65)
const CIRCUMFERENCE = 295
let pollInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null
// Computed dari store yang ADA
const price = computed(() => sessionStore.paymentAmount)
const sessionId = computed(() => sessionStore.currentSessionId)
const generateQR = async () => {
  isLoading.value = true
  error.value = null
  try {
    // PANGGIL API YANG ADA: generatePaymentQrCode(sessionId)
    const res = await window.api.generatePaymentQrCode(sessionId.value!)
    if (res.success && res.qrDataUrl) {
      qrCodeUrl.value = res.qrDataUrl
      startPolling()
      startCountdown()
    } else {
      error.value = res.error || 'Gagal generate QR'
    }
  } catch (e) {
    error.value = 'Error generate QR: ' + (e as Error).message
  } finally {
    isLoading.value = false
  }
}
const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(async () => {
    if (!sessionId.value) return
    try {
      // PANGGIL API YANG ADA: checkPaymentStatus(sessionId)
      const res = await window.api.checkPaymentStatus(sessionId.value)
      if (res.success && res.paymentStatus === 'PAID') {
        stopAllTimers()
        // GUNAKAN ACTION YANG ADA: checkPayment() -> set paymentStatus = 'PAID'
        await sessionStore.checkPayment()
        router.push('/frame')
      }
    } catch {
      // silent
    }
  }, 5000)
}
const startCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 108
      progressOffset.value = 65
      generateQR() // Re-generate QR saat timeout
    } else {
      const progress = countdown.value / 108
      progressOffset.value = CIRCUMFERENCE * (1 - progress)
    }
  }, 1000)
}
const stopAllTimers = () => {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
}
const goBack = () => {
  stopAllTimers()
  router.push('/')
}

const simulatePayment = async () => {
  stopAllTimers()
  await sessionStore.checkPayment()
  router.push('/frame-selection')
}

onMounted(() => {
  if (!sessionId.value) {
    router.push('/')
    return
  }
  generateQR()
})
onUnmounted(() => {
  stopAllTimers()
})
</script>

<template>
  <div class="fixed inset-0 bg-background font-body-md text-on-surface antialiased select-none flex flex-col p-margin">
    
    <!-- Top Bar: Studio badge + Live Kiosk (satu bar, justify-between) -->
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
      <div class="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] pointer-events-auto">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span class="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase">Live Kiosk</span>
      </div>
    </div>

    <!-- Main Content: flex-1, no min-h, flex-col justify-center -->
    <main class="flex-1 flex flex-col justify-center select-none overflow-hidden relative z-10">
      
      <!-- Step Tag & Header (compact) -->
      <div class="flex flex-col items-center text-center space-y-space-xs mb-space-md">
        <div class="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant">
          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span class="font-label-md text-label-md uppercase tracking-widest font-semibold">Step 1 of 6 • Payment</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Scan to Pay</h1>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-md">
          Use your phone camera or payment app to complete your session.
        </p>
      </div>

      <!-- Two Panels: Grid responsive, gap reduced -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start flex-1 min-h-0">
        
        <!-- Left Panel: Package Overview (col-span-5 lg, full mobile) -->
        <div class="lg:col-span-5 flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm min-h-0">
          <div class="space-y-space-md flex-1 overflow-hidden">
            <!-- Badge & Title -->
            <div class="space-y-space-xs">
              <span class="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold">Self-Service Capture</span>
              <h2 class="font-headline-md text-headline-md text-on-surface">Photo Session Package</h2>
            </div>
            <!-- Price (compact) -->
            <div class="p-space-md rounded-lg bg-surface-container-low flex items-baseline justify-between">
              <div>
                <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">Total Amount</span>
                <span class="font-label-md text-label-md text-outline">Tax included • Instant Access</span>
              </div>
              <div class="flex items-baseline gap-space-xs">
                <span class="font-headline-md text-headline-md text-primary font-bold">$</span>
                <span class="font-display-sm text-display-sm text-primary font-bold leading-none">{{ price.toFixed(2) }}</span>
              </div>
            </div>
            <!-- Highlights (3 items, tighter) -->
            <div class="space-y-space-sm pt-space-xs">
              <div class="flex items-start gap-space-sm">
                <div class="p-1 rounded-full bg-primary-fixed text-primary shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-[16px] block" style="font-variation-settings: 'FILL' 1;">check</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-body-md text-body-md font-semibold text-on-surface truncate">2 Printed Glossy Photo Strips</span>
                  <span class="font-label-md text-label-md text-on-surface-variant truncate">Archival thermal dye sublimation output</span>
                </div>
              </div>
              <div class="flex items-start gap-space-sm">
                <div class="p-1 rounded-full bg-primary-fixed text-primary shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-[16px] block" style="font-variation-settings: 'FILL' 1;">check</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-body-md text-body-md font-semibold text-on-surface truncate">Full Digital Copies via Email &amp; QR</span>
                  <span class="font-label-md text-label-md text-on-surface-variant truncate">Full-resolution gallery ready in 15 seconds</span>
                </div>
              </div>
              <div class="flex items-start gap-space-sm">
                <div class="p-1 rounded-full bg-primary-fixed text-primary shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-[16px] block" style="font-variation-settings: 'FILL' 1;">check</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-body-md text-body-md font-semibold text-on-surface truncate">All Pro Filters &amp; Retouch</span>
                  <span class="font-label-md text-label-md text-on-surface-variant truncate">Studio monochrome, warm vintage, and skin-tone soft</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Status Pill (bottom of left panel) -->
          <div class="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant border-t border-outline-variant/30">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[16px] text-primary">verified_user</span>
              <span class="font-label-md text-label-md">256-Bit Encrypted Link</span>
            </div>
            <span class="font-label-md text-label-md uppercase tracking-wider">Kiosk #04</span>
          </div>
        </div>

        <!-- Right Panel: QR Scanner (col-span-7 lg) -->
        <div class="lg:col-span-7 flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-lowest shadow-sm min-h-0">
          
          <!-- QR Stage with Ring (size responsive) -->
          <div class="relative flex items-center justify-center mb-space-md">
            <svg class="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewbox="0 0 100 100" style="max-width: 280px; max-height: 280px;">
              <circle class="text-surface-container-high" cx="50" cy="50" fill="none" r="47" stroke="currentColor" stroke-width="2"></circle>
              <circle class="text-primary transition-all duration-1000" cx="50" cy="50" fill="none" r="47" stroke="currentColor" :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="progressOffset" stroke-linecap="round" stroke-width="2.5"></circle>
            </svg>
            <div class="relative w-48 h-48 md:w-56 md:h-56 bg-surface-container-lowest rounded-xl p-space-md flex items-center justify-center shadow-sm relative z-10">
              <div v-if="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <img v-else-if="qrCodeUrl" :src="qrCodeUrl" alt="Payment QR Code" class="w-full h-full object-contain rounded-lg" />
              <div v-else class="flex items-center justify-center text-on-surface-variant">
                <span class="material-symbols-outlined text-5xl">qr_code_scanner</span>
              </div>
            </div>
          </div>

          <!-- Instruction + Countdown (compact) -->
          <div class="space-y-space-xs text-center mb-space-md">
            <span class="font-headline-md text-headline-md text-on-surface">Point your smartphone camera</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant flex items-center justify-center gap-space-xs">
              <span>Code refreshes in</span>
              <span class="font-bold text-primary font-mono">
                {{ String(Math.floor(countdown / 60)).padStart(2, '0') }}:{{ String(countdown % 60).padStart(2, '0') }}
              </span>
            </p>
          </div>

          <!-- Wallets (compact chips) -->
          <div class="flex flex-wrap items-center justify-center gap-space-xs mb-space-md">
            <span class="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low font-label-md text-label-md text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px]">phone_iphone</span>
              <span class="font-semibold">Apple Pay</span>
            </span>
            <span class="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low font-label-md text-label-md text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px]">android</span>
              <span class="font-semibold">Google Pay</span>
            </span>
            <span class="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low font-label-md text-label-md text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px]">credit_card</span>
              <span class="font-semibold">Debit • Credit</span>
            </span>
          </div>

          <!-- Payment Simulation Button (for testing) -->
          <button type="button" @click="simulatePayment" class="w-full max-w-md flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors duration-150 cursor-pointer text-left">
            <div class="flex items-center gap-space-sm">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                <span class="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div class="min-w-0">
                <span class="font-body-md text-body-md font-semibold text-on-surface block">Simulasi Pembayaran Berhasil</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Klik untuk lanjut ke pilih frame</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline text-[18px] shrink-0">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- Bottom Actions (Back + Status) -->
      <div class="flex items-center justify-between pt-space-md mt-auto border-t border-outline-variant/30">
        <button type="button" class="inline-flex items-center gap-space-xs text-outline hover:text-on-surface transition-colors cursor-pointer group py-space-xs px-space-sm rounded-lg hover:bg-surface-container" @click="goBack">
          <span class="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span class="font-label-lg text-label-lg">Back to Options</span>
        </button>
        <div class="flex items-center gap-space-xs text-outline">
          <span class="w-1.5 h-1.5 rounded-full bg-surface-tint"></span>
          <span class="font-label-md text-label-md uppercase tracking-wider">Awaiting Scan Confirmation</span>
        </div>
      </div>
    </main>

    <!-- Footer (fixed bottom, compact) -->
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