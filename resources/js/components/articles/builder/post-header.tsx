import { X } from 'lucide-react';
import { useState } from 'react';
import { ImagePicker } from '@/components/articles/builder/image-picker';
import type { Previews } from '@/components/articles/builder/sections-scope';
import {
    CategoryField,
    categoryFormData,
    useCategoryChoice,
} from '@/components/articles/category-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Category, PickedImage } from '@/types';

export type PostHeaderInitial = {
    category: Category | null;
    title: string;
    isPublic: boolean;
    coverPreview: string | null;
};

export const emptyPostHeader: PostHeaderInitial = {
    category: null,
    title: '',
    isPublic: true,
    coverPreview: null,
};

/**
 * Fields every template shares: category, title, visibility, and the cover image.
 */
export function usePostHeader(initial: PostHeaderInitial, previews: Previews) {
    const category = useCategoryChoice(initial.category);
    const [title, setTitle] = useState(initial.title);
    const [isPublic, setIsPublic] = useState(initial.isPublic);
    const [cover, setCover] = useState<{
        file: File | null;
        preview: string | null;
        pickedAssetId?: number;
    }>({ file: null, preview: initial.coverPreview });

    const setCoverFile = (file: File | null) => {
        previews.release(cover.preview);
        setCover({ file, preview: file ? previews.create(file) : null });
    };

    const setCoverAsset = (image: PickedImage) => {
        previews.release(cover.preview);
        setCover({ file: null, preview: image.url, pickedAssetId: image.id });
    };

    return {
        category,
        title,
        setTitle,
        isPublic,
        setIsPublic,
        cover,
        setCoverFile,
        setCoverAsset,
    };
}

export type PostHeader = ReturnType<typeof usePostHeader>;

/**
 * The header card at the top of every editor. Drafts hide visibility; it is
 * chosen when the draft is published from the Notes page.
 */
export function PostHeaderCard({
    header,
    categories,
    isNote,
    errors,
    subtitle,
}: {
    header: PostHeader;
    categories: Category[];
    isNote: boolean;
    errors: Record<string, string>;
    subtitle?: { value: string; onChange: (value: string) => void };
}) {
    return (
        <section className="grid gap-5 rounded-xl border p-4 md:p-5">
            {isNote && (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    This is a draft note. Publish it from the Notes page to
                    choose its visibility.
                </p>
            )}
            <div className="flex flex-wrap items-start gap-4">
                <CategoryField
                    choice={header.category}
                    categories={categories}
                    errors={errors}
                />
                {!isNote && (
                    <div className="grid gap-2">
                        <Label>Visibility</Label>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={header.isPublic ? 'public' : 'members'}
                            onValueChange={(value) =>
                                value && header.setIsPublic(value === 'public')
                            }
                        >
                            <ToggleGroupItem value="public" className="px-3">
                                Public
                            </ToggleGroupItem>
                            <ToggleGroupItem value="members" className="px-3">
                                Members only
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="article-title">Title</Label>
                <Input
                    id="article-title"
                    value={header.title}
                    onChange={(event) => header.setTitle(event.target.value)}
                    placeholder="Headline"
                    className="h-12 text-lg font-medium"
                    maxLength={255}
                    required
                />
                <InputError message={errors.title} />
            </div>

            {subtitle && (
                <div className="grid gap-2">
                    <Label htmlFor="article-subtitle">Subtitle</Label>
                    <Input
                        id="article-subtitle"
                        value={subtitle.value}
                        onChange={(event) =>
                            subtitle.onChange(event.target.value)
                        }
                        placeholder="Optional"
                        maxLength={255}
                    />
                    <InputError message={errors.subtitle} />
                </div>
            )}

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label>Cover image</Label>
                    {header.cover.preview && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => header.setCoverFile(null)}
                        >
                            <X />
                            Remove
                        </Button>
                    )}
                </div>
                <ImagePicker
                    preview={header.cover.preview}
                    onSelect={header.setCoverFile}
                    onPickAsset={header.setCoverAsset}
                    label="Optional: choose a cover image"
                    className="aspect-[21/9] w-full"
                />
                <InputError message={errors.cover_image} />
            </div>
        </section>
    );
}

/**
 * The header's form fields. A missing cover file means "unchanged" on the server.
 */
export function postHeaderFormData(
    header: PostHeader,
): Record<string, string | File> {
    const data: Record<string, string | File> = {
        ...categoryFormData(header.category),
        title: header.title,
        is_public: header.isPublic ? '1' : '0',
    };

    if (header.cover.file) {
        data.cover_image = header.cover.file;
    } else if (header.cover.pickedAssetId) {
        data.cover_image_asset_id = String(header.cover.pickedAssetId);
    }

    return data;
}
