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

// --- RESTAURANTS ---
export const createRestaurant = async (data: Omit<Restaurant, 'id' | 'createdAt'>) => {
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
    // e.g. logos/{restaurantId}/filename
    const storageRef = ref(storage, `logos/${restaurantId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// --- CATEGORIES ---
export const addCategory = async (data: Omit<Category, 'id'>) => {
    return await addDoc(collection(db, 'categories'), data);
};

export const getCategories = async (restaurantId: string) => {
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

// --- MENU ITEMS ---
export const addMenuItem = async (data: Omit<MenuItem, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, 'menuItems'), {
        ...data,
        createdAt: serverTimestamp()
    });
};

export const getMenuItems = async (restaurantId: string, categoryId?: string) => {
    let q;
    if (categoryId) {
        q = query(
            collection(db, 'menuItems'),
            where('restaurantId', '==', restaurantId),
            where('categoryId', '==', categoryId)
        );
    } else {
        q = query(
            collection(db, 'menuItems'),
            where('restaurantId', '==', restaurantId)
        );
    }
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

// --- TABLES ---
export const addTable = async (data: Omit<Table, 'id' | 'qrCodeUrl'>) => {
    const tableRef = await addDoc(collection(db, 'tables'), data);
    // Generate QR URL
    const qrUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/menu?r=${data.restaurantId}&t=${tableRef.id}`;

    await updateDoc(tableRef, { qrCodeUrl: qrUrl });
    return { id: tableRef.id, ...data, qrCodeUrl: qrUrl } as Table;
};

export const getTables = async (restaurantId: string) => {
    const q = query(collection(db, 'tables'), where('restaurantId', '==', restaurantId), orderBy('number'));
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

// --- ORDERS ---
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    // 1. Create Order
    const orderRef = await addDoc(collection(db, 'orders'), {
        ...order,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // 2. Lock Table
    await updateTableStatus(order.tableId, true, orderRef.id);

    return orderRef.id;
};

export const subscribeToOrders = (restaurantId: string, callback: (orders: Order[]) => void) => {
    // Get orders from last 24 hours only to keep it snappy for dashboard
    // Or just by status != 'paid'/'cancelled'
    const q = query(
        collection(db, 'orders'),
        where('restaurantId', '==', restaurantId),
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

    // Unlock table if order is done. NOTE: We need tableId here if we want to unlock.
    // Ideally updateOrderStatus should probably fetch the order to get the tableId if not passed, 
    // or the caller must pass it. 
    // For now, if tableId is passed, we unlock.
    if (tableId && (status === 'paid' || status === 'cancelled')) {
        await updateTableStatus(tableId, false, null as any); // Using 'null' to clear field (or deleteField() if prefer)
    }
};

// --- ORDER ITEMS ---
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    // Order items are embedded in the order document as an array
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
        const data = orderDoc.data() as any;
        return data.items || [];
    }
    return [];
};

// --- WAITER CALLS ---
export const createWaiterCall = async (call: Omit<WaiterCall, 'id' | 'createdAt' | 'status'>) => {
    await addDoc(collection(db, 'waiterCalls'), {
        ...call,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

export const subscribeToWaiterCalls = (restaurantId: string, callback: (calls: WaiterCall[]) => void) => {
    const q = query(
        collection(db, 'waiterCalls'),
        where('restaurantId', '==', restaurantId),
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

// --- USER UTILS ---
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

