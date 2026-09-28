import { Head, Link, usePage } from '@inertiajs/react';
import { Lock, Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { create, index, show } from '@/routes/articles';
import type {
    ArticleSummary,
    ArticleType,
    ArticleTypeOption,
    Paginated,
} from '@/types';

export default function ArticlesIndex({
    articles,
    filters,
    types,
}: {
    articles: Paginated<ArticleSummary>;
    filters: { type: ArticleType | null };
    types: ArticleTypeOption[];
}) {
    const { auth } = usePage().props;
    const tabs = [{ value: null, label: 'All' }, ...types];

    return (
        <>
            <Head title="Articles" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Articles"
                        description="Posts and tutorials."
                    />
                    {auth.user && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus />
                                New article
                            </Link>
                        </Button>
                    )}
                </div>

                <nav className="flex gap-1 border-b">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.label}
                            href={index({
                                query: tab.value ? { type: tab.value } : {},
                            })}
                            className={cn(
                                '-mb-px border-b-2 px-3 py-2 text-sm',
                                filters.type === tab.value
                                    ? 'border-foreground font-medium'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>

                {articles.data.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        No articles yet.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.data.map((article) => (
                            <Link
                                key={article.id}
                                href={show(article.id)}
                                className="group overflow-hidden rounded-xl border transition-colors hover:border-ring"
                            >
                                <div className="aspect-video bg-muted">
                                    {article.cover_image_url && (
                                        <img
                                            src={article.cover_image_url}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="grid gap-2 p-4">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {article.type}
                                        </Badge>
                                        {!article.is_public && (
                                            <Badge variant="outline">
                                                <Lock />
                                                Members only
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="font-medium group-hover:underline">
                                        {article.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {article.author} ·{' '}
                                        {new Date(
                                            article.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {articles.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Page {articles.current_page} of {articles.last_page}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!articles.prev_page_url}
                                asChild={!!articles.prev_page_url}
                            >
                                {articles.prev_page_url ? (
                                    <Link href={articles.prev_page_url}>
                                        Previous
                                    </Link>
                                ) : (
                                    'Previous'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!articles.next_page_url}
                                asChild={!!articles.next_page_url}
                            >
                                {articles.next_page_url ? (
                                    <Link href={articles.next_page_url}>
                                        Next
                                    </Link>
                                ) : (
                                    'Next'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

ArticlesIndex.layout = {
    breadcrumbs: [{ title: 'Articles', href: index() }],
};
