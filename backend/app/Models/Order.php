<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'orders';

    protected $fillable = [
        'fudo_order_id',
        'customer_id',
        'items',
        'subtotal',
        'tax',
        'total',
        'status',
        'source',
        'notes',
        'delivery_address',
        'confirmed_at',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'float',
        'tax' => 'float',
        'total' => 'float',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
