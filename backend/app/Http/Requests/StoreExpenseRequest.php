<?php

namespace App\Http\Requests;

use App\Models\Expense;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
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

        foreach (['description', 'payment_method', 'receipt_url', 'notes', 'created_by'] as $field) {
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
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|gt:0',
            'category' => 'required|string|in:' . implode(',', Expense::CATEGORIES),
            'date' => 'required|date',
            'payment_method' => 'required|string',
            'receipt_url' => 'nullable|string',
            'notes' => 'nullable|string',
            'created_by' => 'nullable|string',
        ];
    }
}
