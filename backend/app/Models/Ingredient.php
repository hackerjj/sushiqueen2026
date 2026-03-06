<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Ingredient extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'ingredients';

    protected $fillable = [
        'name',
        'unit',
        'current_stock',
        'min_stock',
        'cost_per_unit',
        'supplier_id',
        'category',
        'fudo_id',
        'stock_control',
    ];

    protected $casts = [
        'current_stock' => 'float',
        'min_stock' => 'float',
        'cost_per_unit' => 'float',
    ];
}
