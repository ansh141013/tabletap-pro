import { useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QRDesignState, BackgroundOption } from "../types";
import { cn } from "@/lib/utils";

interface QRPreviewProps {
    design: QRDesignState;
    background: BackgroundOption;
    restaurantLogo?: string | null;
    forwardedRef: React.RefObject<HTMLDivElement>;
    restaurantId?: string;
}

export const QRPreview = ({ design, background, restaurantLogo, forwardedRef, restaurantId }: QRPreviewProps) => {
    const {
        restaurantName,
        restaurantNameStyle,
        tableNumber,
        tableNumberStyle,
        greeting,
        greetingStyle,
        qrStyle,
        layout,
        footerText,
        icon
    } = design;

    // Calculate dimensions based on layout
    const getDimensions = () => {
        switch (layout) {
            case 'square': return { width: 600, height: 600 };
            case 'landscape': return { width: 800, height: 600 };
            case 'portrait':
            default: return { width: 600, height: 800 };
        }
    };

    const { width, height } = getDimensions();

    // QR Code URL
    // https://quicktap-dine.lovable.app/menu?r={restaurant_id}&t={table_id}
    // We'll use tableNumber as table_id for now if no specific ID mapping provided, or just pass table number as param
    const qrValue = `https://quicktap-dine.lovable.app/menu?r=${restaurantId || 'demo'}&t=${tableNumber}`;

    const getQRSize = () => {
        switch (qrStyle.size) {
            case 'small': return 150;
            case 'large': return 300;
            case 'medium':
            default: return 220;
        }
    };

    const qrSize = getQRSize();

    return (
        <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-auto shadow-inner min-h-[600px]">
            <div
                ref={forwardedRef}
                style={{
                    width: width,
                    height: height,
                    ...background.style,
                    transform: 'scale(0.6)', // Scale down for preview
                    transformOrigin: 'center center',
                }}
                className="relative flex flex-col items-center justify-between py-12 px-8 shadow-2xl transition-all duration-300 mx-auto bg-white"
                id="qr-preview-canvas"
            >
                {/* Decorative Icon */}
                {icon && (
                    <div className="absolute top-8 right-8 text-6xl opacity-80 animate-pulse">
                        {icon}
                    </div>
                )}

                {/* Background Overlay (Texture logic placeholder) */}
                <div className="absolute inset-0 pointer-events-none" />

                {/* Header */}
                <div className="text-center z-10 space-y-2 w-full">
                    <h1
                        style={{
                            fontSize: `${restaurantNameStyle.fontSize}px`,
                            color: restaurantNameStyle.color,
                            fontWeight: restaurantNameStyle.fontWeight === 'extra-bold' ? 800 : restaurantNameStyle.fontWeight === 'bold' ? 700 : 400,
                            fontFamily: 'Inter, sans-serif',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        className="leading-tight break-words px-4"
                    >
                        {restaurantName || "Restaurant Name"}
                    </h1>
                </div>

                {/* Center Content: Table Number & QR */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10 w-full">
                    <div className="text-center">
                        <span
                            style={{
                                fontSize: `${tableNumberStyle.fontSize}px`,
                                color: tableNumberStyle.color,
                                fontWeight: tableNumberStyle.fontWeight === 'extra-bold' ? 800 : tableNumberStyle.fontWeight === 'bold' ? 700 : 400,
                            }}
                        >
                            {tableNumberStyle.prefix}{tableNumber}
                        </span>
                    </div>

                    <div
                        className={cn(
                            "p-4 bg-white shadow-xl",
                            qrStyle.cornerStyle === 'rounded' && "rounded-2xl",
                            qrStyle.cornerStyle === 'dots' && "rounded-full",
                            qrStyle.border && `border-[${qrStyle.borderColor}] border-4`
                        )}
                        style={{
                            backgroundColor: qrStyle.bgColor,
                            borderRadius: qrStyle.cornerStyle === 'rounded' ? '1rem' : qrStyle.cornerStyle === 'dots' ? '2rem' : '0'
                        }}
                    >
                        <QRCodeCanvas
                            value={qrValue}
                            size={qrSize}
                            fgColor={qrStyle.color}
                            bgColor={qrStyle.bgColor}
                            level={qrStyle.errorCorrection}
                            imageSettings={qrStyle.logoEnabled && restaurantLogo ? {
                                src: restaurantLogo,
                                x: undefined,
                                y: undefined,
                                height: qrSize * 0.2,
                                width: qrSize * 0.2,
                                excavate: true,
                            } : undefined}
                        />
                    </div>

                    <div className="text-center px-8">
                        <p
                            style={{
                                fontSize: `${greetingStyle.fontSize}px`,
                                color: greetingStyle.color,
                            }}
                            className="font-medium opacity-90 whitespace-pre-wrap"
                        >
                            {greeting}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="z-10 mt-auto pt-4 opacity-70">
                    <p className="text-sm font-medium" style={{ color: greetingStyle.color }}>
                        {footerText}
                    </p>
                </div>
            </div>
        </div>
    );
};
