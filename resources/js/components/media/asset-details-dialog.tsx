import { Link, router, useForm } from '@inertiajs/react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { formatBytes } from '@/components/media/format';
import { StatusBadge } from '@/components/media/status-badge';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { show as showArticle } from '@/routes/articles';
import { destroy, process as processAsset, update } from '@/routes/media';
import { cn, pixelated } from '@/lib/utils';
import type { MediaAsset } from '@/types';

/**
 * Preview, details form, variants, and where the file is used.
 */
export function AssetDetailsDialog({
    asset,
    folders,
    onClose,
}: {
    asset: MediaAsset;
    folders: string[];
    onClose: () => void;
}) {
    const form = useForm({
        title: asset.title ?? '',
        alt_text: asset.alt_text ?? '',
        description: asset.description ?? '',
        subcategory: asset.subcategory ?? '',
        is_featured: asset.is_featured,
    });
    const usage = asset.usage ?? [];
    const isImage = asset.category === 'image';

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="truncate pr-6">
                        {asset.title || asset.original_filename}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid content-start gap-3 text-sm">
                        {isImage ? (
                            <img
                                src={
                                    asset.is_pixel_art
                                        ? asset.thumbnail_url
                                        : (asset.size_urls.medium ?? asset.url)
                                }
                                alt={asset.alt_text ?? ''}
                                className={cn(
                                    'w-full rounded-lg border',
                                    pixelated(asset.is_pixel_art),
                                )}
                            />
                        ) : (
                            <a
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border p-6 text-center underline underline-offset-4"
                            >
                                Open {asset.original_filename}
                            </a>
                        )}

                        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-muted-foreground">
                            <dt>Status</dt>
                            <dd>
                                <StatusBadge status={asset.processing_status} />
                            </dd>
                            <dt>Type</dt>
                            <dd>{asset.mime_type}</dd>
                            <dt>Size</dt>
                            <dd>
                                {formatBytes(asset.file_size)}
                                {(asset.optimized_size ?? 0) > 0 &&
                                    ` (saved ${formatBytes(asset.optimized_size)})`}
                            </dd>
                            <dt>Uploaded</dt>
                            <dd>
                                {new Date(asset.created_at).toLocaleString()}
                                {asset.uploaded_by &&
                                    ` by ${asset.uploaded_by}`}
                            </dd>
                            <dt>Source</dt>
                            <dd>
                                {asset.is_library_item
                                    ? 'Library upload'
                                    : 'Article upload (deleted when no article uses it)'}
                            </dd>
                            {Object.keys(asset.size_urls).length > 0 && (
                                <>
                                    <dt>Sizes</dt>
                                    <dd className="flex flex-wrap gap-x-3">
                                        {Object.entries(asset.size_urls).map(
                                            ([name, url]) => (
                                                <a
                                                    key={name}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="underline underline-offset-4"
                                                >
                                                    {name}
                                                </a>
                                            ),
                                        )}
                                    </dd>
                                </>
                            )}
                        </dl>

                        {asset.processing_error && (
                            <p className="rounded-md bg-destructive/10 p-2 text-destructive">
                                {asset.processing_error}
                            </p>
                        )}

                        <div>
                            <h3 className="mb-1 font-medium text-foreground">
                                Used in
                            </h3>
                            {usage.length === 0 ? (
                                <p className="text-muted-foreground">
                                    Not used by any article.
                                </p>
                            ) : (
                                <ul className="grid gap-1">
                                    {usage.map((article) => (
                                        <li key={article.id}>
                                            <Link
                                                href={showArticle(article.id)}
                                                className="underline underline-offset-4"
                                            >
                                                {article.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <form
                        className="grid content-start gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.patch(update.url(asset.id), {
                                preserveScroll: true,
                                onSuccess: onClose,
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="asset-title">Title</Label>
                            <Input
                                id="asset-title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="asset-alt">Alt text</Label>
                            <Input
                                id="asset-alt"
                                value={form.data.alt_text}
                                onChange={(event) =>
                                    form.setData('alt_text', event.target.value)
                                }
                                placeholder="Describe the image for screen readers"
                            />
                            <InputError message={form.errors.alt_text} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="asset-description">
                                Description
                            </Label>
                            <textarea
                                id="asset-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="asset-folder">Folder</Label>
                            <Input
                                id="asset-folder"
                                list="media-folders"
                                value={form.data.subcategory}
                                onChange={(event) =>
                                    form.setData(
                                        'subcategory',
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. site-photos"
                            />
                            <datalist id="media-folders">
                                {folders.map((folder) => (
                                    <option key={folder} value={folder} />
                                ))}
                            </datalist>
                            <InputError message={form.errors.subcategory} />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.data.is_featured}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'is_featured',
                                        checked === true,
                                    )
                                }
                            />
                            Featured
                        </label>

                        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                            <div className="flex gap-2">
                                {isImage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.post(
                                                processAsset.url(asset.id),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: onClose,
                                                },
                                            )
                                        }
                                    >
                                        <RefreshCw />
                                        Reprocess
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={usage.length > 0}
                                    title={
                                        usage.length > 0
                                            ? 'Remove it from the articles that use it first.'
                                            : undefined
                                    }
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Delete this file and all its sizes?',
                                            )
                                        ) {
                                            router.delete(
                                                destroy.url(asset.id),
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: onClose,
                                                },
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            </div>
                            <Button type="submit" disabled={form.processing}>
                                Save details
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
