<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const selectedFilter = ref<string>('normal')
const isProcessing = ref<boolean>(false)

// Daftar filter visual CSS yang tersedia untuk dicoba pengguna
const availableFilters = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'grayscale', name: 'B&W Klasik', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia Warm', css: 'sepia(80%)' },
  { id: 'vintage', name: 'Vintage', css: 'contrast(120%) brightness(90%) sepia(30%)' },
  { id: 'bright', name: 'Bright Pop', css: 'brightness(115%) contrast(105%) saturation(120%)' },
]

// Frame terpilih dan daftar foto hasil capture
const currentFrame = computed(() => sessionStore.selectedFrame)
const capturedPhotos = computed(() => sessionStore.capturedPhotos)

// Style CSS Filter yang aktif
const currentFilterCss = computed(() => {
  const found = availableFilters.find((f) => f.id === selectedFilter.value)
  return found ? found.css : 'none'
})

// Terapkan filter ke foto
const applyFilter = (filterId: string) => {
  selectedFilter.value = filterId
}

// Konfirmasi & Komposisikan Foto Akhir
const handleConfirmComposition = async () => {
  if (isProcessing.value) return
  isProcessing.value = true

  try {
    // Simpan informasi filter ke Pinia Store
    sessionStore.selectedFilter = selectedFilter.value

    // Panggil backend IPC untuk me-render foto gabungan dengan frame
    const renderResult = await window.api.renderFinalComposition({
      sessionId: sessionStore.currentSessionId,
      frameId: currentFrame.value?.id,
      photos: capturedPhotos.value.map((p) => p.filePath),
      filter: selectedFilter.value,
    })

    if (renderResult.success) {
      sessionStore.finalComposedImagePath = renderResult.finalImagePath
      // Pindah ke Halaman Hasil Pratinjau (Step 6)
      router.push('/result')
    } else {
      alert('Gagal memproses komposisi foto: ' + renderResult.message)
    }
  } catch (error) {
    console.error('Error rendering composition:', error)
    alert('Terjadi kesalahan saat memproses gambar.')
  } finally {
    isProcessing.value = false
  }
}

// Kembali untuk retake foto jika kurang memuaskan
const handleRetake = () => {
  sessionStore.clearCapturedPhotos()
  router.push('/capture')
}
</script>

<template>
  <div class="composition-container">
    <!-- Top Step Header -->
    <div class="step-header">
      <span class="step-badge">LANGKAH 5 DARI 7</span>
      <h2 class="step-title">Komposisi & Filter Foto</h2>
      <p class="step-subtitle">Pilih efek filter terbaik untuk strip foto Anda</p>
    </div>

    <!-- Main Workspace: Frame Preview & Filters -->
    <div class="workspace-layout">
      <!-- Left: Frame Canvas Preview -->
      <div class="preview-stage">
        <div class="frame-canvas-mockup">
          <!-- Frame Overlay Image -->
          <img
            v-if="currentFrame"
            :src="currentFrame.imagePath"
            alt="Frame Overlay"
            class="frame-overlay-img"
          />

          <!-- Photo Slots -->
          <div class="photo-slots-grid">
            <div
              v-for="(photo, index) in capturedPhotos"
              :key="photo.id || index"
              class="slot-item"
            >
              <img
                :src="photo.filePath"
                alt="Captured Shot"
                class="slot-photo-img"
                :style="{ filter: currentFilterCss }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Filter Options Control Bar -->
      <div class="controls-panel">
        <h3 class="panel-title">Pilih Filter Foto</h3>
        
        <div class="filter-options-list">
          <div
            v-for="filter in availableFilters"
            :key="filter.id"
            class="filter-card"
            :class="{ active: selectedFilter === filter.id }"
            @click="applyFilter(filter.id)"
          >
            <div class="filter-thumb-preview">
              <img
                v-if="capturedPhotos.length > 0"
                :src="capturedPhotos[0].filePath"
                alt="Filter Sample"
                :style="{ filter: filter.css }"
                class="thumb-img"
              />
            </div>
            <span class="filter-name">{{ filter.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
      <button class="btn-secondary" :disabled="isProcessing" @click="handleRetake">
        🔄 Foto Ulang
      </button>

      <button
        class="btn-primary"
        :disabled="isProcessing"
        @click="handleConfirmComposition"
      >
        <span v-if="!isProcessing">Lanjut ke Hasil & Pratinjau →</span>
        <span v-else class="processing-text">
          <span class="spinner"></span> Memproses Komposisi...
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.composition-container {
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
.workspace-layout {
  display: flex;
  gap: 3rem;
  width: 100%;
  max-width: 1000px;
  height: 62vh;
  align-items: center;
  justify-content: center;
}

/* Left Canvas Stage */
.preview-stage {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.frame-canvas-mockup {
  position: relative;
  height: 100%;
  aspect-ratio: 1 / 3; /* Format Strip standar photobooth */
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 10px;
  box-sizing: border-box;
}

.frame-overlay-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 10;
  pointer-events: none;
}

.photo-slots-grid {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1;
}

.slot-item {
  flex: 1;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: #0f172a;
}

.slot-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

/* Right Controls Panel */
.controls-panel {
  width: 320px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: #f8fafc;
}

.filter-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 42vh;
  overflow-y: auto;
  padding-right: 4px;
}

.filter-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 2px solid transparent;
  padding: 0.6rem;
  border-radius: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-card:hover {
  border-color: rgba(168, 85, 247, 0.5);
}

.filter-card.active {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.15);
}

.filter-thumb-preview {
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #000000;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.filter-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
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

.btn-secondary:hover:not(:disabled) {
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
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.processing-text {
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