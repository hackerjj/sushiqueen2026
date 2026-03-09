<?php

return [

    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [

        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('MONGO_URI', env('MONGO_DSN')),
            'host' => env('MONGO_HOST', '127.0.0.1'),
            'port' => env('MONGO_PORT', 27017),
            'database' => env('MONGO_DATABASE', 'sushi_queen'),
            'username' => env('MONGO_USERNAME', ''),
            'password' => env('MONGO_PASSWORD', ''),
            'options' => [
                'authSource' => env('MONGO_AUTH_SOURCE', 'admin'),
            ],
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [

        'client' => env('REDIS_CLIENT', 'predis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', 'sq_'),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '0'),
        ],

        'session' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_SESSION_DB', '0'),
        ],

    ],

];
