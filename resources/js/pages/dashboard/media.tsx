import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { MediaGallery } from '@/components/media/media-gallery';
import { MediaQueue } from '@/components/media/media-queue';
import { MediaSettingsForm } from '@/components/media/media-settings-form';
import { TabNav } from '@/components/tab-nav';
import { dashboard } from '@/routes';
import { media } from '@/routes/dashboard';
import type {
    MediaAsset,
    MediaFilters,
    MediaSettings,
    MediaStats,
    Paginated,
    PhpLimits,
    QueueStats,
} from '@/types';

const tabs = [
    { id: 'gallery', label: 'Gallery' },
    { id: 'settings', label: 'Settings' },
    { id: 'queue', label: 'Queue' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function MediaLibrary({
    tab,
    filters,
    assets,
    folders,
    stats,
    settings,
    supportedMimeTypes,
    phpLimits,
    queueStats,
    recentJobs,
}: {
    tab: TabId;
    filters: MediaFilters;
    assets: Paginated<MediaAsset>;
    folders: string[];
    stats: MediaStats;
    settings: MediaSettings;
    supportedMimeTypes: string[];
    phpLimits: PhpLimits;
    queueStats: QueueStats;
    recentJobs: MediaAsset[];
}) {
    const [activeTab, setActiveTab] = useState<TabId>(tab);

    /**
     * Keep the tab in the URL so reloads and shared links land on it.
     */
    const changeTab = (next: TabId) => {
        setActiveTab(next);
        router.get(
            media.url({ query: next === 'gallery' ? {} : { tab: next } }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Media Library" />
            <div className="flex w-full flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Media Library"
                    description="Every uploaded file, including images added through articles."
                />

                <TabNav
                    tabs={tabs}
                    active={activeTab}
                    onChange={changeTab}
                    className="-mt-4"
                />

                {activeTab === 'gallery' && (
                    <MediaGallery
                        assets={assets}
                        filters={filters}
                        folders={folders}
                        stats={stats}
                    />
                )}
                {activeTab === 'settings' && (
                    <MediaSettingsForm
                        key={JSON.stringify(settings)}
                        settings={settings}
                        supportedMimeTypes={supportedMimeTypes}
                        phpLimits={phpLimits}
                    />
                )}
                {activeTab === 'queue' && (
                    <MediaQueue
                        queueStats={queueStats}
                        recentJobs={recentJobs}
                    />
                )}
            </div>
        </>
    );
}

MediaLibrary.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Media Library', href: media() },
    ],
};
