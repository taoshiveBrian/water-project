import { Head } from '@inertiajs/react';
import {
    ArticleBuilderProvider,
    POOL_FIELDS,
} from '@/components/articles/builder/article-builder-context';
import type { EditorMode } from '@/components/articles/builder/article-editor';
import { ArticleEditor } from '@/components/articles/builder/article-editor';
import { GuideBuilderProvider } from '@/components/articles/builder/guide-builder-context';
import { GuideEditor } from '@/components/articles/builder/guide-editor';
import {
    parseArticleForEdit,
    postHeaderFromArticle,
} from '@/components/articles/builder/parse-article-for-edit';
import { parseGuideForEdit } from '@/components/articles/builder/parse-guide-for-edit';
import type { ScopedPoolImage } from '@/components/articles/builder/sections-scope';
import { SimplePostForm } from '@/components/articles/builder/simple-post-form';
import type { ArticleFormData } from '@/components/articles/builder/use-article-submit';
import { index, update } from '@/routes/articles';
import type { Article, Category } from '@/types';

export default function EditArticle({
    article,
    categories,
}: {
    article: Article;
    categories: Category[];
}) {
    const mode: EditorMode = {
        kind: 'edit',
        submitUrl: update.url(article.id),
        isNote: article.is_note,
    };

    /**
     * An absent file means "unchanged", so a removed cover needs a clear flag.
     */
    const clearCover = (
        data: ArticleFormData,
        { coverPreview }: { coverPreview: string | null },
    ) => {
        if (article.images.cover_image.url && !coverPreview) {
            data.clear_cover_image = '1';
        }
    };

    /**
     * Article pool images live in fixed columns: clear any column that had an image
     * and is no longer used by a slot holding one.
     */
    const clearArticleImages = (
        data: ArticleFormData,
        state: { coverPreview: string | null; pool: ScopedPoolImage[] },
    ) => {
        clearCover(data, state);

        for (const field of POOL_FIELDS) {
            const stillUsed = state.pool.some(
                (image) =>
                    image.field === field && (image.file || image.preview),
            );

            if (article.images[field].url && !stillUsed) {
                data[`clear_${field}`] = '1';
            }
        }
    };

    return (
        <>
            <Head title={`Edit: ${article.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {article.template === 'simple' &&
                    article.body.builder === 'simple' && (
                        <SimplePostForm
                            mode={mode}
                            categories={categories}
                            initial={{
                                header: postHeaderFromArticle(article),
                                subtitle: article.subtitle ?? '',
                                text: article.body.text,
                                text2: article.body.text2 ?? '',
                            }}
                            onBeforeSubmit={clearCover}
                        />
                    )}
                {article.template === 'article' && (
                    <ArticleBuilderProvider
                        initial={parseArticleForEdit(article)}
                    >
                        <ArticleEditor
                            mode={mode}
                            categories={categories}
                            onBeforeSubmit={clearArticleImages}
                        />
                    </ArticleBuilderProvider>
                )}
                {article.template === 'sectioned' && (
                    <GuideBuilderProvider initial={parseGuideForEdit(article)}>
                        <GuideEditor
                            mode={mode}
                            categories={categories}
                            onBeforeSubmit={clearCover}
                        />
                    </GuideBuilderProvider>
                )}
            </div>
        </>
    );
}

EditArticle.layout = {
    breadcrumbs: [{ title: 'Articles', href: index() }],
};
