/**
 * Plan Configuration
 * 
 * Defines the features and limits for each subscription plan.
 * This is the single source of truth for plan-based feature gating.
 */

import { PlanType } from '@/types/models';

// ================================
// PLAN DEFINITIONS
// ================================

export interface PlanFeatures {
    // Limits
    maxTables: number;
    maxMenuItems: number;
    maxCategories: number;
    maxOrders: number; // per month, -1 for unlimited

    // Features
    analytics: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    qrCustomization: boolean;
    multipleLocations: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    smsNotifications: boolean;
    exportData: boolean;
    teamMembers: number;
}

export interface PlanConfig {
    id: PlanType;
    name: string;
    description: string;
    price: number; // monthly price in USD
    yearlyPrice: number; // yearly price in USD
    features: PlanFeatures;
    popular?: boolean;
    cta: string;
    badge?: string;
}

// ================================
// PLAN CONFIGURATIONS
// ================================

export const PLANS: Record<PlanType, PlanConfig> = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        yearlyPrice: 0,
        cta: 'Current Plan',
        features: {
            maxTables: 5,
            maxMenuItems: 25,
            maxCategories: 5,
            maxOrders: 100,
            analytics: false,
            advancedAnalytics: false,
            customBranding: false,
            qrCustomization: false,
            multipleLocations: false,
            apiAccess: false,
            prioritySupport: false,
            smsNotifications: false,
            exportData: false,
            teamMembers: 1,
        },
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        description: 'For growing restaurants',
        price: 29,
        yearlyPrice: 290, // Save ~17%
        cta: 'Upgrade to Pro',
        popular: true,
        badge: 'Most Popular',
        features: {
            maxTables: 25,
            maxMenuItems: 150,
            maxCategories: 20,
            maxOrders: -1, // Unlimited
            analytics: true,
            advancedAnalytics: false,
            customBranding: true,
            qrCustomization: true,
            multipleLocations: false,
            apiAccess: false,
            prioritySupport: true,
            smsNotifications: true,
            exportData: true,
            teamMembers: 5,
        },
    },
    business: {
        id: 'business',
        name: 'Business',
        description: 'For restaurant chains',
        price: 79,
        yearlyPrice: 790, // Save ~17%
        cta: 'Upgrade to Business',
        badge: 'Best Value',
        features: {
            maxTables: -1, // Unlimited
            maxMenuItems: -1,
            maxCategories: -1,
            maxOrders: -1,
            analytics: true,
            advancedAnalytics: true,
            customBranding: true,
            qrCustomization: true,
            multipleLocations: true,
            apiAccess: true,
            prioritySupport: true,
            smsNotifications: true,
            exportData: true,
            teamMembers: -1, // Unlimited
        },
    },
};

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Get plan configuration by plan type
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
    return PLANS[plan] || PLANS.free;
}

/**
 * Get feature limits for a plan
 */
export function getPlanLimits(plan: PlanType): PlanFeatures {
    return getPlanConfig(plan).features;
}

/**
 * Check if a feature is available on a plan
 */
export function hasFeature(plan: PlanType, feature: keyof PlanFeatures): boolean {
    const limits = getPlanLimits(plan);
    const value = limits[feature];

    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    return false;
}

/**
 * Check if user has reached a limit
 */
export function isLimitReached(plan: PlanType, feature: keyof PlanFeatures, currentCount: number): boolean {
    const limits = getPlanLimits(plan);
    const limit = limits[feature] as number;

    if (limit === -1) return false; // Unlimited
    return currentCount >= limit;
}

/**
 * Get remaining count for a limit
 */
export function getRemainingCount(plan: PlanType, feature: keyof PlanFeatures, currentCount: number): number {
    const limits = getPlanLimits(plan);
    const limit = limits[feature] as number;

    if (limit === -1) return Infinity;
    return Math.max(0, limit - currentCount);
}

/**
 * Get all plans as array (for rendering)
 */
export function getAllPlans(): PlanConfig[] {
    return [PLANS.free, PLANS.pro, PLANS.business];
}

/**
 * Get the next upgrade plan
 */
export function getUpgradePlan(currentPlan: PlanType): PlanType | null {
    if (currentPlan === 'free') return 'pro';
    if (currentPlan === 'pro') return 'business';
    return null; // Already on highest plan
}

// ================================
// FEATURE DISPLAY NAMES
// ================================

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
    maxTables: 'Tables',
    maxMenuItems: 'Menu Items',
    maxCategories: 'Categories',
    maxOrders: 'Orders/Month',
    analytics: 'Basic Analytics',
    advancedAnalytics: 'Advanced Analytics',
    customBranding: 'Custom Branding',
    qrCustomization: 'QR Code Customization',
    multipleLocations: 'Multiple Locations',
    apiAccess: 'API Access',
    prioritySupport: 'Priority Support',
    smsNotifications: 'SMS Notifications',
    exportData: 'Export Data',
    teamMembers: 'Team Members',
};

/**
 * Format a limit value for display
 */
export function formatLimitValue(value: number | boolean): string {
    if (typeof value === 'boolean') {
        return value ? '✓' : '—';
    }
    if (value === -1) {
        return 'Unlimited';
    }
    return value.toString();
}
