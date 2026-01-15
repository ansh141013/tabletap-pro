# Multi-Tenant Architecture - Quick Reference

## 🚀 What Changed

### Before (Restaurant-based)
```typescript
// ❌ Insecure - filter by restaurantId
getCategories(restaurantId)
getMenuItems(restaurantId)
getTables(restaurantId)
subscribeToOrders(restaurantId)
```

### After (Owner-based)
```typescript
// ✅ Secure - filter by ownerId (auth.uid)
getCategories(user.uid)
getMenuItems(user.uid)
getTables(user.uid)
subscribeToOrders(user.uid)
```

---

## 📝 Key Points

1. **Every document now has `ownerId`** = Firebase Auth UID
2. **All queries filter by `ownerId`** = Complete isolation
3. **Firestore rules enforce ownership** = Server-side security
4. **Composite indexes use `ownerId`** = Optimized performance

---

## 🔧 When Creating Data

Always include `ownerId: user.uid`:

```typescript
// Categories
await addCategory({
  ownerId: user.uid,  // ← REQUIRED
  restaurantId,
  name,
  displayOrder
});

// Menu Items
await addMenuItem({
  ownerId: user.uid,  // ← REQUIRED
  restaurantId,
  categoryId,
  name,
  price,
  available: true
});

// Tables
await addTable({
  ownerId: user.uid,  // ← REQUIRED
  restaurantId,
  number,
  seats,
  status: 'available'
});
```

---

## 🔍 When Querying Data

Always use `user.uid`:

```typescript
// Get current user
const { user } = useAuth();

// Query by ownerId
const categories = await getCategories(user.uid);
const items = await getMenuItems(user.uid);
const tables = await getTables(user.uid);
```

---

## ✅ Deployment Checklist

1. [ ] Firebase rules deployed
2. [ ] Firestore indexes deployed (wait for "Enabled")
3. [ ] Migration script run (if existing data)
4. [ ] Application built and deployed
5. [ ] Test with 2 owner accounts
6. [ ] Verify data isolation

---

## 🐛 Troubleshooting

### "The query requires an index"
→ Wait for indexes to finish building (5-10 min)

### "Permission denied"
→ Run migration script to add `ownerId` to existing docs

### No data showing
→ Check `user?.uid` is defined

---

## 📚 Documentation

- **ARCHITECTURE.md** - Architecture details
- **IMPLEMENTATION_SUMMARY.md** - What changed
- **DEPLOYMENT_GUIDE.md** - How to deploy
- **FINAL_SUMMARY.md** - Complete overview

---

## 🎯 Testing Multi-Tenancy

```typescript
// 1. Create Owner A
// 2. Create Owner B
// 3. Owner A creates categories/items
// 4. Owner B creates categories/items
// 5. Verify Owner A can't see Owner B's data ✓
```

---

## 🔒 Security

**Guaranteed by Firebase**:
- Firestore rules enforce `ownerId == auth.uid`
- Server-side validation
- Zero possibility of cross-owner access

**Guaranteed by Code**:
- All queries filter by `ownerId`
- All creates include `ownerId`
- TypeScript enforces types
