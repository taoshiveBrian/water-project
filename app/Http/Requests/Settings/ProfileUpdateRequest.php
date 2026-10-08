<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        ];
    }
}
