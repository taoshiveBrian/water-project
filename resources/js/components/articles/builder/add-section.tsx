import { Plus } from 'lucide-react';
import { useSectionsScope } from '@/components/articles/builder/sections-scope';
import { Button } from '@/components/ui/button';
import type { SectionType } from '@/types';

/**
 * Every section type the editors offer. `singleUse` types are disabled once one
 * exists in the current scope (so a Guide can have one source per chapter).
 */
export const SECTIONS: {
    id: SectionType;
    label: string;
    singleUse: boolean;
    description: string;
}[] = [
    {
        id: 'hero',
        label: 'Hero Image',
        singleUse: false,
        description: 'A full-width image at this point in the article.',
    },
    {
        id: 'text',
        label: 'Full Width Text',
        singleUse: false,
        description: 'A single column of text.',
    },
    {
        id: 'columns',
        label: 'Columns',
        singleUse: false,
        description: 'Text in columns, with inline images from the pool.',
    },
    {
        id: 'source',
        label: 'Source / Attribution',
        singleUse: true,
        description: 'Credit where the information came from.',
    },
];

export function sectionLabel(type: SectionType): string {
    return SECTIONS.find((section) => section.id === type)?.label ?? type;
}

export function AddSectionBar() {
    const { sections, pool, poolCap, addSection } = useSectionsScope();
    const used = new Set(sections.map((section) => section.type));
    const poolIsFull = poolCap !== null && pool.length >= poolCap;

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3">
            <span className="mr-1 text-sm text-muted-foreground">
                Add section:
            </span>
            {SECTIONS.map((section) => {
                const alreadyUsed = section.singleUse && used.has(section.id);
                const blockedByPool = section.id === 'hero' && poolIsFull;

                return (
                    <Button
                        key={section.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSection(section.id)}
                        disabled={alreadyUsed || blockedByPool}
                        title={
                            blockedByPool
                                ? `All ${poolCap} image slots are in use.`
                                : section.description
                        }
                    >
                        <Plus />
                        {section.label}
                    </Button>
                );
            })}
        </div>
    );
}
