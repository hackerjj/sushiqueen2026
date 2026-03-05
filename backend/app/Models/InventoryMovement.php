<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class InventoryMovement extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'inventory_movements';

    protected $fillable = [
        'ingredient_id',
        'type',
        'quantity',
        'previous_stock',
        'new_stock',
        'cost',
        'order_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'float',
        'previous_stock' => 'float',
        'new_stock' => 'float',
        'cost' => 'float',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}
