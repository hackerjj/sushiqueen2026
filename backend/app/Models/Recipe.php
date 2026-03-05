<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Recipe extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'recipes';

    protected $fillable = [
        'menu_item_id',
        'ingredients',
        'total_cost',
        'yield',
        'notes',
    ];

    protected $casts = [
        'ingredients' => 'array',
        'total_cost' => 'float',
        'yield' => 'integer',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
