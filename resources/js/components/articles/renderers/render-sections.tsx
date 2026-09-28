import type { ReactNode } from 'react';
import {
    COLUMN_BREAK,
    displayModeClasses,
    INLINE_TAG_PATTERN,
} from '@/components/articles/inline-images';
import type { ArticleSection, DisplayMode } from '@/types';

export type ResolvedImage = { url: string; displayMode: DisplayMode };

export type TagImages = Map<string, ResolvedImage>;

/**
 * Text with [tag] markers swapped for images. Built as React nodes, never as
 * HTML, so user text is always escaped.
 */
export function InlineText({
    content,
    images = new Map(),
}: {
    content: string;
    images?: TagImages;
}) {
    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of content.matchAll(INLINE_TAG_PATTERN)) {
        const tag = match[1];
        const image = images.get(tag);

        nodes.push(content.slice(cursor, match.index));

        if (image) {
            nodes.push(
                <img
                    key={`${tag}-${match.index}`}
                    src={image.url}
                    alt=""
                    className={displayModeClasses[image.displayMode]}
                />,
            );
        }

        cursor = match.index + match[0].length;
    }

    nodes.push(content.slice(cursor));

    return <div className="flow-root whitespace-pre-line">{nodes}</div>;
}

function renderSection(
    section: ArticleSection,
    images: TagImages,
    source: { label?: string | null; url?: string | null },
): ReactNode {
    switch (section.type) {
        case 'text':
            return section.content?.trim() ? (
                <InlineText content={section.content} images={images} />
            ) : null;

        case 'columns': {
            if (!section.content?.trim()) {
                return null;
            }

            const columns = section.content.split(COLUMN_BREAK);

            return (
                <div
                    className="grid gap-6 md:grid-cols-(--columns)"
                    style={
                        {
                            '--columns': `repeat(${columns.length}, minmax(0, 1fr))`,
                        } as React.CSSProperties
                    }
                >
                    {columns.map((column, index) => (
                        <InlineText
                            key={index}
                            content={column}
                            images={images}
                        />
                    ))}
                </div>
            );
        }

        case 'hero': {
            const image = section.poolTag
                ? images.get(section.poolTag)
                : undefined;

            return image ? (
                <img
                    src={image.url}
                    alt=""
                    className="w-full rounded-xl object-cover"
                />
            ) : null;
        }

        case 'source':
            if (!source.label && !source.url) {
                return null;
            }

            return (
                <p className="border-t pt-4 text-sm text-muted-foreground">
                    Source:{' '}
                    {source.url ? (
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="underline underline-offset-4 hover:text-foreground"
                        >
                            {source.label || source.url}
                        </a>
                    ) : (
                        source.label
                    )}
                </p>
            );

        default:
            // Unknown or legacy entries (such as an old `cover` section) render nothing.
            return null;
    }
}

/**
 * Walks sections in order. Shared by Article bodies and every Guide chapter.
 */
export function RenderSections({
    sections,
    images,
    source,
}: {
    sections: ArticleSection[];
    images: TagImages;
    source: { label?: string | null; url?: string | null };
}) {
    return (
        <>
            {sections.map((section) => (
                <div key={section.instanceId}>
                    {renderSection(section, images, source)}
                </div>
            ))}
        </>
    );
}
