<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
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

        if ($this->has('notes')) {
            $merge['notes'] = $sanitize($this->input('notes'));
        }
        if ($this->has('fudo_order_id')) {
            $merge['fudo_order_id'] = $sanitize($this->input('fudo_order_id'));
        }
        if ($this->has('payment_method')) {
            $merge['payment_method'] = $sanitize($this->input('payment_method'));
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:pending,confirmed,preparing,ready,delivering,delivered,cancelled',
            'fudo_order_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'tip' => 'nullable|numeric',
        ];
    }
}
