import { useHttp } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { show, sync } from '@/routes/datasets';
import type { Paginated } from '@/types';

type Row = Record<string, string | number | null>;

type DatasetPage = {
    synced: boolean;
    synced_at: string | null;
    paginator: Paginated<Row> | null;
};

/**
 * Browse a cached dataset snapshot: "not synced" prompt, paged table, last-synced
 * label, and a re-sync button that restarts the snapshot's TTL window.
 */
export function CachedDatasetPanel({
    dataset,
    title,
    columns,
    scope,
}: {
    dataset: string;
    title: string;
    columns: { key: string; label: string }[];
    scope?: string;
}) {
    const http = useHttp<Record<string, never>, DatasetPage>({});
    const [page, setPage] = useState<DatasetPage | null>(null);
    const [syncing, setSyncing] = useState(false);

    const query = scope ? { scope } : {};

    const loadPage = async (pageNumber: number) => {
        setPage(
            await http.get(
                show.url(dataset, { query: { ...query, page: pageNumber } }),
            ),
        );
    };

    const handleSync = async () => {
        setSyncing(true);

        try {
            await http.post(sync.url(dataset, { query }));
            await loadPage(1);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        void loadPage(1);
        // Load once per dataset/scope; loadPage is recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataset, scope]);

    const paginator = page?.paginator;

    return (
        <section className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="font-medium">{title}</h2>
                    <p className="text-xs text-muted-foreground">
                        {page?.synced_at
                            ? `Last synced ${formatDistanceToNow(new Date(page.synced_at), { addSuffix: true })}`
                            : 'Not synced yet'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? <Spinner /> : <RefreshCw />}
                    {page?.synced ? 'Re-sync' : 'Sync'}
                </Button>
            </div>

            {page === null ? (
                <div className="grid gap-2">
                    {Array.from({ length: 5 }, (_, index) => (
                        <Skeleton key={index} className="h-6 w-full" />
                    ))}
                </div>
            ) : !paginator ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Nothing cached. Click Sync to load a snapshot.
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className="px-2 py-1.5 font-medium"
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginator.data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="border-b last:border-0"
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className="px-2 py-1.5 tabular-nums"
                                            >
                                                {row[column.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {paginator.from}–{paginator.to} of {paginator.total}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={paginator.current_page <= 1}
                                onClick={() =>
                                    loadPage(paginator.current_page - 1)
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    paginator.current_page >=
                                    paginator.last_page
                                }
                                onClick={() =>
                                    loadPage(paginator.current_page + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
