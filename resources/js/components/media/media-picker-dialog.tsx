import { useHttp } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { picker } from '@/routes/media';
import type { Paginated, PickedImage } from '@/types';

/**
 * Choose an existing image from the media library.
 */
export function MediaPickerDialog({
    open,
    onOpenChange,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (image: PickedImage) => void;
}) {
    const http = useHttp<Record<string, never>, Paginated<PickedImage>>({});
    const [results, setResults] = useState<Paginated<PickedImage> | null>(null);
    const [search, setSearch] = useState('');

    const load = async (page: number, term = search) => {
        const query: Record<string, string | number> = { page };

        if (term) {
            query.search = term;
        }

        setResults(await http.get(picker.url({ query })));
    };

    useEffect(() => {
        if (open) {
            void load(1, '');
        }
        // Reload only when the dialog opens; load is recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Choose from library</DialogTitle>
                    <DialogDescription>
                        Images from the media library. Upload new ones there, or
                        use “Choose an image” in the editor.
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void load(1);
                    }}
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by title or filename"
                    />
                    <Button type="submit" variant="outline">
                        <Search />
                        Search
                    </Button>
                </form>

                <div className="max-h-[55vh] overflow-y-auto">
                    {results === null ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 8 }, (_, index) => (
                                <Skeleton
                                    key={index}
                                    className="aspect-square"
                                />
                            ))}
                        </div>
                    ) : results.data.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No images found.
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {results.data.map((image) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onClick={() => {
                                        onPick(image);
                                        onOpenChange(false);
                                    }}
                                    className="group grid gap-1 text-left"
                                >
                                    <img
                                        src={image.thumbnail_url}
                                        alt={image.alt_text ?? ''}
                                        className="aspect-square w-full rounded-md border object-cover transition group-hover:ring-2 group-hover:ring-ring"
                                    />
                                    <span className="truncate text-xs text-muted-foreground">
                                        {image.title || image.original_filename}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {results && results.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Page {results.current_page} of {results.last_page}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={results.current_page <= 1}
                                onClick={() => load(results.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    results.current_page >= results.last_page
                                }
                                onClick={() => load(results.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
