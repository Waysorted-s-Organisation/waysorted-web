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
        };
        subscription: {
            planCode: string | null;
            status: string;
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
    };
    createdAt: Date;
    updatedAt: Date;
    hasAnyNotifications?: boolean;
    notifications?: { id: string; title: string; body: string }[];
}
