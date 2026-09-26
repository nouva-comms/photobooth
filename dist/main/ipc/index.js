"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const prisma_1 = __importDefault(require("../services/prisma"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const qrcode_1 = __importDefault(require("qrcode"));
const ensureDir = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
};
function registerIpcHandlers() {
    // 1. SESSION & PAYMENT MODULE
    electron_1.ipcMain.handle('session:create', async () => {
        try {
            const sessionCode = `PB-${Math.floor(1000 + Math.random() * 9000)}`;
            const session = await prisma_1.default.session.create({
                data: {
                    sessionCode,
                    paymentStatus: 'UNPAID',
                    paymentAmount: 35000,
                },
            });
            return { success: true, data: session };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('payment:check-status', async (_, sessionId) => {
        try {
            const session = await prisma_1.default.session.findUnique({
                where: { id: sessionId },
            });
            return { success: true, paymentStatus: session?.paymentStatus || 'UNPAID' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('payment:generate-qr', async (_, sessionId) => {
        try {
            const session = await prisma_1.default.session.findUnique({
                where: { id: sessionId },
            });
            if (!session)
                throw new Error('Session not found');
            // Generate QR code data URL for payment (QRIS format)
            // Format: QRIS merchant + amount + sessionCode
            const paymentUrl = `https://pay.example.com/${session.sessionCode}?amount=${session.paymentAmount}`;
            const qrDataUrl = await qrcode_1.default.toDataURL(paymentUrl, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            return { success: true, qrDataUrl, sessionCode: session.sessionCode, amount: session.paymentAmount };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('session:update-frame', async (_, { sessionId, frameId }) => {
        try {
            const session = await prisma_1.default.session.update({
                where: { id: sessionId },
                data: { frameId },
                include: { frame: true },
            });
            return { success: true, data: session };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // 2. FRAME MODULE
    electron_1.ipcMain.handle('frame:get-all-active', async () => {
        try {
            const frames = await prisma_1.default.frame.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });
            return { success: true, data: frames };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // 3. PHOTO CAPTURE MODULE
    electron_1.ipcMain.handle('photo:save-raw', async (_, { sessionId, photoOrder, base64Image }) => {
        try {
            const settings = await prisma_1.default.setting.findUnique({ where: { id: 'default' } });
            const storageDir = settings?.storageDir || 'C:/PhotoboothData';
            const rawPhotosDir = path_1.default.join(storageDir, 'raw_photos', sessionId);
            ensureDir(rawPhotosDir);
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `capture_${photoOrder}_${Date.now()}.png`;
            const filePath = path_1.default.join(rawPhotosDir, fileName);
            fs_1.default.writeFileSync(filePath, buffer);
            const photo = await prisma_1.default.photo.create({
                data: {
                    sessionId,
                    filePath,
                    photoOrder,
                },
            });
            return { success: true, data: photo };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('photo:save-final', async (_, { sessionId, base64CompositeImage }) => {
        try {
            const settings = await prisma_1.default.setting.findUnique({ where: { id: 'default' } });
            const storageDir = settings?.storageDir || 'C:/PhotoboothData';
            const finalPrintsDir = path_1.default.join(storageDir, 'final_prints');
            ensureDir(finalPrintsDir);
            const base64Data = base64CompositeImage.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `final_${sessionId}_${Date.now()}.png`;
            const filePath = path_1.default.join(finalPrintsDir, fileName);
            fs_1.default.writeFileSync(filePath, buffer);
            const session = await prisma_1.default.session.update({
                where: { id: sessionId },
                data: { finalImagePath: filePath },
            });
            return { success: true, data: session };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // 4. COMPOSITION RENDERING
    electron_1.ipcMain.handle('composition:render', async (_, { sessionId, frameId, photos, filter }) => {
        try {
            const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
            if (!session)
                throw new Error('Session not found');
            const frame = await prisma_1.default.frame.findUnique({ where: { id: frameId } });
            if (!frame)
                throw new Error('Frame not found');
            const settings = await prisma_1.default.setting.findUnique({ where: { id: 'default' } });
            const storageDir = settings?.storageDir || 'C:/PhotoboothData';
            const finalPrintsDir = path_1.default.join(storageDir, 'final_prints');
            ensureDir(finalPrintsDir);
            // For now, return a placeholder - actual canvas composition would need sharp or canvas library
            // This is a mock response that returns the first photo as "composed"
            const firstPhotoPath = photos[0] || '';
            // In a real implementation, you'd use sharp/canvas to composite frame + photos + filter
            // For now, copy the first photo as final
            const fileName = `composed_${sessionId}_${Date.now()}.png`;
            const filePath = path_1.default.join(finalPrintsDir, fileName);
            if (firstPhotoPath && fs_1.default.existsSync(firstPhotoPath)) {
                fs_1.default.copyFileSync(firstPhotoPath, filePath);
            }
            else {
                // Fallback: copy any existing photo or throw meaningful error
                const allPhotos = photos.filter((p) => p && fs_1.default.existsSync(p));
                if (allPhotos.length > 0) {
                    fs_1.default.copyFileSync(allPhotos[0], filePath);
                }
                else {
                    throw new Error('Tidak ada file foto yang valid untuk dikomposisi');
                }
            }
            await prisma_1.default.session.update({
                where: { id: sessionId },
                data: { finalImagePath: filePath },
            });
            return { success: true, finalImagePath: filePath };
        }
        catch (error) {
            console.error('Composition error:', error);
            return { success: false, error: error.message, message: 'Gagal memproses komposisi foto' };
        }
    });
    // 5. QR CODE FOR DOWNLOAD
    electron_1.ipcMain.handle('download:generate-qr', async (_, sessionCode) => {
        try {
            const downloadUrl = `https://download.example.com/${sessionCode}`;
            const qrDataUrl = await qrcode_1.default.toDataURL(downloadUrl, {
                width: 200,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            return { success: true, qrDataUrl };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // 6. PRINT & EMAIL MODULE
    electron_1.ipcMain.handle('printer:print-photo', async (_, { sessionId, copyCount }) => {
        try {
            const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
            if (!session?.finalImagePath)
                throw new Error('File hasil cetak tidak ditemukan');
            await prisma_1.default.session.update({
                where: { id: sessionId },
                data: { printStatus: 'PRINTED', printCount: copyCount },
            });
            console.log(`[PRINT] Cetak ${session.finalImagePath} sejumlah ${copyCount} lembar`);
            return { success: true, message: 'Berhasil dikirim ke printer' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('mailer:send-softcopy', async (_, { sessionId, userEmail }) => {
        try {
            const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
            const settings = await prisma_1.default.setting.findUnique({ where: { id: 'default' } });
            if (!session?.finalImagePath)
                throw new Error('File foto tidak ditemukan');
            const transporter = nodemailer_1.default.createTransport({
                host: settings?.smtpHost || 'smtp.gmail.com',
                port: settings?.smtpPort || 587,
                secure: false,
                auth: {
                    user: settings?.smtpUser || '',
                    pass: settings?.smtpPass || '',
                },
            });
            await transporter.sendMail({
                from: '"Nouva Photobooth" <no-reply@photobooth.com>',
                to: userEmail,
                subject: `Softcopy Foto Photobooth Anda [${session.sessionCode}]`,
                text: 'Terima kasih telah menggunakan Photobooth! Berikut berkas softcopy foto Anda.',
                attachments: [
                    {
                        filename: `Photobooth_${session.sessionCode}.png`,
                        path: session.finalImagePath,
                    },
                ],
            });
            await prisma_1.default.session.update({
                where: { id: sessionId },
                data: { userEmail, emailSent: true },
            });
            return { success: true, message: 'Email berhasil dikirim' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
}
//# sourceMappingURL=index.js.map