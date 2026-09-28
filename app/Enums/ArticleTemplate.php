<?php

namespace App\Enums;

/**
 * The editor an article was built with. Fixed at creation.
 */
enum ArticleTemplate: string
{
    /** Title, subtitle, one or two plain text blocks, cover image. */
    case Simple = 'simple';

    /** Composed sections with a capped pool of five inline images in fixed columns. */
    case Article = 'article';

    /** A guide: chapters, each composed like an Article, with an uncapped per-chapter image pool. */
    case Sectioned = 'sectioned';
}
