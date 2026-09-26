<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore, FrameData } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const frames = ref<FrameData[]>([])
const selectedFrameId = ref<string | null>(null)
const isLoading = ref<boolean>(true)
const isSubmitting = ref<boolean>(false)

// 1. Ambil daftar frame aktif dari Database via IPC Main Process saat di-mount
const fetchFrames = async () => {
  isLoading.value = true
  try {
    const res = await window.api.getAllActiveFrames()
    if (res.success && res.data) {
      frames.value = res.data
      // Pilih frame pertama sebagai default pilihan jika tersedia
      if (frames.value.length > 0) {
        selectedFrameId.value = frames.value[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching frames:', error)
  } finally {
    isLoading.value = false
  }
}

// 2. Pilih Frame
const handleSelectFrame = (frameId: string) => {
  selectedFrameId.value = frameId
}

// 3. Konfirmasi pilihan & Pindah ke Halaman Capture (Step 4)
const handleConfirm = async () => {
  if (!selectedFrameId.value || isSubmitting.value) return
  isSubmitting.value = true

  const frameObj = frames.value.find((f) => f.id === selectedFrameId.value)
  if (frameObj) {
    // Simpan ke Pinia Store dan Update DB Session via IPC
    await sessionStore.selectFrame(frameObj)
    router.push('/capture')
  }

  isSubmitting.value = false
}

// Batal/Kembali ke Halaman Sebelumnya
const handleBack = () => {
  router.push('/payment')
}

onMounted(() => {
  fetchFrames()
})
</script>

<template>
  <div class="frame-container">
    <!-- Header Step Progress -->
    <div class="step-header">
      <span class="step-badge">LANGKAH 3 DARI 7</span>
      <h2 class="step-title">Pilih Bingkai Foto</h2>
      <p class="step-subtitle">Pilih tata letak dan desain bingkai favorit Anda</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <span class="spinner"></span>
      <p>Memuat daftar bingkai...</p>
    </div>

    <!-- Frame Grid Selection -->
    <div v-else-if="frames.length > 0" class="frame-grid">
      <div
        v-for="frame in frames"
        :key="frame.id"
        class="frame-card"
        :class="{ active: selectedFrameId === frame.id }"
        @click="handleSelectFrame(frame.id)"
      >
        <div class="preview-wrapper">
          <!-- Thumbnail/Preview Gambar Frame -->
          <img
            :src="frame.previewPath || frame.imagePath"
            :alt="frame.name"
            class="frame-preview-img"
          />
          <div v-if="selectedFrameId === frame.id" class="check-badge">
            ✓
          </div>
        </div>

        <div class="frame-info">
          <h3 class="frame-name">{{ frame.name }}</h3>
          <div class="frame-meta">
            <span class="meta-tag">{{ frame.slotCount }} Foto</span>
            <span class="meta-tag">{{ frame.aspectRatio }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>Tidak ada bingkai yang tersedia saat ini.</p>
    </div>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
      <button class="btn-secondary" @click="handleBack">
        Kembali
      </button>

      <button
        class="btn-primary"
        :disabled="!selectedFrameId || isSubmitting"
        @click="handleConfirm"
      >
        <span v-if="!isSubmitting">Lanjut ke Pemotretan →</span>
        <span v-else>Menyimpan...</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.frame-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #ffffff;
  user-select: none;
  padding: 2.5rem 3rem;
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
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0.75rem 0 0.25rem;
}

.step-subtitle {
  color: #94a3b8;
  font-size: 1rem;
  margin: 0;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #94a3b8;
  font-size: 1.1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid rgba(168, 85, 247, 0.3);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Frame Cards Grid */
.frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
  max-height: 55vh;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
}

.frame-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.frame-card:hover {
  transform: translateY(-4px);
  border-color: rgba(168, 85, 247, 0.5);
  background: rgba(30, 41, 59, 0.8);
}

.frame-card.active {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.12);
  box-shadow: 0 0 25px rgba(236, 72, 153, 0.3);
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.frame-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.check-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ec4899;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.frame-info {
  margin-top: 1rem;
  text-align: center;
  width: 100%;
}

.frame-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #f8fafc;
}

.frame-meta {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.meta-tag {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.375rem;
}

/* Action Bar Bottom */
.action-bar {
  width: 100%;
  max-width: 1000px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: none;
  padding: 0.85rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  border: none;
  padding: 0.85rem 2.5rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.6);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>