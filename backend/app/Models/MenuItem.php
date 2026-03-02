<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MenuItem extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'menu_items';

    protected $fillable = [
        'fudo_id',
        'name',
        'description',
        'price',
        'category',
        'image_url',
        'modifiers',
        'available',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'float',
        'available' => 'boolean',
        'sort_order' => 'integer',
        'modifiers' => 'array',
    ];
}
