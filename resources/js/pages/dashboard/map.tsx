import { Head } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { TabNav } from '@/components/tab-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard } from '@/routes';
import { map } from '@/routes/dashboard';

const ZoneMap = lazy(() => import('@/components/map/zone-map'));

/**
 * Data views for the map. Cosmetic for now: switching tabs doesn't change the map.
 */
const tabs = [
    { id: '1', label: 'Overview' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function MapPage() {
    const [activeTab, setActiveTab] = useState<TabId>('1');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => setIsClient(true), []);

    return (
        <>
            <Head title="Map" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <Heading
                    title="Map"
                    description="Starting zone: 30-mile radius around Taos, NM (87571)."
                />

                <TabNav
                    tabs={tabs}
                    active={activeTab}
                    onChange={setActiveTab}
                    className="-mt-4"
                />

                <div className="relative min-h-[32rem] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    {isClient ? (
                        <Suspense
                            fallback={<Skeleton className="absolute inset-0" />}
                        >
                            <ZoneMap />
                        </Suspense>
                    ) : (
                        <Skeleton className="absolute inset-0" />
                    )}
                </div>
            </div>
        </>
    );
}

MapPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Map', href: map() },
    ],
};
