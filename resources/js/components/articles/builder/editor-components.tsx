import { useLayoutEffect, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import {
    displayModeClasses,
    INLINE_TAG_PATTERN,
} from '@/components/articles/inline-images';
import { cn } from '@/lib/utils';
import type { DisplayMode } from '@/types';

export type InlineImage = {
    url: string | null;
    displayMode: DisplayMode;
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Plain text with [tag] markers → editor HTML. Known tags become an image (or a
 * placeholder chip until a file is chosen); everything else is escaped text.
 * A trailing newline gets an extra <br>, since browsers don't render the last one.
 */
export function colToHTML(
    text: string,
    images: Record<string, InlineImage>,
): string {
    let html = escapeHtml(text).replace(INLINE_TAG_PATTERN, (marker, tag) => {
        const image = images[tag];

        if (!image) {
            return marker;
        }

        if (image.url) {
            return `<img data-tag="${tag}" src="${escapeHtml(image.url)}" alt="" contenteditable="false" class="${displayModeClasses[image.displayMode]}">`;
        }

        return `<span data-tag="${tag}" contenteditable="false" class="mx-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">[${tag}]</span>`;
    });

    html = html.replace(/\n/g, '<br>');

    return text.endsWith('\n') ? `${html}<br>` : html;
}

function serializeNodes(nodes: ArrayLike<ChildNode>): string {
    let text = '';

    for (const node of Array.from(nodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += (node.textContent ?? '').replace(/ /g, ' ');
            continue;
        }

        if (!(node instanceof HTMLElement)) {
            continue;
        }

        if (node.dataset.tag) {
            text += `[${node.dataset.tag}]`;
        } else if (node.nodeName === 'BR') {
            text += '\n';
        } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
            text +=
                (text && !text.endsWith('\n') ? '\n' : '') +
                serializeNodes(node.childNodes);
        } else {
            text += serializeNodes(node.childNodes);
        }
    }

    return text;
}

/**
 * Editor DOM → plain text with [tag] markers. Inverse of colToHTML.
 */
export function colFromHTML(element: HTMLElement): string {
    const text = serializeNodes(element.childNodes);

    return element.lastChild?.nodeName === 'BR' && text.endsWith('\n')
        ? text.slice(0, -1)
        : text;
}

/**
 * The caret position as an offset into the plain-text value.
 */
function getCursorOffset(element: HTMLElement): number | null {
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
        return null;
    }

    const range = selection.getRangeAt(0);

    if (!element.contains(range.endContainer)) {
        return null;
    }

    const before = document.createRange();
    before.selectNodeContents(element);
    before.setEnd(range.endContainer, range.endOffset);

    return serializeNodes(before.cloneContents().childNodes).length;
}

/**
 * A contenteditable column where [tag] markers show as real inline images.
 *
 * The DOM is the source of truth while typing: input is read back into a string
 * and reported up, and innerHTML is only rewritten when the value changes from
 * outside (an inserted tag, a split column) or an image changes. That keeps the
 * caret where it is on every keystroke.
 */
export function ContentEditableColumn({
    value,
    onChange,
    images,
    onCursorChange,
    onFocus,
    placeholder,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    images: Record<string, InlineImage>;
    onCursorChange?: (offset: number) => void;
    onFocus?: () => void;
    placeholder?: string;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const renderedValue = useRef<string | null>(null);
    const renderedImages = useRef<string | null>(null);

    useLayoutEffect(() => {
        const element = ref.current;
        const imagesKey = JSON.stringify(images);

        if (
            !element ||
            (renderedValue.current === value &&
                renderedImages.current === imagesKey)
        ) {
            return;
        }

        element.innerHTML = colToHTML(value, images);
        renderedValue.current = value;
        renderedImages.current = imagesKey;
    }, [value, images]);

    const reportCursor = () => {
        const offset = ref.current ? getCursorOffset(ref.current) : null;

        if (offset !== null) {
            onCursorChange?.(offset);
        }
    };

    const handleInput = () => {
        if (!ref.current) {
            return;
        }

        const next = colFromHTML(ref.current);
        renderedValue.current = next;
        onChange(next);
        reportCursor();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.execCommand('insertLineBreak');
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        document.execCommand(
            'insertText',
            false,
            event.clipboardData.getData('text/plain'),
        );
    };

    return (
        <div
            ref={ref}
            role="textbox"
            aria-multiline="true"
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={reportCursor}
            onMouseUp={reportCursor}
            onFocus={onFocus}
            onPaste={handlePaste}
            className={cn(
                'flow-root min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
                className,
            )}
        />
    );
}
