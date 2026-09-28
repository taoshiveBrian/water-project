<?php

namespace App\Http\Requests;

use App\Concerns\ArticleValidationRules;
use App\Enums\ArticleTemplate;
use App\Models\Article;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticleRequest extends FormRequest
{
    use ArticleValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Article::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $template = ArticleTemplate::tryFrom((string) $this->input('template'));

        return [
            'template' => ['required', Rule::enum(ArticleTemplate::class)],
            'is_note' => ['nullable', 'boolean'],
            ...$this->baseArticleRules($this->boolean('is_note')),
            ...($template ? $this->templateRules($template) : []),
        ];
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
