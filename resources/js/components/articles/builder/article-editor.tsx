import { useArticleBuilder } from '@/components/articles/builder/article-builder-context';
import { EditorActions } from '@/components/articles/builder/editor-actions';
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
import type { ScopedPoolImage } from '@/components/articles/builder/sections-scope';
import type { ArticleLayoutBody, Category, PoolField } from '@/types';

export type EditorMode =
    | { kind: 'create'; submitUrl: string }
    | { kind: 'edit'; submitUrl: string; isNote: boolean };

/**
 * The Article editor, shared by create and edit. A pool image's file is sent under
 * its fixed column name only when newly chosen.
 */
export function ArticleEditor({
    mode,
    categories,
    onBeforeSubmit,
}: {
    mode: EditorMode;
    categories: Category[];
    onBeforeSubmit?: (
        data: ArticleFormData,
        state: { coverPreview: string | null; pool: ScopedPoolImage[] },
    ) => void;
}) {
    const { header, sectionsData } = useArticleBuilder();
    const { submit, errors, processing } = useArticleSubmit();
    const { sections, sectionContents, pool } = sectionsData;
    const isNote = mode.kind === 'edit' && mode.isNote;

    const handleSubmit = (asNote: boolean) => {
        const body: ArticleLayoutBody = {
            builder: 'v2',
            sections: sectionsPayload(sections, sectionContents, pool),
            pool: pool.map((image) => ({
                tag: image.tag,
                field: image.field as PoolField,
                displayMode: image.displayMode,
            })),
        };

        const data: ArticleFormData = {
            ...postHeaderFormData(header),
            template: 'article',
            is_note: asNote ? '1' : '0',
            source_label: sectionsData.sourceLabel,
            source_url: sectionsData.sourceUrl,
            body: JSON.stringify(body),
        };

        for (const image of pool) {
            if (image.field && image.file) {
                data[image.field] = image.file;
            } else if (image.field && image.pickedAssetId) {
                data[`${image.field}_asset_id`] = String(image.pickedAssetId);
            }

            if (image.field) {
                data[`${image.field}_display`] = image.displayMode;
            }
        }

        onBeforeSubmit?.(data, { coverPreview: header.cover.preview, pool });

        submit(mode.submitUrl, mode.kind === 'edit' ? 'put' : 'post', data);
    };

    return (
        <div className="flex w-full max-w-4xl flex-col gap-6">
            <PostHeaderCard
                header={header}
                categories={categories}
                isNote={isNote}
                errors={errors}
            />
            <SectionsEditor />
            <EditorActions
                mode={mode}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
