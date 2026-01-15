/**
 * Language/Localization Utility
 * 
 * Provides internationalization support for the application.
 * Reads language setting from OwnerContext.
 */

// Supported languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Translation keys - organized by feature/section
export type TranslationKeys = {
    // Common
    common: {
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        add: string;
        search: string;
        loading: string;
        error: string;
        success: string;
        confirm: string;
        back: string;
        next: string;
        done: string;
        close: string;
        yes: string;
        no: string;
    };
    // Dashboard
    dashboard: {
        title: string;
        orders: string;
        menu: string;
        tables: string;
        settings: string;
        analytics: string;
        waiterCalls: string;
    };
    // Orders
    orders: {
        title: string;
        pending: string;
        preparing: string;
        ready: string;
        served: string;
        cancelled: string;
        total: string;
        items: string;
        table: string;
        customer: string;
        noOrders: string;
        accept: string;
        reject: string;
        markReady: string;
        markServed: string;
    };
    // Menu
    menu: {
        title: string;
        categories: string;
        items: string;
        addCategory: string;
        addItem: string;
        available: string;
        unavailable: string;
        price: string;
        description: string;
        noItems: string;
    };
    // Tables
    tables: {
        title: string;
        addTable: string;
        tableNumber: string;
        seats: string;
        status: string;
        available: string;
        occupied: string;
        reserved: string;
        qrCode: string;
    };
    // Settings
    settings: {
        title: string;
        general: string;
        currency: string;
        language: string;
        timezone: string;
        notifications: string;
        profile: string;
    };
};

// English translations (default)
const en: TranslationKeys = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        done: 'Done',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
    },
    dashboard: {
        title: 'Dashboard',
        orders: 'Orders',
        menu: 'Menu',
        tables: 'Tables',
        settings: 'Settings',
        analytics: 'Analytics',
        waiterCalls: 'Waiter Calls',
    },
    orders: {
        title: 'Orders',
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        served: 'Served',
        cancelled: 'Cancelled',
        total: 'Total',
        items: 'Items',
        table: 'Table',
        customer: 'Customer',
        noOrders: 'No orders found',
        accept: 'Accept',
        reject: 'Reject',
        markReady: 'Mark Ready',
        markServed: 'Mark Served',
    },
    menu: {
        title: 'Menu',
        categories: 'Categories',
        items: 'Items',
        addCategory: 'Add Category',
        addItem: 'Add Item',
        available: 'Available',
        unavailable: 'Unavailable',
        price: 'Price',
        description: 'Description',
        noItems: 'No menu items found',
    },
    tables: {
        title: 'Tables',
        addTable: 'Add Table',
        tableNumber: 'Table Number',
        seats: 'Seats',
        status: 'Status',
        available: 'Available',
        occupied: 'Occupied',
        reserved: 'Reserved',
        qrCode: 'QR Code',
    },
    settings: {
        title: 'Settings',
        general: 'General',
        currency: 'Currency',
        language: 'Language',
        timezone: 'Timezone',
        notifications: 'Notifications',
        profile: 'Profile',
    },
};

// Hindi translations
const hi: TranslationKeys = {
    common: {
        save: 'सहेजें',
        cancel: 'रद्द करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        add: 'जोड़ें',
        search: 'खोजें',
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        confirm: 'पुष्टि करें',
        back: 'पीछे',
        next: 'आगे',
        done: 'पूर्ण',
        close: 'बंद करें',
        yes: 'हाँ',
        no: 'नहीं',
    },
    dashboard: {
        title: 'डैशबोर्ड',
        orders: 'ऑर्डर',
        menu: 'मेनू',
        tables: 'टेबल',
        settings: 'सेटिंग्स',
        analytics: 'एनालिटिक्स',
        waiterCalls: 'वेटर कॉल',
    },
    orders: {
        title: 'ऑर्डर',
        pending: 'लंबित',
        preparing: 'तैयार हो रहा है',
        ready: 'तैयार',
        served: 'परोसा गया',
        cancelled: 'रद्द',
        total: 'कुल',
        items: 'आइटम',
        table: 'टेबल',
        customer: 'ग्राहक',
        noOrders: 'कोई ऑर्डर नहीं मिला',
        accept: 'स्वीकार करें',
        reject: 'अस्वीकार करें',
        markReady: 'तैयार चिह्नित करें',
        markServed: 'परोसा गया चिह्नित करें',
    },
    menu: {
        title: 'मेनू',
        categories: 'श्रेणियां',
        items: 'आइटम',
        addCategory: 'श्रेणी जोड़ें',
        addItem: 'आइटम जोड़ें',
        available: 'उपलब्ध',
        unavailable: 'अनुपलब्ध',
        price: 'मूल्य',
        description: 'विवरण',
        noItems: 'कोई मेनू आइटम नहीं मिला',
    },
    tables: {
        title: 'टेबल',
        addTable: 'टेबल जोड़ें',
        tableNumber: 'टेबल नंबर',
        seats: 'सीटें',
        status: 'स्थिति',
        available: 'उपलब्ध',
        occupied: 'व्यस्त',
        reserved: 'आरक्षित',
        qrCode: 'क्यूआर कोड',
    },
    settings: {
        title: 'सेटिंग्स',
        general: 'सामान्य',
        currency: 'मुद्रा',
        language: 'भाषा',
        timezone: 'समय क्षेत्र',
        notifications: 'सूचनाएं',
        profile: 'प्रोफ़ाइल',
    },
};

// Spanish translations
const es: TranslationKeys = {
    common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        search: 'Buscar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        confirm: 'Confirmar',
        back: 'Atrás',
        next: 'Siguiente',
        done: 'Hecho',
        close: 'Cerrar',
        yes: 'Sí',
        no: 'No',
    },
    dashboard: {
        title: 'Panel de Control',
        orders: 'Pedidos',
        menu: 'Menú',
        tables: 'Mesas',
        settings: 'Configuración',
        analytics: 'Análisis',
        waiterCalls: 'Llamadas al Mesero',
    },
    orders: {
        title: 'Pedidos',
        pending: 'Pendiente',
        preparing: 'Preparando',
        ready: 'Listo',
        served: 'Servido',
        cancelled: 'Cancelado',
        total: 'Total',
        items: 'Artículos',
        table: 'Mesa',
        customer: 'Cliente',
        noOrders: 'No se encontraron pedidos',
        accept: 'Aceptar',
        reject: 'Rechazar',
        markReady: 'Marcar Listo',
        markServed: 'Marcar Servido',
    },
    menu: {
        title: 'Menú',
        categories: 'Categorías',
        items: 'Artículos',
        addCategory: 'Agregar Categoría',
        addItem: 'Agregar Artículo',
        available: 'Disponible',
        unavailable: 'No Disponible',
        price: 'Precio',
        description: 'Descripción',
        noItems: 'No se encontraron artículos del menú',
    },
    tables: {
        title: 'Mesas',
        addTable: 'Agregar Mesa',
        tableNumber: 'Número de Mesa',
        seats: 'Asientos',
        status: 'Estado',
        available: 'Disponible',
        occupied: 'Ocupada',
        reserved: 'Reservada',
        qrCode: 'Código QR',
    },
    settings: {
        title: 'Configuración',
        general: 'General',
        currency: 'Moneda',
        language: 'Idioma',
        timezone: 'Zona Horaria',
        notifications: 'Notificaciones',
        profile: 'Perfil',
    },
};

// All translations
const translations: Record<string, TranslationKeys> = {
    en,
    hi,
    es,
};

/**
 * Get translations for a specific language
 */
export function getTranslations(languageCode: string = DEFAULT_LANGUAGE): TranslationKeys {
    return translations[languageCode] || translations[DEFAULT_LANGUAGE];
}

/**
 * Get a specific translation by path
 * @example t('orders.pending', 'en') => 'Pending'
 */
export function t(
    path: string,
    languageCode: string = DEFAULT_LANGUAGE
): string {
    const keys = path.split('.');
    let result: any = getTranslations(languageCode);

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            // Fallback to English
            result = getTranslations(DEFAULT_LANGUAGE);
            for (const k of keys) {
                if (result && typeof result === 'object' && k in result) {
                    result = result[k];
                } else {
                    return path; // Return path as fallback
                }
            }
            break;
        }
    }

    return typeof result === 'string' ? result : path;
}

/**
 * Get supported languages for dropdown
 */
export function getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
}
