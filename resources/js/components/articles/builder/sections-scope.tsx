import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';
import type { DisplayMode, PickedImage, PoolField, SectionType } from '@/types';

export type SectionInstance = {
    type: SectionType;
    instanceId: string;
};

export type ScopedPoolImage = {
    tag: string;
    file: File | null;
    /** An object URL for a newly chosen file, or the stored URL when editing. */
    preview: string | null;
    displayMode: DisplayMode;
    /** The hero section that owns this slot, if any. */
    heroFor?: string;
    /** Article: the fixed column this image rides in on. Assigned once, never from array order. */
    field?: PoolField;
    /** Guide: `${chapterId}:${tag}`, the multipart key for a newly chosen file. */
    uploadKey?: string;
    /** Guide: the slot had a saved image when the editor opened. */
    stored?: boolean;
    /** An existing media library image chosen for this slot instead of a new file. */
    pickedAssetId?: number;
};

/**
 * Everything one set of sections owns: an Article has one, each Guide chapter has one.
 */
export type SectionsData = {
    sections: SectionInstance[];
    sectionContents: Record<string, string>;
    pool: ScopedPoolImage[];
    sourceLabel: string;
    sourceUrl: string;
    /**
     * Next tag index. Only ever increases and is seeded past the highest saved tag,
     * so a removed tag is never handed out again (a reused tag could pick up the
     * removed image on the server).
     */
    tagCounter: number;
};

/**
 * What every section component reads and writes, without knowing whether it's
 * editing an Article or one Guide chapter.
 */
export type SectionsScope = SectionsData & {
    /** 5 for an Article (fixed columns), null for an uncapped Guide chapter. */
    poolCap: number | null;
    setSectionContent: (instanceId: string, content: string) => void;
    addSection: (type: SectionType) => void;
    removeSection: (instanceId: string) => void;
    moveSection: (instanceId: string, direction: -1 | 1) => void;
    addPoolSlot: () => void;
    setPoolFile: (tag: string, file: File) => void;
    setPoolAsset: (tag: string, image: PickedImage) => void;
    setPoolDisplayMode: (tag: string, displayMode: DisplayMode) => void;
    removePoolImage: (tag: string) => void;
    setSourceLabel: (label: string) => void;
    setSourceUrl: (url: string) => void;
};

export const emptySectionsData = (): SectionsData => ({
    sections: [],
    sectionContents: {},
    pool: [],
    sourceLabel: '',
    sourceUrl: '',
    tagCounter: 0,
});

/**
 * imgA, imgB, … imgZ, imgAA, imgAB, …
 */
export function tagFromIndex(index: number): string {
    let letters = '';
    let remaining = index;

    do {
        letters = String.fromCharCode(65 + (remaining % 26)) + letters;
        remaining = Math.floor(remaining / 26) - 1;
    } while (remaining >= 0);

    return `img${letters}`;
}

function indexFromTag(tag: string): number {
    return Array.from(tag.slice(3)).reduce(
        (index, letter) => (index + 1) * 26 + letter.charCodeAt(0) - 65,
        -1,
    );
}

/**
 * The counter to start from when hydrating a saved pool: one past the highest tag.
 */
export function tagCounterFor(pool: { tag: string }[]): number {
    return Math.max(-1, ...pool.map((image) => indexFromTag(image.tag))) + 1;
}

/**
 * The highest numeric suffix among ids like "text-3" or "chapter-7", plus one.
 */
export function nextSuffix(ids: string[]): number {
    return (
        Math.max(0, ...ids.map((id) => Number(id.split('-').pop()) || 0)) + 1
    );
}

/**
 * Object URLs for image previews, revoked when replaced, removed, or on unmount.
 */
export function usePreviews() {
    const urls = useRef(new Set<string>());

    useEffect(() => {
        const current = urls.current;

        return () => current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const create = useCallback((file: File): string => {
        const url = URL.createObjectURL(file);
        urls.current.add(url);

        return url;
    }, []);

    const release = useCallback((url: string | null) => {
        if (url && urls.current.delete(url)) {
            URL.revokeObjectURL(url);
        }
    }, []);

    return { create, release };
}

export type Previews = ReturnType<typeof usePreviews>;

function withoutPoolImage(data: SectionsData, tag: string): SectionsData {
    return {
        ...data,
        sectionContents: Object.fromEntries(
            Object.entries(data.sectionContents).map(([id, content]) => [
                id,
                content.split(`[${tag}]`).join(''),
            ]),
        ),
        pool: data.pool.filter((image) => image.tag !== tag),
    };
}

/**
 * Builds a scope over one SectionsData. Every operation computes the next data from
 * the current render's data and hands it to `update`, with preview side effects kept
 * out of state updaters.
 */
export function createSectionsScope({
    data,
    update,
    poolCap,
    slotExtras,
    previews,
}: {
    data: SectionsData;
    update: (next: SectionsData) => void;
    poolCap: number | null;
    /** Storage details for a new slot, or null when there's no room. */
    slotExtras: (
        data: SectionsData,
        tag: string,
    ) => Partial<ScopedPoolImage> | null;
    previews: Previews;
}): SectionsScope {
    const withNewSlot = (
        current: SectionsData,
        heroFor?: string,
    ): SectionsData | null => {
        if (poolCap !== null && current.pool.length >= poolCap) {
            return null;
        }

        const tag = tagFromIndex(current.tagCounter);
        const extras = slotExtras(current, tag);

        if (!extras) {
            return null;
        }

        return {
            ...current,
            tagCounter: current.tagCounter + 1,
            pool: [
                ...current.pool,
                {
                    tag,
                    file: null,
                    preview: null,
                    displayMode: 'block',
                    heroFor,
                    ...extras,
                },
            ],
        };
    };

    return {
        ...data,
        poolCap,

        setSectionContent: (instanceId, content) =>
            update({
                ...data,
                sectionContents: {
                    ...data.sectionContents,
                    [instanceId]: content,
                },
            }),

        addSection: (type) => {
            const instanceId = `${type}-${nextSuffix(data.sections.map((section) => section.instanceId))}`;
            const base = type === 'hero' ? withNewSlot(data, instanceId) : data;

            if (!base) {
                return;
            }

            update({
                ...base,
                sections: [...base.sections, { type, instanceId }],
            });
        },

        removeSection: (instanceId) => {
            const section = data.sections.find(
                (candidate) => candidate.instanceId === instanceId,
            );
            let next = data;

            if (section?.type === 'hero') {
                const slot = data.pool.find(
                    (image) => image.heroFor === instanceId,
                );

                if (slot) {
                    previews.release(slot.preview);
                    next = withoutPoolImage(next, slot.tag);
                }
            }

            if (section?.type === 'source') {
                next = { ...next, sourceLabel: '', sourceUrl: '' };
            }

            const sectionContents = { ...next.sectionContents };
            delete sectionContents[instanceId];

            update({
                ...next,
                sectionContents,
                sections: next.sections.filter(
                    (candidate) => candidate.instanceId !== instanceId,
                ),
            });
        },

        moveSection: (instanceId, direction) => {
            const from = data.sections.findIndex(
                (section) => section.instanceId === instanceId,
            );
            const to = from + direction;

            if (from < 0 || to < 0 || to >= data.sections.length) {
                return;
            }

            const sections = [...data.sections];
            [sections[from], sections[to]] = [sections[to], sections[from]];
            update({ ...data, sections });
        },

        addPoolSlot: () => {
            const next = withNewSlot(data);

            if (next) {
                update(next);
            }
        },

        setPoolFile: (tag, file) => {
            const existing = data.pool.find((image) => image.tag === tag);

            if (!existing) {
                return;
            }

            previews.release(existing.preview);
            const preview = previews.create(file);

            update({
                ...data,
                pool: data.pool.map((image) =>
                    image.tag === tag
                        ? { ...image, file, preview, pickedAssetId: undefined }
                        : image,
                ),
            });
        },

        setPoolAsset: (tag, picked) => {
            previews.release(
                data.pool.find((image) => image.tag === tag)?.preview ?? null,
            );

            update({
                ...data,
                pool: data.pool.map((image) =>
                    image.tag === tag
                        ? {
                              ...image,
                              file: null,
                              preview: picked.url,
                              pickedAssetId: picked.id,
                          }
                        : image,
                ),
            });
        },

        setPoolDisplayMode: (tag, displayMode) =>
            update({
                ...data,
                pool: data.pool.map((image) =>
                    image.tag === tag ? { ...image, displayMode } : image,
                ),
            }),

        removePoolImage: (tag) => {
            previews.release(
                data.pool.find((image) => image.tag === tag)?.preview ?? null,
            );
            update(withoutPoolImage(data, tag));
        },

        setSourceLabel: (sourceLabel) => update({ ...data, sourceLabel }),
        setSourceUrl: (sourceUrl) => update({ ...data, sourceUrl }),
    };
}

export const SectionsScopeContext = createContext<SectionsScope | null>(null);

export function useSectionsScope(): SectionsScope {
    const scope = useContext(SectionsScopeContext);

    if (!scope) {
        throw new Error(
            'useSectionsScope must be used inside a sections scope provider.',
        );
    }

    return scope;
}
