import { Link, router, useForm } from '@inertiajs/react';
import {
    FileAudio,
    FileText,
    FileVideo,
    FolderInput,
    LayoutGrid,
    List,
    Lock,
    RefreshCw,
    Search,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { AssetDetailsDialog } from '@/components/media/asset-details-dialog';
import { formatBytes } from '@/components/media/format';
import { StatusBadge } from '@/components/media/status-badge';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { media } from '@/routes/dashboard';
import { bulkDestroy, bulkFolder, bulkProcess, store } from '@/routes/media';
import type { MediaAsset, MediaFilters, MediaStats, Paginated } from '@/types';

const ALL = '__all';

const typeOptions = [
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Documents' },
];

function FileIcon({
    asset,
    className,
}: {
    asset: MediaAsset;
    className?: string;
}) {
    const Icon =
        asset.category === 'video'
            ? FileVideo
            : asset.category === 'audio'
              ? FileAudio
              : FileText;

    return <Icon className={cn('text-muted-foreground', className)} />;
}

function UploadForm({ folders }: { folders: string[] }) {
    const form = useForm<{ files: File[]; folder: string }>({
        files: [],
        folder: '',
    });

    const errors = Object.entries(form.errors)
        .filter(([key]) => key.startsWith('files'))
        .map(([, message]) => message);

    return (
        <form
            className="grid gap-3 rounded-xl border p-4"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(store.url(), {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => form.reset(),
                });
            }}
        >
            <div className="flex flex-wrap items-end gap-3">
                <label className="grid flex-1 gap-1.5 text-sm">
                    <span className="font-medium">Files</span>
                    <Input
                        key={form.data.files.length === 0 ? 'empty' : 'chosen'}
                        type="file"
                        multiple
                        onChange={(event) =>
                            form.setData(
                                'files',
                                Array.from(event.target.files ?? []),
                            )
                        }
                    />
                </label>
                <label className="grid w-48 gap-1.5 text-sm">
                    <span className="font-medium">Folder</span>
                    <Input
                        list="upload-folders"
                        value={form.data.folder}
                        onChange={(event) =>
                            form.setData('folder', event.target.value)
                        }
                        placeholder="Optional"
                    />
                    <datalist id="upload-folders">
                        {folders.map((folder) => (
                            <option key={folder} value={folder} />
                        ))}
                    </datalist>
                </label>
                <Button
                    type="submit"
                    disabled={form.processing || form.data.files.length === 0}
                >
                    <Upload />
                    {form.processing && form.progress
                        ? `${form.progress.percentage}%`
                        : 'Upload'}
                </Button>
            </div>
            <InputError message={form.errors.folder} />
            {errors.length > 0 && (
                <ul className="text-sm text-destructive">
                    {Array.from(new Set(errors)).map((error) => (
                        <li key={error}>{error}</li>
                    ))}
                </ul>
            )}
        </form>
    );
}

export function MediaGallery({
    assets,
    filters,
    folders,
    stats,
}: {
    assets: Paginated<MediaAsset>;
    filters: MediaFilters;
    folders: string[];
    stats: MediaStats;
}) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [openAssetId, setOpenAssetId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [moveTo, setMoveTo] = useState('');

    const openAsset = assets.data.find((asset) => asset.id === openAssetId);

    const applyFilters = (changes: Partial<MediaFilters>) => {
        const next = { ...filters, ...changes };
        const query: Record<string, string> = {};

        if (next.search) {
            query.search = next.search;
        }

        if (next.type) {
            query.type = next.type;
        }

        if (next.folder) {
            query.folder = next.folder;
        }

        if (next.featured) {
            query.featured = '1';
        }

        setSelected(new Set());
        router.get(
            media.url({ query }),
            {},
            { preserveState: true, replace: true },
        );
    };

    const toggle = (id: number) =>
        setSelected((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });

    const bulk = (url: string, data: Record<string, unknown> = {}) =>
        router.post(
            url,
            { ids: [...selected], ...data },
            { preserveScroll: true, onSuccess: () => setSelected(new Set()) },
        );

    return (
        <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
                {stats.total_count} files · {formatBytes(stats.total_size)}
                {stats.saved_bytes > 0 &&
                    ` · ${formatBytes(stats.saved_bytes)} saved by compression`}
            </p>

            <UploadForm folders={folders} />

            <div className="flex flex-wrap items-center gap-2">
                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        applyFilters({ search });
                    }}
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search"
                        className="w-48"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search />
                    </Button>
                </form>
                <Select
                    value={filters.type ?? ALL}
                    onValueChange={(value) =>
                        applyFilters({
                            type:
                                value === ALL
                                    ? null
                                    : (value as MediaFilters['type']),
                        })
                    }
                >
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All types</SelectItem>
                        {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label} (
                                {stats.by_type[
                                    option.value as keyof MediaStats['by_type']
                                ] ?? 0}
                                )
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.folder ?? ALL}
                    onValueChange={(value) =>
                        applyFilters({ folder: value === ALL ? null : value })
                    }
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All folders</SelectItem>
                        {folders.map((folder) => (
                            <SelectItem key={folder} value={folder}>
                                {folder}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={filters.featured}
                        onCheckedChange={(checked) =>
                            applyFilters({ featured: checked === true })
                        }
                    />
                    Featured
                </label>
                <div className="ml-auto flex gap-1">
                    <Button
                        variant={view === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('grid')}
                        title="Grid"
                    >
                        <LayoutGrid />
                    </Button>
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('list')}
                        title="List"
                    >
                        <List />
                    </Button>
                </div>
            </div>

            {selected.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-2 text-sm">
                    <span className="px-2 font-medium">
                        {selected.size} selected
                    </span>
                    <Input
                        list="upload-folders"
                        value={moveTo}
                        onChange={(event) => setMoveTo(event.target.value)}
                        placeholder="Folder"
                        className="h-8 w-40 bg-background"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            bulk(bulkFolder.url(), { folder: moveTo })
                        }
                    >
                        <FolderInput />
                        Move
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulk(bulkProcess.url())}
                    >
                        <RefreshCw />
                        Reprocess
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            confirm(
                                `Delete ${selected.size} files? Files used by articles are skipped.`,
                            ) && bulk(bulkDestroy.url())
                        }
                    >
                        <Trash2 />
                        Delete
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected(new Set())}
                    >
                        Clear
                    </Button>
                </div>
            )}

            {assets.data.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    No files match.
                </p>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                    {assets.data.map((asset) => (
                        <div
                            key={asset.id}
                            className={cn(
                                'group relative overflow-hidden rounded-lg border',
                                selected.has(asset.id) && 'ring-2 ring-ring',
                            )}
                        >
                            <Checkbox
                                checked={selected.has(asset.id)}
                                onCheckedChange={() => toggle(asset.id)}
                                className="absolute top-2 left-2 z-10 bg-background"
                                aria-label="Select"
                            />
                            <button
                                type="button"
                                onClick={() => setOpenAssetId(asset.id)}
                                className="block w-full text-left"
                            >
                                <div className="flex aspect-square items-center justify-center bg-muted">
                                    {asset.category === 'image' ? (
                                        <img
                                            src={asset.thumbnail_url}
                                            alt={asset.alt_text ?? ''}
                                            loading="lazy"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <FileIcon
                                            asset={asset}
                                            className="size-10"
                                        />
                                    )}
                                </div>
                                <div className="grid gap-1 p-2 text-xs">
                                    <span className="truncate font-medium">
                                        {asset.title || asset.original_filename}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        {formatBytes(asset.file_size)}
                                        {asset.is_featured && (
                                            <Star className="size-3 fill-current" />
                                        )}
                                        {asset.is_private && (
                                            <Lock
                                                className="size-3"
                                                aria-label="Private"
                                            />
                                        )}
                                    </span>
                                    <span className="flex flex-wrap gap-1">
                                        {asset.processing_status !==
                                            'completed' && (
                                            <StatusBadge
                                                status={asset.processing_status}
                                            />
                                        )}
                                        {(asset.usage?.length ?? 0) > 0 && (
                                            <Badge variant="outline">
                                                In use ({asset.usage?.length})
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="w-10 p-2" />
                                <th className="p-2 font-medium">File</th>
                                <th className="p-2 font-medium">Folder</th>
                                <th className="p-2 font-medium">Size</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium">Used in</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.data.map((asset) => (
                                <tr key={asset.id} className="border-t">
                                    <td className="p-2">
                                        <Checkbox
                                            checked={selected.has(asset.id)}
                                            onCheckedChange={() =>
                                                toggle(asset.id)
                                            }
                                            aria-label="Select"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenAssetId(asset.id)
                                            }
                                            className="flex items-center gap-2 text-left hover:underline"
                                        >
                                            {asset.category === 'image' ? (
                                                <img
                                                    src={asset.thumbnail_url}
                                                    alt=""
                                                    className="size-8 rounded object-cover"
                                                />
                                            ) : (
                                                <FileIcon
                                                    asset={asset}
                                                    className="size-8"
                                                />
                                            )}
                                            {asset.title ||
                                                asset.original_filename}
                                        </button>
                                    </td>
                                    <td className="p-2 text-muted-foreground">
                                        {asset.subcategory ?? '—'}
                                    </td>
                                    <td className="p-2 tabular-nums">
                                        {formatBytes(asset.file_size)}
                                    </td>
                                    <td className="p-2">
                                        <StatusBadge
                                            status={asset.processing_status}
                                        />
                                    </td>
                                    <td className="p-2 text-muted-foreground">
                                        {asset.usage?.length ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {assets.last_page > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Page {assets.current_page} of {assets.last_page}
                    </span>
                    <div className="flex gap-2">
                        {assets.prev_page_url && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={assets.prev_page_url}
                                    preserveScroll
                                >
                                    Previous
                                </Link>
                            </Button>
                        )}
                        {assets.next_page_url && (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={assets.next_page_url}
                                    preserveScroll
                                >
                                    Next
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {openAsset && (
                <AssetDetailsDialog
                    key={openAsset.id}
                    asset={openAsset}
                    folders={folders}
                    onClose={() => setOpenAssetId(null)}
                />
            )}
        </div>
    );
}
