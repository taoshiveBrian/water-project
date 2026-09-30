import type { ReactNode } from 'react';

/**
 * Matches a "[label](https://…)" link, or a bare http(s) URL.
 */
const LINK_PATTERN =
    /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;

/**
 * Punctuation that usually ends the sentence rather than the bare URL.
 */
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;

export const inlineLinkClassName =
    'rounded-sm text-sky-800 no-underline transition-colors hover:bg-sky-100 hover:text-sky-900 dark:text-sky-300 dark:hover:bg-sky-900/40 dark:hover:text-sky-200';

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLinkClassName}
        >
            {children}
        </a>
    );
}

/**
 * Text with its links made clickable. Built as React nodes, never as HTML, and only
 * http(s) URLs become links.
 */
export function linkify(text: string, keyPrefix = 'link'): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of text.matchAll(LINK_PATTERN)) {
        const [whole, label, labelledUrl, bareUrl] = match;
        let end = match.index + whole.length;

        nodes.push(text.slice(cursor, match.index));

        if (labelledUrl) {
            nodes.push(
                <InlineLink key={`${keyPrefix}-${match.index}`} href={labelledUrl}>
                    {label}
                </InlineLink>,
            );
        } else {
            const url = bareUrl.replace(TRAILING_PUNCTUATION, '');
            end = match.index + url.length;

            nodes.push(
                <InlineLink key={`${keyPrefix}-${match.index}`} href={url}>
                    {url}
                </InlineLink>,
            );
        }

        cursor = end;
    }

    nodes.push(text.slice(cursor));

    return nodes;
}
