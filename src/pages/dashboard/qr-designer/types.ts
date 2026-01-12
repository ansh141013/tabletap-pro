export interface QRDesignState {
    backgroundId: number;
    restaurantName: string;
    restaurantNameStyle: {
        fontSize: number;
        color: string;
        fontWeight: 'normal' | 'bold' | 'extra-bold';
    };
    tableNumber: string;
    tableNumberStyle: {
        fontSize: number;
        color: string;
        fontWeight: 'normal' | 'bold' | 'extra-bold';
        prefix: 'Table #' | 'Table ' | '#' | '';
    };
    greeting: string;
    greetingStyle: {
        fontSize: number;
        color: string;
    };
    qrStyle: {
        size: 'small' | 'medium' | 'large';
        color: string;
        bgColor: string;
        cornerStyle: 'square' | 'rounded' | 'dots';
        logoEnabled: boolean;
        border: boolean;
        borderColor: string;
        errorCorrection: 'L' | 'M' | 'Q' | 'H';
    };
    layout: 'portrait' | 'square' | 'landscape';
    paperFormat: 'A5' | 'A6' | 'TableCard' | 'Custom';
    footerText: string;
    icon: string;
}

export const DEFAULT_DESIGN: QRDesignState = {
    backgroundId: 1,
    restaurantName: '',
    restaurantNameStyle: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tableNumber: '1',
    tableNumberStyle: {
        fontSize: 48,
        color: '#FFFFFF',
        fontWeight: 'bold',
        prefix: 'Table ',
    },
    greeting: 'Scan to Order',
    greetingStyle: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    qrStyle: {
        size: 'medium',
        color: '#000000',
        bgColor: '#FFFFFF',
        cornerStyle: 'square',
        logoEnabled: false,
        border: false,
        borderColor: '#000000',
        errorCorrection: 'M',
    },
    layout: 'portrait',
    paperFormat: 'A5',
    footerText: 'Powered by TableTap',
    icon: '',
};

export interface BackgroundOption {
    id: number;
    name: string;
    style: React.CSSProperties;
    description: string;
    textColor: string; // Recommended text color for this background
}
