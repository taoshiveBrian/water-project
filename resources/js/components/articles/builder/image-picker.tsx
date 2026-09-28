import { ImagePlus, Library } from 'lucide-react';
import { useId, useState } from 'react';
import { MediaPickerDialog } from '@/components/media/media-picker-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PickedImage } from '@/types';

/**
 * A click-to-choose image input with a preview, plus an optional "choose from
 * library" button. Replacing the image is just choosing again; removal is
 * handled by the caller.
 */
export function ImagePicker({
    preview,
    onSelect,
    onPickAsset,
    label = 'Choose an image',
    className,
}: {
    preview: string | null;
    onSelect: (file: File) => void;
    onPickAsset?: (image: PickedImage) => void;
    label?: string;
    className?: string;
}) {
    const id = useId();
    const [libraryOpen, setLibraryOpen] = useState(false);

    return (
        <div className="grid gap-1.5">
            <label
                htmlFor={id}
                className={cn(
                    'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 text-sm text-muted-foreground transition-colors hover:border-ring',
                    className,
                )}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                        />
                        <span className="relative rounded-md bg-background/85 px-2 py-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            Replace image
                        </span>
                    </>
                ) : (
                    <span className="flex flex-col items-center gap-2 p-4">
                        <ImagePlus className="size-6" />
                        {label}
                    </span>
                )}
                <input
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            onSelect(file);
                        }

                        event.target.value = '';
                    }}
                />
            </label>
            {onPickAsset && (
                <>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-start"
                        onClick={() => setLibraryOpen(true)}
                    >
                        <Library />
                        Choose from library
                    </Button>
                    <MediaPickerDialog
                        open={libraryOpen}
                        onOpenChange={setLibraryOpen}
                        onPick={onPickAsset}
                    />
                </>
            )}
        </div>
    );
}
