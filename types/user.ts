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
    createdAt: Date;
    updatedAt: Date;
    hasAnyNotifications?: boolean;
    notifications?: { id: string; title: string; body: string }[];
}
