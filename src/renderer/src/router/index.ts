import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '../stores/session'

// 1. Definisikan Route untuk 8 Halaman Utama
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('../views/01_WelcomeView.vue'),
    meta: { step: 1, requiresActiveSession: false },
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('../views/02_PaymentView.vue'),
    meta: { step: 2, requiresActiveSession: true },
  },
  {
    path: '/frame-selection',
    name: 'FrameSelection',
    component: () => import('../views/03_FrameView.vue'),
    meta: { step: 3, requiresActiveSession: true, requiresPayment: true },
  },
  {
    path: '/capture',
    name: 'Capture',
    component: () => import('../views/04_CaptureView.vue'),
    meta: { step: 4, requiresActiveSession: true, requiresPayment: true, requiresFrame: true },
  },
  {
    path: '/composition',
    name: 'Composition',
    component: () => import('../views/05_CompositionView.vue'),
    meta: { step: 5, requiresActiveSession: true, requiresPayment: true, requiresFrame: true },
  },
  {
    path: '/result',
    name: 'Result',
    component: () => import('../views/06_ResultView.vue'),
    meta: { step: 6, requiresActiveSession: true, requiresPayment: true },
  },
  {
    path: '/print-email',
    name: 'PrintEmail',
    component: () => import('../views/07_PrintEmailView.vue'),
    meta: { step: 7, requiresActiveSession: true, requiresPayment: true },
  },
  {
    path: '/thankyou',
    name: 'ThankYou',
    component: () => import('../views/08_ThankYouView.vue'),
    meta: { step: 8, requiresActiveSession: true },
  },
  {
    // Fallback jika route tidak ditemukan
    path: '/:pathMatch(.*)*',
    redirect: '/welcome',
  },
]

// 2. Buat Instance Router
// Menggunakan WebHashHistory agar kompatibel sempurna dengan Electron file protocol (file://)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 3. Navigation Guard (Proteksi Alur Langkah)
router.beforeEach((to, _from, next) => {
  const sessionStore = useSessionStore()

  // Jika halaman membutuhkan sesi aktif namun tidak ada sessionId -> Lempar balik ke Welcome
  if (to.meta.requiresActiveSession && !sessionStore.currentSessionId) {
    return next({ name: 'Welcome' })
  }

  // Jika halaman membutuhkan status pembayaran PAID namun belum lunas -> Lempar ke Payment
  if (to.meta.requiresPayment && !sessionStore.isPaid) {
    return next({ name: 'Payment' })
  }

  // Jika halaman membutuhkan frame yang dipilih -> Lempar ke FrameSelection
  if (to.meta.requiresFrame && !sessionStore.selectedFrame) {
    return next({ name: 'FrameSelection' })
  }

  next()
})

export default router