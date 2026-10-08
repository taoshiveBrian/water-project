import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Hard pixel edges for images the server flags as pixel art, so enlarging them
 * zooms the pixels instead of blurring them. No effect at natural size.
 */
export function pixelated(isPixelArt: boolean | null | undefined): string {
    return isPixelArt ? '[image-rendering:pixelated]' : '';
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
