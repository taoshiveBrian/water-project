import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Mail, XIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn, pixelated } from '@/lib/utils';
import type { ArticleAuthor, AuthorProfile } from '@/types';

export type Anchor = { x: number; y: number };

const WIDTH = 320;
const MARGIN = 16;

/**
 * Pinned with its top-left corner at the anchor (the centre of the clicked avatar),
 * nudged inward only as far as needed to stay on screen.
 */
function position(anchor: Anchor): React.CSSProperties {
    const width = Math.min(WIDTH, window.innerWidth - MARGIN * 2);
    const left = Math.max(
        MARGIN,
        Math.min(anchor.x, window.innerWidth - width - MARGIN),
    );
    const top = Math.max(
        MARGIN,
        Math.min(anchor.y, window.innerHeight - MARGIN - 240),
    );

    return { left, top, width, maxHeight: window.innerHeight - top - MARGIN };
}

/**
 * "github.com/someone" rather than the full URL.
 */
function linkLabel(url: string): string {
    try {
        const { host, pathname } = new URL(url);

        return `${host.replace(/^www\./, '')}${pathname === '/' ? '' : pathname}`;
    } catch {
        return url;
    }
}

export function AuthorProfileDialog({
    author,
    profile,
    anchor,
    onClose,
}: {
    author: ArticleAuthor;
    profile: AuthorProfile;
    anchor: Anchor | null;
    onClose: () => void;
}) {
    const getInitials = useInitials();

    return (
        <DialogPrimitive.Root
            open={anchor !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                {anchor && (
                    <DialogPrimitive.Content
                        style={position(anchor)}
                        className="fixed z-50 grid origin-top-left gap-4 overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-lg duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                        <div className="flex items-center gap-3 pr-6">
                            <Avatar className="size-14">
                                <AvatarImage
                                    src={author.avatar ?? undefined}
                                    alt=""
                                    className={pixelated(
                                        author.avatar_pixelated,
                                    )}
                                />
                                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(author.name)}
                                </AvatarFallback>
                            </Avatar>
                            <DialogPrimitive.Title className="text-lg leading-tight font-semibold">
                                {author.name}
                            </DialogPrimitive.Title>
                        </div>

                        <DialogPrimitive.Description
                            className={cn(
                                'text-sm whitespace-pre-line',
                                !profile.profile_text &&
                                    'text-muted-foreground italic',
                            )}
                        >
                            {profile.profile_text || 'No profile text yet.'}
                        </DialogPrimitive.Description>

                        {(profile.links.length > 0 || profile.email) && (
                            <ul className="grid gap-1.5 border-t pt-4 text-sm">
                                {profile.links.map((link) => (
                                    <li key={link} className="truncate">
                                        <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="underline underline-offset-4 hover:text-muted-foreground"
                                        >
                                            {linkLabel(link)}
                                        </a>
                                    </li>
                                ))}
                                {profile.email && (
                                    <li className="flex items-center gap-1.5 truncate">
                                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                                        <a
                                            href={`mailto:${profile.email}`}
                                            className="underline underline-offset-4 hover:text-muted-foreground"
                                        >
                                            {profile.email}
                                        </a>
                                    </li>
                                )}
                            </ul>
                        )}

                        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-hidden">
                            <XIcon className="size-4" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                    </DialogPrimitive.Content>
                )}
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
