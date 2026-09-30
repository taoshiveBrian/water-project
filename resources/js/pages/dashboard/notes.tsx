import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    CategoryField,
    categoryFormData,
    useCategoryChoice,
} from '@/components/articles/category-field';
import { getTemplateConfig } from '@/components/articles/templates';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { dashboard } from '@/routes';
import { create, destroy, edit, publish } from '@/routes/articles';
import { notes as notesRoute } from '@/routes/dashboard';
import type { Category, NoteSummary } from '@/types';

function PublishDialog({
    note,
    categories,
    onClose,
}: {
    note: NoteSummary | null;
    categories: Category[];
    onClose: () => void;
}) {
    const category = useCategoryChoice(note?.category ?? null);
    const [isPublic, setIsPublic] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = () => {
        if (!note) {
            return;
        }

        router.post(
            publish.url(note.id),
            { ...categoryFormData(category), is_public: isPublic },
            {
                onStart: () => setProcessing(true),
                onError: (validationErrors) =>
                    setErrors(validationErrors as Record<string, string>),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog
            open={note !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Make into a post</DialogTitle>
                    <DialogDescription>
                        “{note?.title}” will be published with these settings.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <CategoryField
                        choice={category}
                        categories={categories}
                        errors={errors}
                    />
                    <div className="grid gap-2">
                        <Label>Visibility</Label>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={isPublic ? 'public' : 'members'}
                            onValueChange={(value) =>
                                value && setIsPublic(value === 'public')
                            }
                            className="justify-start"
                        >
                            <ToggleGroupItem value="public" className="px-3">
                                Public
                            </ToggleGroupItem>
                            <ToggleGroupItem value="members" className="px-3">
                                Members only
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={processing}>
                        Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Notes({
    notes,
    categories,
}: {
    notes: NoteSummary[];
    categories: Category[];
}) {
    const [publishing, setPublishing] = useState<NoteSummary | null>(null);

    return (
        <>
            <Head title="Notes" />
            <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Notes"
                        description="Private drafts of any template. Only you can see them until they're published."
                    />
                    <Button asChild>
                        <Link href={create()}>New post or note</Link>
                    </Button>
                </div>

                {notes.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        No drafts. Use “Save as note” in the editor to keep one
                        here.
                    </p>
                ) : (
                    <ul className="divide-y rounded-xl border">
                        {notes.map((note) => (
                            <li
                                key={note.id}
                                className="flex flex-wrap items-center justify-between gap-3 p-4"
                            >
                                <div className="grid gap-0.5">
                                    <span className="font-medium">
                                        {note.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {getTemplateConfig(note.template)?.name}{' '}
                                        {note.category &&
                                            `· ${note.category.name} `}
                                        · edited{' '}
                                        {new Date(
                                            note.updated_at,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={edit(note.id)}>
                                            <Pencil />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setPublishing(note)}
                                    >
                                        <Send />
                                        Make into a post
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={destroy(note.id)}
                                            as="button"
                                            onBefore={() =>
                                                confirm(
                                                    'Delete this draft and its images?',
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </Link>
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <PublishDialog
                key={publishing?.id ?? 'closed'}
                note={publishing}
                categories={categories}
                onClose={() => setPublishing(null)}
            />
        </>
    );
}

Notes.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notes', href: notesRoute() },
    ],
};
