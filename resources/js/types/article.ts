export type Category = {
    id: number;
    name: string;
    slug: string;
};

export type ArticleTemplate = 'simple' | 'article' | 'sectioned';

export type DisplayMode = 'block' | 'float-left' | 'float-right';

export type SectionType = 'hero' | 'text' | 'columns' | 'source';

export type PoolField =
    | 'image_1'
    | 'image_2'
    | 'image_3'
    | 'image_4'
    | 'image_5';

export type ImageField = 'cover_image' | PoolField;

/**
 * One block in an Article or Guide chapter, in render order. `content` is set for
 * text and columns sections (columns are joined with the literal "[jump]");
 * `poolTag` is set for hero sections.
 */
export type ArticleSection = {
    type: SectionType;
    instanceId: string;
    content?: string;
    poolTag?: string;
};

/**
 * Article template: maps a tag typed into text (e.g. "[imgA]") to a fixed image column.
 */
export type ArticlePoolEntry = {
    tag: string;
    field: PoolField;
    displayMode: DisplayMode;
};

/**
 * Guide template: the server resolves `url` from the stored asset.
 */
export type GuidePoolEntry = {
    tag: string;
    displayMode: DisplayMode;
    assetId?: number | null;
    url?: string | null;
    pixelated?: boolean;
};

export type GuideChapter = {
    id: string;
    heading: string;
    sourceLabel?: string | null;
    sourceUrl?: string | null;
    sections: ArticleSection[];
    pool: GuidePoolEntry[];
};

export type SimpleBody = {
    builder: 'simple';
    text: string;
    text2?: string | null;
};

export type ArticleLayoutBody = {
    builder: 'v2';
    sections: ArticleSection[];
    pool: ArticlePoolEntry[];
};

export type GuideBody = {
    builder: 'v2-chapters';
    chapters: GuideChapter[];
};

/**
 * The JSON stored in `articles.body`; its shape depends on the template.
 */
export type ArticleBody = SimpleBody | ArticleLayoutBody | GuideBody;

export type ArticleImage = {
    url: string | null;
    pixelated?: boolean;
    display: DisplayMode | null;
};

export type Article = {
    id: number;
    category: Category | null;
    template: ArticleTemplate;
    title: string;
    subtitle: string | null;
    body: ArticleBody;
    is_public: boolean;
    is_note: boolean;
    source_label: string | null;
    source_url: string | null;
    author: ArticleAuthor;
    images: Record<ImageField, ArticleImage>;
    created_at: string;
    updated_at: string;
};

export type ArticleAuthor = {
    id: number;
    name: string;
    avatar: string | null;
    avatar_pixelated: boolean;
};

export type ArticleSummary = {
    id: number;
    category: Category | null;
    template: ArticleTemplate;
    title: string;
    is_public: boolean;
    author: ArticleAuthor;
    cover_image_url: string | null;
    cover_image_pixelated: boolean;
    created_at: string;
};

export type NoteSummary = {
    id: number;
    template: ArticleTemplate;
    title: string;
    category: Category | null;
    updated_at: string;
};
