import { Head, Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AuthorByline } from '@/components/articles/author-byline';
import { ArticleBody } from '@/components/articles/renderers/article-body';
import { GuideContentsSidebar } from '@/components/articles/renderers/guide-renderer';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { cn, pixelated } from '@/lib/utils';
import { index, show } from '@/routes/articles';
import type { Article } from '@/types';

function FeedArticle({ article }: { article: Article }) {
    const coverUrl = article.images.cover_image?.url;

    return (
        <article
            data-article-id={article.id}
            className="flex flex-col gap-6 py-10 first:pt-0"
        >
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {article.category && (
                    <Badge variant="secondary">{article.category.name}</Badge>
                )}
                {!article.is_public && (
                    <Badge variant="outline">
                        <Lock />
                        Members only
                    </Badge>
                )}
                <AuthorByline
                    author={article.author}
                    date={article.created_at}
                />
            </div>

            {coverUrl && (
                <img
                    src={coverUrl}
                    alt=""
                    className={cn(
                        'mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-xl',
                        pixelated(article.images.cover_image?.pixelated),
                    )}
                />
            )}

            <header className="grid gap-2">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    <Link href={show(article.id)} className="hover:underline">
                        {article.title}
                    </Link>
                </h2>
                {article.subtitle && (
                    <p className="text-lg text-muted-foreground">
                        {article.subtitle}
                    </p>
                )}
            </header>

            <ArticleBody article={article} />
        </article>
    );
}

export default function Welcome({ articles }: { articles: Article[] }) {
    const feedRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<number | null>(null);

    // The article crossing the middle of the viewport is the active one.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = Number(
                        (entry.target as HTMLElement).dataset.articleId,
                    );

                    setActiveId((current) =>
                        entry.isIntersecting
                            ? id
                            : current === id
                              ? null
                              : current,
                    );
                }
            },
            { rootMargin: '-50% 0px -50% 0px' },
        );

        feedRef.current
            ?.querySelectorAll('[data-article-id]')
            .forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, [articles]);

    const active = articles.find((article) => article.id === activeId);
    const guide =
        active?.body.builder === 'v2-chapters'
            ? { id: active.id, body: active.body }
            : null;

    return (
        <>
            <Head title="Welcome" />
            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_minmax(0,48rem)_1fr]">
                <aside className="hidden lg:block">
                    {guide && (
                        <div
                            key={guide.id}
                            className="h-full animate-in duration-300 fade-in"
                        >
                            <GuideContentsSidebar body={guide.body} />
                        </div>
                    )}
                </aside>

                <div className="flex flex-col gap-6">
                    <div className="flex items-baseline justify-between gap-4">
                        <h1 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                            Latest articles
                        </h1>
                        <TextLink href={index()} className="text-sm">
                            View all
                        </TextLink>
                    </div>

                    {articles.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            No articles yet.
                        </p>
                    ) : (
                        <div ref={feedRef} className="flex flex-col divide-y">
                            {articles.map((article) => (
                                <FeedArticle
                                    key={article.id}
                                    article={article}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
