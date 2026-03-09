<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
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

        foreach (['name', 'contact_name', 'phone', 'address', 'notes'] as $field) {
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
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
    }
}
