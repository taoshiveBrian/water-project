import type { TagImages } from '@/components/articles/renderers/render-sections';
import { RenderSections } from '@/components/articles/renderers/render-sections';
import type { GuideBody, GuideChapter } from '@/types';

function chapterImages(chapter: GuideChapter): TagImages {
    const images: TagImages = new Map();

    for (const entry of chapter.pool) {
        if (entry.url) {
            images.set(entry.tag, {
                url: entry.url,
                displayMode: entry.displayMode,
                pixelated: entry.pixelated,
            });
        }
    }

    return images;
}

/**
 * Each chapter as an anchored section, so the contents sidebar can jump to it.
 */
export function GuideRenderer({ body }: { body: GuideBody }) {
    return (
        <div className="grid gap-12">
            {body.chapters.map((chapter, index) => (
                <section
                    key={chapter.id}
                    id={chapter.id}
                    className="grid scroll-mt-24 gap-6"
                >
                    <h2 className="text-2xl font-semibold tracking-tight">
                        <span className="mr-2 text-muted-foreground">
                            {index + 1}.
                        </span>
                        {chapter.heading}
                    </h2>
                    <RenderSections
                        sections={chapter.sections}
                        images={chapterImages(chapter)}
                        source={{
                            label: chapter.sourceLabel,
                            url: chapter.sourceUrl,
                        }}
                    />
                </section>
            ))}
        </div>
    );
}

export function GuideContentsSidebar({ body }: { body: GuideBody }) {
    return (
        <nav className="sticky top-6 grid gap-2 rounded-xl border p-4 text-sm">
            <h2 className="font-medium">Contents</h2>
            <ol className="grid gap-1.5">
                {body.chapters.map((chapter, index) => (
                    <li key={chapter.id}>
                        <a
                            href={`#${chapter.id}`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {index + 1}. {chapter.heading}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
