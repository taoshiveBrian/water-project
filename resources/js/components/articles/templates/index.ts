import { BookOpen, FileText, LayoutTemplate } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ArticleTemplate } from '@/types';

/**
 * Display metadata for the template picker. Which editor, renderer and server
 * rules apply is decided by explicit switches on the template id.
 */
export interface TemplateConfig {
    id: ArticleTemplate;
    name: string;
    description: string;
    icon: LucideIcon;
}

/**
 * The only layout constant: max columns in a Columns section (Article and Guide).
 */
export const ARTICLE_MAX_COLUMNS = 2;

export const templates: TemplateConfig[] = [
    {
        id: 'simple',
        name: 'Simple Post',
        description:
            'Title, subtitle, one or two blocks of text, and an optional cover image.',
        icon: FileText,
    },
    {
        id: 'article',
        name: 'Article',
        description:
            'Composed from sections: full-width text, columns with inline images, hero images, and a source. Up to 5 images.',
        icon: LayoutTemplate,
    },
    {
        id: 'sectioned',
        name: 'Guide',
        description:
            'Several chapters, each built like an Article, with a table of contents beside the finished page.',
        icon: BookOpen,
    },
];

export function getTemplateConfig(id: string): TemplateConfig | undefined {
    return templates.find((template) => template.id === id);
}
