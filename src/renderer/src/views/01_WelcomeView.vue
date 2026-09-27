<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isLoading = ref(false)
const flashOpacity = ref(0)

// Dipanggil saat pengguna menyentuh/mengklik layar atau tekan Space
const handleStart = async () => {
  if (isLoading.value) return
  isLoading.value = true
  triggerFlash()

  try {
    // 1. Panggil action Pinia Store untuk membuat sesi baru via IPC Backend
    const res = await sessionStore.startNewSession()

    if (res.success) {
      // 2. Berhasil buat sesi -> Pindah ke Halaman Pembayaran (Step 2)
      router.push('/payment')
    } else {
      alert('Gagal memulai sesi baru. Silakan coba lagi.')
      isLoading.value = false
    }
  } catch (error) {
    console.error('Error starting session:', error)
    isLoading.value = false
  }
}

const triggerFlash = () => {
  flashOpacity.value = 0.9
  setTimeout(() => {
    flashOpacity.value = 0
  }, 220)
}

// Keyboard shortcut: Space
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.code === 'Space' || e.key === ' ') && !isLoading.value) {
    e.preventDefault()
    handleStart()
  }
}

// Mount/unmount keyboard listener
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div 
    class="fixed inset-0 bg-background font-body-md text-on-surface antialiased select-none flex flex-col justify-between p-margin"
    @click="handleStart"
  >
    <!-- Flash Effect Overlay -->
    <div 
      class="fixed inset-0 bg-surface-container-lowest pointer-events-none transition-opacity duration-300 z-50"
      :style="{ opacity: flashOpacity }"
    ></div>

    <!-- Top Left: Lumina Studio badge -->
    <div class="fixed top-margin left-margin z-50 flex items-center gap-space-sm pointer-events-none">
      <div class="flex items-center gap-space-xs">
        <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></span>
      </div>
      <div class="w-1.5 h-1.5 rounded-full bg-primary/40 ml-space-xs"></div>
      <span class="font-label-md text-label-md text-on-surface-variant/50 tracking-widest uppercase">Lumina Studio</span>
    </div>

    <!-- Top Right: Live Kiosk indicator -->
    <div class="fixed top-margin right-margin z-50 flex items-center gap-space-sm pointer-events-none">
      <div class="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span class="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase">Live Kiosk</span>
      </div>
    </div>

    <!-- Main Content -->
    <main class="relative flex-1 flex flex-col items-center justify-between min-h-[calc(100vh-5rem)] py-space-md select-none overflow-hidden" id="interactive-screen">
      <!-- Background Gradient Blob -->
      <div class="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
        <div class="w-[680px] h-[680px] rounded-full bg-gradient-to-tr from-primary-fixed/20 via-tertiary-fixed/30 to-transparent blur-3xl transform -translate-y-12"></div>
      </div>

      <!-- Top Status Bar -->
      <div class="relative z-10 w-full flex justify-between items-center px-space-xl opacity-0 animate-fade-in text-on-surface-variant/70 font-label-md text-label-md">
        <div class="flex items-center gap-space-sm tracking-wider uppercase">
          <span class="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
          <span>Studio Calibrated</span>
        </div>
        <div class="flex items-center gap-space-md">
          <span class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-[16px] text-primary">auto_awesome</span> Studio Lighting On </span>
        </div>
      </div>

      <!-- Center: Photo Strips + CTA -->
      <div class="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center my-auto px-space-md">
        <!-- Photo Strip Container -->
        <div class="relative mb-space-xl group cursor-pointer" id="strip-container">
          <div class="absolute -inset-6 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent rounded-full blur-2xl opacity-60 transition duration-700 group-hover:opacity-100"></div>
          <div class="relative flex items-center justify-center gap-space-lg transform -rotate-1 transition-all duration-500 hover:rotate-0 hover:scale-[1.015]">
            <!-- Strip 1 -->
            <div class="w-44 md:w-52 bg-surface-container-lowest p-space-sm pb-space-lg rounded-xl shadow-[0_20px_50px_-12px_rgba(19,27,46,0.12)] flex flex-col gap-space-xs transition-transform duration-500 group-hover:-translate-y-1">
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCicjmHXf2OaQjHF2vbvinRwjshnUIi__8qus9qfspXyXozYaetTUxHukxaVGWJMYUe-pMGoOJ9loYk7KWjeNt915nfigMYoyiViyFNX6XuJoW2_Nvo2WL3MMqq5t3Dd9S0qr1V8vOy-Xwvutv3a_HEduYbAnIYE3JMAkUlGJM7MEAMIMXW21610yOA4ZEtq0jH9vMzUrAFFpdZeeCop_l7c131AS3IxQipbIyn0mNUiMorrO9b0XPr" alt="Photobooth sample 1" />
              </div>
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCywGrvfiqovZxZ3tzUZtrvy1QKP2zMlZ_zKwivrEZxqOUDZV02qaDFpfsUll2YjmIqom99UD5UxQyopcumJK4HJh2unK0Xrvb3EEmrK4pmnPEvxjp1l6iCH9kVKW5gJL2dN0KuFboWV1uL7Jv3At9gvbUtBzCvv1ih7crBHpl3RtXUjmFeQ33qFYaxBfURVhC91bZt4ZodsGpkzRSURkdjr1KBVk4cOAyxb22oPEYRtglHs1_Z7nl4" alt="Photobooth sample 2" />
              </div>
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC11KBHK354F97tNnQTi2Y_FeDz-_VltNRtOhm0GE00G1SGm0KWlOEdyuV5o7cgQXALZgQuoyN_42nMzonaDk_5TZquIN_43hjiVK5HucTqDLouCem8oaxCOOGV7mqi1yaLGZ5WTQmpZgh5DrWa7424nF3sY4IUzMUJ2-5r1D5TScwIJm9aftx6uYZyrp-3qR8CUoYhKGm7ADCBPy6lx0qyx5yjxc87jYWKa0j833dCbsbTOBFp8Bob" alt="Photobooth sample 3" />
              </div>
              <div class="pt-space-xs flex justify-between items-center px-1">
                <span class="font-headline-md text-label-md text-on-surface-variant/40 tracking-widest font-semibold uppercase">LUMINA</span>
                <span class="font-label-md text-[10px] text-on-surface-variant/40">№ 042</span>
              </div>
            </div>

            <!-- Strip 2 (rotated) -->
            <div class="hidden sm:flex w-44 md:w-52 bg-surface-container-lowest p-space-sm pb-space-lg rounded-xl shadow-[0_24px_60px_-12px_rgba(19,27,46,0.14)] flex-col gap-space-xs transform rotate-3 translate-y-4 transition-transform duration-500 group-hover:translate-y-2 group-hover:rotate-2">
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAvmBOE3opDXmQ7dozMtIQJgnSX_oqKYDcRPBRfoxFxCn8poSLB-4U09nb24NtJmUmTQD1qlPQKI1zswr2-QqXUH71bKzdzbgVhFY_TPQQLrW3EUHPCE-wA_rOQPV_mM-kkYs98j01_TdDfVnEtvmPl9ctjN5xS-lmEh0K35I2ly3bwSxdCIJaxYxu49tIIoynzhoOs1Y3Cw0Rxuc7QdgXJAeKiZs716pXWcboyPuuMprtFN_BiEym" alt="Photobooth sample 4" />
              </div>
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrCHTvPi0B6Jj8pgNGCSS9ctuF6Z6RQXYw_FqEN_FSbq_0r_pdZ-aXUo_Vo73dBR3-lSHIcZejA_Ao4P3J7rzIjrLe6Py4BJJYHiJ-zZgwoUPxt0o3NJEmxfYjI5gYfssiGttbGC7ExDgHZFIOFPY5aD2LuEP6ZKxxvl7b2lbz1mGv3uthhC8YPVvGl3JVrl1eGFG6FomjmoRWxmwXzOOMNYVwiCPMNDSjAWYU_u4YNQZr7BDHHVUx" alt="Photobooth sample 5" />
              </div>
              <div class="aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-container">
                <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFTiTUNAnx0uE2EquN_BtEF3zHiq-Y8VzVH--1fa4B-9QQVeq89UbsWUB0UFyLsyZAdj3vcdpc5xIXLd79Cm6k8yFa_QuhcPTp-MJaDW0y2rLuW8S7FMub0SREJZyEkJHIylC4_7PBpvzgglqyAW-I2Kf0HEYo-xWJ32yKTc-cm_-GEe0stX7RA9MaoPwGqnUpKEnkmWupdwFzRgyG_UjHON9yeI8pAvn8Qq1yy653Ak5W-Hm0hEG4" alt="Photobooth sample 6" />
              </div>
              <div class="pt-space-xs flex justify-between items-center px-1">
                <span class="font-headline-md text-label-md text-on-surface-variant/40 tracking-widest font-semibold uppercase">LUMINA</span>
                <span class="font-label-md text-[10px] text-on-surface-variant/40">№ 043</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Text -->
        <div class="flex flex-col items-center text-center space-y-space-xs max-w-xl">
          <h1 class="font-headline-lg text-display-sm text-on-surface tracking-tight font-semibold"> Ready for your photos? </h1>
          <p class="font-body-lg text-body-lg text-on-surface-variant"> 
            Tap anywhere or press 
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold mx-1 shadow-sm">Space</span> 
            to begin 
          </p>
        </div>

        <!-- Start Button -->
        <div class="mt-space-xl flex flex-col items-center">
          <button 
            class="group relative flex items-center gap-space-md bg-primary hover:bg-secondary-container active:scale-95 text-on-primary font-label-lg text-label-lg px-space-xl py-4 rounded-full shadow-[0_12px_32px_-4px_rgba(29,78,216,0.35)] hover:shadow-[0_16px_40px_-4px_rgba(29,78,216,0.45)] transition-all duration-300"
            @click.stop="handleStart"
            :disabled="isLoading"
          >
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-on-primary/15 group-hover:bg-on-primary/25 transition-colors">
              <span class="material-symbols-outlined text-[20px] text-on-primary">photo_camera</span>
            </span>
            <span class="font-semibold tracking-wide">Start Photo Session</span>
            <span class="hidden sm:inline-block ml-2 px-2.5 py-1 rounded-full bg-on-primary/20 text-on-primary font-label-md text-label-md font-medium tracking-normal"> Space </span>
            
            <!-- Loading spinner -->
            <span v-if="isLoading" class="ml-2 flex items-center justify-center w-6 h-6">
              <svg class="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </button>
        </div>
      </div>

      <!-- Bottom Hint -->
      <div class="relative z-10 w-full flex flex-col sm:flex-row items-center justify-center gap-space-xs text-center py-space-sm text-on-surface-variant/70 font-label-md text-label-md">
        <span class="inline-flex items-center gap-space-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
          <span>Photo Booth Ready</span>
        </span>
        <span class="hidden sm:inline opacity-40">•</span>
        <span>Touch anywhere to start</span>
      </div>
    </main>

    <!-- Footer -->
    <footer class="fixed bottom-margin left-margin right-margin z-40 pointer-events-none">
      <div class="max-w-7xl mx-auto flex items-center justify-between font-label-md text-label-md text-on-surface-variant/60">
        <div class="flex items-center gap-space-xs pointer-events-auto">
          <span class="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
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
/* Animasi fade-in untuk top bar */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
  animation-delay: 0.3s;
}

/* Global overrides untuk Tailwind custom spacing */
:deep(.space-xl) { margin: 2.5rem; }
:deep(.space-lg) { margin: 1.5rem; }
:deep(.space-md) { margin: 1rem; }
:deep(.space-sm) { margin: 0.5rem; }
:deep(.space-xs) { margin: 0.25rem; }

/* Disable scrollbar */
::-webkit-scrollbar {
  display: none;
}
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Focus visible untuk aksesibilitas */
button:focus-visible {
  outline: 2px solid #0037b0;
  outline-offset: 2px;
}
</style>