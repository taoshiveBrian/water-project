<?php

namespace App\Concerns;

use App\Enums\ArticleTemplate;
use App\Enums\ArticleType;
use App\Models\Article;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

/**
 * Shared by StoreArticleRequest and UpdateArticleRequest. Expects the
 * using request to decode `body` from its JSON string in prepareForValidation().
 *
 * `body` is only ever stored from validated() data, so any key without a rule
 * here (for example a client-supplied Guide `assetId`) is dropped.
 */
trait ArticleValidationRules
{
    public const array SECTION_TYPES = ['hero', 'text', 'columns', 'source'];

    public const int MAX_CHAPTERS = 50;

    /**
     * Fields every template has. Drafts don't need a type or visibility yet.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function baseArticleRules(bool $isNote): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => [$isNote ? 'nullable' : 'required', Rule::enum(ArticleType::class)],
            'is_public' => [$isNote ? 'nullable' : 'required', 'boolean'],
            'cover_image' => $this->imageRules(),
            'cover_image_asset_id' => $this->libraryImageRules(),
            'body' => ['required', 'array'],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function templateRules(ArticleTemplate $template): array
    {
        return match ($template) {
            ArticleTemplate::Simple => $this->simpleRules(),
            ArticleTemplate::Article => $this->composedArticleRules(),
            ArticleTemplate::Sectioned => $this->guideRules(),
        };
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function simpleRules(): array
    {
        return [
            'subtitle' => ['nullable', 'string', 'max:255'],
            'body.builder' => ['required', 'in:simple'],
            'body.text' => ['required', 'string', 'max:100000'],
            'body.text2' => ['nullable', 'string', 'max:100000'],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function composedArticleRules(): array
    {
        $rules = [
            'source_label' => ['nullable', 'string', 'max:255'],
            'source_url' => ['nullable', 'url:http,https', 'max:2048'],
            'body.builder' => ['required', 'in:v2'],
            ...$this->sectionRules('body.sections'),
            'body.pool' => ['present', 'array', 'max:'.count(Article::POOL_FIELDS)],
            'body.pool.*.tag' => ['required', 'string', 'regex:/^img[A-Z]+$/', 'distinct'],
            'body.pool.*.field' => ['required', Rule::in(Article::POOL_FIELDS), 'distinct'],
            'body.pool.*.displayMode' => ['required', Rule::in(Article::DISPLAY_MODES)],
        ];

        foreach (Article::POOL_FIELDS as $field) {
            $rules[$field] = $this->imageRules();
            $rules["{$field}_asset_id"] = $this->libraryImageRules();
            $rules["{$field}_display"] = ['nullable', Rule::in(Article::DISPLAY_MODES)];
        }

        return $rules;
    }

    /**
     * New chapter images arrive as chapter_images[{uploadKey}]; the pool entry that
     * owns each file names it with `uploadKey`.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function guideRules(): array
    {
        return [
            'body.builder' => ['required', 'in:v2-chapters'],
            'body.chapters' => ['required', 'array', 'min:1', 'max:'.self::MAX_CHAPTERS],
            'body.chapters.*.id' => ['required', 'string', 'regex:/^chapter-\d+$/', 'distinct'],
            'body.chapters.*.heading' => ['required', 'string', 'max:255'],
            'body.chapters.*.sourceLabel' => ['nullable', 'string', 'max:255'],
            'body.chapters.*.sourceUrl' => ['nullable', 'url:http,https', 'max:2048'],
            ...$this->sectionRules('body.chapters.*.sections'),
            'body.chapters.*.pool' => ['present', 'array', 'max:50'],
            'body.chapters.*.pool.*.tag' => ['required', 'string', 'regex:/^img[A-Z]+$/'],
            'body.chapters.*.pool.*.displayMode' => ['required', Rule::in(Article::DISPLAY_MODES)],
            'body.chapters.*.pool.*.uploadKey' => ['nullable', 'string', 'max:100'],
            'body.chapters.*.pool.*.cleared' => ['nullable', 'boolean'],
            'body.chapters.*.pool.*.pickedAssetId' => $this->libraryImageRules(),
            'chapter_images' => ['nullable', 'array', 'max:100'],
            'chapter_images.*' => $this->imageRules(),
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function sectionRules(string $prefix): array
    {
        return [
            $prefix => ['present', 'array', 'max:100'],
            "{$prefix}.*.type" => ['required', Rule::in(self::SECTION_TYPES)],
            "{$prefix}.*.instanceId" => ['required', 'string', 'max:50'],
            "{$prefix}.*.content" => ['nullable', 'string', 'max:100000'],
            "{$prefix}.*.poolTag" => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * An existing image chosen from the media library instead of a new upload.
     *
     * @return list<mixed>
     */
    private function libraryImageRules(): array
    {
        return ['nullable', 'integer', Rule::exists('assets', 'id')->where('category', 'image')];
    }

    /**
     * @return list<string>
     */
    private function imageRules(): array
    {
        return ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:10240'];
    }

    /**
     * Readable names for nested body fields in error messages.
     *
     * @return array<string, string>
     */
    protected function articleAttributes(): array
    {
        return [
            'body.text' => 'text',
            'body.text2' => 'additional text',
            'body.chapters' => 'chapters',
            'body.chapters.*.heading' => 'chapter heading',
            'body.chapters.*.sourceLabel' => 'chapter source name',
            'body.chapters.*.sourceUrl' => 'chapter source URL',
            'chapter_images.*' => 'chapter image',
            'source_label' => 'source name',
            'source_url' => 'source URL',
        ];
    }

    /**
     * The editors submit `body` as a JSON string inside multipart form data.
     */
    protected function decodeArticleBody(): void
    {
        $body = $this->input('body');

        if (is_string($body)) {
            $this->merge(['body' => json_decode($body, true)]);
        }
    }
}
