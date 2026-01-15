# Migration Checklist - Multi-Tenant Architecture

## ✅ Completed Work

### Code Changes
- [x] Updated TypeScript models with `ownerId` field
- [x] Refactored Firebase service (22 functions)
- [x] Updated Firestore security rules
- [x] Updated MenuPage component
- [x] Updated OwnerSetup component  
- [x] Updated useOrders hook
- [x] Updated OrdersPage component
- [x] Updated useOrderNotifications hook
- [x] Updated Firestore composite indexes

### Documentation
- [x] ARCHITECTURE.md created
- [x] IMPLEMENTATION_SUMMARY.md created
- [x] DEPLOYMENT_GUIDE.md created
- [x] FINAL_SUMMARY.md created
- [x] QUICK_REFERENCE.md created
- [x] This checklist created

### Migration Tools
- [x] Migration script created (`scripts/migrate-ownerid.ts`)
- [x] Dry-run mode implemented
- [x] Batch processing for large datasets
- [x] Error handling and reporting

---

## 🚀 Deployment In Progress

### Current Status
```
Command: firebase deploy --only firestore:rules,firestore:indexes
Status: RUNNING ⏳
```

**What's happening**:
1. Deploying new Firestore security rules
2. Creating new composite indexes with `ownerId`
3. Firestore is building the indexes (can take 2-10 minutes)

---

## ⏭️ Next Steps (In Order)

### Step 1: Wait for Deployment ⏸️
- [ ] Wait for deployment command to complete
- [ ] Expected message: "✔ Deploy complete!"
- [ ] Check Firebase Console → Firestore → Indexes
- [ ] All indexes should show status: "Building..." → "Enabled"

### Step 2: Run Migration (If You Have Existing Data) 📊

**Option A: Dry Run First (Recommended)**
```bash
cd "d:\app\tabletap pro"

# Install dependencies if needed
npm install firebase-admin

# Run dry run to see what would change
node -r ts-node/register scripts/migrate-ownerid.ts --dry-run
```

**Option B: Run Actual Migration**
```bash
# Run the migration
node -r ts-node/register scripts/migrate-ownerid.ts
```

**What to expect**:
- Script will process all collections
- Shows progress for each collection
- Reports: Total, Updated, Skipped, Errors
- Takes 1-5 minutes depending on data size

### Step 3: Verify Migration ✔️
- [ ] Check Firestore Console
- [ ] Random sample check: Open a few documents
- [ ] Verify `ownerId` field exists
- [ ] Verify `ownerId` matches expected owner's UID

### Step 4: Deploy Application Code 🚢
```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Step 5: Test Multi-Tenancy 🧪

**Create Test Accounts**:
- [ ] Create Owner A account
- [ ] Create Owner B account

**Owner A Actions**:
- [ ] Complete onboarding
- [ ] Create 2-3 categories
- [ ] Add 3-5 menu items
- [ ] Note down some item names

**Owner B Actions**:
- [ ] Complete onboarding  
- [ ] Create different categories  
- [ ] Add different menu items

**Verification**:
- [ ] Owner A dashboard shows ONLY Owner A's data
- [ ] Owner B dashboard shows ONLY Owner B's data
- [ ] No overlap, no cross-contamination

**Public Order Test**:
- [ ] Open Owner A's public menu (as guest)
- [ ] Place an order
- [ ] Verify order appears in Owner A's dashboard
- [ ] Verify order does NOT appear in Owner B's dashboard

### Step 6: Production Deployment 🎯
- [ ] All tests passing
- [ ] No errors in browser console
- [ ] No errors in Firebase logs
- [ ] Ready for production traffic

---

## 🔍 Verification Queries

Run these in Firestore Console to verify migration:

### Check Categories
```javascript
// Should return 0 (all have ownerId now)
db.collection('categories')
  .where('ownerId', '==', null)
  .get()
  .then(snap => console.log('Missing ownerId:', snap.size))
```

### Check Menu Items
```javascript
db.collection('menuItems')
  .where('ownerId', '==', null)
  .get()
  .then(snap => console.log('Missing ownerId:', snap.size))
```

### Check Tables
```javascript
db.collection('tables')
  .where('ownerId', '==', null)
  .get()
  .then(snap => console.log('Missing ownerId:', snap.size))
```

### Check Orders
```javascript
db.collection('orders')
  .where('ownerId', '==', null)
  .get()
  .then(snap => console.log('Missing ownerId:', snap.size))
```

---

## ⚠️ Common Issues & Solutions

### Issue: Deployment Stuck
**Symptom**: Firebase deploy command running for >15 minutes
**Solution**: 
```bash
# Cancel with Ctrl+C
# Try again
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Issue: Index Still Building
**Symptom**: "The query requires an index" error
**Solution**: Wait. Indexes can take up to 10 minutes to build.
**Check**: Firebase Console → Firestore → Indexes tab

### Issue: Permission Denied
**Symptom**: "Missing or insufficient permissions"
**Solution**:
1. Check user is authenticated (`user?.uid` exists)
2. Verify Firestore rules deployed
3. Run migration script to add `ownerId` to documents

### Issue: No Data Showing
**Symptom**: Dashboard is empty after deployment
**Solution**:
1. Check browser console for errors
2. Verify `user?.uid` is defined
3. Check queries are using `user.uid` not `restaurantId`
4. Verify documents have `ownerId` field

---

## 📊 Migration Script Output Example

```
🚀 Starting ownerId migration...

📊 Step 1: Building restaurantId -> ownerId map...
  ✓ Restaurant abc123 -> Owner uid_owner_a
  ✓ Restaurant xyz789 -> Owner uid_owner_b

✅ Found 2 restaurants with ownerId

📦 Migrating collection: categories
  Found 15 documents
    ✓ Committed batch of 15 updates
  ✅ Completed categories: 15 updated, 0 skipped, 0 errors

📦 Migrating collection: menuItems
  Found 42 documents
    ✓ Committed batch of 42 updates
  ✅ Completed menuItems: 42 updated, 0 skipped, 0 errors

═══════════════════════════════════════
📋 MIGRATION SUMMARY
═══════════════════════════════════════

Collection: categories
  Total Documents: 15
  ✅ Updated: 15
  ⏭️  Skipped: 0
  ❌ Errors: 0

TOTALS:
  ✅ Updated: 157
  ⏭️  Skipped: 0
  ❌ Errors: 0
═══════════════════════════════════════

✅ Migration completed successfully!
```

---

## 🎯 Success Criteria

Migration is complete when:

- [x] All code changes committed
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed and "Enabled"
- [ ] Migration script completed (0 errors)
- [ ] Application deployed
- [ ] Two test owners verified isolated
- [ ] No Firestore errors in production
- [ ] Public orders working

---

## 📞 Need Help?

### Check These First
1. Firebase Console logs
2. Browser developer console
3. Firestore → Indexes tab
4. This checklist

### Documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment steps
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - Complete overview
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick code examples

---

## 🎉 When Everything Is Complete

You'll know you're done when:

1. ✅ Firebase deployment shows "Deploy complete!"
2. ✅ All indexes show "Enabled" status
3. ✅ Migration script shows "Migration completed successfully!"
4. ✅ Application builds without errors
5. ✅ Test: Two owners can't see each other's data
6. ✅ Test: Public customers can place orders
7. ✅ Zero permission errors in logs

**Then you're ready for production! 🚀**

---

**Current Status**: Step 1 (Deployment) in progress ⏸️

**Last Updated**: 2026-01-13 13:05 IST
