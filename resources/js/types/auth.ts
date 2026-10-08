export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    avatar_id?: number | null;
    avatar_pixelated?: boolean;
    profile_text?: string | null;
    link_1?: string | null;
    link_2?: string | null;
    link_3?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    canViewNotes: boolean;
};
