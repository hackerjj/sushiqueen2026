<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function prepareForValidation(): void
    {
        $sanitize = function ($value) {
            return is_string($value) ? trim(strip_tags($value)) : $value;
        };

        $merge = [];

        if ($this->has('customer')) {
            $customer = $this->input('customer', []);
            $merge['customer'] = [
                'name' => $sanitize($customer['name'] ?? null),
                'phone' => $sanitize($customer['phone'] ?? null),
                'email' => $sanitize($customer['email'] ?? null),
                'address' => $sanitize($customer['address'] ?? null),
            ];
        } else {
            if ($this->has('customer_name')) {
                $merge['customer_name'] = $sanitize($this->input('customer_name'));
            }
            if ($this->has('customer_phone')) {
                $merge['customer_phone'] = $sanitize($this->input('customer_phone'));
            }
            if ($this->has('customer_email')) {
                $merge['customer_email'] = $sanitize($this->input('customer_email'));
            }
        }

        if ($this->has('notes')) {
            $merge['notes'] = $sanitize($this->input('notes'));
        }
        if ($this->has('delivery_address')) {
            $merge['delivery_address'] = $sanitize($this->input('delivery_address'));
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $hasNested = $this->has('customer');

        $rules = [
            'items' => 'required|array|min:1',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.modifiers' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'delivery_address' => 'nullable|string',
            'source' => 'nullable|string|in:web,whatsapp,facebook,phone',
            'send_to_fudo' => 'nullable|boolean',
        ];

        if ($hasNested) {
            $rules['customer.name'] = 'required|string|max:255';
            $rules['customer.phone'] = 'required|string|max:50';
            $rules['customer.email'] = 'nullable|email';
            $rules['customer.address'] = 'nullable|string';
            $rules['items.*.menu_item_id'] = 'required|string';
            $rules['items.*.name'] = 'nullable|string';
            $rules['items.*.price'] = 'nullable|numeric';
        } else {
            $rules['customer_name'] = 'required|string|max:255';
            $rules['customer_phone'] = 'required|string|max:50';
            $rules['customer_email'] = 'nullable|email';
            $rules['items.*.menu_item_id'] = 'required|string';
        }

        return $rules;
    }
}
