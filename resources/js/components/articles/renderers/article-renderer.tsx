import type { TagImages } from '@/components/articles/renderers/render-sections';
import { RenderSections } from '@/components/articles/renderers/render-sections';
import type { Article, ArticleLayoutBody } from '@/types';

/**
 * Tag → image from the pool and the article's live image columns. Tags whose slot
 * has no image are left out, so their markers render as nothing.
 */
function tagImages(article: Article, body: ArticleLayoutBody): TagImages {
    const images: TagImages = new Map();

    for (const entry of body.pool) {
        const image = article.images[entry.field];

        if (image?.url) {
            images.set(entry.tag, {
                url: image.url,
                displayMode: image.display ?? entry.displayMode,
            });
        }
    }

    return images;
}

export function ArticleRenderer({
    article,
    body,
}: {
    article: Article;
    body: ArticleLayoutBody;
}) {
    return (
        <div className="grid gap-6">
            <RenderSections
                sections={body.sections}
                images={tagImages(article, body)}
                source={{
                    label: article.source_label,
                    url: article.source_url,
                }}
            />
        </div>
    );
}
