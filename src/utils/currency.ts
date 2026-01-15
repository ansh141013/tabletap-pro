/**
 * Currency Formatting Utility
 * 
 * This module provides centralized currency formatting that reads from
 * the OwnerContext to ensure consistency across the entire application.
 */

// Currency configuration with symbols and formatting rules
export const CURRENCY_CONFIG: Record<string, {
    symbol: string;
    code: string;
    symbolPosition: 'before' | 'after';
    decimalSeparator: string;
    thousandsSeparator: string;
    decimals: number;
}> = {
    USD: {
        symbol: '$',
        code: 'USD',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    INR: {
        symbol: '₹',
        code: 'INR',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    EUR: {
        symbol: '€',
        code: 'EUR',
        symbolPosition: 'before',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        decimals: 2
    },
    GBP: {
        symbol: '£',
        code: 'GBP',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    JPY: {
        symbol: '¥',
        code: 'JPY',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 0 // Japanese Yen has no decimal places
    },
    CAD: {
        symbol: 'CA$',
        code: 'CAD',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    AUD: {
        symbol: 'A$',
        code: 'AUD',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    AED: {
        symbol: 'د.إ',
        code: 'AED',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    SGD: {
        symbol: 'S$',
        code: 'SGD',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    },
    MXN: {
        symbol: 'MX$',
        code: 'MXN',
        symbolPosition: 'before',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimals: 2
    }
};

// Default currency if none specified
export const DEFAULT_CURRENCY = 'USD';

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currencyCode - Currency code (e.g., "USD", "INR")
 * @param options - Additional formatting options
 */
export function formatCurrency(
    amount: number | string | undefined | null,
    currencyCode: string = DEFAULT_CURRENCY,
    options: {
        showSymbol?: boolean;
        showCode?: boolean;
        compact?: boolean;
    } = {}
): string {
    const { showSymbol = true, showCode = false, compact = false } = options;

    // Handle null/undefined
    if (amount === null || amount === undefined) {
        return formatCurrency(0, currencyCode, options);
    }

    // Convert to number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle NaN
    if (isNaN(numAmount)) {
        return formatCurrency(0, currencyCode, options);
    }

    // Get currency config
    const config = CURRENCY_CONFIG[currencyCode.toUpperCase()] || CURRENCY_CONFIG[DEFAULT_CURRENCY];

    // Format number with proper separators
    let formattedNumber: string;

    if (compact && Math.abs(numAmount) >= 1000) {
        // Compact format for large numbers
        if (Math.abs(numAmount) >= 1000000) {
            formattedNumber = (numAmount / 1000000).toFixed(1) + 'M';
        } else if (Math.abs(numAmount) >= 1000) {
            formattedNumber = (numAmount / 1000).toFixed(1) + 'K';
        } else {
            formattedNumber = numAmount.toFixed(config.decimals);
        }
    } else {
        // Standard format
        const parts = numAmount.toFixed(config.decimals).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
        formattedNumber = config.decimals > 0
            ? `${integerPart}${config.decimalSeparator}${parts[1]}`
            : integerPart;
    }

    // Build final string
    let result = '';

    if (showSymbol) {
        if (config.symbolPosition === 'before') {
            result = `${config.symbol}${formattedNumber}`;
        } else {
            result = `${formattedNumber}${config.symbol}`;
        }
    } else {
        result = formattedNumber;
    }

    if (showCode) {
        result = `${result} ${config.code}`;
    }

    return result;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
    const config = CURRENCY_CONFIG[currencyCode.toUpperCase()] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
    return config.symbol;
}

/**
 * Parse a currency string back to a number
 */
export function parseCurrencyInput(value: string, currencyCode: string = DEFAULT_CURRENCY): number {
    const config = CURRENCY_CONFIG[currencyCode.toUpperCase()] || CURRENCY_CONFIG[DEFAULT_CURRENCY];

    // Remove currency symbol and code
    let cleaned = value
        .replace(config.symbol, '')
        .replace(config.code, '')
        .trim();

    // Replace thousands separator and standardize decimal separator
    cleaned = cleaned.replace(new RegExp(`\\${config.thousandsSeparator}`, 'g'), '');
    cleaned = cleaned.replace(config.decimalSeparator, '.');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get list of supported currencies for dropdown
 */
export function getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
        { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
    ];
}
