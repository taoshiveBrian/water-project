import { useSectionsScope } from '@/components/articles/builder/sections-scope';

export function FullWidthText({ instanceId }: { instanceId: string }) {
    const { sectionContents, setSectionContent } = useSectionsScope();

    return (
        <textarea
            value={sectionContents[instanceId] ?? ''}
            onChange={(event) =>
                setSectionContent(instanceId, event.target.value)
            }
            placeholder="Write something…"
            rows={6}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
    );
}
