<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MenuItem extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'menu_items';

    protected $fillable = [
        'name',
        'description',
        'price',
        'category',
        'image_url',
        'modifiers',
        'available',
        'sort_order',
        'prices',
        'available_hours',
        'recipe_id',
        'cost',
    ];

    protected $casts = [
        'price' => 'float',
        'cost' => 'float',
        'available' => 'boolean',
        'sort_order' => 'integer',
        'modifiers' => 'array',
        'prices' => 'array',
        'available_hours' => 'array',
    ];
}
