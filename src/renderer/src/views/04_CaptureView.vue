<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

// DOM Refs
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// State
const mediaStream = ref<MediaStream | null>(null)
const countdown = ref<number | null>(null)
const isCapturing = ref<boolean>(false)
const flashActive = ref<boolean>(false)
const mirrored = ref<boolean>(false)

// Countdown ring
const COUNTDOWN_MAX = 3
const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ~326.72
const ringOffset = ref<number>(RING_CIRCUMFERENCE * (1 - 1 / COUNTDOWN_MAX)) // start at 1/3

// Slot foto dari frame pilihan
const requiredSlots = computed(() => sessionStore.totalSlotsRequired)
const currentSlotIndex = computed(() => sessionStore.capturedPhotos.length + 1)
const capturedPhotos = computed(() => sessionStore.capturedPhotos)

// 1. Inisialisasi Kamera Webcam
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user',
      },
      audio: false,
    })
    mediaStream.value = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('Gagal mengakses kamera:', error)
    alert('Kamera tidak terdeteksi atau izin ditolak!')
  }
}

// 2. Mulaikan Sesi Pemotretan Otomatis (Countdown Loop)
const startPhotoLoop = () => {
  if (isCapturing.value) return
  isCapturing.value = true
  runCountdown(COUNTDOWN_MAX)
}

// 3. Jalankan Hitung Mundur
const runCountdown = (seconds: number) => {
  countdown.value = seconds
  ringOffset.value = RING_CIRCUMFERENCE * (1 - seconds / COUNTDOWN_MAX)
  
  const timer = setInterval(() => {
    if (countdown.value !== null && countdown.value > 1) {
      countdown.value -= 1
      ringOffset.value = RING_CIRCUMFERENCE * (1 - countdown.value / COUNTDOWN_MAX)
    } else {
      clearInterval(timer)
      countdown.value = null
      ringOffset.value = RING_CIRCUMFERENCE
      capturePhoto()
    }
  }, 1000)
}

// 4. Jepret Foto dari Video Frame ke Canvas & Kirim ke Backend
const capturePhoto = async () => {
  if (!videoRef.value || !canvasRef.value) return

  // Efek Flash Kamera
  flashActive.value = true
  setTimeout(() => {
    flashActive.value = false
  }, 160)

  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')

  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720

  if (context) {
    // Flip horizontal agar hasil foto sesuai dengan tampilan cermin (mirror view)
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64Image = canvas.toDataURL('image/png')

    // Simpan foto via Pinia Store (Memanggil IPC `photo:save-raw`)
    await sessionStore.addCapturedPhoto(base64Image)

    // Cek apakah slot foto sudah terpenuhi seluruhnya
    if (sessionStore.isCaptureComplete) {
      stopCamera()
      // Pindah ke Halaman Komposisi & Filter (Step 5)
      router.push('/composition')
    } else {
      // Jeda 2 detik sebelum masuk ke hitung mundur foto berikutnya
      setTimeout(() => {
        runCountdown(COUNTDOWN_MAX)
      }, 2000)
    }
  }
}

// Mirror toggle
const toggleMirror = () => {
  mirrored.value = !mirrored.value
}

// Matikan Aliran Kamera
const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
}

// Keyboard: Space untuk capture
const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    if (!isCapturing.value) {
      startPhotoLoop()
    } else if (countdown.value !== null) {
      // Skip countdown, capture now
      capturePhoto()
    }
  }
}

onMounted(() => {
  startCamera()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopCamera()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="fixed inset-0 bg-background font-body-md text-on-surface antialiased select-none flex flex-col p-margin">
    
    <!-- Top Bar -->
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

    <!-- Main Content -->
    <main class="flex-1 flex flex-col justify-between min-h-0 select-none overflow-hidden relative z-10">
      
      <!-- Top Floating Status Pill -->
      <div class="flex justify-center w-full mb-space-md">
        <div class="inline-flex items-center gap-space-sm px-space-lg py-2.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-lg transition-all">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span class="font-headline-md text-label-lg font-semibold tracking-wide text-on-surface">
            Photo {{ Math.min(currentSlotIndex, requiredSlots) }} of {{ requiredSlots }}
          </span>
          <span class="text-outline-variant font-body-md text-label-md">•</span>
          <span class="font-body-md text-label-lg text-primary font-medium tracking-wide">
            {{ countdown !== null ? 'Get ready!' : isCapturing ? 'Get ready to smile!' : 'Press Space to start' }}
          </span>
        </div>
      </div>

      <!-- Primary Stage: Viewfinder + Filmstrip -->
      <div class="grid grid-cols-12 gap-space-lg items-stretch w-full flex-1 min-h-0">
        
        <!-- Camera Viewport (10 cols) -->
        <div class="col-span-12 lg:col-span-10 relative flex flex-col justify-center items-center rounded-xl overflow-hidden bg-surface-container aspect-[16/9] shadow-xl group">
          <!-- Real Camera Feed -->
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
            :style="{ transform: mirrored ? 'scaleX(-1)' : 'scaleX(1)' }"
          ></video>
          
          <!-- Fallback placeholder saat kamera belum ready -->
          <div v-if="!mediaStream" class="absolute inset-0 bg-cover bg-center" 
               style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBKdiHNHshnGCVdk3wYSsXVAc0KhgZWQms6euYOiPktMsDXHtmVloALyLI6fRiyUjtMC538d3yCD3UZlqHpMtbgtKMEdoPhsaSPNVZH7wYlo4Yjf_fyCI0MZS7NMyiisQOIqi3RwMeqhJQONYSDmmhGt-37iEIIMJNyH4v9SFWSg2Qb7pdfNiI_tE8ZmPDYsKcS6GdWlhg83T9NdpGc320kz_U80PoAcOPTUOxedKexAY-8ZhtywpKm')">
          </div>

          <!-- Subtle Vignette -->
          <div class="absolute inset-0 bg-gradient-to-t from-inverse-surface/40 via-transparent to-inverse-surface/20 pointer-events-none"></div>
          
          <!-- Framing Reticles (Corner Precision Marks) -->
          <div class="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary-fixed-dim/80 pointer-events-none"></div>
          <div class="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary-fixed-dim/80 pointer-events-none"></div>
          <div class="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary-fixed-dim/80 pointer-events-none"></div>
          <div class="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary-fixed-dim/80 pointer-events-none"></div>

          <!-- Center Countdown & Pose Tip Overlay -->
          <div class="relative z-10 flex flex-col items-center justify-center gap-space-md">
            <!-- Circular Animated Countdown Indicator -->
            <div class="relative w-36 h-36 flex items-center justify-center rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-2xl">
              <svg class="absolute inset-0 w-full h-full -rotate-90 transform" viewbox="0 0 120 120">
                <circle class="text-surface-container-highest opacity-40" cx="60" cy="60" fill="transparent" r="52" stroke="currentColor" stroke-width="5"></circle>
                <circle class="text-primary transition-all duration-1000 ease-linear" cx="60" cy="60" fill="transparent" r="52" stroke="currentColor" :stroke-dasharray="RING_CIRCUMFERENCE" :stroke-dashoffset="ringOffset" stroke-linecap="round" stroke-width="6"></circle>
              </svg>
              <span v-if="countdown !== null" class="font-display-lg text-display-lg text-primary select-none font-bold tracking-tight">
                {{ countdown }}
              </span>
              <span v-else-if="isCapturing" class="font-headline-md text-headline-md text-primary font-bold">SMILE!</span>
              <span v-else class="font-display-lg text-display-lg text-primary/30 select-none font-bold">●</span>
            </div>
            
            <!-- Pose Tip Banner -->
            <div v-if="isCapturing" class="flex items-center gap-space-xs px-space-lg py-2 rounded-full bg-inverse-surface/85 backdrop-blur-lg shadow-md animate-bounce">
              <span class="font-headline-md text-label-lg font-medium text-inverse-on-surface tracking-wide">
                Strike a fun pose together ✨
              </span>
            </div>
          </div>

          <!-- Flash Overlay -->
          <div class="absolute inset-0 bg-surface-container-lowest pointer-events-none transition-opacity duration-300 z-30" :style="{ opacity: flashActive ? 0.9 : 0 }"></div>
        </div>

        <!-- Vertical Strip Shot Thumbnail Reel (2 cols) -->
        <div class="col-span-12 lg:col-span-2 flex lg:flex-col flex-row gap-space-sm justify-between min-w-0">
          <template v-for="i in requiredSlots" :key="i">
            <div class="relative flex-1 lg:w-full rounded-xl overflow-hidden bg-surface-container-low shadow-sm flex flex-col transition-transform hover:scale-[1.02]"
                 :class="[
                   i < currentSlotIndex ? 'opacity-100' : 'opacity-60',
                   i === currentSlotIndex && isCapturing ? 'scale-[1.02] shadow-md' : ''
                 ]">
              <div class="relative w-full aspect-[4/3] overflow-hidden">
                <!-- Captured photo -->
                <img v-if="i < currentSlotIndex && capturedPhotos[i - 1]"
                     :src="capturedPhotos[i - 1].filePath"
                     :alt="'Shot ' + i"
                     class="w-full h-full object-cover" />
                
                <!-- Active shooting state -->
                <div v-else-if="i === currentSlotIndex && isCapturing"
                     class="absolute inset-0 bg-primary-fixed/30 flex items-center justify-center">
                  <div class="z-10 flex flex-col items-center gap-1">
                    <span class="material-symbols-outlined text-primary text-[28px] animate-spin" style="animation-duration: 4s;">motion_photos_on</span>
                    <span class="font-label-md text-label-md font-bold uppercase text-primary tracking-wider">Shooting</span>
                  </div>
                  <div class="absolute inset-0 bg-primary/10 animate-pulse"></div>
                </div>
                
                <!-- Pending state -->
                <div v-else class="w-full h-full bg-surface-container flex items-center justify-center">
                  <span class="material-symbols-outlined text-outline-variant text-[24px]">
                    {{ i === currentSlotIndex ? 'hourglass_empty' : 'photo_camera_back' }}
                  </span>
                </div>
                
                <!-- Check badge for captured -->
                <div v-if="i < currentSlotIndex" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <span class="material-symbols-outlined text-on-primary text-[14px] font-bold">check</span>
                </div>
              </div>
              <div class="px-space-sm py-1.5 flex items-center justify-between"
                   :class="i === currentSlotIndex && isCapturing ? 'bg-primary-container text-on-primary' : 'bg-surface-container-lowest'">
                <span class="font-label-md text-label-md font-semibold" :class="{ 'text-on-surface-variant': true, 'text-primary': i < currentSlotIndex, 'text-outline': i >= currentSlotIndex }">
                  Shot {{ i }}
                </span>
                <span class="font-label-md text-label-md font-bold" :class="{
                    'text-primary': i < currentSlotIndex,
                    'text-primary-fixed-dim': i === currentSlotIndex && isCapturing,
                    'text-outline-variant': i > currentSlotIndex
                  }">
                  {{ i < currentSlotIndex ? 'Captured' : i === currentSlotIndex && isCapturing ? 'Active' : 'Pending' }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Bottom Floating Control Deck -->
      <div class="w-full flex items-center justify-between mt-space-lg pt-space-xs">
        
        <!-- Mirror View Toggle -->
        <div class="flex items-center">
          <button type="button" @click="toggleMirror" 
                  class="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container-lowest shadow-sm text-on-surface font-label-lg hover:bg-surface-container transition-all active:scale-95"
                  :class="{ 'bg-primary-fixed': mirrored }"
                  title="Toggle viewfinder mirror effect">
            <span class="material-symbols-outlined text-[20px]" :class="mirrored ? 'text-primary' : 'text-on-surface-variant'">flip</span>
            <span class="font-label-lg font-semibold tracking-wide">Mirror View</span>
          </button>
        </div>

        <!-- Primary Shutter Button -->
        <div class="flex items-center justify-center">
          <button type="button" 
                  @click="isCapturing ? capturePhoto : startPhotoLoop"
                  :disabled="false"
                  class="group relative inline-flex items-center gap-space-sm px-space-xl py-4 rounded-full bg-primary-container text-on-primary shadow-xl hover:bg-primary transition-all duration-200 active:scale-95 min-h-[58px]">
            <span class="relative flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-surface-container-lowest"></span>
            </span>
            <span class="font-headline-md text-label-lg font-bold tracking-wide">
              {{ isCapturing && countdown === null ? 'Snap Now' : 'Start Session' }}
            </span>
            <span class="px-2 py-0.5 rounded bg-surface-container-lowest/20 font-label-md text-label-md font-mono tracking-wider ml-1 opacity-90">[Space]</span>
          </button>
        </div>

        <!-- Aspect Ratio Note -->
        <div class="flex items-center justify-end">
          <div class="inline-flex items-center gap-space-xs px-space-md py-2 rounded-full bg-surface-container text-on-surface-variant">
            <span class="material-symbols-outlined text-[18px] text-primary">aspect_ratio</span>
            <span class="font-label-md text-label-md tracking-wider font-semibold uppercase">16:9 Studio 4K</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Hidden Canvas untuk Render Image Capture -->
    <canvas ref="canvasRef" class="hidden"></canvas>

    <!-- Footer -->
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
/* Semua styling via Tailwind global di index.html */
/* Animasi bounce untuk pose tip */

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce {
  animation: bounce 1.5s ease-in-out infinite;
}

</style>