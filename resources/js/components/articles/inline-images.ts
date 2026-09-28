import type { DisplayMode } from '@/types';

/**
 * Matches an inline image marker such as "[imgA]".
 */
export const INLINE_TAG_PATTERN = /\[(img[A-Z]+)\]/g;

export const COLUMN_BREAK = '[jump]';

/**
 * Classes for an inline image, shared by the editor and the renderer so both
 * lay out images the same way.
 */
export const displayModeClasses: Record<DisplayMode, string> = {
    block: 'my-4 block w-full rounded-lg',
    'float-left': 'float-left mr-4 mb-2 w-1/2 max-w-xs rounded-lg',
    'float-right': 'float-right mb-2 ml-4 w-1/2 max-w-xs rounded-lg',
};

export const displayModeLabels: Record<DisplayMode, string> = {
    block: 'Full width',
    'float-left': 'Float left',
    'float-right': 'Float right',
};
