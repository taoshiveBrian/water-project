import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import {
    AddSectionBar,
    sectionLabel,
} from '@/components/articles/builder/add-section';
import { ColumnSection } from '@/components/articles/builder/column-section';
import { FullWidthText } from '@/components/articles/builder/full-width-text';
import { HeroImage } from '@/components/articles/builder/hero-image';
import { ImagePool } from '@/components/articles/builder/image-pool';
import type { SectionInstance } from '@/components/articles/builder/sections-scope';
import { useSectionsScope } from '@/components/articles/builder/sections-scope';
import { SourceField } from '@/components/articles/builder/source-field';
import { Button } from '@/components/ui/button';

function SectionBody({ section }: { section: SectionInstance }) {
    switch (section.type) {
        case 'hero':
            return <HeroImage instanceId={section.instanceId} />;
        case 'text':
            return <FullWidthText instanceId={section.instanceId} />;
        case 'columns':
            return <ColumnSection instanceId={section.instanceId} />;
        case 'source':
            return <SourceField />;
    }
}

/**
 * The section list, add bar, and image pool for one scope. Rendered once for an
 * Article and once per Guide chapter.
 */
export function SectionsEditor() {
    const { sections, moveSection, removeSection } = useSectionsScope();

    return (
        <div className="grid gap-4">
            {sections.map((section, index) => (
                <section
                    key={section.instanceId}
                    className="grid gap-3 rounded-xl border p-4"
                >
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">
                            {sectionLabel(section.type)}
                        </h3>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={index === 0}
                                onClick={() =>
                                    moveSection(section.instanceId, -1)
                                }
                                title="Move up"
                            >
                                <ArrowUp />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={index === sections.length - 1}
                                onClick={() =>
                                    moveSection(section.instanceId, 1)
                                }
                                title="Move down"
                            >
                                <ArrowDown />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    removeSection(section.instanceId)
                                }
                                title="Remove section"
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    </div>
                    <SectionBody section={section} />
                </section>
            ))}

            <AddSectionBar />

            <ImagePool />
        </div>
    );
}

/**
 * Sections as sent to the server: text/columns carry content, heroes carry the
 * tag of the slot they own.
 */
export function sectionsPayload(
    sections: SectionInstance[],
    sectionContents: Record<string, string>,
    pool: { tag: string; heroFor?: string }[],
) {
    return sections.map((section) => {
        if (section.type === 'text' || section.type === 'columns') {
            return {
                ...section,
                content: sectionContents[section.instanceId] ?? '',
            };
        }

        if (section.type === 'hero') {
            return {
                ...section,
                poolTag: pool.find(
                    (image) => image.heroFor === section.instanceId,
                )?.tag,
            };
        }

        return { ...section };
    });
}
