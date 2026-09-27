<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const selectedFilter = ref<string>('crisp')
const intensity = ref<number>(75)
const isProcessing = ref<boolean>(false)

// 5 preset sesuai UI baru
const availableFilters = [
  { id: 'natural', name: 'Natural', desc: 'Original true tones' },
  { id: 'crisp', name: 'Studio Crisp', desc: 'Clean blue-white highlights, pop contrast' },
  { id: 'warm', name: 'Warm Golden', desc: 'Soft sunny glow' },
  { id: 'mono', name: 'Monochrome', desc: 'Classic black & white film' },
  { id: 'pastel', name: 'Soft Pastel', desc: 'Gentle muted colors' },
]

const currentFrame = computed(() => sessionStore.selectedFrame)
const capturedPhotos = computed(() => sessionStore.capturedPhotos)
const requiredSlots = computed(() => sessionStore.totalSlotsRequired)

// CSS filter + intensity (untuk preview saja)
function cssFor(id: string, factor: number): string {
  if (id === 'natural') return `contrast(${1 + 0.05 * factor}) brightness(${1 + 0.02 * factor})`
  if (id === 'crisp') return `contrast(${1 + 0.25 * factor}) saturate(${1 + 0.15 * factor}) brightness(${1 + 0.05 * factor}) hue-rotate(${-8 * factor}deg)`
  if (id === 'warm') return `sepia(${0.35 * factor}) saturate(${1 + 0.2 * factor}) brightness(${1 + 0.04 * factor})`
  if (id === 'mono') return `grayscale(${1 * factor}) contrast(${1 + 0.3 * factor})`
  if (id === 'pastel') return `saturate(${1 - 0.35 * factor}) brightness(${1 + 0.12 * factor}) contrast(${1 - 0.05 * factor})`
  return 'none'
}

const currentFilterCss = computed(() => cssFor(selectedFilter.value, intensity.value / 100))
const activeFilterName = computed(() => availableFilters.find(f => f.id === selectedFilter.value)?.name || selectedFilter.value)

const applyFilter = (filterId: string) => {
  selectedFilter.value = filterId
}

const updateIntensity = (val: string | number) => {
  intensity.value = typeof val === 'string' ? parseInt(val, 10) : val
}

// Sama seperti logic lama
const handleConfirmComposition = async () => {
  if (isProcessing.value) return
  isProcessing.value = true
  try {
    sessionStore.selectedFilter = selectedFilter.value
    const renderResult = await window.api.renderFinalComposition({
      sessionId: sessionStore.currentSessionId,
      frameId: currentFrame.value?.id,
      photos: capturedPhotos.value.map((p) => p.filePath),
      filter: selectedFilter.value,
    })
    if (renderResult.success) {
      sessionStore.finalComposedImagePath = renderResult.finalImagePath ?? null
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

const handleRetake = () => {
  if (confirm('Buang sesi ini dan foto ulang semua?')) {
    sessionStore.clearCapturedPhotos()
    router.push('/capture')
  }
}
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

    <main class="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-md">
        <div>
          <div class="flex items-center gap-space-xs mb-1">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <span class="font-label-md text-label-md text-primary tracking-widest uppercase">Capture Step 05 / 06</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg tracking-tight">Choose a Filter</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">Enhance your photos with a subtle studio look.</p>
        </div>
        <div class="flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container shadow-sm self-start md:self-auto">
          <span class="material-symbols-outlined text-[18px] text-primary">auto_fix_high</span>
          <span class="font-label-md text-label-md">Auto-Balanced Live Rendering</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start flex-1 min-h-0">

        <div class="lg:col-span-8 flex flex-col gap-space-sm min-h-0">
          <div class="relative bg-surface-container-low rounded-xl p-space-md shadow-sm overflow-hidden">
            <div class="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-primary/30 pointer-events-none z-10"></div>
            <div class="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-primary/30 pointer-events-none z-10"></div>
            <div class="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-primary/30 pointer-events-none z-10"></div>
            <div class="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-primary/30 pointer-events-none z-10"></div>

            <div class="grid grid-cols-2 gap-space-sm">
              <div v-for="(photo, idx) in capturedPhotos" :key="photo.id || idx" class="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-container-highest shadow-sm">
                <img :src="photo.filePath" :alt="'Photo ' + (idx + 1)" class="w-full h-full object-cover transition-all duration-300" :style="{ filter: currentFilterCss }" />
                <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-on-background/70 text-surface font-label-md text-label-md">{{ String(idx + 1).padStart(2, '0') }}</div>
              </div>
              <div v-for="n in Math.max(0, requiredSlots - capturedPhotos.length)" :key="'empty-' + n" class="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                <span class="material-symbols-outlined text-outline-variant text-[24px]">image</span>
              </div>
            </div>

            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-space-sm px-space-md py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md pointer-events-none">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
              <span class="font-label-md text-label-md">Preset: {{ activeFilterName }} ({{ intensity }}%)</span>
            </div>
          </div>

          <div class="flex items-center justify-between px-space-xs text-on-surface-variant font-label-md text-label-md">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[16px] text-primary">view_quilt</span>
              <span>{{ currentFrame?.name || '4-Shot Strip' }} • 300 DPI</span>
            </div>
            <span class="hidden sm:inline">Tap any preset to test tone grades</span>
          </div>
        </div>

        <div class="lg:col-span-4 flex flex-col gap-space-md min-h-0">
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div class="flex items-center justify-between">
              <h2 class="font-headline-md text-headline-md">Presets</h2>
              <span class="font-label-md text-label-md text-on-surface-variant/70 uppercase">5 Styles</span>
            </div>

            <button
              v-for="f in availableFilters"
              :key="f.id"
              type="button"
              @click="applyFilter(f.id)"
              class="w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-center gap-space-md"
              :class="{ 'bg-surface-container-high shadow-sm': selectedFilter === f.id, 'bg-surface-container-low hover:bg-surface-container': selectedFilter !== f.id }"
            >
              <div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest shadow-sm">
                <img v-if="capturedPhotos.length > 0" :src="capturedPhotos[0].filePath" :alt="f.name" class="w-full h-full object-cover" :style="{ filter: cssFor(f.id, intensity / 100) }" />
                <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                  <span class="material-symbols-outlined">image</span>
                </div>
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-headline-md text-body-lg font-semibold" :class="{ 'text-primary': selectedFilter === f.id, 'text-on-surface': selectedFilter !== f.id }">{{ f.name }}</span>
                  <span v-if="selectedFilter === f.id" class="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span v-else class="material-symbols-outlined text-outline-variant/40 text-[20px]">check_circle</span>
                </div>
                <span class="font-label-md text-label-md truncate" :class="{ 'text-primary font-medium': selectedFilter === f.id, 'text-on-surface-variant': selectedFilter !== f.id }">{{ f.desc }}</span>
              </div>
            </button>
          </div>

          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div class="flex items-center justify-between">
              <label class="font-headline-md text-body-lg font-semibold" for="intensity-slider">Filter Intensity</label>
              <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md">{{ intensity }}%</span>
            </div>
            <input id="intensity-slider" type="range" min="0" max="100" :value="intensity" @input="updateIntensity(($event.target as HTMLInputElement).value)" class="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-container-high accent-primary focus:outline-none" />
            <div class="flex justify-between font-label-md text-label-md text-on-surface-variant/60">
              <span>Subtle (0%)</span>
              <span>Balanced</span>
              <span>Full (100%)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md mt-space-md">
        <button type="button" @click="handleRetake" :disabled="isProcessing" class="w-full sm:w-auto px-space-lg py-3 rounded-full bg-surface-container-low hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-space-xs font-label-lg text-label-lg disabled:opacity-50">
          <span class="material-symbols-outlined text-[20px] text-on-surface-variant">replay</span>
          <span>Retake Photos</span>
        </button>
        <div class="flex items-center gap-space-md w-full sm:w-auto justify-end">
          <span class="hidden md:inline font-label-md text-label-md text-on-surface-variant">{{ capturedPhotos.length }} of {{ requiredSlots }} captures processed</span>
          <button type="button" @click="handleConfirmComposition" :disabled="isProcessing" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary-container text-on-primary hover:bg-primary active:scale-95 transition-all duration-150 flex items-center justify-center gap-space-sm shadow-md font-label-lg text-label-lg disabled:opacity-50">
            <span v-if="!isProcessing">Next: Review Result</span>
            <span v-else>Memproses...</span>
            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
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
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0037b0;
  cursor: pointer;
}
</style>