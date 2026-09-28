import { Plus, Trash2 } from 'lucide-react';
import { ImagePicker } from '@/components/articles/builder/image-picker';
import { useSectionsScope } from '@/components/articles/builder/sections-scope';
import { displayModeLabels } from '@/components/articles/inline-images';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { DisplayMode } from '@/types';

/**
 * Images that can be placed inline in Columns sections by tag. Hero images are
 * managed by their own sections but count toward a capped pool.
 */
export function ImagePool() {
    const {
        pool,
        poolCap,
        addPoolSlot,
        setPoolFile,
        setPoolAsset,
        setPoolDisplayMode,
        removePoolImage,
    } = useSectionsScope();
    const taggable = pool.filter((image) => !image.heroFor);
    const isFull = poolCap !== null && pool.length >= poolCap;

    return (
        <section className="grid gap-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="font-medium">Image pool</h3>
                    <p className="text-sm text-muted-foreground">
                        {poolCap === null
                            ? 'Add images, then place them in Columns sections with “Insert image”.'
                            : `${pool.length} of ${poolCap} image slots used${
                                  pool.length > taggable.length
                                      ? ` (${pool.length - taggable.length} by hero images)`
                                      : ''
                              }.`}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPoolSlot}
                    disabled={isFull}
                >
                    <Plus />
                    Add image
                </Button>
            </div>

            {taggable.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {taggable.map((image) => (
                        <div key={image.tag} className="grid gap-2">
                            <ImagePicker
                                preview={image.preview}
                                onSelect={(file) =>
                                    setPoolFile(image.tag, file)
                                }
                                onPickAsset={(picked) =>
                                    setPoolAsset(image.tag, picked)
                                }
                                className="aspect-video"
                            />
                            <div className="flex items-center gap-2">
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                    [{image.tag}]
                                </code>
                                <Select
                                    value={image.displayMode}
                                    onValueChange={(value) =>
                                        setPoolDisplayMode(
                                            image.tag,
                                            value as DisplayMode,
                                        )
                                    }
                                >
                                    <SelectTrigger size="sm" className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(displayModeLabels).map(
                                            ([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePoolImage(image.tag)}
                                    title="Remove image and its inline tags"
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
