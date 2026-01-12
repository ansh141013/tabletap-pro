import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { getTables } from '@/services/firebaseService'; // Use Firebase service instead

export interface QRCodeOptions {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    restaurantName: string;
    greetingMessage?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    logoUrl?: string;
}

export class QRCodeService {
    private static readonly BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

    static generateQRUrl(restaurantId: string, tableId: string): string {
        return `${this.BASE_URL}/menu?r=${restaurantId}&t=${tableId}`;
    }

    static async generateQRDataUrl(
        restaurantId: string,
        tableId: string,
        options?: {
            size?: number;
            errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
            color?: { dark?: string; light?: string };
        }
    ): Promise<string> {
        const url = this.generateQRUrl(restaurantId, tableId);
        return await QRCode.toDataURL(url, {
            width: options?.size || 300,
            margin: 2,
            errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
            color: options?.color || { dark: '#000000', light: '#FFFFFF' }
        });
    }

    static async generateStyledQRCode(options: QRCodeOptions): Promise<string> {
        const qrDataUrl = await this.generateQRDataUrl(options.restaurantId, options.tableId, { size: 250 });

        // Canvas manipulation logic (simplified for this generic replacement)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas context');

        canvas.width = 600;
        canvas.height = 800;

        // White BG
        ctx.fillStyle = options.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(options.restaurantName, canvas.width / 2, 80);
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`Table ${options.tableNumber}`, canvas.width / 2, 150);

        // QR Image
        const qrImage = new Image();
        await new Promise(r => { qrImage.onload = r; qrImage.src = qrDataUrl; });
        ctx.drawImage(qrImage, (canvas.width - 250) / 2, 200, 250, 250);

        return canvas.toDataURL('image/png');
    }

    static downloadQRAsPNG(dataUrl: string, filename: string = 'qr.png') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
