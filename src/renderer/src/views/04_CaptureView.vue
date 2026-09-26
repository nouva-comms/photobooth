<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

// DOM References
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// State
const mediaStream = ref<MediaStream | null>(null)
const countdown = ref<number | null>(null)
const isCapturing = ref<boolean>(false)
const flashActive = ref<boolean>(false)

// Slot foto dari frame pilihan
const requiredSlots = computed(() => sessionStore.totalSlotsRequired)
const currentSlotIndex = computed(() => sessionStore.capturedPhotos.length + 1)

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
  runCountdown(3) // Waktu jeda awal 3 detik
}

// 3. Jalankan Hitung Mundur
const runCountdown = (seconds: number) => {
  countdown.value = seconds
  const timer = setInterval(() => {
    if (countdown.value !== null && countdown.value > 1) {
      countdown.value -= 1
    } else {
      clearInterval(timer)
      countdown.value = null
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
  }, 300)

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
        runCountdown(3)
      }, 2000)
    }
  }
}

// Matikan Aliran Kamera
const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
}

onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="capture-container">
    <!-- Screen Flash Overlay -->
    <div :class="['flash-overlay', { active: flashActive }]"></div>

    <!-- Top Status Bar -->
    <div class="status-bar">
      <div class="slot-badge">
        FOTO <strong>{{ Math.min(currentSlotIndex, requiredSlots) }}</strong> / {{ requiredSlots }}
      </div>
      <div class="session-info">
        Kode: <strong>{{ sessionStore.sessionCode }}</strong>
      </div>
    </div>

    <!-- Main Live View Area -->
    <div class="camera-viewport">
      <video ref="videoRef" autoplay playsinline class="webcam-feed"></video>

      <!-- Countdown Overlay -->
      <div v-if="countdown !== null" class="countdown-overlay">
        <span class="countdown-number">{{ countdown }}</span>
      </div>

      <!-- Instruction Badge -->
      <div v-if="!isCapturing" class="start-hint">
        <span>Bersiap di depan kamera!</span>
      </div>
    </div>

    <!-- Hidden Canvas untuk Render Image Capture -->
    <canvas ref="canvasRef" class="hidden-canvas"></canvas>

    <!-- Photo Preview Thumbnails Side/Bottom -->
    <div class="thumbnails-bar">
      <div
        v-for="i in requiredSlots"
        :key="i"
        class="thumb-slot"
        :class="{ filled: sessionStore.capturedPhotos[i - 1] }"
      >
        <img
          v-if="sessionStore.capturedPhotos[i - 1]"
          :src="sessionStore.capturedPhotos[i - 1].filePath"
          alt="Hasil Capture"
          class="thumb-img"
        />
        <span v-else class="thumb-number">{{ i }}</span>
      </div>
    </div>

    <!-- Control Action Bar -->
    <div class="action-bar">
      <button
        v-if="!isCapturing"
        class="btn-capture"
        @click="startPhotoLoop"
      >
        📸 Mulai Pemotretan
      </button>
      <div v-else class="capturing-label">
        <span>Pemotretan Sedang Berlangsung...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.capture-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  color: #ffffff;
  user-select: none;
  padding: 1.5rem;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

/* Flash Effect */
.flash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
  opacity: 0;
  pointer-events: none;
  z-index: 100;
  transition: opacity 0.1s ease-out;
}

.flash-overlay.active {
  opacity: 0.95;
}

/* Top Status Bar */
.status-bar {
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.slot-badge {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.session-info {
  color: #94a3b8;
  font-size: 1rem;
}

/* Camera Viewport */
.camera-viewport {
  position: relative;
  width: 100%;
  max-width: 960px;
  height: 60vh;
  background: #000000;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.webcam-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror view untuk kemudahan pose */
}

/* Countdown Overlay */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.countdown-number {
  font-size: 10rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 0 30px rgba(236, 72, 153, 0.8);
  animation: popIn 0.8s infinite;
}

.start-hint {
  position: absolute;
  bottom: 20px;
  background: rgba(15, 23, 42, 0.8);
  padding: 0.6rem 1.5rem;
  border-radius: 999px;
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 600;
}

.hidden-canvas {
  display: none;
}

/* Thumbnails Bar */
.thumbnails-bar {
  display: flex;
  gap: 1rem;
  z-index: 10;
}

.thumb-slot {
  width: 75px;
  height: 75px;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.thumb-slot.filled {
  border-style: solid;
  border-color: #ec4899;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-number {
  color: #64748b;
  font-weight: 700;
  font-size: 1.2rem;
}

/* Action Bar */
.action-bar {
  z-index: 10;
}

.btn-capture {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: #ffffff;
  border: none;
  padding: 1rem 3rem;
  border-radius: 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
  transition: transform 0.2s;
}

.btn-capture:hover {
  transform: scale(1.05);
}

.capturing-label {
  color: #38bdf8;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}
</style>