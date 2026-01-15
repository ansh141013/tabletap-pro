# TableTap Multi-Tenant Architecture

## Overview
TableTap is a multi-tenant SaaS where each **owner** (`auth.uid`) can manage **one restaurant**. All data must be strictly isolated by `ownerId` to prevent cross-owner data leakage.

---

## Core Principles

1. **auth.uid is the single source of truth for ownership**
2. **Every document includes ownerId (auth.uid)**
3. **restaurantId is derived from ownerId (one-to-one mapping)**
4. **All queries filter by ownerId**
5. **Firestore rules enforce ownerId == request.auth.uid**

---

## Data Model

### 1. Users Collection
**Path**: `users/{uid}`

```typescript
interface UserProfile {
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'owner' | 'staff' | 'admin';
  restaurantId?: string;    // Optional: only set after onboarding
  createdAt: Timestamp;
}
```

**Security**:
- Owner can only read/write their own document
- Document ID = auth.uid

---

### 2. Restaurants Collection
**Path**: `restaurants/{restaurantId}`

```typescript
interface Restaurant {
  id: string;               // Document ID (auto-generated)
  ownerId: string;          // *** CRITICAL: auth.uid of owner ***
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  
  // Settings
  currency: string;
  language: string;
  setupComplete: boolean;
  
  // Location
  latitude?: number;
  longitude?: number;
  location_radius?: number;
  
  // Metadata
  createdAt: Timestamp;
}
```

**Security**:
- Only owner (ownerId == auth.uid) can update
- Public read for customers browsing menus
- **One owner = one restaurant** (enforced in app logic)

---

### 3. Categories Collection
**Path**: `categories/{categoryId}`

```typescript
interface Category {
  id: string;
  ownerId: string;        // *** NEW: auth.uid ***
  restaurantId: string;   // For backwards compatibility
  name: string;
  displayOrder: number;
  description?: string;
}
```

**Security**:
- Only owner (ownerId == auth.uid) can write
- Public read

**Queries**:
```typescript
// ✅ CORRECT
const q = query(
  collection(db, 'categories'),
  where('ownerId', '==', currentUser.uid),
  orderBy('displayOrder')
);

// ❌ WRONG (missing ownerId filter)
const q = query(
  collection(db, 'categories'),
  where('restaurantId', '==', restaurantId)
);
```

---

### 4. Menu Items Collection
**Path**: `menuItems/{itemId}`

```typescript
interface MenuItem {
  id: string;
  ownerId: string;        // *** NEW: auth.uid ***
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  createdAt: Timestamp;
}
```

**Security**:
- Only owner (ownerId == auth.uid) can write
- Public read

---

### 5. Tables Collection
**Path**: `tables/{tableId}`

```typescript
interface Table {
  id: string;
  ownerId: string;        // *** NEW: auth.uid ***
  restaurantId: string;
  number: string;
  seats: number;
  qrCodeUrl?: string;
  isLocked: boolean;
  currentOrderId?: string;
  status: 'available' | 'occupied' | 'reserved';
}
```

**Security**:
- Only owner (ownerId == auth.uid) can write
- Public read (for QR code scans)

---

### 6. Orders Collection
**Path**: `orders/{orderId}`

```typescript
interface Order {
  id: string;
  ownerId: string;          // *** NEW: Owner of restaurant ***
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  items: OrderItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Security**:
- Public can create (place orders)
- Only owner (ownerId == auth.uid) can read/update
- **Critical**: Must validate tableId belongs to ownerId before creating order

---

### 7. Waiter Calls Collection
**Path**: `waiterCalls/{callId}`

```typescript
interface WaiterCall {
  id: string;
  ownerId: string;        // *** NEW: auth.uid ***
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  type: 'service' | 'bill' | 'other';
  status: 'pending' | 'resolved';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}
```

**Security**:
- Public can create
- Only owner (ownerId == auth.uid) can read/update

---

## Migration Strategy

### Phase 1: Add ownerId to Existing Collections
For existing documents without `ownerId`, backfill from `restaurants` collection:

```typescript
// Migration script (run once)
const restaurants = await getDocs(collection(db, 'restaurants'));
for (const restaurantDoc of restaurants.docs) {
  const restaurant = restaurantDoc.data();
  const ownerId = restaurant.ownerId;
  const restaurantId = restaurantDoc.id;
  
  // Backfill categories
  const categories = await getDocs(
    query(collection(db, 'categories'), where('restaurantId', '==', restaurantId))
  );
  for (const cat of categories.docs) {
    await updateDoc(doc(db, 'categories', cat.id), { ownerId });
  }
  
  // Repeat for menuItems, tables, orders, waiterCalls
}
```

### Phase 2: Update All Queries
Replace all `where('restaurantId', '==', ...)` with `where('ownerId', '==', auth.uid)`.

### Phase 3: Deploy New Security Rules
Update Firestore rules to enforce `ownerId == request.auth.uid`.

### Phase 4: Update Owner Setup
Prevent duplicate restaurant creation by checking if `restaurantId` exists in `UserProfile`.

---

## Owner Setup Flow (Secure)

```typescript
// Step 1: Check if owner already has a restaurant
const userDoc = await getDoc(doc(db, 'users', auth.uid));
if (userDoc.exists() && userDoc.data().restaurantId) {
  // Prevent duplicate setup
  navigate('/dashboard');
  return;
}

// Step 2: Create restaurant (only once)
const restaurantId = await createRestaurant({
  ownerId: auth.uid,  // ✅ CRITICAL
  name: formData.name,
  setupComplete: false,
  // ... other fields
});

// Step 3: Link to user profile
await updateDoc(doc(db, 'users', auth.uid), {
  restaurantId: restaurantId
});

// Step 4: Create categories/tables/etc with ownerId
await addCategory({
  ownerId: auth.uid,  // ✅ CRITICAL
  restaurantId: restaurantId,
  name: 'Appetizers',
  displayOrder: 0
});
```

---

## Firestore Security Rules (v2)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner() {
      return request.auth.uid == resource.data.ownerId;
    }
    
    function isCreatingOwnData() {
      return request.auth.uid == request.resource.data.ownerId;
    }
    
    // Users: can only access own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Restaurants: owner can update, public can read
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow create: if isAuthenticated() && isCreatingOwnData();
      allow update, delete: if isOwner();
    }
    
    // Categories: owner can write, public can read
    match /categories/{categoryId} {
      allow read: if true;
      allow create: if isAuthenticated() && isCreatingOwnData();
      allow update, delete: if isOwner();
    }
    
    // Menu Items: owner can write, public can read
    match /menuItems/{itemId} {
      allow read: if true;
      allow create: if isAuthenticated() && isCreatingOwnData();
      allow update, delete: if isOwner();
    }
    
    // Tables: owner can write, public can read
    match /tables/{tableId} {
      allow read: if true;
      allow create: if isAuthenticated() && isCreatingOwnData();
      allow update, delete: if isOwner();
    }
    
    // Orders: public can create, only owner can read/update
    match /orders/{orderId} {
      allow create: if true; // Public can place orders
      allow read: if isAuthenticated() && isOwner();
      allow update: if isAuthenticated() && isOwner();
      allow delete: if false; // Never delete orders
    }
    
    // Waiter Calls: public can create, owner can read/update
    match /waiterCalls/{callId} {
      allow create: if true;
      allow read, update: if isAuthenticated() && isOwner();
      allow delete: if isOwner();
    }
  }
}
```

---

## Query Examples

### ✅ Secure Query Pattern
```typescript
// Always filter by ownerId
const getCategories = async (ownerId: string) => {
  const q = query(
    collection(db, 'categories'),
    where('ownerId', '==', ownerId),
    orderBy('displayOrder')
  );
  return await getDocs(q);
};

const getMenuItems = async (ownerId: string, categoryId?: string) => {
  let q = query(
    collection(db, 'menuItems'),
    where('ownerId', '==', ownerId)
  );
  
  if (categoryId) {
    q = query(q, where('categoryId', '==', categoryId));
  }
  
  return await getDocs(q);
};
```

### ❌ Insecure Query Pattern (DO NOT USE)
```typescript
// WRONG: No ownerId filter
const q = query(
  collection(db, 'categories'),
  where('restaurantId', '==', restaurantId)
);
```

---

## Validation Checklist

Before deploying any query or mutation:

- [ ] Does it include `ownerId == auth.uid` filter?
- [ ] Is `ownerId` set to `auth.uid` when creating documents?
- [ ] Does the Firestore rule enforce `ownerId == request.auth.uid`?
- [ ] Is there a composite index for `ownerId` + other filters?
- [ ] Does the UI prevent users from entering other owners' IDs?

---

## Testing Multi-Tenancy

1. **Create two owner accounts** (Owner A and Owner B)
2. **Owner A creates restaurant, categories, menu items**
3. **Owner B creates restaurant, categories, menu items**
4. **Verify Owner A cannot see Owner B's data**:
   - Try accessing Owner B's `restaurantId` in queries
   - Try bypassing filters in frontend
   - Check Firestore console for data isolation
5. **Test security rules in Firebase Console**

---

## Benefits of This Architecture

1. **Zero data leakage**: Impossible for owners to see each other's data
2. **Simple queries**: Always filter by `auth.uid` (no complex joins)
3. **Scalable**: Works for 10 or 10,000 owners
4. **Auditable**: Every document has an audit trail via `ownerId`
5. **Firebase-native**: Leverages Firestore rules for server-side enforcement

---

## Future Enhancements

1. **Multi-restaurant support**: Change `restaurantId` to `restaurantIds: string[]` in `UserProfile`
2. **Staff accounts**: Add `restaurantIds: string[]` to allow staff to work at multiple locations
3. **Organization hierarchy**: Add `organizationId` for enterprise customers
4. **Role-based access**: Add `permissions: string[]` to `UserProfile` for granular access
