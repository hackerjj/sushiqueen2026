<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Expense extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'expenses';

    protected $fillable = [
        'description',
        'amount',
        'category',
        'date',
        'payment_method',
        'receipt_url',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'date' => 'datetime',
    ];

    public const CATEGORIES = [
        'ingredientes',
        'servicios',
        'personal',
        'alquiler',
        'marketing',
        'otros',
    ];
}
