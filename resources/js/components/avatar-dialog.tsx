import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import AvatarController from '@/actions/App/Http/Controllers/Settings/AvatarController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export type AvatarChoice = { id: number; url: string; pixelated: boolean };

/**
 * Upload a private avatar or pick a shared one. Shared choices load when it opens.
 */
export function AvatarDialog({
    currentId,
    choices,
}: {
    currentId: number | null;
    choices: AvatarChoice[] | undefined;
}) {
    const [open, setOpen] = useState(false);
    const [chooseError, setChooseError] = useState<string>();

    const onOpenChange = (next: boolean) => {
        setOpen(next);
        setChooseError(undefined);

        if (next) {
            router.reload({ only: ['avatarChoices'] });
        }
    };

    const choose = (id: number) =>
        router.put(
            AvatarController.choose.url(),
            { asset_id: id },
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
                onError: (errors) => setChooseError(errors.asset_id),
            },
        );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Change avatar</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change avatar</DialogTitle>
                    <DialogDescription>
                        Choose one of ours, or upload your own. It's shown next
                        to your name on your articles. Only you can use an
                        avatar you upload.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    <Label>Choose an avatar</Label>
                    {choices === undefined ? (
                        <Spinner />
                    ) : choices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No avatars to choose from yet.
                        </p>
                    ) : (
                        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto p-1">
                            {choices.map((choice) => (
                                <button
                                    key={choice.id}
                                    type="button"
                                    aria-label="Use this avatar"
                                    aria-pressed={currentId === choice.id}
                                    onClick={() => choose(choice.id)}
                                    className={cn(
                                        'size-14 overflow-hidden rounded-full ring-offset-2 ring-offset-background outline-none hover:ring-2 hover:ring-ring/50 focus-visible:ring-2 focus-visible:ring-ring',
                                        currentId === choice.id &&
                                            'ring-2 ring-foreground hover:ring-foreground',
                                    )}
                                >
                                    <img
                                        src={choice.url}
                                        alt=""
                                        className={cn(
                                            'size-full object-cover',
                                            choice.pixelated &&
                                                '[image-rendering:pixelated]',
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                    <InputError message={chooseError} />
                </div>

                <Form
                    {...AvatarController.update.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="grid gap-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <Label htmlFor="avatar">Or upload your own</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    id="avatar"
                                    type="file"
                                    name="avatar"
                                    accept="image/jpeg,image/png"
                                    required
                                    className="w-auto flex-1"
                                />
                                <Button disabled={processing}>Upload</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                JPG or PNG, up to 2 MB.
                            </p>
                            <InputError message={errors.avatar} />
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
