<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use App\Enums\ProfileVisibility;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            'profile_text' => ['nullable', 'string', 'max:2000'],
            'link_1' => ['nullable', 'url:http,https', 'max:2048'],
            'link_2' => ['nullable', 'url:http,https', 'max:2048'],
            'link_3' => ['nullable', 'url:http,https', 'max:2048'],
            'show_email' => ['boolean'],
            'profile_visibility' => ['sometimes', Rule::enum(ProfileVisibility::class)],
        ];
    }

    /**
     * An unchecked checkbox sends nothing, which means "don't show".
     */
    protected function prepareForValidation(): void
    {
        $this->merge(['show_email' => $this->boolean('show_email')]);
    }
}
