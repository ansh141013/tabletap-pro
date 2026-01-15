import { db, storage } from '../config/firebase';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Restaurant, Table, Category, MenuItem, Order, OrderItem, UserProfile, WaiterCall } from '../types/models';

// ========================================
// RESTAURANTS
// ========================================

export const createRestaurant = async (data: Omit<Restaurant, 'id' | 'createdAt'>) => {
    // ownerId must be provided in data
    if (!data.ownerId) {
        throw new Error('ownerId is required to create a restaurant');
    }

    const ref = await addDoc(collection(db, 'restaurants'), {
        ...data,
        createdAt: serverTimestamp()
    });
    return ref.id;
};

export const getRestaurant = async (id: string) => {
    const docRef = doc(db, 'restaurants', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...(snap.data() as any) } as Restaurant : null;
};

export const updateRestaurant = async (id: string, data: Partial<Restaurant>) => {
    const docRef = doc(db, 'restaurants', id);
    await updateDoc(docRef, data);
};

export const uploadLogo = async (file: File, restaurantId: string): Promise<string> => {
    const storageRef = ref(storage, `logos/${restaurantId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// ========================================
// CATEGORIES
// ========================================

/**
 * Add a category (SECURE: requires ownerId)
 */
export const addCategory = async (data: Omit<Category, 'id'>) => {
    if (!data.ownerId) {
        throw new Error('ownerId is required to create a category');
    }
    return await addDoc(collection(db, 'categories'), data);
};

/**
 * Get categories for an owner (SECURE: filters by ownerId)
 */
export const getCategories = async (ownerId: string) => {
    const q = query(
        collection(db, 'categories'),
        where('ownerId', '==', ownerId),
        orderBy('displayOrder')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Category));
};

/**
 * Get categories for the dashboard (SECURE: filters by ownerId AND restaurantId)
 */
export const getDashboardCategories = async (ownerId: string, restaurantId: string) => {
    const q = query(
        collection(db, 'categories'),
        where('ownerId', '==', ownerId),
        where('restaurantId', '==', restaurantId),
        orderBy('displayOrder')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Category));
};

/**
 * Get categories for a restaurant (PUBLIC)
 */
export const getPublicCategories = async (restaurantId: string) => {
    const q = query(
        collection(db, 'categories'),
        where('restaurantId', '==', restaurantId),
        orderBy('displayOrder')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Category));
};

export const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
    const ref = doc(db, 'categories', id);
    await updateDoc(ref, data);
};

// ========================================
// MENU ITEMS
// ========================================

/**
 * Add a menu item (SECURE: requires ownerId)
 */
export const addMenuItem = async (data: Omit<MenuItem, 'id' | 'createdAt'>) => {
    if (!data.ownerId) {
        throw new Error('ownerId is required to create a menu item');
    }
    return await addDoc(collection(db, 'menuItems'), {
        ...data,
        createdAt: serverTimestamp()
    });
};

/**
 * Get menu items for an owner (Legacy/Simple)
 */
export const getMenuItems = async (ownerId: string, categoryId?: string) => {
    let q;
    if (categoryId) {
        q = query(
            collection(db, 'menuItems'),
            where('ownerId', '==', ownerId),
            where('categoryId', '==', categoryId)
        );
    } else {
        q = query(
            collection(db, 'menuItems'),
            where('ownerId', '==', ownerId)
        );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as MenuItem));
};

/**
 * Get menu items for the dashboard (SECURE: filters by ownerId AND restaurantId, ordered by createdAt)
 */
export const getDashboardMenuItems = async (ownerId: string, restaurantId: string) => {
    console.log(`[firebaseService] getDashboardMenuItems called with ownerId=${ownerId}, restaurantId=${restaurantId}`);
    const q = query(
        collection(db, 'menuItems'),
        where('ownerId', '==', ownerId),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    console.log(`[firebaseService] getDashboardMenuItems returned ${snap.size} docs`);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as MenuItem));
};

/**
 * Get menu items for a restaurant (PUBLIC)
 */
export const getPublicMenuItems = async (restaurantId: string) => {
    const q = query(
        collection(db, 'menuItems'),
        where('restaurantId', '==', restaurantId),
        where('available', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as MenuItem));
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
    const ref = doc(db, 'menuItems', id);
    await updateDoc(ref, data);
};

export const deleteMenuItem = async (id: string) => {
    await deleteDoc(doc(db, 'menuItems', id));
};

export const uploadMenuItemImage = async (file: File, restaurantId: string): Promise<string> => {
    const storageRef = ref(storage, `menu-items/${restaurantId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// ========================================
// TABLES
// ========================================

/**
 * Add a table (SECURE: requires ownerId)
 */
export const addTable = async (data: Omit<Table, 'id' | 'qrCodeUrl'>) => {
    if (!data.ownerId) throw new Error('ownerId is required to create a table');
    if (!data.restaurantId) throw new Error('restaurantId is required to create a table');

    // Check for duplicate table number within this restaurant
    const q = query(
        collection(db, 'tables'),
        where('ownerId', '==', data.ownerId),
        where('restaurantId', '==', data.restaurantId),
        where('number', '==', data.number)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        throw new Error(`Table number ${data.number} already exists`);
    }

    const tableRef = await addDoc(collection(db, 'tables'), data);
    // Generate QR URL
    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const qrUrl = `${baseUrl}/menu/${data.restaurantId}/${tableRef.id}`;

    await updateDoc(tableRef, { qrCodeUrl: qrUrl });
    return { id: tableRef.id, ...data, qrCodeUrl: qrUrl } as Table;
};

export const regenerateQRCode = async (tableId: string) => {
    const docRef = doc(db, 'tables', tableId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Table not found");
    const table = snap.data() as Table;

    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const qrUrl = `${baseUrl}/menu/${table.restaurantId}/${tableId}`;

    await updateDoc(docRef, { qrCodeUrl: qrUrl });
    return qrUrl;
};

/**
 * Get tables for an owner (SECURE: filters by ownerId)
 */
export const getTables = async (ownerId: string, restaurantId: string) => {
    const q = query(
        collection(db, 'tables'),
        where('ownerId', '==', ownerId),
        where('restaurantId', '==', restaurantId),
        orderBy('number', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Table));
};

export const updateTableStatus = async (tableId: string, isLocked: boolean, currentOrderId?: string) => {
    const data: any = { isLocked };
    if (currentOrderId !== undefined) data.currentOrderId = currentOrderId;
    await updateDoc(doc(db, 'tables', tableId), data);
};

export const updateTable = async (id: string, updates: Partial<Table>) => {
    const docRef = doc(db, 'tables', id);
    await updateDoc(docRef, updates as any);
};

export const deleteTable = async (id: string) => {
    await deleteDoc(doc(db, 'tables', id));
};

// ========================================
// ORDERS
// ========================================

/**
 * Create an order (PUBLIC: customers can create orders)
 * BUT we must validate that the table belongs to the correct restaurant
 */
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'ownerId'>) => {
    // CRITICAL SECURITY CHECK: Validate that tableId belongs to the restaurant
    const tableDoc = await getDoc(doc(db, 'tables', order.tableId));
    if (!tableDoc.exists()) {
        throw new Error('Invalid table ID');
    }

    const tableData = tableDoc.data() as Table;
    if (tableData.restaurantId !== order.restaurantId) {
        throw new Error('Table does not belong to this restaurant');
    }

    // Use the ownerId from the table to ensure proper ownership
    const orderData = {
        ...order,
        ownerId: tableData.ownerId, // Inherit ownerId from table
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    // Lock Table
    await updateTableStatus(order.tableId, true, orderRef.id);

    return orderRef.id;
};

/**
 * Subscribe to orders for an owner (SECURE: filters by ownerId)
 */
export const subscribeToOrders = (ownerId: string, callback: (orders: Order[]) => void) => {
    const q = query(
        collection(db, 'orders'),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const orders = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Order));
        callback(orders);
    });
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], tableId?: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
    });

    // Unlock table if order is done
    if (tableId && (status === 'paid' || status === 'cancelled')) {
        await updateTableStatus(tableId, false, null as any);
    }
};

// ========================================
// ORDER ITEMS
// ========================================

export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
        const data = orderDoc.data() as any;
        return data.items || [];
    }
    return [];
};

// ========================================
// WAITER CALLS
// ========================================

/**
 * Create a waiter call (PUBLIC: customers can create calls)
 * BUT we validate that the table belongs to the restaurant
 */
export const createWaiterCall = async (call: Omit<WaiterCall, 'id' | 'createdAt' | 'status' | 'ownerId'>) => {
    // CRITICAL SECURITY CHECK: Validate that tableId belongs to the restaurant
    const tableDoc = await getDoc(doc(db, 'tables', call.tableId));
    if (!tableDoc.exists()) {
        throw new Error('Invalid table ID');
    }

    const tableData = tableDoc.data() as Table;
    if (tableData.restaurantId !== call.restaurantId) {
        throw new Error('Table does not belong to this restaurant');
    }

    // Inherit ownerId from table
    await addDoc(collection(db, 'waiterCalls'), {
        ...call,
        ownerId: tableData.ownerId,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

/**
 * Subscribe to waiter calls for an owner (SECURE: filters by ownerId)
 */
export const subscribeToWaiterCalls = (ownerId: string, callback: (calls: WaiterCall[]) => void) => {
    const q = query(
        collection(db, 'waiterCalls'),
        where('ownerId', '==', ownerId),
        where('status', '==', 'pending')
    );
    return onSnapshot(q, (snap) => {
        const calls = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as WaiterCall));
        callback(calls);
    });
};

export const resolveWaiterCall = async (callId: string) => {
    await updateDoc(doc(db, 'waiterCalls', callId), {
        status: 'resolved',
        resolvedAt: serverTimestamp()
    });
};

// ========================================
// USER UTILS
// ========================================

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const getTable = async (tableId: string): Promise<Table | null> => {
    const docRef = doc(db, 'tables', tableId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as any) } as Table;
    }
    return null;
};


