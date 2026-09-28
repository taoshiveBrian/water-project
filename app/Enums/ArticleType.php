<?php

namespace App\Enums;

enum ArticleType: string
{
    case Post = 'post';
    case Tutorial = 'tutorial';

    public function label(): string
    {
        return match ($this) {
            self::Post => 'Post',
            self::Tutorial => 'Tutorial',
        };
    }
}
