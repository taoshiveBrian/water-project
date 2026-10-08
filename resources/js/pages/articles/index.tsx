import { Head, Link, router, usePage } from '@inertiajs/react';
import { Lock, Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { create, index, show } from '@/routes/articles';
import type { ArticleSummary, Category, Paginated } from '@/types';

type Filters = { category: string | null; author: number | null };

const ALL_AUTHORS = 'all';

/**
 * The index query for the given filters, leaving out empty ones.
 */
function filterQuery({ category, author }: Filters) {
    return {
        ...(category ? { category } : {}),
        ...(author ? { author } : {}),
    };
}

export default function ArticlesIndex({
    articles,
    filters,
    categories,
    authors,
}: {
    articles: Paginated<ArticleSummary>;
    filters: Filters;
    categories: Category[];
    authors: { id: number; name: string }[];
}) {
    const { auth } = usePage().props;
    const tabs = [
        { slug: null, name: 'All' },
        ...categories.map(({ slug, name }) => ({ slug, name })),
    ];

    const filterByAuthor = (value: string) =>
        router.get(
            index.url({
                query: filterQuery({
                    ...filters,
                    author: value === ALL_AUTHORS ? null : Number(value),
                }),
            }),
            {},
            { preserveScroll: true },
        );

    return (
        <>
            <Head title="Articles" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Articles"
                        description="Posts and guides, by category."
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

                <div className="flex flex-wrap items-center gap-4">
                    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto border-b">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.slug ?? 'all'}
                                href={index({
                                    query: filterQuery({
                                        ...filters,
                                        category: tab.slug,
                                    }),
                                })}
                                className={cn(
                                    '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap',
                                    filters.category === tab.slug
                                        ? 'border-foreground font-medium'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.name}
                            </Link>
                        ))}
                    </nav>

                    {authors.length > 1 && (
                        <Select
                            value={
                                filters.author
                                    ? String(filters.author)
                                    : ALL_AUTHORS
                            }
                            onValueChange={filterByAuthor}
                        >
                            <SelectTrigger
                                className="w-full sm:w-48"
                                aria-label="Filter by author"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_AUTHORS}>
                                    All authors
                                </SelectItem>
                                {authors.map((author) => (
                                    <SelectItem
                                        key={author.id}
                                        value={String(author.id)}
                                    >
                                        {author.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

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
                                            className="size-full object-contain"
                                        />
                                    )}
                                </div>
                                <div className="grid gap-2 p-4">
                                    <div className="flex items-center gap-2">
                                        {article.category && (
                                            <Badge variant="secondary">
                                                {article.category.name}
                                            </Badge>
                                        )}
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
