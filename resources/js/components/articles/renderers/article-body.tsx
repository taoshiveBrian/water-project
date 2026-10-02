import { ArticleRenderer } from '@/components/articles/renderers/article-renderer';
import { GuideRenderer } from '@/components/articles/renderers/guide-renderer';
import { SimpleRenderer } from '@/components/articles/renderers/simple-renderer';
import type { Article } from '@/types';

export function ArticleBody({ article }: { article: Article }) {
    switch (article.body.builder) {
        case 'simple':
            return <SimpleRenderer body={article.body} />;
        case 'v2':
            return <ArticleRenderer article={article} body={article.body} />;
        case 'v2-chapters':
            return <GuideRenderer body={article.body} />;
    }
}
