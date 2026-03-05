<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Promotion extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'promotions';

    protected $fillable = [
        'title',
        'description',
        'discount_type',
        'discount_value',
        'applicable_items',
        'image_url',
        'starts_at',
        'expires_at',
        'active',
        'code',
        'usage_count',
        'max_usage',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'active' => 'boolean',
        'usage_count' => 'integer',
        'max_usage' => 'integer',
        'applicable_items' => 'array',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true)->where('expires_at', '>', now());
    }
}
