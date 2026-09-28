import { router, usePoll } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { formatBytes } from '@/components/media/format';
import { StatusBadge } from '@/components/media/status-badge';
import { Button } from '@/components/ui/button';
import { process as processAsset, processAll } from '@/routes/media';
import type { MediaAsset, ProcessingStatus, QueueStats } from '@/types';

const order: ProcessingStatus[] = [
    'pending',
    'processing',
    'failed',
    'completed',
];

/**
 * Processing overview. Refreshes itself every 5 seconds while open.
 */
export function MediaQueue({
    queueStats,
    recentJobs,
}: {
    queueStats: QueueStats;
    recentJobs: MediaAsset[];
}) {
    usePoll(5000, { only: ['queueStats', 'recentJobs'] });

    const post = (url: string, data: Record<string, boolean> = {}) =>
        router.post(url, data, { preserveScroll: true });

    return (
        <div className="grid max-w-4xl gap-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {order.map((status) => (
                    <div
                        key={status}
                        className="grid gap-1 rounded-xl border p-4"
                    >
                        <StatusBadge status={status} />
                        <span className="text-2xl font-semibold tabular-nums">
                            {queueStats[status]}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    disabled={queueStats.failed === 0}
                    onClick={() =>
                        post(processAll.url(), { only_failed: true })
                    }
                >
                    <RefreshCw />
                    Retry all failed
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        confirm(
                            'Rebuild compression and sizes for every image? This can take a while.',
                        ) && post(processAll.url())
                    }
                >
                    <RefreshCw />
                    Reprocess all images
                </Button>
            </div>

            <section className="grid gap-2">
                <h3 className="font-medium">Waiting, in progress, or failed</h3>
                {recentJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing waiting. Everything is processed.
                    </p>
                ) : (
                    <ul className="divide-y rounded-xl border">
                        {recentJobs.map((asset) => (
                            <li
                                key={asset.id}
                                className="flex flex-wrap items-center gap-3 p-3 text-sm"
                            >
                                <img
                                    src={asset.thumbnail_url}
                                    alt=""
                                    className="size-10 rounded object-cover"
                                />
                                <div className="grid min-w-0 flex-1 gap-0.5">
                                    <span className="truncate font-medium">
                                        {asset.title || asset.original_filename}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatBytes(asset.file_size)}
                                        {asset.processing_error &&
                                            ` · ${asset.processing_error}`}
                                    </span>
                                </div>
                                <StatusBadge status={asset.processing_status} />
                                {asset.processing_status === 'failed' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            post(processAsset.url(asset.id))
                                        }
                                    >
                                        Retry
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
