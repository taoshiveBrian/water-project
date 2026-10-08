import { Head, Link } from '@inertiajs/react';
import { AuthorByline } from '@/components/articles/author-byline';
import { Badge } from '@/components/ui/badge';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { cn, pixelated } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show } from '@/routes/articles';
import type { ArticleSummary } from '@/types';

const cardClassName =
    'relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border';

function LatestArticleCard({ article }: { article: ArticleSummary }) {
    return (
        <Link
            href={show(article.id)}
            className={`${cardClassName} group flex flex-col bg-muted transition-colors hover:border-ring`}
        >
            {article.cover_image_url ? (
                <img
                    src={article.cover_image_url}
                    alt=""
                    className={cn(
                        'absolute inset-0 size-full object-contain',
                        pixelated(article.cover_image_pixelated),
                    )}
                />
            ) : (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            )}
            <div className="relative mt-auto grid gap-1 bg-background/90 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {article.category && (
                        <Badge variant="secondary">
                            {article.category.name}
                        </Badge>
                    )}
                    <AuthorByline
                        author={article.author}
                        date={article.created_at}
                        className="min-w-0 truncate"
                    />
                </div>
                <h3 className="line-clamp-2 font-medium group-hover:underline">
                    {article.title}
                </h3>
            </div>
        </Link>
    );
}

export default function Dashboard({
    latestArticles,
}: {
    latestArticles: ArticleSummary[];
}) {
    const emptySlots = Math.max(0, 3 - latestArticles.length);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {latestArticles.map((article) => (
                        <LatestArticleCard key={article.id} article={article} />
                    ))}
                    {Array.from({ length: emptySlots }, (_, index) => (
                        <div key={index} className={cardClassName}>
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    ))}
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
