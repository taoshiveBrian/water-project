import { Form, Head, router, usePage } from '@inertiajs/react';
import AvatarController from '@/actions/App/Http/Controllers/Settings/AvatarController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const LINK_FIELDS = ['link_1', 'link_2', 'link_3'] as const;

export default function Profile({
    avatarChoices,
}: {
    avatarChoices: { id: number; url: string }[];
}) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your avatar, name, email address and profile"
                />

                <div className="flex flex-wrap items-center gap-4">
                    <Avatar className="size-16 overflow-hidden rounded-full">
                        <AvatarImage
                            src={auth.user.avatar ?? undefined}
                            alt={auth.user.name}
                        />
                        <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <Form
                        {...AvatarController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="grid gap-2"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Input
                                        type="file"
                                        name="avatar"
                                        accept="image/jpeg,image/png"
                                        aria-label="Avatar image"
                                        required
                                        className="w-auto"
                                    />
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Upload
                                    </Button>
                                    {auth.user.avatar && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                router.delete(
                                                    AvatarController.destroy.url(),
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    JPG or PNG, up to 2 MB. Your uploaded avatar
                                    is private to you.
                                </p>
                                <InputError message={errors.avatar} />
                            </>
                        )}
                    </Form>
                </div>

                {avatarChoices.length > 0 && (
                    <div className="grid gap-2">
                        <Label>Or choose an avatar</Label>
                        <div className="flex flex-wrap gap-2">
                            {avatarChoices.map((choice) => (
                                <button
                                    key={choice.id}
                                    type="button"
                                    aria-label="Use this avatar"
                                    aria-pressed={
                                        auth.user.avatar_id === choice.id
                                    }
                                    onClick={() =>
                                        router.put(
                                            AvatarController.choose.url(),
                                            { asset_id: choice.id },
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={cn(
                                        'size-12 overflow-hidden rounded-full ring-offset-2 ring-offset-background outline-none hover:ring-2 hover:ring-ring/50 focus-visible:ring-2 focus-visible:ring-ring',
                                        auth.user.avatar_id === choice.id &&
                                            'ring-2 ring-foreground hover:ring-foreground',
                                    )}
                                >
                                    <img
                                        src={choice.url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="profile_text">
                                    Profile text
                                </Label>

                                <textarea
                                    id="profile_text"
                                    name="profile_text"
                                    rows={5}
                                    maxLength={2000}
                                    defaultValue={auth.user.profile_text ?? ''}
                                    placeholder="A little about yourself"
                                    className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.profile_text}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="link_1">Links</Label>

                                {LINK_FIELDS.map((field, i) => (
                                    <div key={field} className="grid gap-1">
                                        <Input
                                            id={field}
                                            type="url"
                                            name={field}
                                            defaultValue={
                                                auth.user[field] ?? ''
                                            }
                                            placeholder="https://github.com/you"
                                            aria-label={`Link ${i + 1}`}
                                        />
                                        <InputError message={errors[field]} />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
