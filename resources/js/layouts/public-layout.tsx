import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LoginDialog } from '@/components/login-dialog';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard, home, map } from '@/routes';
import { index as articlesIndex } from '@/routes/articles';
import type { BreadcrumbItem } from '@/types';

const navItems = [
    { title: 'Home', href: home(), matchChildren: false },
    { title: 'Articles', href: articlesIndex(), matchChildren: true },
    { title: 'Map', href: map(), matchChildren: false },
];

/**
 * The site for visitors: a top nav instead of the dashboard sidebar. Accepts
 * breadcrumbs so pages shared with the dashboard layout don't need to change.
 */
export default function PublicLayout({
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
                    <Link
                        href={home()}
                        className="flex shrink-0 items-center gap-2"
                    >
                        <AppLogoIcon className="size-8 object-contain" />
                        <span className="hidden text-lg font-semibold tracking-tight sm:inline">
                            Water Comb
                        </span>
                    </Link>

                    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-accent hover:text-accent-foreground',
                                    isCurrentUrl(
                                        item.href,
                                        undefined,
                                        item.matchChildren,
                                    )
                                        ? 'font-medium text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    <div className="shrink-0">
                        {auth.user ? (
                            <Button asChild>
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <LoginDialog />
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
                {children}
            </main>
        </div>
    );
}
