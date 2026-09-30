import { Link, usePage } from '@inertiajs/react';
import {
    House,
    Images,
    Info,
    LayoutGrid,
    Map as MapIcon,
    Newspaper,
    NotebookPen,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, home } from '@/routes';
import { index as articlesIndex } from '@/routes/articles';
import { extraInfo, map, media, notes } from '@/routes/dashboard';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Map',
        href: map(),
        icon: MapIcon,
    },
    {
        title: 'Media Library',
        href: media(),
        icon: Images,
    },
    {
        title: 'Notes',
        href: notes(),
        icon: NotebookPen,
    },
    {
        title: 'Extra Info',
        href: extraInfo(),
        icon: Info,
    },
    {
        title: 'Articles',
        href: articlesIndex(),
        icon: Newspaper,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Home',
        href: home(),
        icon: House,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const navItems = auth.canViewNotes
        ? mainNavItems
        : mainNavItems.filter((item) => item.title !== 'Notes');

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
