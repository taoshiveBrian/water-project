<?php

namespace App\Models;

use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A shared grouping for articles, shown as a tab on the articles page.
 * The slug is derived from the name and used in the `?category=` filter.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name'])]
class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (Category $category) {
            $category->slug = Str::slug($category->name);
        });
    }

    /**
     * The chosen category's id from validated `category_id` / `new_category` input.
     * A new name that matches an existing category (ignoring case and spacing) reuses it.
     *
     * @param  array{category_id?: int|string|null, new_category?: string|null}  $validated
     */
    public static function idFromInput(array $validated): ?int
    {
        $newName = Str::squish($validated['new_category'] ?? '');

        if ($newName !== '') {
            return self::firstOrCreate(['slug' => Str::slug($newName)], ['name' => $newName])->id;
        }

        return isset($validated['category_id']) ? (int) $validated['category_id'] : null;
    }

    /**
     * @return HasMany<Article, $this>
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }
}
