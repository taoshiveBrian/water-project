import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { dashboard } from '@/routes';
import { create, destroy, edit, publish } from '@/routes/articles';
import { notes as notesRoute } from '@/routes/dashboard';
import type { ArticleType, ArticleTypeOption, NoteSummary } from '@/types';

function PublishDialog({
    note,
    types,
    onClose,
}: {
    note: NoteSummary | null;
    types: ArticleTypeOption[];
    onClose: () => void;
}) {
    const [type, setType] = useState<ArticleType>('post');
    const [isPublic, setIsPublic] = useState(true);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        if (!note) {
            return;
        }

        router.post(
            publish.url(note.id),
            { type, is_public: isPublic },
            {
                onStart: () => setProcessing(true),
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
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select
                            value={type}
                            onValueChange={(value) =>
                                setType(value as ArticleType)
                            }
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
    types,
}: {
    notes: NoteSummary[];
    types: ArticleTypeOption[];
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
                types={types}
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
