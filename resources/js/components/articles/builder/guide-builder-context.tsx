import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
    PostHeader,
    PostHeaderInitial,
} from '@/components/articles/builder/post-header';
import {
    emptyPostHeader,
    usePostHeader,
} from '@/components/articles/builder/post-header';
import type {
    Previews,
    SectionsData,
} from '@/components/articles/builder/sections-scope';
import {
    createSectionsScope,
    emptySectionsData,
    nextSuffix,
    SectionsScopeContext,
    usePreviews,
} from '@/components/articles/builder/sections-scope';

export type ChapterState = SectionsData & {
    id: string;
    heading: string;
};

export type GuideBuilderInitial = {
    header: PostHeaderInitial;
    chapters: ChapterState[];
};

type GuideBuilderValue = {
    header: PostHeader;
    chapters: ChapterState[];
    previews: Previews;
    addChapter: () => void;
    removeChapter: (id: string) => void;
    updateChapter: (id: string, patch: Partial<ChapterState>) => void;
};

const GuideBuilderContext = createContext<GuideBuilderValue | null>(null);

export const newChapter = (id: string): ChapterState => ({
    ...emptySectionsData(),
    id,
    heading: '',
});

/**
 * Guide state: the shared header plus a list of chapters. Chapter ids come from a
 * counter that only increases and starts past the highest saved id, so a removed
 * chapter's id (and its anchor and stored images) is never reused.
 */
export function GuideBuilderProvider({
    initial = { header: emptyPostHeader, chapters: [] },
    children,
}: {
    initial?: GuideBuilderInitial;
    children: ReactNode;
}) {
    const previews = usePreviews();
    const header = usePostHeader(initial.header, previews);
    const [chapters, setChapters] = useState<ChapterState[]>(
        initial.chapters.length > 0
            ? initial.chapters
            : [newChapter('chapter-1')],
    );
    const chapterCounter = useRef(
        nextSuffix(
            (initial.chapters.length > 0
                ? initial.chapters
                : [{ id: 'chapter-1' }]
            ).map((chapter) => chapter.id),
        ),
    );

    const addChapter = () => {
        const id = `chapter-${chapterCounter.current++}`;
        setChapters((current) => [...current, newChapter(id)]);
    };

    const removeChapter = (id: string) => {
        if (chapters.length <= 1) {
            return;
        }

        chapters
            .find((chapter) => chapter.id === id)
            ?.pool.forEach((image) => previews.release(image.preview));
        setChapters((current) =>
            current.filter((chapter) => chapter.id !== id),
        );
    };

    const updateChapter = (id: string, patch: Partial<ChapterState>) =>
        setChapters((current) =>
            current.map((chapter) =>
                chapter.id === id ? { ...chapter, ...patch } : chapter,
            ),
        );

    return (
        <GuideBuilderContext.Provider
            value={{
                header,
                chapters,
                previews,
                addChapter,
                removeChapter,
                updateChapter,
            }}
        >
            {children}
        </GuideBuilderContext.Provider>
    );
}

export function useGuideBuilder(): GuideBuilderValue {
    const context = useContext(GuideBuilderContext);

    if (!context) {
        throw new Error(
            'useGuideBuilder must be used inside GuideBuilderProvider.',
        );
    }

    return context;
}

/**
 * Adapts one chapter to a SectionsScope. The pool is uncapped, and each slot's
 * upload key ties a new file to this chapter and tag.
 */
export function ChapterScopeProvider({
    chapter,
    children,
}: {
    chapter: ChapterState;
    children: ReactNode;
}) {
    const { updateChapter, previews } = useGuideBuilder();

    const scope = createSectionsScope({
        data: chapter,
        update: (next) => updateChapter(chapter.id, next),
        poolCap: null,
        previews,
        slotExtras: (_, tag) => ({ uploadKey: `${chapter.id}:${tag}` }),
    });

    return (
        <SectionsScopeContext.Provider value={scope}>
            {children}
        </SectionsScopeContext.Provider>
    );
}
