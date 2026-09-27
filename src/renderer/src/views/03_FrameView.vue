<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore, FrameData } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const frames = ref<FrameData[]>([])
const selectedFrameId = ref<string | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// Border color state (untuk nanti)
const borderColor = ref<'white' | 'black' | 'blue' | 'cream'>('white')

// 1. Ambil daftar frame aktif dari Database via IPC
const fetchFrames = async () => {
  isLoading.value = true
  try {
    const res = await window.api.getAllActiveFrames()
    if (res.success && res.data) {
      frames.value = res.data
      // Pilih frame pertama sebagai default
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

// 3. Konfirmasi & ke Capture
const handleConfirm = async () => {
  if (!selectedFrameId.value || isSubmitting.value) return
  isSubmitting.value = true

  const frameObj = frames.value.find((f) => f.id === selectedFrameId.value)
  if (frameObj) {
    await sessionStore.selectFrame(frameObj)
    router.push('/capture')
  }
  isSubmitting.value = false
}

const handleBack = () => {
  router.push('/payment')
}

onMounted(() => {
  fetchFrames()
})

// Computed untuk frame terpilih
const selectedFrame = computed(() =>
  frames.value.find((f) => f.id === selectedFrameId.value) || null
)

// Slot count untuk preview (default 4)
const slotCount = computed(() => selectedFrame.value?.slotCount || 4)
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
    <main class="flex-1 flex flex-col justify-center min-h-0 select-none overflow-hidden relative z-10">
      
      <!-- Step Header -->
      <div class="flex flex-col items-center text-center space-y-space-xs mb-space-md">
        <div class="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant">
          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span class="font-label-md text-label-md uppercase tracking-widest font-semibold">Stage 03 / 05</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Choose Your Layout</h1>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-md">Select your preferred print format and border color.</p>
      </div>

      <!-- Content Grid: Left = Frame List, Right = Preview -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start flex-1 min-h-0">
        
        <!-- Left Panel: Frame Options (1 frame dulu) -->
        <div class="lg:col-span-5 flex flex-col gap-space-md min-h-0">
          <div v-if="isLoading" class="flex items-center justify-center flex-1 text-on-surface-variant">
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          
          <div v-else-if="frames.length === 0" class="flex items-center justify-center flex-1 text-on-surface-variant">
            <p>Tidak ada bingkai tersedia</p>
          </div>
          
          <div v-else class="flex flex-col gap-space-md">
            <!-- Frame Card (loop, tapi untuk 1 frame dulu) -->
            <button
              v-for="frame in frames"
              :key="frame.id"
              type="button"
              @click="handleSelectFrame(frame.id)"
              :class="[
                'layout-card group w-full text-left p-space-md rounded-xl shadow-sm transition-all duration-300 flex items-center justify-between',
                selectedFrameId === frame.id
                  ? 'bg-primary-fixed/25 border border-primary/30'
                  : 'bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30'
              ]"
            >
              <div class="flex items-center gap-space-md min-w-0">
                <div :class="[
                  'w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0',
                  selectedFrameId === frame.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                ]">
                  <span class="material-symbols-outlined text-xl">
                    {{ frame.slotCount === 2 ? 'view_agenda' : frame.slotCount === 4 && frame.aspectRatio === '1:1' ? 'grid_view' : 'auto_awesome_motion' }}
                  </span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-headline-md text-headline-md truncate" :class="selectedFrameId === frame.id ? 'text-on-surface' : 'text-on-surface'">
                    {{ frame.name }}
                  </span>
                  <span class="font-body-md text-body-md truncate" :class="selectedFrameId === frame.id ? 'text-on-surface-variant' : 'text-on-surface-variant'">
                    {{ frame.slotCount }} photos • {{ frame.aspectRatio }} print
                  </span>
                </div>
              </div>
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" :class="selectedFrameId === frame.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-transparent'">
                <span class="material-symbols-outlined text-base">check</span>
              </div>
            </button>

            <!-- Info Card -->
            <div class="mt-space-xs p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-sm">
              <span class="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <div class="flex flex-col min-w-0">
                <span class="font-label-lg text-label-lg text-on-surface font-semibold">Touchscreen Auto-Print</span>
                <span class="font-body-md text-body-md text-on-surface-variant">Selected frame will be used for photo composition and printing.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Preview Canvas -->
        <div class="lg:col-span-7 flex flex-col items-center justify-center bg-surface-container-low/70 rounded-2xl p-space-md relative overflow-hidden min-h-0">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-fixed/20 via-transparent to-surface-dim/30 pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col items-center w-full max-w-md flex-1 justify-center">
            <!-- Print Canvas dengan border color -->
            <div 
              class="transition-all duration-500 ease-out p-space-md rounded-xl shadow-xl flex flex-col items-center"
              :class="[
                borderColor === 'white' && 'bg-surface-container-lowest',
                borderColor === 'black' && 'bg-inverse-surface',
                borderColor === 'blue' && 'bg-tertiary-fixed',
                borderColor === 'cream' && 'bg-[#fbf6ec]'
              ]"
            >
              <!-- Strip Layout Preview (4 photos vertical) -->
              <div v-if="selectedFrame && selectedFrame.slotCount === 4 && selectedFrame.aspectRatio !== '1:1'" class="flex flex-col gap-2 w-40 items-center">
                <div v-for="i in 4" :key="i" class="w-full aspect-[3/4] rounded-lg overflow-hidden bg-surface-dim">
                  <img 
                    v-if="selectedFrame.previewPath" 
                    :src="selectedFrame.previewPath" 
                    :alt="selectedFrame.name" 
                    class="w-full h-full object-cover"
                  />
                  <img 
                    v-else-if="selectedFrame.imagePath" 
                    :src="selectedFrame.imagePath" 
                    :alt="selectedFrame.name" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                    <span class="material-symbols-outlined text-3xl">image</span>
                  </div>
                </div>
                <div class="pt-1 text-center flex flex-col items-center">
                  <span class="font-headline-md text-headline-md tracking-wider text-xs uppercase font-semibold" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant'
                  ]">
                    {{ selectedFrame.name }}
                  </span>
                  <span class="font-label-md text-label-md text-[9px] tracking-widest" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface/70',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant/70',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant/70'
                  ]">
                    {{ slotCount }} SLOTS • {{ selectedFrame.aspectRatio }}
                  </span>
                </div>
              </div>

              <!-- Polaroid Layout (2 photos) -->
              <div v-else-if="selectedFrame && selectedFrame.slotCount === 2" class="flex flex-col gap-3 w-56 items-center">
                <div v-for="i in 2" :key="i" class="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-dim">
                  <img 
                    v-if="selectedFrame.previewPath" 
                    :src="selectedFrame.previewPath" 
                    :alt="selectedFrame.name" 
                    class="w-full h-full object-cover"
                  />
                  <img 
                    v-else-if="selectedFrame.imagePath" 
                    :src="selectedFrame.imagePath" 
                    :alt="selectedFrame.name" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                    <span class="material-symbols-outlined text-3xl">image</span>
                  </div>
                </div>
                <div class="pt-2 pb-1 text-center flex flex-col items-center">
                  <span class="font-headline-md text-headline-md tracking-wider text-sm uppercase font-semibold" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant'
                  ]">
                    {{ selectedFrame.name }}
                  </span>
                  <span class="font-label-md text-label-md text-[10px] tracking-widest" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface/70',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant/70',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant/70'
                  ]">
                    2 PHOTOS • {{ selectedFrame.aspectRatio }}
                  </span>
                </div>
              </div>

              <!-- Grid Layout (4 photos 2x2) -->
              <div v-else-if="selectedFrame && selectedFrame.slotCount === 4 && selectedFrame.aspectRatio === '1:1'" class="flex flex-col gap-2 w-56 items-center">
                <div class="grid grid-cols-2 gap-2 w-full">
                  <div v-for="i in 4" :key="i" class="aspect-square rounded-lg overflow-hidden bg-surface-dim">
                    <img 
                      v-if="selectedFrame.previewPath" 
                      :src="selectedFrame.previewPath" 
                      :alt="selectedFrame.name" 
                      class="w-full h-full object-cover"
                    />
                    <img 
                      v-else-if="selectedFrame.imagePath" 
                      :src="selectedFrame.imagePath" 
                      :alt="selectedFrame.name" 
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                      <span class="material-symbols-outlined text-3xl">image</span>
                    </div>
                  </div>
                </div>
                <div class="pt-1 text-center flex flex-col items-center">
                  <span class="font-headline-md text-headline-md tracking-wider text-xs uppercase font-semibold" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant'
                  ]">
                    {{ selectedFrame.name }}
                  </span>
                  <span class="font-label-md text-label-md text-[9px] tracking-widest" :class="[
                    borderColor === 'black' && 'text-inverse-on-surface/70',
                    borderColor === 'blue' && 'text-on-tertiary-fixed-variant/70',
                    (borderColor === 'white' || borderColor === 'cream') && 'text-on-surface-variant/70'
                  ]">
                    4 PHOTOS • 1:1
                  </span>
                </div>
              </div>

              <!-- Fallback: no frame selected -->
              <div v-else class="flex items-center justify-center w-full h-64 text-on-surface-variant">
                <span class="material-symbols-outlined text-6xl">photo_library</span>
              </div>
            </div>

            <!-- Border Color Selector -->
            <div class="mt-space-lg flex flex-col items-center gap-space-sm bg-surface-container-lowest/90 backdrop-blur-md px-space-lg py-space-sm rounded-full shadow-sm">
              <span class="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant text-[10px]">Border Color</span>
              <div class="flex items-center gap-space-sm">
                <button type="button" @click="borderColor = 'white'" :class="[
                  'group flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-transform active:scale-95',
                  borderColor === 'white' ? 'bg-surface-container-lowest' : 'bg-surface-container-low'
                ]">
                  <span class="w-3.5 h-3.5 rounded-full" :class="borderColor === 'white' ? 'bg-primary' : 'bg-transparent'"></span>
                </button>
                <button type="button" @click="borderColor = 'black'" :class="[
                  'group flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-transform active:scale-95',
                  borderColor === 'black' ? 'bg-inverse-surface' : 'bg-surface-container-low'
                ]">
                  <span class="w-3.5 h-3.5 rounded-full" :class="borderColor === 'black' ? 'bg-on-primary' : 'bg-transparent'"></span>
                </button>
                <button type="button" @click="borderColor = 'blue'" :class="[
                  'group flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-transform active:scale-95',
                  borderColor === 'blue' ? 'bg-tertiary-fixed' : 'bg-surface-container-low'
                ]">
                  <span class="w-3.5 h-3.5 rounded-full" :class="borderColor === 'blue' ? 'bg-primary' : 'bg-transparent'"></span>
                </button>
                <button type="button" @click="borderColor = 'cream'" :class="[
                  'group flex items-center justify-center w-8 h-8 rounded-full shadow-sm transition-transform active:scale-95',
                  borderColor === 'cream' ? 'bg-[#fbf6ec]' : 'bg-surface-container-low'
                ]">
                  <span class="w-3.5 h-3.5 rounded-full" :class="borderColor === 'cream' ? 'bg-primary' : 'bg-transparent'"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div class="w-full flex items-center justify-between pt-space-md mt-auto border-t border-outline-variant/30">
        <button type="button" @click="handleBack" class="flex items-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-label-lg text-label-lg active:scale-95">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back</span>
        </button>
        <div class="flex items-center gap-space-md">
          <button
            type="button"
            @click="handleConfirm"
            :disabled="!selectedFrameId || isSubmitting"
            class="flex items-center gap-space-sm px-space-xl py-3.5 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md hover:shadow-lg font-label-lg text-label-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isSubmitting">Continue to Camera</span>
            <span v-else>Saving...</span>
            <span class="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

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
</style>