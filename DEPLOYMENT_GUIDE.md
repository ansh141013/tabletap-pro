# Multi-Tenant Architecture - Deployment Guide

## 🎯 Overview
This guide covers deploying the multi-tenant architecture refactor for TableTap.

---

## ✅ Pre-Deployment Checklist

### Code Changes (Completed ✓)
- [x] Updated TypeScript models with `ownerId`
- [x] Refactored Firebase service functions
- [x] Updated Firestore security rules
- [x] Fixed MenuPage component
- [x] Fixed OwnerSetup component
- [x] Updated useOrders hook
- [x] Updated OrdersPage component
- [x] Updated useOrderNotifications hook
- [x] Updated Firestore indexes

### Migration Script
- [x] Created `/scripts/migrate-ownerid.ts`

---

## 📋 Deployment Steps

### Step 1: Deploy Firestore Rules & Indexes

```bash
# Navigate to project root
cd "d:\app\tabletap pro"

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

**Expected Output:**
```
✔ Deploy complete!
Project Console: https://console.firebase.google.com/project/table-tap-930b5/overview
```

**⏱️ Index Build Time**: Composite indexes can take 2-10 minutes to build depending on existing data size.

---

### Step 2: Run Migration Script (If Existing Data)

**IMPORTANT**: Only run this if you have existing production data!

#### Option A: Via Firebase Functions (Recommended for Production)

1. Create a Cloud Function:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { migrateOwnerId } from './migrate-ownerid';

export const runMigration = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    // Add authentication check
    const secret = req.query.secret;
    if (secret !== 'YOUR_SECRET_KEY') {
      res.status(403).send('Unauthorized');
      return;
    }

    try {
      await migrateOwnerId();
      res.status(200).send('Migration completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).send(`Migration failed: ${error}`);
    }
  });
```

2. Deploy the function:
```bash
firebase deploy --only functions:runMigration
```

3. Run via HTTP:
```bash
curl "https://us-central1-table-tap-930b5.cloudfunctions.net/runMigration?secret=YOUR_SECRET_KEY"
```

#### Option B: Via Node.js Script (For Testing/Small Datasets)

1. Install Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Set up service account:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `service-account-key.json`

3. Run the script:
```bash
# Copy migration script to a runnable location
node -r ts-node/register scripts/migrate-ownerid.ts
```

#### Option C: Manual Migration via Firestore Console

For small datasets, you can manually add `ownerId` fields:

1. Open Firestore Console
2. For each collection (categories, menuItems, tables, orders, waiterCalls):
   - Find documents missing `ownerId`
   - Look up `restaurantId`
   - Find corresponding restaurant's `ownerId`
   - Add `ownerId` field to document

---

### Step 3: Verify Migration

After running the migration, verify data integrity:

```bash
# Check that all documents have ownerId
# Run in Firestore Console
```

**Manual Verification Queries:**

1. **Categories without ownerId**:
```javascript
db.collection('categories').where('ownerId', '==', null).get()
```

2. **MenuItems without ownerId**:
```javascript
db.collection('menuItems').where('ownerId', '==', null).get()
```

3. **Tables without ownerId**:
```javascript
db.collection('tables').where('ownerId', '==', null).get()
```

---

### Step 4: Deploy Application Code

```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

### Step 5: Test Multi-Tenancy

**Critical Test Scenarios:**

#### Test 1: Owner Isolation
1. Create two test accounts (Owner A & Owner B)
2. Owner A: Complete onboarding, create categories, menu items
3. Owner B: Complete onboarding, create categories, menu items
4. Owner A: Verify can ONLY see their own data
5. Owner B: Verify can ONLY see their own data

#### Test 2: Order Creation Security
1. Public customer places order on Owner A's menu
2. Verify order appears ONLY in Owner A's dashboard
3. Verify order has correct `ownerId` (Owner A's uid)

#### Test 3: Firestore Rules Enforcement
1. Try to query another owner's data via console
2. Should return empty results or permission error

---

## 🔧 Troubleshooting

### Issue: "The query requires an index"

**Cause**: Composite indexes are still building

**Solution**: Wait 5-10 minutes for indexes to complete. Check status:
- Firebase Console → Firestore → Indexes

### Issue: "Permission denied" errors

**Cause**: Firestore rules are enforcing ownerId, but documents don't have it

**Solution**: Run the migration script to backfill `ownerId`

### Issue: No data showing in dashboard

**Cause 1**: User not authenticated
**Solution**: Check `user?.uid` is available

**Cause 2**: Documents don't have `ownerId` matching user
**Solution**: Run migration script

### Issue: TypeScript errors

**Cause**: Missing `ownerId` in function calls

**Solution**: Ensure all create/update operations include `ownerId: user.uid`

---

## 📊 Monitoring

After deployment, monitor these metrics:

1. **Error Rates**: Check Firebase Console → Functions → Logs
2. **Query Performance**: Firestore → Usage tab
3. **Index Status**: Firestore → Indexes tab
4. **User Reports**: Monitor for data isolation issues

---

## 🚨 Rollback Plan

If critical issues arise:

### Rollback Firestore Rules
```bash
# Revert to previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Application Code
```bash
# Redeploy previous version
git checkout HEAD~1
npm run build
firebase deploy --only hosting
```

**Note**: Indexes cannot be easily rolled back. If needed:
1. Manually delete new indexes in Firebase Console
2. Recreate old indexes

---

## 📝 Post-Deployment Verification

### Checklist
- [ ] All indexes show "Enabled" status
- [ ] Firestore rules deployed successfully
- [ ] Migration script completed (if run)
- [ ] Application builds without errors
- [ ] Test accounts can sign up/login
- [ ] Owner setup flow works
- [ ] Menu page loads data correctly
- [ ] Orders page shows orders
- [ ] Multi-tenancy works (Owner A can't see Owner B's data)
- [ ] Public menu still works for customers
- [ ] Orders can be placed from public menu
- [ ] Real-time updates work

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ Zero TypeScript compilation errors
2. ✅ All Firestore indexes are "Enabled"
3. ✅ Two test owners can operate independently
4. ✅ Owner A cannot access Owner B's data
5. ✅ Public customers can place orders
6. ✅ Orders appear in correct owner's dashboard
7. ✅ No Firestore permission errors in console

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console logs
2. Review browser console for errors
3. Verify Firestore rules are deployed
4. Check index build status
5. Confirm migration completed successfully

---

## 📚 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details
- [scripts/migrate-ownerid.ts](./scripts/migrate-ownerid.ts) - Migration script

---

## ⏭️ Next Steps After Deployment

1. **Monitor Production**: Watch for any data isolation issues
2. **Performance Testing**: Test with realistic data volumes
3. **User Training**: Update documentation for owners
4. **Backup Strategy**: Implement regular Firestore backups
5. **Analytics**: Track multi-tenant usage patterns
