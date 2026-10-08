import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type { BreadcrumbItem } from '@/types';

/**
 * For pages open to everyone: the dashboard layout for members, the public one for guests.
 */
export default function SiteLayout(props: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;

    return auth.user ? <AppLayout {...props} /> : <PublicLayout {...props} />;
}
