import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Droplets, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArticleBody } from '@/components/articles/renderers/article-body';
import { GuideContentsSidebar } from '@/components/articles/renderers/guide-renderer';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard, register } from '@/routes';
import { index, show } from '@/routes/articles';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { Article } from '@/types';

type Props = {
    articles: Article[];
    canResetPassword: boolean;
    canRegister: boolean;
};

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
                <span>
                    {article.author.name} ·{' '}
                    {new Date(article.created_at).toLocaleDateString()}
                </span>
            </div>

            {coverUrl && (
                <img
                    src={coverUrl}
                    alt=""
                    className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-xl"
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

function LoginDialog({
    canResetPassword,
    canRegister,
}: Omit<Props, 'articles'>) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Log in</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Log in</DialogTitle>
                    <DialogDescription>
                        Enter your email and password to log in.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...store.form()}
                    options={{ preserveState: true, preserveScroll: true }}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>

                            {canRegister && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Don't have an account?{' '}
                                    <TextLink href={register()}>Sign up</TextLink>
                                </p>
                            )}
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function Welcome({
    articles,
    canResetPassword,
    canRegister,
}: Props) {
    const { auth } = usePage().props;
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
            <div className="min-h-screen bg-background text-foreground">
                <header className="border-b">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-600 text-white">
                                <Droplets className="size-5" />
                            </div>
                            <span className="text-xl font-semibold tracking-tight">
                                Water Comb
                            </span>
                        </div>
                        {auth.user ? (
                            <Button asChild>
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            <LoginDialog
                                canResetPassword={canResetPassword}
                                canRegister={canRegister}
                            />
                        )}
                    </div>
                </header>

                <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_minmax(0,48rem)_1fr]">
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
                </main>
            </div>
        </>
    );
}
