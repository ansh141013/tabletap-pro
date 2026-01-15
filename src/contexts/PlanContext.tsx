/**
 * PlanContext - Subscription Plan Provider
 * 
 * Provides plan-based feature gating and upgrade prompts across the application.
 * Reads plan data from OwnerContext and exposes limit checking functions.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useOwnerSettings } from '@/contexts/OwnerContext';
import { PlanType, PlanStatus } from '@/types/models';
import {
    getPlanConfig,
    getPlanLimits,
    hasFeature as hasFeatureCheck,
    isLimitReached as isLimitReachedCheck,
    getRemainingCount as getRemainingCountCheck,
    getUpgradePlan,
    PlanConfig,
    PlanFeatures,
} from '@/config/plans';

// ================================
// TYPES
// ================================

interface PlanContextType {
    // Current plan info
    plan: PlanType;
    planStatus: PlanStatus;
    planConfig: PlanConfig;
    limits: PlanFeatures;

    // Trial info
    isTrialing: boolean;
    trialDaysLeft: number;

    // Feature checks
    hasFeature: (feature: keyof PlanFeatures) => boolean;
    isLimitReached: (feature: keyof PlanFeatures, currentCount: number) => boolean;
    getRemainingCount: (feature: keyof PlanFeatures, currentCount: number) => number;

    // Upgrade helpers
    canUpgrade: boolean;
    upgradePlan: PlanType | null;

    // Actions (placeholder for future payment integration)
    startUpgrade: (plan: PlanType) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

// ================================
// PROVIDER COMPONENT
// ================================

export function PlanProvider({ children }: { children: React.ReactNode }) {
    const { restaurant } = useOwnerSettings();

    // Get current plan from restaurant (default to 'free')
    const plan: PlanType = restaurant?.plan || 'free';
    const planStatus: PlanStatus = restaurant?.planStatus || 'active';

    // Memoize plan config and limits
    const planConfig = useMemo(() => getPlanConfig(plan), [plan]);
    const limits = useMemo(() => getPlanLimits(plan), [plan]);

    // Check if user is in trial
    const isTrialing = useMemo(() => planStatus === 'trial', [planStatus]);

    // Calculate trial days left
    const trialDaysLeft = useMemo(() => {
        if (!isTrialing || !restaurant?.trialEndsAt) return 0;

        const trialEnd = restaurant.trialEndsAt?.toDate?.() || new Date(restaurant.trialEndsAt);
        const now = new Date();
        const diffMs = trialEnd.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }, [isTrialing, restaurant?.trialEndsAt]);

    // Feature check function
    const hasFeature = useCallback((feature: keyof PlanFeatures) => {
        return hasFeatureCheck(plan, feature);
    }, [plan]);

    // Limit check function
    const isLimitReached = useCallback((feature: keyof PlanFeatures, currentCount: number) => {
        return isLimitReachedCheck(plan, feature, currentCount);
    }, [plan]);

    // Remaining count function
    const getRemainingCount = useCallback((feature: keyof PlanFeatures, currentCount: number) => {
        return getRemainingCountCheck(plan, feature, currentCount);
    }, [plan]);

    // Upgrade helpers
    const upgradePlan = useMemo(() => getUpgradePlan(plan), [plan]);
    const canUpgrade = upgradePlan !== null;

    // Start upgrade (placeholder - will integrate with payment later)
    const startUpgrade = useCallback((targetPlan: PlanType) => {
        console.log('[PlanContext] Starting upgrade to:', targetPlan);
        // TODO: Integrate with Stripe/payment provider
        // For now, navigate to upgrade page
        window.location.href = '/dashboard/upgrade';
    }, []);

    // Context value
    const value = useMemo<PlanContextType>(() => ({
        plan,
        planStatus,
        planConfig,
        limits,
        isTrialing,
        trialDaysLeft,
        hasFeature,
        isLimitReached,
        getRemainingCount,
        canUpgrade,
        upgradePlan,
        startUpgrade,
    }), [
        plan,
        planStatus,
        planConfig,
        limits,
        isTrialing,
        trialDaysLeft,
        hasFeature,
        isLimitReached,
        getRemainingCount,
        canUpgrade,
        upgradePlan,
        startUpgrade,
    ]);

    return (
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
}

// ================================
// HOOKS
// ================================

/**
 * Hook to access plan information and feature gating
 */
export function usePlan(): PlanContextType {
    const context = useContext(PlanContext);

    if (context === undefined) {
        throw new Error('usePlan must be used within a PlanProvider');
    }

    return context;
}

/**
 * Hook to check a specific feature
 */
export function useFeature(feature: keyof PlanFeatures): boolean {
    const { hasFeature } = usePlan();
    return hasFeature(feature);
}

/**
 * Hook to check if a limit is reached
 */
export function useLimit(feature: keyof PlanFeatures, currentCount: number) {
    const { isLimitReached, getRemainingCount, limits, plan, canUpgrade } = usePlan();

    const limit = limits[feature] as number;
    const reached = isLimitReached(feature, currentCount);
    const remaining = getRemainingCount(feature, currentCount);

    return {
        limit,
        reached,
        remaining,
        currentCount,
        plan,
        canUpgrade,
    };
}
