import type { GuideBuilderInitial } from '@/components/articles/builder/guide-builder-context';
import {
    postHeaderFromArticle,
    sectionsFromSaved,
} from '@/components/articles/builder/parse-article-for-edit';
import type { ScopedPoolImage } from '@/components/articles/builder/sections-scope';
import { tagCounterFor } from '@/components/articles/builder/sections-scope';
import type { Article } from '@/types';

/**
 * Rebuilds Guide editor state. Image previews use the URLs the server resolved
 * from each chapter's stored assets.
 */
export function parseGuideForEdit(article: Article): GuideBuilderInitial {
    const chapters =
        article.body.builder === 'v2-chapters' ? article.body.chapters : [];

    return {
        header: postHeaderFromArticle(article),
        chapters: chapters.map((chapter) => {
            const pool: ScopedPoolImage[] = chapter.pool.map((entry) => ({
                tag: entry.tag,
                file: null,
                preview: entry.url ?? null,
                displayMode: entry.displayMode,
                uploadKey: `${chapter.id}:${entry.tag}`,
                stored: Boolean(entry.url),
                heroFor: chapter.sections.find(
                    (section) =>
                        section.type === 'hero' &&
                        section.poolTag === entry.tag,
                )?.instanceId,
            }));

            return {
                id: chapter.id,
                heading: chapter.heading,
                ...sectionsFromSaved(chapter.sections),
                pool,
                sourceLabel: chapter.sourceLabel ?? '',
                sourceUrl: chapter.sourceUrl ?? '',
                tagCounter: tagCounterFor(pool),
            };
        }),
    };
}
