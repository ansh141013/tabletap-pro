/**
 * Upgrade Page
 * 
 * Shows pricing plans and encourages upgrades.
 * Premium SaaS-grade design with feature comparison.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Check,
    X,
    Sparkles,
    Zap,
    Building2,
    Crown,
    ArrowRight,
    Clock,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlan } from '@/contexts/PlanContext';
import { useOwnerSettings } from '@/contexts/OwnerContext';
import { getAllPlans, FEATURE_LABELS, formatLimitValue, PlanConfig, PlanFeatures } from '@/config/plans';
import { useToast } from '@/hooks/use-toast';

// Feature comparison list
const COMPARISON_FEATURES: (keyof PlanFeatures)[] = [
    'maxTables',
    'maxMenuItems',
    'maxCategories',
    'maxOrders',
    'analytics',
    'advancedAnalytics',
    'qrCustomization',
    'customBranding',
    'smsNotifications',
    'exportData',
    'prioritySupport',
    'teamMembers',
    'apiAccess',
    'multipleLocations',
];

export const UpgradePage = () => {
    const { plan: currentPlan, planStatus, isTrialing, trialDaysLeft } = usePlan();
    const { formatCurrency } = useOwnerSettings();
    const { toast } = useToast();
    const [isYearly, setIsYearly] = useState(false);

    const plans = getAllPlans();

    const handleUpgrade = (planConfig: PlanConfig) => {
        if (planConfig.id === currentPlan) {
            toast({ title: 'This is your current plan' });
            return;
        }

        // TODO: Integrate with payment provider
        toast({
            title: '🚀 Upgrade Request Received',
            description: `We'll contact you to upgrade to ${planConfig.name}. Payment integration coming soon!`,
        });
    };

    const getPlanIcon = (planId: string) => {
        switch (planId) {
            case 'free': return Zap;
            case 'pro': return Sparkles;
            case 'business': return Building2;
            default: return Zap;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
            {/* Header */}
            <div className="text-center pt-8 pb-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
                        <Crown className="w-3 h-3 mr-1" />
                        Pricing Plans
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Scale your restaurant operations with the right plan.
                        All plans include core features with no hidden fees.
                    </p>
                </motion.div>

                {/* Trial Banner */}
                {isTrialing && trialDaysLeft > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600"
                    >
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {trialDaysLeft} days left in your trial
                        </span>
                    </motion.div>
                )}

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Monthly
                    </span>
                    <Switch
                        checked={isYearly}
                        onCheckedChange={setIsYearly}
                        aria-label="Toggle yearly billing"
                    />
                    <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        Yearly
                    </span>
                    {isYearly && (
                        <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20">
                            Save 17%
                        </Badge>
                    )}
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((planConfig, index) => {
                        const Icon = getPlanIcon(planConfig.id);
                        const isCurrentPlan = planConfig.id === currentPlan;
                        const isPopular = planConfig.popular;
                        const price = isYearly ? planConfig.yearlyPrice : planConfig.price;
                        const priceLabel = isYearly ? '/year' : '/month';

                        return (
                            <motion.div
                                key={planConfig.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className={`relative h-full flex flex-col transition-all duration-300 ${isPopular
                                        ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                                        : 'hover:border-primary/50 hover:shadow-md'
                                    } ${isCurrentPlan ? 'ring-2 ring-primary/50' : ''}`}>

                                    {/* Popular Badge */}
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-primary text-primary-foreground shadow-lg">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                {planConfig.badge}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Current Plan Badge */}
                                    {isCurrentPlan && !isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge variant="outline" className="bg-background">
                                                <Check className="w-3 h-3 mr-1" />
                                                Current Plan
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-2 pt-8">
                                        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${isPopular
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <CardTitle className="text-xl">{planConfig.name}</CardTitle>
                                        <CardDescription>{planConfig.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 pt-4">
                                        {/* Price */}
                                        <div className="text-center mb-6">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-4xl font-bold">
                                                    {price === 0 ? 'Free' : `$${price}`}
                                                </span>
                                                {price > 0 && (
                                                    <span className="text-muted-foreground">{priceLabel}</span>
                                                )}
                                            </div>
                                            {isYearly && price > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    ${Math.round(price / 12)}/month billed annually
                                                </p>
                                            )}
                                        </div>

                                        {/* Key Features */}
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span>
                                                    <strong>{formatLimitValue(planConfig.features.maxTables)}</strong> tables
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span>
                                                    <strong>{formatLimitValue(planConfig.features.maxMenuItems)}</strong> menu items
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span>
                                                    <strong>{formatLimitValue(planConfig.features.maxOrders)}</strong> orders/month
                                                </span>
                                            </li>
                                            {planConfig.features.analytics && (
                                                <li className="flex items-center gap-3 text-sm">
                                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span>Analytics dashboard</span>
                                                </li>
                                            )}
                                            {planConfig.features.qrCustomization && (
                                                <li className="flex items-center gap-3 text-sm">
                                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span>Custom QR codes</span>
                                                </li>
                                            )}
                                            {planConfig.features.prioritySupport && (
                                                <li className="flex items-center gap-3 text-sm">
                                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span>Priority support</span>
                                                </li>
                                            )}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="pt-4">
                                        <Button
                                            className={`w-full ${isPopular ? '' : 'variant-outline'}`}
                                            variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'secondary'}
                                            size="lg"
                                            disabled={isCurrentPlan}
                                            onClick={() => handleUpgrade(planConfig)}
                                        >
                                            {isCurrentPlan ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Current Plan
                                                </>
                                            ) : (
                                                <>
                                                    {planConfig.cta}
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16"
                >
                    <h2 className="text-2xl font-bold text-center mb-8">Compare All Features</h2>

                    <div className="bg-card rounded-xl border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-4 font-medium text-muted-foreground">Feature</th>
                                        {plans.map(p => (
                                            <th key={p.id} className="p-4 text-center font-medium">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={currentPlan === p.id ? 'text-primary' : ''}>
                                                        {p.name}
                                                    </span>
                                                    {currentPlan === p.id && (
                                                        <Badge variant="outline" className="text-xs">Current</Badge>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {COMPARISON_FEATURES.map((feature, idx) => (
                                        <tr key={feature} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                                            <td className="p-4 text-sm font-medium">{FEATURE_LABELS[feature]}</td>
                                            {plans.map(p => {
                                                const value = p.features[feature];
                                                const isBoolean = typeof value === 'boolean';

                                                return (
                                                    <td key={p.id} className="p-4 text-center">
                                                        {isBoolean ? (
                                                            value ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10">
                                                                    <Check className="w-4 h-4 text-green-600" />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                                                                    <X className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="font-medium">
                                                                {formatLimitValue(value as number)}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-12 flex flex-wrap justify-center gap-6 text-muted-foreground"
                >
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Secure payments</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" />
                        <span>Instant activation</span>
                    </div>
                </motion.div>

                {/* FAQ CTA */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Have questions about our plans?
                    </p>
                    <Button variant="link" className="text-primary">
                        Contact Sales →
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePage;
