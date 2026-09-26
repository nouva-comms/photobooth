import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai seeding data awal...')

  // 1. Buat Konfigurasi Default Sistem
  const defaultSetting = await prisma.setting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storageDir: 'C:/PhotoboothData',
      countdownSec: 3,
      printerName: 'Default_Photo_Printer',
    },
  })

  console.log('✅ Setting default berhasil dibuat:', defaultSetting.id)

  // 2. Buat Contoh Frame Awal
  const frame1 = await prisma.frame.create({
    data: {
      name: 'Classic Vintage 4-Grid',
      imagePath: '/frames/classic_vintage.png',
      previewPath: '/frames/previews/classic_vintage_thumb.png',
      slotCount: 4,
      aspectRatio: '4x6',
      isActive: true,
    },
  })

  const frame2 = await prisma.frame.create({
    data: {
      name: 'Cute Pastel Strip',
      imagePath: '/frames/cute_pastel.png',
      previewPath: '/frames/previews/cute_pastel_thumb.png',
      slotCount: 3,
      aspectRatio: '2x6_strip',
      isActive: true,
    },
  })

  console.log('✅ Sample Frames berhasil dibuat:', [frame1.name, frame2.name])
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('🎉 Seeding selesai!')
  })
  .catch(async (e) => {
    console.error('❌ Error saat seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })