<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const isPrinting = ref<boolean>(false)
const printCopies = ref<number>(2)
const email = ref<string>('')
const emailSent = ref<boolean>(false)
const showSuccessModal = ref<boolean>(false)
const sentToEmail = ref<string>('')

// Print progress (auto simulate)
const printProgress = ref<number>(0)
const printStatusLabel = ref<string>('Printing 2 Copies...')
let printInterval: ReturnType<typeof setInterval> | null = null

const finalImage = sessionStore.finalComposedImagePath
const sessionCode = sessionStore.sessionCode

const startPrintSimulation = () => {
  printProgress.value = 0
  printStatusLabel.value = `Printing ${printCopies.value} Copies...`
  if (printInterval) clearInterval(printInterval)
  printInterval = setInterval(() => {
    if (printProgress.value < 100) {
      printProgress.value += 10
    } else {
      printStatusLabel.value = 'Prints Completed!'
      if (printInterval) clearInterval(printInterval)
    }
  }, 1500)
}

const increaseCopies = () => {
  if (printCopies.value < 4) {
    printCopies.value += 1
    startPrintSimulation()
  }
}

const decreaseCopies = () => {
  if (printCopies.value > 1) {
    printCopies.value -= 1
    startPrintSimulation()
  }
}

const handlePrintPhoto = async () => {
  if (isPrinting.value || !finalImage) return
  isPrinting.value = true
  try {
    const res = await window.api.printPhoto(
      sessionStore.currentSessionId ? sessionStore.currentSessionId : '',
      printCopies.value
    )
    if (res.success) {
      // Print done, stay on page for email
    } else {
      alert('Gagal mencetak: ' + res.message)
    }
  } catch (error) {
    console.error('Print error:', error)
    alert('Terjadi kesalahan pada printer.')
  } finally {
    isPrinting.value = false
  }
}

// const sendEmail = async () => {
//   if (!email.value || !finalImage) return
//   try {
//     const res = await window.api.sendSoftcopyEmail(sessionStore.currentSessionId ? sessionStore.currentSessionId : '', email.value)
//     if (res.success) {
//       emailSent.value = true
//       sentToEmail.value = email.value
//       showSuccessModal.value = true
//     } else {
//       alert('Gagal kirim email: ' + res.message)
//     }
//   } catch (error) {
//     console.error('Email error:', error)
//     alert('Gagal mengirim email.')
//   }
// }

const sendEmail = async () => {
  if (!email.value || !finalImage) return
  
  try {
    // SIMULASI: Delay 1.5 detik seolah-olah sedang mengirim ke server
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // SIMULASI SUCCESS: Langsung set nilai sukses
    emailSent.value = true
    sentToEmail.value = email.value
    showSuccessModal.value = true
  } catch (error) {
    console.error('Email error:', error)
    alert('Gagal mengirim email.')
  }
}

const handleSendComplete = () => {
  if (!email.value) return
  sendEmail()
}

const restartSession = () => {
  sessionStore.resetSession()
  router.push('/')
}

const closeModal = () => {
  showSuccessModal.value = false
  // Auto restart after success
  // setTimeout(restartSession, 500)
  router.push('/thankyou')
}

onMounted(() => {
  startPrintSimulation()
})

onMounted(() => {
  if (printInterval) clearInterval(printInterval)
})
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

      <div class="flex flex-col items-start gap-space-xs mb-space-md">
        <div class="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high text-primary font-label-md text-label-md tracking-wider uppercase">
          <span class="material-symbols-outlined text-[14px]">done_all</span>
          <span>Stage 07 • Fulfillment</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Print &amp; Email Your Photos</h1>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">Collect your glossy prints below and enter your email for instant high-res digital copies.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start flex-1 min-h-0">

        <!-- LEFT: Physical Printing -->
        <div class="lg:col-span-6 flex flex-col gap-space-lg min-h-0">
          <div class="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md flex-1">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-sm">
                <div class="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[26px]">photo_library</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-label-lg text-label-lg text-on-surface font-semibold">Physical Printing</span>
                  <span class="font-label-md text-label-md text-on-surface-variant">DNP Dye-Sublimation Studio Unit</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-md text-label-md">
                <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>Active</span>
              </div>
            </div>

            <div class="flex items-center gap-space-md mt-space-xs">
              <div class="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative shadow-sm">
                <img v-if="finalImage" :src="finalImage" alt="Print preview" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                  <span class="material-symbols-outlined text-3xl">image</span>
                </div>
                <div class="absolute bottom-1 right-1 px-1 rounded bg-inverse-surface/80 text-inverse-on-surface font-label-md text-[10px]">2x6"</div>
              </div>
              <div class="flex-1 flex flex-col justify-between h-full gap-space-sm">
                <div class="flex flex-col">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-body-md text-body-md text-on-surface font-medium">{{ printStatusLabel }}</span>
                    <span class="font-label-md text-label-md text-primary font-bold">{{ printProgress }}%</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all duration-700 ease-out" :style="{ width: printProgress + '%' }"></div>
                  </div>
                </div>
                <div class="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
                  <span class="material-symbols-outlined text-[16px] text-primary">output</span>
                  <span>Tray dispenser slot directly below monitor</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2">
              <button type="button" @click="decreaseCopies" :disabled="printCopies <= 1" class="flex-1 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container disabled:opacity-50 transition-colors font-label-md text-label-md text-on-surface">- Copies</button>
              <div class="flex items-center justify-center px-4 py-2 bg-surface-container-low rounded-lg">
                <span class="font-headline-md text-headline-md text-on-surface font-bold">{{ printCopies }} Copies</span>
              </div>
              <button type="button" @click="increaseCopies" :disabled="printCopies >= 4" class="flex-1 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container disabled:opacity-50 transition-colors font-label-md text-label-md text-on-surface">+ Copies</button>
            </div>

            <button type="button" @click="handlePrintPhoto" :disabled="isPrinting" class="w-full h-12 px-space-lg rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50">
              <span class="material-symbols-outlined text-[20px]">print</span>
              <span v-if="!isPrinting">Print Now</span>
              <span v-else class="flex items-center gap-2"><span class="animate-spin w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full"></span>Printing...</span>
            </button>
          </div>

          <div class="rounded-xl bg-surface-container-low p-space-md flex items-center justify-between">
            <div class="flex items-center gap-space-sm">
              <span class="material-symbols-outlined text-primary text-[22px]">lock_clock</span>
              <span class="font-label-md text-label-md text-on-surface-variant">Photos deleted from station disk in 15 minutes</span>
            </div>
            <span class="font-label-md text-label-md text-primary font-semibold">Privacy Protected</span>
          </div>
        </div>

        <!-- RIGHT: Digital Copies via Email -->
        <div class="lg:col-span-6 flex flex-col gap-space-lg min-h-0">
          <div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md flex-1">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="font-headline-md text-headline-md text-on-surface">Digital Copies via Email</span>
                <span class="font-body-md text-body-md text-on-surface-variant">High-res stills, animated GIF, and video reel</span>
              </div>
              <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">mail</span>
              </div>
            </div>

            <div class="relative w-full mt-space-xs">
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-4 text-primary text-[24px] pointer-events-none">alternate_email</span>
                <input v-model="email" type="email" placeholder="Enter email address" class="w-full pl-12 pr-12 py-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-lg text-body-lg focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors duration-200" id="kioskEmailInput" />
                <button type="button" @click="email = ''" class="absolute right-3.5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors" aria-label="Clear email">
                  <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-space-xs overflow-x-auto pb-1">
              <span class="font-label-md text-label-md text-on-surface-variant mr-1 flex-shrink-0">Quick Add:</span>
              <button type="button" @click="email = (email.split('@')[0] || 'photo') + '@gmail.com'" class="domain-pill px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary font-label-md text-label-md text-on-surface font-medium transition-colors">@gmail.com</button>
              <button type="button" @click="email = (email.split('@')[0] || 'photo') + '@icloud.com'" class="domain-pill px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary font-label-md text-label-md text-on-surface font-medium transition-colors">@icloud.com</button>
              <button type="button" @click="email = (email.split('@')[0] || 'photo') + '@outlook.com'" class="domain-pill px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary font-label-md text-label-md text-on-surface font-medium transition-colors">@outlook.com</button>
              <button type="button" @click="email = (email.split('@')[0] || 'photo') + '@yahoo.com'" class="domain-pill px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary font-label-md text-label-md text-on-surface font-medium transition-colors">@yahoo.com</button>
            </div>

            <!-- On-screen keyboard (compact) -->
            <div class="w-full bg-surface-container-low p-3 rounded-xl flex flex-col gap-2 mt-space-xs select-none">
              <div class="grid grid-cols-10 gap-1.5 w-full">
                <button v-for="n in 10" :key="n" type="button" @click="email += (n % 10)" class="kb-key h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm">{{ n % 10 }}</button>
              </div>
              <div class="grid grid-cols-10 gap-1.5 w-full">
                <button v-for="k in ['q','w','e','r','t','y','u','i','o','p']" :key="k" type="button" @click="email += k" class="kb-key h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm">{{ k }}</button>
              </div>
              <div class="grid grid-cols-9 gap-1.5 w-11/12 mx-auto">
                <button v-for="k in ['a','s','d','f','g','h','j','k','l']" :key="k" type="button" @click="email += k" class="kb-key h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm">{{ k }}</button>
              </div>
              <div class="grid grid-cols-10 gap-1.5 w-full">
                <button type="button" @click="email = email.slice(0, -1)" class="kb-key h-12 rounded-lg bg-surface-container-highest text-error font-headline-md text-headline-md active:bg-error active:text-on-error flex items-center justify-center shadow-sm col-span-2"><span class="material-symbols-outlined text-[22px]">backspace</span></button>
                <button v-for="k in ['z','x','c','v','b','n','m']" :key="k" type="button" @click="email += k" class="kb-key h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm">{{ k }}</button>
                <button type="button" @click="email += '@'" class="kb-key h-12 rounded-lg bg-surface-container text-primary font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm col-span-1">@</button>
              </div>
              <div class="grid grid-cols-12 gap-1.5 w-full">
                <button type="button" @click="email += ' '" class="kb-key h-12 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm col-span-4">space</button>
                <button type="button" @click="email += '.'" class="kb-key h-12 rounded-lg bg-surface-container text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm col-span-2">.</button>
                <button type="button" @click="email += '-'" class="kb-key h-12 rounded-lg bg-surface-container text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm col-span-2">-</button>
                <button type="button" @click="email += '_'" class="kb-key h-12 rounded-lg bg-surface-container text-on-surface font-headline-md text-headline-md active:bg-primary active:text-on-primary flex items-center justify-center shadow-sm col-span-2">_</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Actions -->
      <div class="w-full flex items-center justify-between pt-space-xs pb-space-lg mt-auto">
        <button type="button" @click="restartSession" class="h-14 px-space-lg rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-lg text-label-lg flex items-center gap-space-xs transition-colors">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
          <span>New Photo Session</span>
        </button>
        <div class="flex items-center gap-space-md">
          <div class="hidden sm:flex flex-col text-right">
            <span class="font-label-lg text-label-lg text-on-surface font-semibold">Ready to finish?</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Sends digital bundle and logs out</span>
          </div>
          <button type="button" @click="handleSendComplete" :disabled="!email.valueOf() || emailSent.valueOf()" class="h-14 px-8 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold flex items-center gap-space-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50">
            <span class="material-symbols-outlined text-[20px]">send</span>
            <span>Send &amp; Complete →</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md">
      <div class="w-full max-w-md bg-surface-container-lowest rounded-xl p-space-xl shadow-xl flex flex-col items-center text-center gap-space-md">
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
          <span class="material-symbols-outlined text-[36px]">mark_email_read</span>
        </div>
        <div class="flex flex-col gap-1">
          <h3 class="font-headline-md text-headline-md text-on-surface">Photos Dispatched!</h3>
          <p class="font-body-md text-body-md text-on-surface-variant">We sent your complete high-res photo gallery to {{ sentToEmail }}</p>
        </div>
        <div class="w-full p-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-primary text-[18px]">print</span>
          <span>Physical prints ready in tray!</span>
        </div>
        <button type="button" @click="closeModal" class="w-full h-12 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold mt-2">Finish &amp; Start Fresh</button>
      </div>
    </div>

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
.kb-key {
  user-select: none;
}
input[type="email"] {
  caret-color: #0037b0;
}
</style>