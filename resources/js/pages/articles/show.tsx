import { Head, Link } from '@inertiajs/react';
import { Lock, NotebookPen, Pencil, Trash2 } from 'lucide-react';
import { ArticleBody } from '@/components/articles/renderers/article-body';
import { GuideContentsSidebar } from '@/components/articles/renderers/guide-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { destroy, edit, index } from '@/routes/articles';
import type { Article } from '@/types';

export default function ShowArticle({
    article,
    can,
}: {
    article: Article;
    can: { update: boolean; delete: boolean };
}) {
    const guide = article.body.builder === 'v2-chapters' ? article.body : null;
    const coverUrl = article.images.cover_image?.url;

    return (
        <>
            <Head title={article.title} />
            <div
                className={cn(
                    'grid flex-1 gap-8 p-4 md:p-6',
                    guide && 'lg:grid-cols-[1fr_minmax(0,48rem)_1fr]',
                )}
            >
                {guide && (
                    <aside className="hidden lg:block">
                        <GuideContentsSidebar body={guide} />
                    </aside>
                )}

                <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {article.is_note ? (
                                <Badge variant="outline">
                                    <NotebookPen />
                                    Draft note
                                </Badge>
                            ) : (
                                article.category && (
                                    <Badge variant="secondary" asChild>
                                        <Link
                                            href={index({
                                                query: {
                                                    category:
                                                        article.category.slug,
                                                },
                                            })}
                                        >
                                            {article.category.name}
                                        </Link>
                                    </Badge>
                                )
                            )}
                            {!article.is_public && !article.is_note && (
                                <Badge variant="outline">
                                    <Lock />
                                    Members only
                                </Badge>
                            )}
                            <span>
                                {article.author.name} ·{' '}
                                {new Date(
                                    article.created_at,
                                ).toLocaleDateString()}
                            </span>
                        </div>
                        {(can.update || can.delete) && (
                            <div className="flex gap-2">
                                {can.update && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={edit(article.id)}>
                                            <Pencil />
                                            Edit
                                        </Link>
                                    </Button>
                                )}
                                {can.delete && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={destroy(article.id)}
                                            as="button"
                                            onBefore={() =>
                                                confirm(
                                                    'Delete this and all its images? This cannot be undone.',
                                                )
                                            }
                                        >
                                            <Trash2 />
                                            Delete
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {coverUrl && (
                        <img
                            src={coverUrl}
                            alt=""
                            className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-xl"
                        />
                    )}

                    <header className="grid gap-2">
                        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                            {article.title}
                        </h1>
                        {article.subtitle && (
                            <p className="text-lg text-muted-foreground">
                                {article.subtitle}
                            </p>
                        )}
                    </header>

                    <ArticleBody article={article} />
                </article>
            </div>
        </>
    );
}

ShowArticle.layout = {
    breadcrumbs: [{ title: 'Articles', href: index() }],
};
