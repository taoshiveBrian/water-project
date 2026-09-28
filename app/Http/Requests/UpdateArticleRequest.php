<?php

namespace App\Http\Requests;

use App\Concerns\ArticleValidationRules;
use App\Enums\ArticleTemplate;
use App\Models\Article;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    use ArticleValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('article'));
    }

    /**
     * The template and draft status are fixed here (drafts are promoted via publish).
     * `clear_{field}` removes an existing image; an absent file leaves it unchanged.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Article $article */
        $article = $this->route('article');

        $rules = [
            ...$this->baseArticleRules($article->is_note),
            ...$this->templateRules($article->template),
            'clear_cover_image' => ['nullable', 'boolean'],
        ];

        if ($article->template === ArticleTemplate::Article) {
            foreach (Article::POOL_FIELDS as $field) {
                $rules["clear_{$field}"] = ['nullable', 'boolean'];
            }
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->articleAttributes();
    }

    protected function prepareForValidation(): void
    {
        $this->decodeArticleBody();
    }
}
