<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        $sanitize = function ($value) {
            return is_string($value) ? trim(strip_tags($value)) : $value;
        };

        $merge = [];

        foreach (['title', 'description', 'image_url', 'code'] as $field) {
            if ($this->has($field)) {
                $merge[$field] = $sanitize($this->input($field));
            }
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'discount_type' => 'required|string|in:percentage,fixed,2x1,bogo',
            'discount_value' => 'required|numeric|min:0',
            'applicable_items' => 'nullable|array',
            'image_url' => 'nullable|string',
            'starts_at' => 'required|date',
            'expires_at' => 'required|date|after:starts_at',
            'active' => 'boolean',
            'code' => 'nullable|string|max:50',
            'max_usage' => 'nullable|integer|min:0',
        ];
    }
}
