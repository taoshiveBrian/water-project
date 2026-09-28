<?php

namespace App\Http\Requests\Media;

use App\Enums\ProcessingMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMediaSettingsRequest extends FormRequest
{
    /**
     * File types the library can be set to accept.
     */
    public const array SUPPORTED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf', 'text/csv',
    ];

    /**
     * Any signed-in user can manage the library for now.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'processing_enabled' => ['required', 'boolean'],
            'compress_images' => ['required', 'boolean'],
            'compression_quality' => ['required', 'integer', 'between:1,100'],
            'processing_method' => ['required', Rule::enum(ProcessingMethod::class)],
            'max_file_size' => ['required', 'integer', 'between:1,102400'],
            'allowed_mime_types' => ['required', 'array', 'min:1'],
            'allowed_mime_types.*' => ['required', 'string', Rule::in(self::SUPPORTED_MIME_TYPES), 'distinct'],
            'sizes' => ['present', 'array', 'max:10'],
            'sizes.*.name' => ['required', 'string', 'alpha_dash', 'max:30', 'distinct'],
            'sizes.*.width' => ['nullable', 'integer', 'between:1,8000', 'required_without:sizes.*.height'],
            'sizes.*.height' => ['nullable', 'integer', 'between:1,8000', 'required_without:sizes.*.width'],
            'sizes.*.crop' => ['required', 'boolean'],
            'sizes.*.enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sizes.*.name' => 'size name',
            'sizes.*.width' => 'size width',
            'sizes.*.height' => 'size height',
            'allowed_mime_types.*' => 'file type',
        ];
    }
}
