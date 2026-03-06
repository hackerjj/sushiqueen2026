<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'orders';

    protected $fillable = [
        'order_number',
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
        'type',
        'payment_method',
        'payment_status',
        'tip',
        'prepared_items',
        'cash_register_id',
        'table_id',
        'guest_count',
        'assigned_to',
        'estimated_time',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'tax' => 'float',
        'total' => 'float',
        'tip' => 'float',
        'estimated_time' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
