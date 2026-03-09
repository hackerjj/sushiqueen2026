<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
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

        foreach (['name', 'unit', 'category', 'supplier_id'] as $field) {
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
            'name' => 'required|string|max:255',
            'unit' => 'required|string|in:kg,g,l,ml,pza,paq',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|string',
            'category' => 'nullable|string|max:100',
        ];
    }
}
