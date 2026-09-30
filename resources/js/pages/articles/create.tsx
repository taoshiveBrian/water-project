import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { ArticleBuilderProvider } from '@/components/articles/builder/article-builder-context';
import type { EditorMode } from '@/components/articles/builder/article-editor';
import { ArticleEditor } from '@/components/articles/builder/article-editor';
import { GuideBuilderProvider } from '@/components/articles/builder/guide-builder-context';
import { GuideEditor } from '@/components/articles/builder/guide-editor';
import { SimplePostForm } from '@/components/articles/builder/simple-post-form';
import { getTemplateConfig, templates } from '@/components/articles/templates';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { create, index, store } from '@/routes/articles';
import type { ArticleTemplate, Category } from '@/types';

function TemplatePicker({
    onPick,
}: {
    onPick: (template: ArticleTemplate) => void;
}) {
    return (
        <div className="w-full max-w-4xl">
            <Heading
                title="Choose a template"
                description="The template can't be changed after the post is created."
            />
            <div className="grid gap-4 md:grid-cols-3">
                {templates.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onPick(option.id)}
                        className="grid gap-2 rounded-xl border p-5 text-left transition-colors hover:border-ring hover:bg-muted/40"
                    >
                        <option.icon className="size-6 text-muted-foreground" />
                        <h3 className="font-medium">{option.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {option.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function CreateArticle({
    categories,
}: {
    categories: Category[];
}) {
    const [template, setTemplate] = useState<ArticleTemplate | null>(null);
    const mode: EditorMode = { kind: 'create', submitUrl: store.url() };

    return (
        <>
            <Head title="New post" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {template === null ? (
                    <TemplatePicker onPick={setTemplate} />
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTemplate(null)}
                            >
                                <ArrowLeft />
                                Templates
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {getTemplateConfig(template)?.name}
                            </span>
                        </div>

                        {template === 'simple' && (
                            <SimplePostForm
                                mode={mode}
                                categories={categories}
                            />
                        )}
                        {template === 'article' && (
                            <ArticleBuilderProvider>
                                <ArticleEditor
                                    mode={mode}
                                    categories={categories}
                                />
                            </ArticleBuilderProvider>
                        )}
                        {template === 'sectioned' && (
                            <GuideBuilderProvider>
                                <GuideEditor
                                    mode={mode}
                                    categories={categories}
                                />
                            </GuideBuilderProvider>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

CreateArticle.layout = {
    breadcrumbs: [
        { title: 'Articles', href: index() },
        { title: 'New', href: create() },
    ],
};
