import { useState } from 'react';
import type { EditorMode } from '@/components/articles/builder/article-editor';
import { EditorActions } from '@/components/articles/builder/editor-actions';
import type { PostHeaderInitial } from '@/components/articles/builder/post-header';
import {
    emptyPostHeader,
    PostHeaderCard,
    postHeaderFormData,
    usePostHeader,
} from '@/components/articles/builder/post-header';
import { usePreviews } from '@/components/articles/builder/sections-scope';
import type { ArticleFormData } from '@/components/articles/builder/use-article-submit';
import { useArticleSubmit } from '@/components/articles/builder/use-article-submit';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types';

export type SimplePostInitial = {
    header: PostHeaderInitial;
    subtitle: string;
    text: string;
    text2: string;
};

const textareaClassName =
    'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function SimplePostForm({
    mode,
    categories,
    initial = { header: emptyPostHeader, subtitle: '', text: '', text2: '' },
    onBeforeSubmit,
}: {
    mode: EditorMode;
    categories: Category[];
    initial?: SimplePostInitial;
    onBeforeSubmit?: (
        data: ArticleFormData,
        state: { coverPreview: string | null },
    ) => void;
}) {
    const previews = usePreviews();
    const header = usePostHeader(initial.header, previews);
    const [subtitle, setSubtitle] = useState(initial.subtitle);
    const [text, setText] = useState(initial.text);
    const [text2, setText2] = useState(initial.text2);
    const { submit, errors, processing } = useArticleSubmit();
    const isNote = mode.kind === 'edit' && mode.isNote;

    const handleSubmit = (asNote: boolean) => {
        const data: ArticleFormData = {
            ...postHeaderFormData(header),
            template: 'simple',
            is_note: asNote ? '1' : '0',
            subtitle,
            body: JSON.stringify({ builder: 'simple', text, text2 }),
        };

        onBeforeSubmit?.(data, { coverPreview: header.cover.preview });

        submit(mode.submitUrl, mode.kind === 'edit' ? 'put' : 'post', data);
    };

    return (
        <div className="flex w-full max-w-4xl flex-col gap-6">
            <PostHeaderCard
                header={header}
                categories={categories}
                isNote={isNote}
                errors={errors}
                subtitle={{ value: subtitle, onChange: setSubtitle }}
            />

            <section className="grid gap-5 rounded-xl border p-4 md:p-5">
                <div className="grid gap-2">
                    <Label htmlFor="simple-text">Text</Label>
                    <textarea
                        id="simple-text"
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        rows={10}
                        placeholder="Write your post…"
                        className={textareaClassName}
                        required
                    />
                    <InputError message={errors['body.text']} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="simple-text2">Additional text</Label>
                    <textarea
                        id="simple-text2"
                        value={text2}
                        onChange={(event) => setText2(event.target.value)}
                        rows={5}
                        placeholder="Optional. Shown after a divider."
                        className={textareaClassName}
                    />
                    <InputError message={errors['body.text2']} />
                </div>
            </section>

            <EditorActions
                mode={mode}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                inlineErrorFields={[
                    'title',
                    'subtitle',
                    'cover_image',
                    'body.text',
                    'body.text2',
                ]}
            />
        </div>
    );
}
