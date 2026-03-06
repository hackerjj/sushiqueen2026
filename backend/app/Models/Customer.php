<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Customer extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'customers';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'source',
        'tier',
        'total_orders',
        'total_spent',
        'preferences',
        'ai_profile',
        'facebook_id',
        'whatsapp_id',
        'last_order_at',
        'predominant_order_type',
    ];

    protected $casts = [
        'total_orders' => 'integer',
        'total_spent' => 'float',
    ];
}
