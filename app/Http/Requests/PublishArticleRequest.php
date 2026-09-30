<?php

namespace App\Http\Requests;

use App\Concerns\ArticleValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PublishArticleRequest extends FormRequest
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
     * The settings chosen when a draft note becomes a post.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->categoryRules(),
            'is_public' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->articleAttributes();
    }
}
