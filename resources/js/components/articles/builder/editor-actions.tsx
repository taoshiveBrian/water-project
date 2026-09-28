import type { EditorMode } from '@/components/articles/builder/article-editor';
import AlertError from '@/components/alert-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/**
 * Error summary plus the submit buttons. On create, "Save as note" stores a
 * private draft; on edit, the article keeps whatever draft status it has.
 */
export function EditorActions({
    mode,
    errors,
    processing,
    onSubmit,
    inlineErrorFields = ['title', 'subtitle', 'cover_image'],
}: {
    mode: EditorMode;
    errors: Record<string, string>;
    processing: boolean;
    onSubmit: (asNote: boolean) => void;
    inlineErrorFields?: string[];
}) {
    const messages = Object.entries(errors)
        .filter(([field]) => !inlineErrorFields.includes(field))
        .map(([, message]) => message);

    const editingNote = mode.kind === 'edit' && mode.isNote;

    return (
        <div className="grid gap-4">
            {messages.length > 0 && (
                <AlertError
                    title="This could not be saved."
                    errors={messages}
                />
            )}
            <div className="flex flex-wrap justify-end gap-2">
                {mode.kind === 'create' && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing}
                        onClick={() => onSubmit(true)}
                    >
                        Save as note
                    </Button>
                )}
                <Button
                    type="button"
                    disabled={processing}
                    onClick={() => onSubmit(editingNote)}
                >
                    {processing && <Spinner />}
                    {mode.kind === 'create'
                        ? 'Publish'
                        : editingNote
                          ? 'Save note'
                          : 'Save changes'}
                </Button>
            </div>
        </div>
    );
}
