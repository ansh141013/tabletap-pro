import { BackgroundOption, QRDesignState } from './types';

export const BACKGROUNDS: BackgroundOption[] = [
    {
        id: 1,
        name: "Elegant Restaurant",
        description: "Deep burgundy to black gradient with gold accents",
        textColor: "#FFFFFF",
        style: {
            background: "linear-gradient(135deg, #8B0000 0%, #2C0000 100%)",
            border: "3px solid #FFD700",
            position: "relative",
        }
    },
    {
        id: 2,
        name: "Modern Cafe",
        description: "Warm brown coffee gradient",
        textColor: "#FFFFFF",
        style: {
            background: "linear-gradient(180deg, #6F4E37 0%, #3E2723 100%)",
        }
    },
    {
        id: 3,
        name: "Fresh & Green",
        description: "Light green to white gradient",
        textColor: "#1B5E20",
        style: {
            background: "linear-gradient(to bottom, #81C784 0%, #E8F5E9 100%)",
        }
    },
    {
        id: 4,
        name: "Classic Italian",
        description: "Red, white, and green",
        textColor: "#000000",
        style: {
            background: "linear-gradient(to bottom right, #C62828 30%, #FFFFFF 50%, #2E7D32 70%)",
        }
    },
    {
        id: 5,
        name: "Asian Fusion",
        description: "Red and gold gradient",
        textColor: "#FFFFFF",
        style: {
            background: "linear-gradient(135deg, #D32F2F 0%, #C62828 50%, #FFD700 100%)",
        }
    },
    {
        id: 6,
        name: "Minimalist Modern",
        description: "Clean white background",
        textColor: "#000000",
        style: {
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            backgroundImage: "linear-gradient(90deg, #F5F5F5 1px, transparent 1px), linear-gradient(#F5F5F5 1px, transparent 1px)",
            backgroundSize: "20px 20px"
        }
    },
    {
        id: 7,
        name: "Rustic & Cozy",
        description: "Wood texture tones",
        textColor: "#FFFFFF",
        style: {
            background: "linear-gradient(180deg, #8D6E63 0%, #5D4037 100%)",
            boxShadow: "inset 0 0 50px rgba(0,0,0,0.3)"
        }
    },
    {
        id: 8,
        name: "Vibrant & Fun",
        description: "Bright orange to pink gradient",
        textColor: "#FFFFFF",
        style: {
            background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA07A 100%)",
        }
    }
];

export const PRESET_TEMPLATES: { name: string; design: Partial<QRDesignState> }[] = [
    {
        name: "Classic Restaurant",
        design: {
            backgroundId: 1,
            restaurantNameStyle: { fontSize: 42, color: '#FFFFFF', fontWeight: 'bold' },
            tableNumberStyle: { fontSize: 60, color: '#FFD700', fontWeight: 'extra-bold', prefix: 'Table ' },
            greeting: "Welcome! Scan to Order",
            qrStyle: { size: 'large', color: '#000000', bgColor: '#FFFFFF', cornerStyle: 'rounded', logoEnabled: true, border: false, borderColor: '#000000', errorCorrection: 'M' },
        }
    },
    {
        name: "Modern Cafe",
        design: {
            backgroundId: 2,
            restaurantNameStyle: { fontSize: 36, color: '#FFF8E1', fontWeight: 'bold' },
            tableNumberStyle: { fontSize: 54, color: '#FFFFFF', fontWeight: 'bold', prefix: '#' },
            greeting: "Scan for Digital Menu",
            icon: "☕",
            qrStyle: { size: 'medium', color: '#3E2723', bgColor: '#FFFFFF', cornerStyle: 'square', logoEnabled: false, border: false, borderColor: '#000000', errorCorrection: 'M' },
        }
    },
    {
        name: "Minimal Clean",
        design: {
            backgroundId: 6,
            restaurantNameStyle: { fontSize: 32, color: '#000000', fontWeight: 'normal' },
            tableNumberStyle: { fontSize: 48, color: '#000000', fontWeight: 'bold', prefix: 'Table ' },
            greeting: "Touch-Free Ordering",
            qrStyle: { size: 'medium', color: '#000000', bgColor: '#FFFFFF', cornerStyle: 'dots', logoEnabled: false, border: true, borderColor: '#000000', errorCorrection: 'M' },
        }
    },
    {
        name: "Fun & Colorful",
        design: {
            backgroundId: 8,
            restaurantNameStyle: { fontSize: 40, color: '#FFFFFF', fontWeight: 'bold' },
            tableNumberStyle: { fontSize: 64, color: '#FFFFFF', fontWeight: 'extra-bold', prefix: '' },
            greeting: "Scan & Enjoy! 🍔",
            icon: "🍕",
            qrStyle: { size: 'large', color: '#4A148C', bgColor: '#FFFFFF', cornerStyle: 'rounded', logoEnabled: false, border: false, borderColor: '#000000', errorCorrection: 'M' },
        }
    }
];
