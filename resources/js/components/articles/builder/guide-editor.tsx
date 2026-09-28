import { Plus, Trash2 } from 'lucide-react';
import type { EditorMode } from '@/components/articles/builder/article-editor';
import { EditorActions } from '@/components/articles/builder/editor-actions';
import type { ChapterState } from '@/components/articles/builder/guide-builder-context';
import {
    ChapterScopeProvider,
    useGuideBuilder,
} from '@/components/articles/builder/guide-builder-context';
import {
    PostHeaderCard,
    postHeaderFormData,
} from '@/components/articles/builder/post-header';
import {
    SectionsEditor,
    sectionsPayload,
} from '@/components/articles/builder/sections-editor';
import type { ArticleFormData } from '@/components/articles/builder/use-article-submit';
import { useArticleSubmit } from '@/components/articles/builder/use-article-submit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ArticleTypeOption } from '@/types';

/**
 * One chapter as sent to the server. A pool entry names its upload only when it
 * has a new file, names a library image when one was picked, and sends `cleared`
 * when a saved image was taken away but the slot kept. Otherwise the server keeps
 * the stored image.
 */
function chapterPayload(chapter: ChapterState) {
    return {
        id: chapter.id,
        heading: chapter.heading,
        sourceLabel: chapter.sourceLabel,
        sourceUrl: chapter.sourceUrl,
        sections: sectionsPayload(
            chapter.sections,
            chapter.sectionContents,
            chapter.pool,
        ),
        pool: chapter.pool.map((image) => ({
            tag: image.tag,
            displayMode: image.displayMode,
            ...(image.file ? { uploadKey: image.uploadKey } : {}),
            ...(!image.file && image.pickedAssetId
                ? { pickedAssetId: image.pickedAssetId }
                : {}),
            ...(image.stored && !image.file && !image.preview
                ? { cleared: true }
                : {}),
        })),
    };
}

export function GuideEditor({
    mode,
    types,
    onBeforeSubmit,
}: {
    mode: EditorMode;
    types: ArticleTypeOption[];
    onBeforeSubmit?: (
        data: ArticleFormData,
        state: { coverPreview: string | null },
    ) => void;
}) {
    const { header, chapters, addChapter, removeChapter, updateChapter } =
        useGuideBuilder();
    const { submit, errors, processing } = useArticleSubmit();
    const isNote = mode.kind === 'edit' && mode.isNote;

    const handleSubmit = (asNote: boolean) => {
        const data: ArticleFormData = {
            ...postHeaderFormData(header),
            template: 'sectioned',
            is_note: asNote ? '1' : '0',
            body: JSON.stringify({
                builder: 'v2-chapters',
                chapters: chapters.map(chapterPayload),
            }),
        };

        for (const chapter of chapters) {
            for (const image of chapter.pool) {
                if (image.file && image.uploadKey) {
                    data[`chapter_images[${image.uploadKey}]`] = image.file;
                }
            }
        }

        onBeforeSubmit?.(data, { coverPreview: header.cover.preview });

        submit(mode.submitUrl, mode.kind === 'edit' ? 'put' : 'post', data);
    };

    return (
        <div className="flex w-full max-w-4xl flex-col gap-6">
            <PostHeaderCard
                header={header}
                types={types}
                isNote={isNote}
                errors={errors}
            />

            {chapters.map((chapter, index) => (
                <section
                    key={chapter.id}
                    className="grid gap-4 rounded-xl border-2 p-4 md:p-5"
                >
                    <div className="flex items-end gap-3">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor={`${chapter.id}-heading`}>
                                Chapter {index + 1} heading
                            </Label>
                            <Input
                                id={`${chapter.id}-heading`}
                                value={chapter.heading}
                                onChange={(event) =>
                                    updateChapter(chapter.id, {
                                        heading: event.target.value,
                                    })
                                }
                                placeholder="What this chapter covers"
                                maxLength={255}
                                required
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={chapters.length <= 1}
                            onClick={() => removeChapter(chapter.id)}
                            title="Remove chapter and its images"
                        >
                            <Trash2 />
                        </Button>
                    </div>
                    <ChapterScopeProvider chapter={chapter}>
                        <SectionsEditor />
                    </ChapterScopeProvider>
                </section>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addChapter}
                className="self-start"
            >
                <Plus />
                Add chapter
            </Button>

            <EditorActions
                mode={mode}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
