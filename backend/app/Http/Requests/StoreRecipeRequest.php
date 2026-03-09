<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecipeRequest extends FormRequest
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

        foreach (['menu_item_id', 'notes'] as $field) {
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
            'menu_item_id' => 'required|string',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.ingredient_id' => 'required|string',
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit' => 'required|string',
            'yield' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ];
    }
}
