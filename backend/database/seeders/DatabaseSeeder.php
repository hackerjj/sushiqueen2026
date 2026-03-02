<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin User ──────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@sushiqueen.com'],
            [
                'name' => 'Admin Sushi Queen',
                'email' => 'admin@sushiqueen.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        $this->command->info('Admin user created: admin@sushiqueen.com / admin123');

        // ─── Menu Items ──────────────────────────────────────────
        $menuItems = [
            // Rolls
            [
                'name' => 'Philadelphia Roll',
                'description' => 'Salmón, queso crema, palta. 10 piezas.',
                'price' => 4200.00,
                'category' => 'Rolls',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => ['sin alga', 'extra queso'],
            ],
            [
                'name' => 'California Roll',
                'description' => 'Kanikama, palta, pepino, sésamo. 10 piezas.',
                'price' => 3800.00,
                'category' => 'Rolls',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => ['sin pepino'],
            ],
            [
                'name' => 'Spicy Tuna Roll',
                'description' => 'Atún picante, pepino, cebolla de verdeo. 10 piezas.',
                'price' => 4500.00,
                'category' => 'Rolls',
                'available' => true,
                'sort_order' => 3,
                'modifiers' => ['extra picante', 'suave'],
            ],
            [
                'name' => 'Tempura Roll',
                'description' => 'Langostino tempura, palta, queso crema. 10 piezas.',
                'price' => 5200.00,
                'category' => 'Rolls',
                'available' => true,
                'sort_order' => 4,
                'modifiers' => [],
            ],
            // Nigiri
            [
                'name' => 'Nigiri Salmón',
                'description' => 'Salmón fresco sobre arroz. 2 piezas.',
                'price' => 1800.00,
                'category' => 'Nigiri',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => [],
            ],
            [
                'name' => 'Nigiri Langostino',
                'description' => 'Langostino cocido sobre arroz. 2 piezas.',
                'price' => 2200.00,
                'category' => 'Nigiri',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => [],
            ],
            // Sashimi
            [
                'name' => 'Sashimi Salmón',
                'description' => 'Láminas de salmón fresco. 5 piezas.',
                'price' => 3200.00,
                'category' => 'Sashimi',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => [],
            ],
            [
                'name' => 'Sashimi Mixto',
                'description' => 'Salmón, atún y pez blanco. 6 piezas.',
                'price' => 4000.00,
                'category' => 'Sashimi',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => [],
            ],
            // Combos
            [
                'name' => 'Combo Queen',
                'description' => '30 piezas mixtas: 10 Philadelphia, 10 California, 5 Nigiri, 5 Sashimi.',
                'price' => 9800.00,
                'category' => 'Combos',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => [],
            ],
            [
                'name' => 'Combo Pareja',
                'description' => '20 piezas: 10 Philadelphia, 10 Spicy Tuna.',
                'price' => 7200.00,
                'category' => 'Combos',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => [],
            ],
            // Bebidas
            [
                'name' => 'Té Verde',
                'description' => 'Té verde japonés caliente.',
                'price' => 800.00,
                'category' => 'Bebidas',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => [],
            ],
            [
                'name' => 'Sake',
                'description' => 'Sake frío o caliente. 180ml.',
                'price' => 2500.00,
                'category' => 'Bebidas',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => ['frío', 'caliente'],
            ],
            // Extras
            [
                'name' => 'Salsa de Soja',
                'description' => 'Porción extra de salsa de soja.',
                'price' => 200.00,
                'category' => 'Extras',
                'available' => true,
                'sort_order' => 1,
                'modifiers' => [],
            ],
            [
                'name' => 'Jengibre y Wasabi',
                'description' => 'Porción extra de jengibre encurtido y wasabi.',
                'price' => 300.00,
                'category' => 'Extras',
                'available' => true,
                'sort_order' => 2,
                'modifiers' => [],
            ],
        ];

        foreach ($menuItems as $item) {
            MenuItem::updateOrCreate(
                ['name' => $item['name']],
                $item
            );
        }

        $this->command->info('Seeded ' . count($menuItems) . ' menu items.');

        // ─── Promotions ──────────────────────────────────────────
        $promotions = [
            [
                'title' => '2x1 en Rolls',
                'description' => 'Llevá 2 rolls y pagá solo 1. Válido de lunes a miércoles.',
                'discount_type' => '2x1',
                'discount_value' => 50.0,
                'applicable_items' => ['Rolls'],
                'starts_at' => now(),
                'expires_at' => now()->addMonths(1),
                'active' => true,
                'code' => 'ROLL2X1',
                'usage_count' => 0,
                'max_usage' => 500,
            ],
            [
                'title' => '15% OFF Primera Compra',
                'description' => '15% de descuento en tu primer pedido por la web.',
                'discount_type' => 'percentage',
                'discount_value' => 15.0,
                'applicable_items' => [],
                'starts_at' => now(),
                'expires_at' => now()->addMonths(3),
                'active' => true,
                'code' => 'BIENVENIDO15',
                'usage_count' => 0,
                'max_usage' => 1000,
            ],
            [
                'title' => 'Combo Queen -$1000',
                'description' => '$1000 de descuento en el Combo Queen. Solo por WhatsApp.',
                'discount_type' => 'fixed',
                'discount_value' => 1000.0,
                'applicable_items' => ['Combo Queen'],
                'starts_at' => now(),
                'expires_at' => now()->addWeeks(2),
                'active' => true,
                'code' => 'QUEENDESC',
                'usage_count' => 0,
                'max_usage' => 200,
            ],
        ];

        foreach ($promotions as $promo) {
            Promotion::updateOrCreate(
                ['code' => $promo['code']],
                $promo
            );
        }

        $this->command->info('Seeded ' . count($promotions) . ' promotions.');
    }
}
