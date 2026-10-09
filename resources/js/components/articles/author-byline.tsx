import { useRef, useState } from 'react';
import { AuthorProfileDialog } from '@/components/articles/author-profile-dialog';
import type { Anchor } from '@/components/articles/author-profile-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn, pixelated } from '@/lib/utils';
import type { ArticleAuthor } from '@/types';

/**
 * The author's avatar and name, then the date. When the author's profile card is
 * available to this viewer, the avatar and name open it.
 */
export function AuthorByline({
    author,
    date,
    className,
}: {
    author: ArticleAuthor;
    date: string;
    className?: string;
}) {
    const getInitials = useInitials();
    const avatarRef = useRef<HTMLSpanElement>(null);
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const profile = author.profile;

    const avatar = (
        <Avatar
            ref={avatarRef}
            key={author.avatar ?? 'none'}
            className="size-5"
        >
            <AvatarImage
                src={author.avatar ?? undefined}
                alt=""
                className={pixelated(author.avatar_pixelated)}
            />
            <AvatarFallback className="bg-neutral-200 text-[0.5rem] text-black dark:bg-neutral-700 dark:text-white">
                {getInitials(author.name)}
            </AvatarFallback>
        </Avatar>
    );

    const openProfile = () => {
        const rect = avatarRef.current?.getBoundingClientRect();

        if (rect) {
            setAnchor({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });
        }
    };

    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            {profile ? (
                <>
                    <button
                        type="button"
                        onClick={openProfile}
                        className="inline-flex items-center gap-1.5 rounded-sm hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        {avatar}
                        {author.name}
                    </button>
                    <AuthorProfileDialog
                        author={author}
                        profile={profile}
                        anchor={anchor}
                        onClose={() => setAnchor(null)}
                    />
                </>
            ) : (
                <>
                    {avatar}
                    {author.name}
                </>
            )}
            <span>· {new Date(date).toLocaleDateString()}</span>
        </span>
    );
}
