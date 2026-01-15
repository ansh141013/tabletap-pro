# Owner Settings Propagation - Technical Documentation

## Overview

The TableTap application implements a **global owner settings system** that ensures currency, language, and timezone settings propagate consistently across all dashboard components.

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                               │
│                                                                 │
│  restaurants/{restaurantId}                                     │
│  ├── currency: "INR"                                           │
│  ├── language: "hi"                                            │
│  ├── timezone: "Asia/Kolkata"                                  │
│  └── ... other settings                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Real-time subscription (onSnapshot)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OWNER CONTEXT                              │
│                  (src/contexts/OwnerContext.tsx)                │
│                                                                 │
│  Provides:                                                      │
│  ├── settings: { currency, language, timezone }                │
│  ├── formatCurrency(amount) → "₹99.99" (based on currency)    │
│  ├── t('orders.pending') → "लंबित" (based on language)        │
│  ├── currencySymbol → "₹"                                      │
│  └── updateSettings({ currency: "USD" })                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ React Context API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COMPONENTS                                │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │   OrdersPage    │  │    MenuPage     │  │  SettingsPage  │  │
│  │                 │  │                 │  │                │  │
│  │ formatCurrency  │  │ formatCurrency  │  │ updateSettings │  │
│  │ t('orders.xxx') │  │ t('menu.xxx')   │  │                │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. OwnerContext (`src/contexts/OwnerContext.tsx`)

The central context that loads and manages owner settings.

```typescript
// Key features:
interface OwnerContextType {
  settings: OwnerSettings;         // Current currency, language, timezone
  formatCurrency: (amount) => string; // Format any number as currency
  t: (path) => string;             // Translate any text key
  updateSettings: (newSettings) => Promise<void>; // Update in Firestore
}
```

**Real-time Sync**: Uses Firestore `onSnapshot` for immediate updates:
```typescript
onSnapshot(doc(db, 'restaurants', restaurantId), (snap) => {
  const data = snap.data();
  setSettings({
    currency: data.currency,
    language: data.language,
    timezone: data.timezone
  });
});
```

### 2. Currency Utility (`src/utils/currency.ts`)

Provides currency formatting with proper symbols, separators, and decimal places.

```typescript
// Supports 10+ currencies:
CURRENCY_CONFIG = {
  USD: { symbol: '$', decimals: 2, ... },
  INR: { symbol: '₹', decimals: 2, ... },
  EUR: { symbol: '€', decimals: 2, ... },
  JPY: { symbol: '¥', decimals: 0, ... }, // No decimals!
  // ... more
}

// Usage:
formatCurrency(99.99, 'INR') → "₹99.99"
formatCurrency(1234567, 'USD', { compact: true }) → "$1.2M"
```

### 3. Language Utility (`src/utils/language.ts`)

Provides typed translations for multiple languages.

```typescript
// Type-safe translation keys:
type TranslationKeys = {
  common: { save, cancel, delete, ... };
  orders: { pending, preparing, ready, ... };
  menu: { categories, items, price, ... };
  // ...
}

// Supported languages:
en (English), hi (Hindi), es (Spanish)

// Usage:
t('orders.pending', 'hi') → "लंबित"
```

---

## Propagation Flow

### When Settings Are Loaded (App Start)

```
1. User logs in
2. AuthContext loads userProfile (contains restaurantId)
3. OwnerContext subscribes to restaurant document
4. onSnapshot fires with restaurant data
5. OwnerContext sets settings state
6. All components re-render with new settings
```

### When Settings Are Changed (Settings Page)

```
1. User changes currency from USD to INR
2. SettingsPage calls handleSave()
3. updateRestaurant() writes to Firestore
4. onSnapshot listener in OwnerContext fires
5. OwnerContext.settings updates
6. All components using formatCurrency/t re-render
7. Prices now show ₹ instead of $
```

**Key Point**: The UI updates happen automatically because:
- React Context triggers re-renders when value changes
- `useMemo` and `useCallback` ensure stable references
- Child components use the context hooks

---

## Usage Examples

### In Any Dashboard Component

```tsx
import { useOwnerSettings } from '@/contexts/OwnerContext';

export const MyComponent = () => {
  const { formatCurrency, t, settings } = useOwnerSettings();
  
  return (
    <div>
      <h1>{t('orders.title')}</h1>
      <p>Order Total: {formatCurrency(order.total)}</p>
      <p>Current Currency: {settings.currency}</p>
    </div>
  );
};
```

### Using Lightweight Hooks

```tsx
// For just currency:
import { useCurrency } from '@/contexts/OwnerContext';

const { formatCurrency, currencySymbol } = useCurrency();

// For just translations:
import { useTranslations } from '@/contexts/OwnerContext';

const { t, language } = useTranslations();
```

### Updating Settings Programmatically

```tsx
const { updateSettings } = useOwnerSettings();

// Change to Indian Rupees and Hindi
await updateSettings({
  currency: 'INR',
  language: 'hi',
  timezone: 'Asia/Kolkata'
});
```

---

## Security

### Firestore Rules

```javascript
// Only owner can update their restaurant settings
match /restaurants/{restaurantId} {
  allow read: if true;  // Public for menu
  allow update: if isOwner();  // request.auth.uid == resource.data.ownerId
}
```

### Client-Side Validation

- Settings updates require authenticated user
- restaurantId is bound to user profile
- ownerId validation happens server-side

---

## Troubleshooting

### Issue: Currency not updating after save
**Cause**: Firestore update failed
**Check**: Browser console for errors, network tab for failed requests

### Issue: Wrong currency showing
**Cause**: Component not using context
**Fix**: Replace hardcoded `$` with `formatCurrency(amount)`

### Issue: Translations not working
**Cause**: Language not in supported list
**Check**: `getSupportedLanguages()` includes the language code

### Issue: Settings not persisting after refresh
**Cause**: Firestore update isn't completing
**Check**: Dashboard > Settings > verify values match Firestore console

---

## File Reference

| File | Purpose |
|------|---------|
| `src/contexts/OwnerContext.tsx` | Global settings provider |
| `src/utils/currency.ts` | Currency formatting |
| `src/utils/language.ts` | Translations |
| `src/types/models.ts` | OwnerSettings type |
| `src/pages/dashboard/SettingsPage.tsx` | UI for changing settings |

---

## Adding New Features

### Adding a New Currency

1. Add to `CURRENCY_CONFIG` in `src/utils/currency.ts`:
```typescript
BRL: {
  symbol: 'R$',
  code: 'BRL',
  symbolPosition: 'before',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  decimals: 2
}
```

2. Add to `getSupportedCurrencies()`:
```typescript
{ code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
```

### Adding a New Language

1. Create translations object in `src/utils/language.ts`:
```typescript
const pt: TranslationKeys = {
  common: { save: 'Salvar', ... },
  orders: { pending: 'Pendente', ... },
  // ...
};
```

2. Add to translations map:
```typescript
const translations = { en, hi, es, pt };
```

3. Add to `SUPPORTED_LANGUAGES`:
```typescript
{ code: 'pt', name: 'Portuguese', nativeName: 'Português' }
```

---

## Performance Considerations

- **Memoization**: `useMemo` prevents unnecessary re-calculations
- **Callback stability**: `useCallback` prevents child re-renders
- **Selective subscriptions**: Only subscribe to restaurant doc, not entire collection
- **Real-time updates**: `onSnapshot` for instant propagation without polling
