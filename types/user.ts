export interface IUser {
    id?: string;
    _id: string | { toString(): string };
    email: string;
    name?: string;
    picture?: string;
    favorites: string[];
    earlyAccess: boolean;
    initials: string;
    creditsRemaining: number;
    role?: string;
    billing?: {
        wallet: {
            availableCredits: number;
            heldCredits: number;
            spendableCredits: number;
            lifetimePurchasedCredits?: number;
            lifetimeBonusCredits?: number;
            lifetimeSpentCredits?: number;
            lifetimeRefundedCredits?: number;
        };
        subscription: {
            planCode: string | null;
            status: string;
            startedAt?: string | null;
            endsAt?: string | null;
            renewsAt: string | null;
            willCancelAt: string | null;
            cancelAtCycleEnd: boolean;
        };
        capabilities: {
            customizablePresets: boolean;
            canPurchaseTopups: boolean;
            canPurchaseStarterPack: boolean;
        };
        pricingVersion: string;
        catalog?: { code: string; creditsGranted: number; [key: string]: any }[];
        billingDetails?: {
            firstName: string;
            lastName: string;
            email: string;
            address: string;
            country: string;
            city: string;
            zipCode: string;
        } | null;
    };
    createdAt: Date;
    updatedAt: Date;
    hasAnyNotifications?: boolean;
    notifications?: { id: string; title: string; body: string }[];
}
