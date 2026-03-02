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

        // ─── Menu Items (Real Menu from Sushi Queen) ─────────────
        $menuItems = [

            // ═══ ESPECIALIDADES ═══
            ['name' => 'Gohan Especial', 'description' => 'Tazón de gohan con tiras de pollo en salsa dulce', 'price' => 127, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Ramen Especial', 'description' => 'Fideos con carne y verduras mixtas, con caldo a base de salsa de soya', 'price' => 164, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Chop Suey Mixto', 'description' => 'Germen de soya, verduras, carne de res, pollo y camarón', 'price' => 173, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Gyu Don', 'description' => 'Guisado de bistec, cebolla y harusame en salsa dulce, montado sobre gohan', 'price' => 147, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Tori Don', 'description' => 'Guisado de pollo, cebolla y harusame en salsa dulce, montado sobre gohan', 'price' => 147, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 5, 'modifiers' => []],
            ['name' => 'Misoshiru', 'description' => 'Caldo de miso con pollo y salmón, tofu, champiñones, cebollines y algas marinas', 'price' => 164, 'category' => 'Especialidades', 'available' => true, 'sort_order' => 6, 'modifiers' => []],

            // ═══ KUSHIAGES (Brochetas empanizadas 4 pzas.) ═══
            ['name' => 'Kushiage Plátano', 'description' => 'Brochetas empanizadas de plátano (4 pzas.)', 'price' => 101, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Kushiage Queso', 'description' => 'Brochetas empanizadas de queso (4 pzas.)', 'price' => 122, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Kushiage Plátano con Queso', 'description' => 'Brochetas empanizadas de plátano con queso (4 pzas.)', 'price' => 144, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Kushiage Pollo', 'description' => 'Brochetas empanizadas de pollo (4 pzas.)', 'price' => 144, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Kushiage Pollo con Queso', 'description' => 'Brochetas empanizadas de pollo con queso (4 pzas.)', 'price' => 158, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 5, 'modifiers' => []],
            ['name' => 'Kushiage Surimi', 'description' => 'Brochetas empanizadas de surimi (4 pzas.)', 'price' => 130, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 6, 'modifiers' => []],
            ['name' => 'Kushiage Surimi con Queso', 'description' => 'Brochetas empanizadas de surimi con queso (4 pzas.)', 'price' => 158, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 7, 'modifiers' => []],
            ['name' => 'Kushiage Camarón', 'description' => 'Brochetas empanizadas de camarón (4 pzas.)', 'price' => 181, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 8, 'modifiers' => []],
            ['name' => 'Kushiage Camarón con Queso', 'description' => 'Brochetas empanizadas de camarón con queso (4 pzas.)', 'price' => 196, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 9, 'modifiers' => []],
            ['name' => 'Kushiage Salmón', 'description' => 'Brochetas empanizadas de salmón (4 pzas.)', 'price' => 181, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 10, 'modifiers' => []],
            ['name' => 'Kushiage Salmón con Queso', 'description' => 'Brochetas empanizadas de salmón con queso (4 pzas.)', 'price' => 196, 'category' => 'Kushiages', 'available' => true, 'sort_order' => 11, 'modifiers' => []],

            // ═══ TEMPURAS ═══
            ['name' => 'Tempura Verduras', 'description' => 'Verduras en tempura crujiente', 'price' => 130, 'category' => 'Tempuras', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Tempura Camarón', 'description' => 'Camarones en tempura crujiente', 'price' => 199, 'category' => 'Tempuras', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Tempura Mixto', 'description' => 'Mezcla de verduras y camarón en tempura', 'price' => 233, 'category' => 'Tempuras', 'available' => true, 'sort_order' => 3, 'modifiers' => []],

            // ═══ YAKIMESHI (Arroz frito) ═══
            ['name' => 'Yakimeshi Yasai', 'description' => 'Arroz frito con verduras', 'price' => 89, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Yakimeshi Tori', 'description' => 'Arroz frito con pollo', 'price' => 115, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Yakimeshi Gyuniku', 'description' => 'Arroz frito con res', 'price' => 115, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Yakimeshi Ebi', 'description' => 'Arroz frito con camarón', 'price' => 130, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Yakimeshi Shifudo', 'description' => 'Arroz frito con mariscos', 'price' => 141, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 5, 'modifiers' => []],
            ['name' => 'Yakimeshi Mixto', 'description' => 'Arroz frito mixto con variedad de proteínas', 'price' => 154, 'category' => 'Yakimeshi', 'available' => true, 'sort_order' => 6, 'modifiers' => []],

            // ═══ YAKISOBA (Tallarines acompañados con verduras) ═══
            ['name' => 'Yakisoba Verduras', 'description' => 'Tallarines salteados con verduras', 'price' => 121, 'category' => 'Yakisoba', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Yakisoba Camarón', 'description' => 'Tallarines salteados con camarón', 'price' => 137, 'category' => 'Yakisoba', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Yakisoba Res', 'description' => 'Tallarines salteados con res', 'price' => 130, 'category' => 'Yakisoba', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Yakisoba Pollo', 'description' => 'Tallarines salteados con pollo', 'price' => 130, 'category' => 'Yakisoba', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Yakisoba Mixto', 'description' => 'Tallarines salteados mixtos', 'price' => 146, 'category' => 'Yakisoba', 'available' => true, 'sort_order' => 5, 'modifiers' => []],

            // ═══ TEPPANYAKI ═══
            ['name' => 'Teppanyaki Verduras', 'description' => 'Verduras a la plancha estilo teppanyaki', 'price' => 121, 'category' => 'Teppanyaki', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Teppanyaki Res o Pollo', 'description' => 'Res o pollo a la plancha estilo teppanyaki', 'price' => 156, 'category' => 'Teppanyaki', 'available' => true, 'sort_order' => 2, 'modifiers' => [['name' => 'Res', 'price' => 0], ['name' => 'Pollo', 'price' => 0]]],
            ['name' => 'Teppanyaki Camarón', 'description' => 'Camarón a la plancha estilo teppanyaki', 'price' => 173, 'category' => 'Teppanyaki', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Teppanyaki Mixto', 'description' => 'Mixto a la plancha estilo teppanyaki', 'price' => 199, 'category' => 'Teppanyaki', 'available' => true, 'sort_order' => 4, 'modifiers' => []],

            // ═══ PAQUETES (Incluyen 1 Yakimeshi de verduras, 1 Ensalada de la casa y 1 Kushiage de queso) ═══
            ['name' => 'Paquete Eby Furai', 'description' => 'Camarón empanizado. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 311, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Paquete Sakana Furai', 'description' => 'Pescado empanizado. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 242, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Paquete Pechuga Maki', 'description' => 'Pechuga maki. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Paquete Yakisoba', 'description' => 'Yakisoba. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Paquete Sushi Maki', 'description' => 'Sushi maki empanizado o ajonjolí tostado. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 5, 'modifiers' => [['name' => 'Empanizado', 'price' => 0], ['name' => 'Ajonjolí tostado', 'price' => 0]]],
            ['name' => 'Paquete Tori Queso', 'description' => 'Tori queso. Incluye 1 Yakimeshi de verduras, 1 Ensalada y 1 Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'available' => true, 'sort_order' => 6, 'modifiers' => []],

            // ═══ MAKIS (Base: aguacate, pepino y queso Philadelphia) ═══
            ['name' => 'Maki Ajonjolí Tostado', 'description' => 'Maki con base de aguacate, pepino y queso Philadelphia, cubierto de ajonjolí tostado', 'price' => 115, 'category' => 'Makis', 'available' => true, 'sort_order' => 1, 'modifiers' => []],
            ['name' => 'Maki Empanizado', 'description' => 'Maki empanizado con base de aguacate, pepino y queso Philadelphia', 'price' => 124, 'category' => 'Makis', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Maki Manchego', 'description' => 'Maki con queso manchego, aguacate, pepino y queso Philadelphia', 'price' => 124, 'category' => 'Makis', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Maki Empanizado de Manchego', 'description' => 'Maki empanizado con queso manchego', 'price' => 137, 'category' => 'Makis', 'available' => true, 'sort_order' => 4, 'modifiers' => []],
            ['name' => 'Maki Nori', 'description' => 'Maki envuelto en nori con aguacate, pepino y queso Philadelphia', 'price' => 124, 'category' => 'Makis', 'available' => true, 'sort_order' => 5, 'modifiers' => []],
            ['name' => 'Temaki', 'description' => 'Cono de nori relleno de arroz y ingredientes frescos', 'price' => 101, 'category' => 'Makis', 'available' => true, 'sort_order' => 6, 'modifiers' => []],
            ['name' => 'Maki Sandwich', 'description' => 'Maki estilo sandwich', 'price' => 95, 'category' => 'Makis', 'available' => true, 'sort_order' => 7, 'modifiers' => []],
            ['name' => 'Mini Rollo', 'description' => 'Rollo pequeño de sushi', 'price' => 84, 'category' => 'Makis', 'available' => true, 'sort_order' => 8, 'modifiers' => []],
            ['name' => 'Kappa Maki', 'description' => 'Rollo delgado de pepino', 'price' => 80, 'category' => 'Makis', 'available' => true, 'sort_order' => 9, 'modifiers' => []],
            ['name' => 'Tekka Maki', 'description' => 'Rollo delgado con atún o salmón', 'price' => 89, 'category' => 'Makis', 'available' => true, 'sort_order' => 10, 'modifiers' => [['name' => 'Atún', 'price' => 0], ['name' => 'Salmón', 'price' => 0]]],
            ['name' => 'Nigiri', 'description' => 'Pieza de nigiri (1 pza.)', 'price' => 64, 'category' => 'Makis', 'available' => true, 'sort_order' => 11, 'modifiers' => []],

            // ═══ MAKIS ESPECIALES ═══
            ['name' => 'Maki Mango / Plátano / Kiwi / Fresa / Pepino / Aguacate', 'description' => 'Maki especial con fruta o verdura a elegir', 'price' => 144, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 1, 'modifiers' => [['name' => 'Mango', 'price' => 0], ['name' => 'Plátano', 'price' => 0], ['name' => 'Kiwi', 'price' => 0], ['name' => 'Fresa', 'price' => 0], ['name' => 'Pepino', 'price' => 0], ['name' => 'Aguacate', 'price' => 0]]],
            ['name' => 'Maki Surimi', 'description' => 'Maki especial de surimi', 'price' => 156, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 2, 'modifiers' => []],
            ['name' => 'Maki Philadelphia', 'description' => 'Maki especial Philadelphia', 'price' => 161, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 3, 'modifiers' => []],
            ['name' => 'Maki Atún, Salmón o Camarón', 'description' => 'Maki especial con proteína a elegir', 'price' => 199, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 4, 'modifiers' => [['name' => 'Atún', 'price' => 0], ['name' => 'Salmón', 'price' => 0], ['name' => 'Camarón', 'price' => 0]]],
            ['name' => 'Arcoíris Maki', 'description' => 'Con 7 ingredientes diferentes, puede ser dulce o salado', 'price' => 199, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 5, 'modifiers' => [['name' => 'Dulce', 'price' => 0], ['name' => 'Salado', 'price' => 0]]],
            ['name' => 'Queen Maki', 'description' => 'Rollo de camarón empanizado envuelto en aguacate', 'price' => 208, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 6, 'modifiers' => []],
            ['name' => 'Masago', 'description' => 'Maki especial con masago (huevas de capelán)', 'price' => 240, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 7, 'modifiers' => []],
            ['name' => 'Anguila', 'description' => 'Maki especial de anguila', 'price' => 264, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 8, 'modifiers' => []],
            ['name' => 'Salmón Picante', 'description' => 'Rollo de salmón y aguacate por fuera con chiles toreados y salsa dulce', 'price' => 276, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 9, 'modifiers' => []],
            ['name' => 'Spicy Tuna', 'description' => 'Rollo de atún con salsa chipotle y queso manchego', 'price' => 276, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 10, 'modifiers' => []],
            ['name' => 'Combinación Queen', 'description' => '10 piezas de nigiris con proteínas mixtas', 'price' => 276, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 11, 'modifiers' => []],
            ['name' => 'Dragon Queen', 'description' => 'Maki envuelto con aguacate y mango, por dentro salmón o atún empanizado', 'price' => 228, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 12, 'modifiers' => [['name' => 'Salmón', 'price' => 0], ['name' => 'Atún', 'price' => 0]]],
            ['name' => 'Oniguiri', 'description' => 'Empanizado o de ajonjolí', 'price' => 96, 'category' => 'Makis Especiales', 'available' => true, 'sort_order' => 13, 'modifiers' => [['name' => 'Empanizado', 'price' => 0], ['name' => 'Ajonjolí', 'price' => 0]]],

            // ═══ PASTAS QUEEN (Elige entre espagueti o fettuccine) ═══
            ['name' => 'Pasta Bolognesa', 'description' => 'Puré de tomate, vino tinto, carne molida, finas hierbas y queso parmesano. Elige entre espagueti o fettuccine', 'price' => 160, 'category' => 'Pastas Queen', 'available' => true, 'sort_order' => 1, 'modifiers' => [['name' => 'Espagueti', 'price' => 0], ['name' => 'Fettuccine', 'price' => 0]]],
            ['name' => 'Pasta Poblana', 'description' => 'Crema de chile poblano, chile poblano asado, elote, pechuga de pollo y queso parmesano. Elige entre espagueti o fettuccine', 'price' => 165, 'category' => 'Pastas Queen', 'available' => true, 'sort_order' => 2, 'modifiers' => [['name' => 'Espagueti', 'price' => 0], ['name' => 'Fettuccine', 'price' => 0]]],
            ['name' => 'Pasta Alfredo', 'description' => 'Pasta a la crema con mantequilla, queso parmesano y finas hierbas. Elige entre espagueti o fettuccine', 'price' => 140, 'category' => 'Pastas Queen', 'available' => true, 'sort_order' => 3, 'modifiers' => [['name' => 'Espagueti', 'price' => 0], ['name' => 'Fettuccine', 'price' => 0]]],
            ['name' => 'Pasta 4 Quesos', 'description' => 'Pasta cremosa de parmesano, queso crema, queso manchego y queso mozzarella. Elige entre espagueti o fettuccine', 'price' => 165, 'category' => 'Pastas Queen', 'available' => true, 'sort_order' => 4, 'modifiers' => [['name' => 'Espagueti', 'price' => 0], ['name' => 'Fettuccine', 'price' => 0]]],
            ['name' => 'Pasta di Salmón', 'description' => 'Pasta a la mantequilla con jitomate cherry, espinaca y salmón a las hierbas finas. Elige entre espagueti o fettuccine', 'price' => 250, 'category' => 'Pastas Queen', 'available' => true, 'sort_order' => 5, 'modifiers' => [['name' => 'Espagueti', 'price' => 0], ['name' => 'Fettuccine', 'price' => 0]]],
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
                'title' => '2x1 en Makis',
                'description' => 'Lleva 2 makis y paga solo 1. Válido de lunes a miércoles.',
                'discount_type' => '2x1',
                'discount_value' => 50.0,
                'applicable_items' => ['Makis'],
                'starts_at' => now(),
                'expires_at' => now()->addMonths(1),
                'active' => true,
                'code' => 'MAKI2X1',
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
                'title' => 'Paquete Queen -$30',
                'description' => '$30 de descuento en cualquier Paquete. Solo por WhatsApp.',
                'discount_type' => 'fixed',
                'discount_value' => 30.0,
                'applicable_items' => ['Paquetes'],
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
