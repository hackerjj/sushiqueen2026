<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
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

        foreach (['name', 'description', 'category', 'image_url'] as $field) {
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
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|string|max:100',
            'image_url' => 'nullable|string',
            'modifiers' => 'nullable|array',
            'available' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
