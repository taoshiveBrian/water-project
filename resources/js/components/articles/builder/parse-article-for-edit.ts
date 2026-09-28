import type { ArticleBuilderInitial } from '@/components/articles/builder/article-builder-context';
import { POOL_FIELDS } from '@/components/articles/builder/article-builder-context';
import type { PostHeaderInitial } from '@/components/articles/builder/post-header';
import type {
    ScopedPoolImage,
    SectionInstance,
} from '@/components/articles/builder/sections-scope';
import { tagCounterFor } from '@/components/articles/builder/sections-scope';
import { SECTIONS } from '@/components/articles/builder/add-section';
import type { Article, ArticleSection } from '@/types';

const KNOWN_SECTION_TYPES = new Set(SECTIONS.map((section) => section.id));

export function postHeaderFromArticle(article: Article): PostHeaderInitial {
    return {
        type: article.type,
        title: article.title,
        isPublic: article.is_public,
        coverPreview: article.images.cover_image?.url ?? null,
    };
}

/**
 * Section instances and contents from saved sections. Drops legacy entries
 * (such as the old `cover` section) that the editor no longer offers.
 */
export function sectionsFromSaved(saved: ArticleSection[]): {
    sections: SectionInstance[];
    sectionContents: Record<string, string>;
} {
    const kept = saved.filter((section) =>
        KNOWN_SECTION_TYPES.has(section.type),
    );

    return {
        sections: kept.map(({ type, instanceId }) => ({ type, instanceId })),
        sectionContents: Object.fromEntries(
            kept
                .filter(
                    (section) =>
                        section.type === 'text' || section.type === 'columns',
                )
                .map((section) => [section.instanceId, section.content ?? '']),
        ),
    };
}

/**
 * Rebuilds Article editor state. Pool entries keep their original column, and the
 * tag counter starts past the highest saved tag.
 */
export function parseArticleForEdit(article: Article): ArticleBuilderInitial {
    const body = article.body.builder === 'v2' ? article.body : null;
    const saved = sectionsFromSaved(body?.sections ?? []);

    const pool: ScopedPoolImage[] = (body?.pool ?? [])
        .filter((entry) => POOL_FIELDS.includes(entry.field))
        .map((entry) => {
            const image = article.images[entry.field];

            return {
                tag: entry.tag,
                field: entry.field,
                file: null,
                preview: image?.url ?? null,
                displayMode: image?.display ?? entry.displayMode,
                heroFor: body?.sections.find(
                    (section) =>
                        section.type === 'hero' &&
                        section.poolTag === entry.tag,
                )?.instanceId,
            };
        });

    return {
        header: postHeaderFromArticle(article),
        sectionsData: {
            ...saved,
            pool,
            sourceLabel: article.source_label ?? '',
            sourceUrl: article.source_url ?? '',
            tagCounter: tagCounterFor(pool),
        },
    };
}
