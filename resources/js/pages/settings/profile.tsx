import { Form, Head, router, usePage } from '@inertiajs/react';
import AvatarController from '@/actions/App/Http/Controllers/Settings/AvatarController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { AvatarDialog } from '@/components/avatar-dialog';
import type { AvatarChoice } from '@/components/avatar-dialog';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const LINK_FIELDS = ['link_1', 'link_2', 'link_3'] as const;

const VISIBILITY_OPTIONS = [
    { value: 'members', label: 'Logged-in members only' },
    { value: 'public', label: 'Everyone, including visitors' },
] as const;

export default function Profile({
    avatarChoices,
}: {
    avatarChoices?: AvatarChoice[];
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
                    {/* Keyed on the URL so a new avatar remounts the image instead of keeping the old one. */}
                    <Avatar
                        key={auth.user.avatar ?? 'none'}
                        className="size-16 overflow-hidden rounded-full"
                    >
                        <AvatarImage
                            src={auth.user.avatar ?? undefined}
                            alt={auth.user.name}
                            className={
                                auth.user.avatar_pixelated
                                    ? '[image-rendering:pixelated]'
                                    : undefined
                            }
                        />
                        <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <AvatarDialog
                        currentId={auth.user.avatar_id ?? null}
                        choices={avatarChoices}
                    />

                    {auth.user.avatar && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                router.delete(AvatarController.destroy.url(), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Remove
                        </Button>
                    )}
                </div>

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

                            <fieldset className="grid gap-3">
                                <legend className="mb-2 text-sm font-medium">
                                    Profile card
                                </legend>
                                <p className="-mt-1 text-xs text-muted-foreground">
                                    Opens when someone clicks your name on one
                                    of your articles.
                                </p>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="show_email"
                                        name="show_email"
                                        value="1"
                                        defaultChecked={
                                            auth.user.show_email ?? false
                                        }
                                    />
                                    <Label htmlFor="show_email">
                                        Show my email address
                                    </Label>
                                </div>

                                <div className="grid gap-2">
                                    <span className="text-sm">
                                        Who can see it
                                    </span>
                                    {VISIBILITY_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <input
                                                type="radio"
                                                name="profile_visibility"
                                                value={option.value}
                                                defaultChecked={
                                                    (auth.user
                                                        .profile_visibility ??
                                                        'members') ===
                                                    option.value
                                                }
                                                className="size-4 accent-primary"
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                    <InputError
                                        message={errors.profile_visibility}
                                    />
                                </div>
                            </fieldset>

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
