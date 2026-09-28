import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
    PostHeader,
    PostHeaderInitial,
} from '@/components/articles/builder/post-header';
import {
    emptyPostHeader,
    usePostHeader,
} from '@/components/articles/builder/post-header';
import type { SectionsData } from '@/components/articles/builder/sections-scope';
import {
    createSectionsScope,
    emptySectionsData,
    SectionsScopeContext,
    usePreviews,
} from '@/components/articles/builder/sections-scope';
import type { PoolField } from '@/types';

export const POOL_FIELDS: PoolField[] = [
    'image_1',
    'image_2',
    'image_3',
    'image_4',
    'image_5',
];

/**
 * Hard cap on Article pool images, tied 1:1 to the image columns on `articles`.
 */
export const MAX_POOL = POOL_FIELDS.length;

export type ArticleBuilderInitial = {
    header: PostHeaderInitial;
    sectionsData: SectionsData;
};

type ArticleBuilderValue = {
    header: PostHeader;
    sectionsData: SectionsData;
};

const ArticleBuilderContext = createContext<ArticleBuilderValue | null>(null);

/**
 * Article state, plus one SectionsScope for the whole article with a 5-image cap.
 */
export function ArticleBuilderProvider({
    initial = { header: emptyPostHeader, sectionsData: emptySectionsData() },
    children,
}: {
    initial?: ArticleBuilderInitial;
    children: ReactNode;
}) {
    const previews = usePreviews();
    const header = usePostHeader(initial.header, previews);
    const [sectionsData, setSectionsData] = useState(initial.sectionsData);

    const scope = createSectionsScope({
        data: sectionsData,
        update: setSectionsData,
        poolCap: MAX_POOL,
        previews,
        slotExtras: (data) => {
            const used = new Set(data.pool.map((image) => image.field));
            const field = POOL_FIELDS.find((candidate) => !used.has(candidate));

            return field ? { field } : null;
        },
    });

    return (
        <ArticleBuilderContext.Provider value={{ header, sectionsData }}>
            <SectionsScopeContext.Provider value={scope}>
                {children}
            </SectionsScopeContext.Provider>
        </ArticleBuilderContext.Provider>
    );
}

export function useArticleBuilder(): ArticleBuilderValue {
    const context = useContext(ArticleBuilderContext);

    if (!context) {
        throw new Error(
            'useArticleBuilder must be used inside ArticleBuilderProvider.',
        );
    }

    return context;
}
