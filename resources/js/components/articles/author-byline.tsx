import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { ArticleAuthor } from '@/types';

/**
 * The author's avatar and name, then the date.
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

    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <Avatar key={author.avatar ?? 'none'} className="size-5">
                <AvatarImage
                    src={author.avatar ?? undefined}
                    alt=""
                    className={cn(
                        author.avatar_pixelated &&
                            '[image-rendering:pixelated]',
                    )}
                />
                <AvatarFallback className="bg-neutral-200 text-[0.5rem] text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(author.name)}
                </AvatarFallback>
            </Avatar>
            <span>
                {author.name} · {new Date(date).toLocaleDateString()}
            </span>
        </span>
    );
}
