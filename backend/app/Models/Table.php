<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Table extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'tables';

    protected $fillable = [
        'number',
        'name',
        'capacity',
        'status',
        'current_order_id',
        'position_x',
        'position_y',
        'zone',
        'shape',
        'size',
    ];

    protected $casts = [
        'number' => 'integer',
        'capacity' => 'integer',
        'position_x' => 'float',
        'position_y' => 'float',
    ];
}
