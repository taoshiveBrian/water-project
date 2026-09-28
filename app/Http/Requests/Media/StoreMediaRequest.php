<?php

namespace App\Http\Requests\Media;

use App\Models\MediaSettings;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    /**
     * Any signed-in user can manage the library for now.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * File type and size limits come from the media settings.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $settings = MediaSettings::current();

        return [
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'mimetypes:'.implode(',', $settings->allowed_mime_types),
                'max:'.$settings->max_file_size,
            ],
            'folder' => ['nullable', 'string', 'alpha_dash', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['files.*' => 'file'];
    }
}
