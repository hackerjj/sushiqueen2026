<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class CashRegister extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'cash_registers';

    protected $fillable = [
        'name',
        'opened_by',
        'opened_at',
        'closed_at',
        'initial_amount',
        'expected_amount',
        'actual_amount',
        'status',
        'movements',
        'summary',
    ];

    protected $casts = [
        'initial_amount' => 'float',
        'expected_amount' => 'float',
        'actual_amount' => 'float',
        'movements' => 'array',
        'summary' => 'array',
    ];
}
