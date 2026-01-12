export interface Restaurant {
    id?: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    logoUrl?: string; // New field

    // Existing fields
    ownerId: string;
    currency: string;
    language: string;
    setupComplete: boolean;
    createdAt: any; // Firestore Timestamp

    // Additional settings
    opening_hours?: Record<string, { open: string, close: string, isOpen: boolean }>;
    order_timeout?: number;
    location_radius?: number;
    latitude?: number;
    longitude?: number;
    abuse_threshold?: number;
    notifications_email?: boolean;
    notifications_sms?: boolean;
    notifications_push?: boolean;
    notifications_sound?: boolean;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'owner' | 'staff' | 'admin';
    restaurantId?: string; // If owner/staff
    createdAt: any;
}

export interface Category {
    id?: string;
    restaurantId: string;
    name: string;
    displayOrder: number;
    description?: string; // Opt
    sortOrder?: number; // Compat
}

export interface MenuItem {
    id?: string;
    restaurantId: string;
    categoryId: string; // Refers to Category ID
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    available: boolean;
    createdAt: any;
}

export interface Table {
    id?: string;
    restaurantId: string;
    number: string;
    seats: number;
    qrCodeUrl?: string; // URL for the QR code image or deep link
    isLocked: boolean;
    currentOrderId?: string;
    status: 'available' | 'occupied' | 'reserved';
}

export interface OrderItem {
    itemId: string; // Refers to MenuItem ID
    name: string;
    price: number;
    quantity: number;
    note?: string;
}

export interface Order {
    id?: string;
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'auto_cancelled';
    items: OrderItem[];
    total: number;
    customerName?: string;
    customerPhone?: string;
    createdAt: any;
    updatedAt: any;
    notes?: string;
}

export interface WaiterCall {
    id?: string;
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    type: 'service' | 'bill' | 'other';
    status: 'pending' | 'resolved';
    createdAt: any;
    resolvedAt?: any;
}

// Owner Setup Form Types
export interface RestaurantData {
    name: string;
    logo_url: string;
    location: string;
    currency: string;
    language: string;
}
