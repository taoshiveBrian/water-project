import { Columns2, ImagePlus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { InlineImage } from '@/components/articles/builder/editor-components';
import { ContentEditableColumn } from '@/components/articles/builder/editor-components';
import { useSectionsScope } from '@/components/articles/builder/sections-scope';
import { COLUMN_BREAK } from '@/components/articles/inline-images';
import { ARTICLE_MAX_COLUMNS } from '@/components/articles/templates';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * 1..maxColumns columns of text with inline pool images. Stored as one string
 * with columns separated by "[jump]".
 */
export function ColumnSection({ instanceId }: { instanceId: string }) {
    const { sectionContents, setSectionContent, pool } = useSectionsScope();
    const columns = (sectionContents[instanceId] ?? '').split(COLUMN_BREAK);
    const [activeColumn, setActiveColumn] = useState(0);
    const cursors = useRef<Record<number, number>>({});

    const taggable = pool.filter((image) => !image.heroFor);

    const images = useMemo(
        () =>
            Object.fromEntries(
                pool.map((image) => [
                    image.tag,
                    { url: image.preview, displayMode: image.displayMode },
                ]),
            ) as Record<string, InlineImage>,
        [pool],
    );

    const save = (next: string[]) =>
        setSectionContent(instanceId, next.join(COLUMN_BREAK));

    const cursorIn = (index: number) =>
        cursors.current[index] ?? columns[index].length;

    const insertTag = (tag: string) => {
        const index = Math.min(activeColumn, columns.length - 1);
        const offset = cursorIn(index);
        const marker = `[${tag}]`;
        const next = [...columns];

        next[index] =
            next[index].slice(0, offset) + marker + next[index].slice(offset);
        cursors.current[index] = offset + marker.length;
        save(next);
    };

    const splitColumn = () => {
        const index = Math.min(activeColumn, columns.length - 1);
        const offset = cursorIn(index);
        const next = [...columns];

        next.splice(
            index,
            1,
            columns[index].slice(0, offset),
            columns[index].slice(offset),
        );
        cursors.current = {};
        setActiveColumn(index + 1);
        save(next);
    };

    const mergeColumn = (index: number) => {
        const next = [...columns];
        const [removed] = next.splice(index, 1);
        const target = Math.max(index - 1, 0);

        if (removed) {
            next[target] = next[target]
                ? `${next[target]}\n${removed}`
                : removed;
        }

        cursors.current = {};
        setActiveColumn(target);
        save(next);
    };

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={taggable.length === 0}
                        >
                            <ImagePlus />
                            Insert image
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {taggable.map((image) => (
                            <DropdownMenuItem
                                key={image.tag}
                                onSelect={() => insertTag(image.tag)}
                            >
                                {image.preview && (
                                    <img
                                        src={image.preview}
                                        alt=""
                                        className="size-6 rounded object-cover"
                                    />
                                )}
                                [{image.tag}]
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={splitColumn}
                    disabled={columns.length >= ARTICLE_MAX_COLUMNS}
                    title={`Split the active column at the cursor (max ${ARTICLE_MAX_COLUMNS})`}
                >
                    <Columns2 />
                    Split column
                </Button>
                {taggable.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                        Add images to the image pool below to place them inline.
                    </span>
                )}
            </div>

            <div
                className="grid gap-4 md:grid-cols-(--columns)"
                style={
                    {
                        '--columns': `repeat(${columns.length}, minmax(0, 1fr))`,
                    } as React.CSSProperties
                }
            >
                {columns.map((column, index) => (
                    <div key={index} className="relative">
                        <ContentEditableColumn
                            value={column}
                            images={images}
                            placeholder={
                                columns.length > 1
                                    ? `Column ${index + 1}…`
                                    : 'Write something…'
                            }
                            onFocus={() => setActiveColumn(index)}
                            onCursorChange={(offset) => {
                                cursors.current[index] = offset;
                            }}
                            onChange={(value) => {
                                const next = [...columns];
                                next[index] = value;
                                save(next);
                            }}
                        />
                        {columns.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 size-6"
                                onClick={() => mergeColumn(index)}
                                title="Merge this column into the previous one"
                            >
                                <X className="size-3.5" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
