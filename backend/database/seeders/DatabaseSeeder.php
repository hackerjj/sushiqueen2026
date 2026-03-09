<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Promotion;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin User ──────────────────────────────────────────
        $adminEmail = env('ADMIN_EMAIL', 'admin@sushiqueen.com');
        $adminPassword = env('ADMIN_PASSWORD', 'changeme');
        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Admin Sushi Queen',
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
            ]
        );
        $this->command->info('Admin user created. Configure ADMIN_EMAIL and ADMIN_PASSWORD env vars for production.');

        // ─── Tables: 4 Salón + 2 Terraza ────────────────────────
        $tables = [
            ['number' => 1, 'name' => 'Mesa 1', 'capacity' => 4, 'zone' => 'Salón', 'status' => 'free', 'position_x' => 0, 'position_y' => 1],
            ['number' => 2, 'name' => 'Mesa 2', 'capacity' => 4, 'zone' => 'Salón', 'status' => 'free', 'position_x' => 1, 'position_y' => 1],
            ['number' => 3, 'name' => 'Mesa 3', 'capacity' => 6, 'zone' => 'Salón', 'status' => 'free', 'position_x' => 2, 'position_y' => 1],
            ['number' => 4, 'name' => 'Mesa 4', 'capacity' => 4, 'zone' => 'Salón', 'status' => 'free', 'position_x' => 2, 'position_y' => 0],
            ['number' => 5, 'name' => 'Mesa 5', 'capacity' => 4, 'zone' => 'Terraza', 'status' => 'free', 'position_x' => 0, 'position_y' => 0],
            ['number' => 6, 'name' => 'Mesa 6', 'capacity' => 4, 'zone' => 'Terraza', 'status' => 'free', 'position_x' => 0, 'position_y' => 1],
        ];
        foreach ($tables as $t) {
            Table::updateOrCreate(['number' => $t['number']], $t);
        }
        $this->command->info('Seeded 6 tables (4 Salón + 2 Terraza)');

        // ─── Protein modifiers (shared) ──────────────────────────
        $proteinMods = [
            ['name' => 'Camarón', 'price' => 0],
            ['name' => 'Surimi', 'price' => 0],
            ['name' => 'Pollo', 'price' => 0],
            ['name' => 'Carne', 'price' => 0],
            ['name' => 'Salmón', 'price' => 0],
            ['name' => 'Atún', 'price' => 0],
            ['name' => 'Pulpo', 'price' => 0],
        ];

        $pastaMods = [
            ['name' => 'Espagueti', 'price' => 0],
            ['name' => 'Fettuccine', 'price' => 0],
        ];

        // ─── Menu Items ──────────────────────────────────────────
        $menuItems = [
            // ═══ ESPECIALIDADES / GOHAN ═══
            ['name' => 'Gohan Especial', 'description' => 'Tazón de gohan con tiras de pollo en salsa dulce', 'price' => 127, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gohan-especial.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Gohan', 'description' => 'Tazón de arroz japonés al vapor', 'price' => 89, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gohan.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Gohan Tampico', 'description' => 'Tazón de gohan estilo Tampico con salsa especial', 'price' => 137, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gohan-tampico.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Gyu Don', 'description' => 'Guisado de bistec, cebolla y harusame en salsa dulce, montado sobre gohan', 'price' => 147, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gyu-don.jpeg', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Tori Don', 'description' => 'Guisado de pollo, cebolla y harusame en salsa dulce, montado sobre gohan', 'price' => 147, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gohan-especial.jpeg', 'modifiers' => [], 'sort_order' => 5],
            ['name' => 'Chop Suey Mixto', 'description' => 'Germen de soya, verduras, carne de res, pollo y camarón', 'price' => 173, 'category' => 'Especialidades', 'image_url' => '/images/menu/Gohan/gohan-tampico.jpeg', 'modifiers' => [], 'sort_order' => 6],

            // ═══ SOPAS Y RAMEN ═══
            ['name' => 'Ramen Especial', 'description' => 'Fideos con carne y verduras mixtas, con caldo a base de salsa de soya', 'price' => 164, 'category' => 'Sopas y Ramen', 'image_url' => '/images/menu/Sopas y Ramen/ramen-especial.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Tori Ramen', 'description' => 'Ramen con pollo, verduras y caldo especial', 'price' => 147, 'category' => 'Sopas y Ramen', 'image_url' => '/images/menu/Sopas y Ramen/tori-ramen.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Misoshiru', 'description' => 'Caldo de miso con pollo y salmón, tofu, champiñones, cebollines y algas marinas', 'price' => 164, 'category' => 'Sopas y Ramen', 'image_url' => '/images/menu/Sopas y Ramen/misoshiru.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Sumashi', 'description' => 'Sopa clara japonesa con tofu y algas', 'price' => 89, 'category' => 'Sopas y Ramen', 'image_url' => '/images/menu/Sopas y Ramen/sumashi.jpeg', 'modifiers' => [], 'sort_order' => 4],

            // ═══ ENTRADAS / KUSHIAGES ═══
            ['name' => 'Edamames', 'description' => 'Vainas de soya al vapor con sal de mar', 'price' => 89, 'category' => 'Entradas', 'image_url' => '/images/menu/Entradas/Edamanes.jpg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Gyosas', 'description' => 'Empanadillas japonesas rellenas (5 pzas.)', 'price' => 101, 'category' => 'Entradas', 'image_url' => '/images/menu/Entradas/Gyosas.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Kushiage Plátano', 'description' => 'Brochetas empanizadas de plátano (4 pzas.)', 'price' => 101, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-platano.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Kushiage Queso', 'description' => 'Brochetas empanizadas de queso (4 pzas.)', 'price' => 122, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-queso.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Kushiage Plátano con Queso', 'description' => 'Brochetas empanizadas de plátano con queso (4 pzas.)', 'price' => 144, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-platano-queso.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Kushiage Pollo', 'description' => 'Brochetas empanizadas de pollo (4 pzas.)', 'price' => 144, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-pollo.png', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Kushiage Pollo con Queso', 'description' => 'Brochetas empanizadas de pollo con queso (4 pzas.)', 'price' => 158, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-pollo-queso.png', 'modifiers' => [], 'sort_order' => 5],
            ['name' => 'Kushiage Surimi', 'description' => 'Brochetas empanizadas de surimi (4 pzas.)', 'price' => 130, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-surimi.png', 'modifiers' => [], 'sort_order' => 6],
            ['name' => 'Kushiage Surimi con Queso', 'description' => 'Brochetas empanizadas de surimi con queso (4 pzas.)', 'price' => 158, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-surimi-queso.png', 'modifiers' => [], 'sort_order' => 7],
            ['name' => 'Kushiage Camarón', 'description' => 'Brochetas empanizadas de camarón (4 pzas.)', 'price' => 181, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-camaron-queso.png', 'modifiers' => [], 'sort_order' => 8],
            ['name' => 'Kushiage Camarón con Queso', 'description' => 'Brochetas empanizadas de camarón con queso (4 pzas.)', 'price' => 196, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-camaron-queso.png', 'modifiers' => [], 'sort_order' => 9],
            ['name' => 'Kushiage Salmón', 'description' => 'Brochetas empanizadas de salmón (4 pzas.)', 'price' => 181, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-salmon-queso.png', 'modifiers' => [], 'sort_order' => 10],
            ['name' => 'Kushiage Salmón con Queso', 'description' => 'Brochetas empanizadas de salmón con queso (4 pzas.)', 'price' => 196, 'category' => 'Kushiages', 'image_url' => '/images/menu/Entradas/kushiage-salmon-queso.png', 'modifiers' => [], 'sort_order' => 11],

            // ═══ MAKIS (con modificadores de proteína) ═══
            ['name' => 'Maki Ajonjolí Tostado', 'description' => 'Maki cubierto de ajonjolí tostado', 'price' => 115, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/ajonjolli-tostado.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 1],
            ['name' => 'Maki Empanizado', 'description' => 'Maki empanizado con aguacate, pepino y queso Philadelphia', 'price' => 124, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-empanizado.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 2],
            ['name' => 'Maki Manchego', 'description' => 'Maki con queso manchego', 'price' => 124, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-manchego.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 3],
            ['name' => 'Maki Empanizado Manchego', 'description' => 'Maki empanizado con queso manchego', 'price' => 137, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-empanizado-manchego.png', 'modifiers' => $proteinMods, 'sort_order' => 4],
            ['name' => 'Maki Philadelphia', 'description' => 'Maki con queso Philadelphia, salmón y aguacate', 'price' => 161, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-philadelphia.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 5],
            ['name' => 'Maki Nori', 'description' => 'Maki envuelto en alga nori', 'price' => 124, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-nori.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 6],
            ['name' => 'Maki Surimi', 'description' => 'Maki con surimi', 'price' => 156, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-surimi.jpeg', 'modifiers' => [], 'sort_order' => 7],
            ['name' => 'Maki Camarón', 'description' => 'Maki con camarón', 'price' => 144, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-camaron.jpeg', 'modifiers' => [], 'sort_order' => 8],
            ['name' => 'Maki Salmón', 'description' => 'Maki con salmón fresco', 'price' => 161, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-salmon.jpeg', 'modifiers' => [], 'sort_order' => 9],
            ['name' => 'Maki Atún', 'description' => 'Maki con atún fresco', 'price' => 161, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-atun.jpeg', 'modifiers' => [], 'sort_order' => 10],
            ['name' => 'Maki Mango', 'description' => 'Maki con mango', 'price' => 144, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-mango.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 11],
            ['name' => 'Tekka Maki', 'description' => 'Rollo delgado con atún o salmón', 'price' => 89, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-tekka.jpeg', 'modifiers' => [['name' => 'Atún', 'price' => 0], ['name' => 'Salmón', 'price' => 0]], 'sort_order' => 12],
            ['name' => 'Temaki', 'description' => 'Cono de nori relleno de arroz e ingredientes frescos', 'price' => 101, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/temaki.jpeg', 'modifiers' => $proteinMods, 'sort_order' => 13],
            ['name' => 'Onigiri', 'description' => 'Bola de arroz rellena envuelta en nori', 'price' => 64, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/onigiri.jpeg', 'modifiers' => [], 'sort_order' => 14],
            ['name' => 'Maki Sandwich', 'description' => 'Sushi en forma de sandwich', 'price' => 95, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/maki-sandwich.png', 'modifiers' => $proteinMods, 'sort_order' => 15],
            ['name' => 'Kappa Maki', 'description' => 'Rollo delgado de pepino', 'price' => 80, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/kappa-maki.png', 'modifiers' => [], 'sort_order' => 16],
            ['name' => 'Mini Rollo', 'description' => 'Rollo pequeño de sushi', 'price' => 84, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/mini-rollo.png', 'modifiers' => $proteinMods, 'sort_order' => 17],
            ['name' => 'Nigiri', 'description' => 'Pieza de nigiri (1 pza.)', 'price' => 64, 'category' => 'Makis', 'image_url' => '/images/menu/Makis/nigiri.png', 'modifiers' => [['name' => 'Salmón', 'price' => 0], ['name' => 'Atún', 'price' => 0], ['name' => 'Camarón', 'price' => 0], ['name' => 'Pulpo', 'price' => 0]], 'sort_order' => 18],

            // ═══ MAKIS ESPECIALES ═══
            ['name' => 'Queen Maki', 'description' => 'Rollo de camarón empanizado envuelto en aguacate', 'price' => 208, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/maki-queen.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Dragon Queen', 'description' => 'Maki envuelto con aguacate y mango, por dentro salmón o atún empanizado', 'price' => 228, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Dragon queen.jpeg', 'modifiers' => [['name' => 'Salmón', 'price' => 0], ['name' => 'Atún', 'price' => 0]], 'sort_order' => 2],
            ['name' => 'Salmón Picante', 'description' => 'Rollo de salmón y aguacate por fuera con chiles toreados y salsa dulce', 'price' => 276, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/maki-salmon-picante.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Spicy Tuna', 'description' => 'Rollo de atún con salsa chipotle y queso manchego', 'price' => 276, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/maki-atun-spicy.jpeg', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Maki Masago', 'description' => 'Maki cubierto con huevas de masago', 'price' => 240, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/masago-maki.png', 'modifiers' => [], 'sort_order' => 5],
            ['name' => 'Maki Anguila', 'description' => 'Maki con anguila y salsa especial', 'price' => 264, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/anguila-maki.png', 'modifiers' => [], 'sort_order' => 6],
            ['name' => 'Combinación Queen', 'description' => '10 piezas de nigiris con proteínas mixtas', 'price' => 276, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/combinacion-queen.png', 'modifiers' => [], 'sort_order' => 7],
            ['name' => 'Arcoíris Maki', 'description' => 'Con 7 ingredientes diferentes, dulce o salado', 'price' => 199, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/arcoiris-maki.png', 'modifiers' => [['name' => 'Dulce', 'price' => 0], ['name' => 'Salado', 'price' => 0]], 'sort_order' => 8],
            ['name' => 'Maki Atún Salmón Camarón', 'description' => 'Maki triple con atún, salmón y camarón', 'price' => 199, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/maki-atun-salmon-camaron.png', 'modifiers' => [['name' => 'Atún', 'price' => 0], ['name' => 'Salmón', 'price' => 0], ['name' => 'Camarón', 'price' => 0]], 'sort_order' => 9],
            ['name' => 'Maki Frutas', 'description' => 'Maki dulce con frutas frescas', 'price' => 144, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/maki-frutas.png', 'modifiers' => [['name' => 'Mango', 'price' => 0], ['name' => 'Plátano', 'price' => 0], ['name' => 'Kiwi', 'price' => 0], ['name' => 'Fresa', 'price' => 0]], 'sort_order' => 10],
            ['name' => 'Oniguiri Especial', 'description' => 'Empanizado o de ajonjolí', 'price' => 96, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/oniguiri.png', 'modifiers' => [['name' => 'Empanizado', 'price' => 0], ['name' => 'Ajonjolí', 'price' => 0]], 'sort_order' => 11],
            ['name' => 'Ariday Maki', 'description' => 'Maki especial Ariday con ingredientes premium', 'price' => 228, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Ariday.jpeg', 'modifiers' => [], 'sort_order' => 12],
            ['name' => 'Big Almond', 'description' => 'Maki grande con almendras', 'price' => 228, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Big almond.jpeg', 'modifiers' => [], 'sort_order' => 13],
            ['name' => 'Maki Samurai', 'description' => 'Maki estilo samurai con ingredientes premium', 'price' => 228, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Maki samurai.jpeg', 'modifiers' => [], 'sort_order' => 14],
            ['name' => 'Maki Yin', 'description' => 'Maki especial Yin', 'price' => 199, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Maki yin.jpeg', 'modifiers' => [], 'sort_order' => 15],
            ['name' => 'Maki Yang', 'description' => 'Maki especial Yang', 'price' => 199, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Maki yang.jpeg', 'modifiers' => [], 'sort_order' => 16],
            ['name' => 'Niku Maki', 'description' => 'Maki especial con carne', 'price' => 228, 'category' => 'Makis Especiales', 'image_url' => '/images/menu/Makis Especiales/Niku.jpeg', 'modifiers' => [], 'sort_order' => 17],

            // ═══ YAKIMESHI ═══
            ['name' => 'Yakimeshi Yasai (Verduras)', 'description' => 'Arroz frito con verduras', 'price' => 89, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-yasai.png', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Yakimeshi Tori (Pollo)', 'description' => 'Arroz frito con pollo', 'price' => 115, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-tori.png', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Yakimeshi Gyuniku (Res)', 'description' => 'Arroz frito con carne de res', 'price' => 115, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-gyuniku.png', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Yakimeshi Ebi (Camarón)', 'description' => 'Arroz frito con camarón', 'price' => 130, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-ebi.png', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Yakimeshi Shifudo (Mariscos)', 'description' => 'Arroz frito con mariscos', 'price' => 141, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-shifudo.png', 'modifiers' => [], 'sort_order' => 5],
            ['name' => 'Yakimeshi Mixto', 'description' => 'Arroz frito mixto con variedad de proteínas', 'price' => 154, 'category' => 'Yakimeshi', 'image_url' => '/images/menu/Yakimeshi/yakimeshi-mixto.jpeg', 'modifiers' => [], 'sort_order' => 6],

            // ═══ YAKISOBA ═══
            ['name' => 'Yakisoba Verduras', 'description' => 'Tallarines salteados con verduras', 'price' => 121, 'category' => 'Yakisoba', 'image_url' => '/images/menu/Yakisoba/Verduras.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Yakisoba Pollo', 'description' => 'Tallarines salteados con pollo', 'price' => 130, 'category' => 'Yakisoba', 'image_url' => '/images/menu/Yakisoba/Pollo.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Yakisoba Res', 'description' => 'Tallarines salteados con carne de res', 'price' => 130, 'category' => 'Yakisoba', 'image_url' => '/images/menu/Yakisoba/yakisoba-res.png', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Yakisoba Camarón', 'description' => 'Tallarines salteados con camarón', 'price' => 137, 'category' => 'Yakisoba', 'image_url' => '/images/menu/Yakisoba/Camaron.jpeg', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Yakisoba Mixto', 'description' => 'Tallarines salteados mixtos', 'price' => 146, 'category' => 'Yakisoba', 'image_url' => '/images/menu/Yakisoba/yakisoba-mixto.png', 'modifiers' => [], 'sort_order' => 5],

            // ═══ TEPPANYAKI ═══
            ['name' => 'Teppanyaki Verduras', 'description' => 'Verduras a la plancha estilo teppanyaki', 'price' => 121, 'category' => 'Teppanyaki', 'image_url' => '/images/menu/Teppanyaki/Verduras.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Teppanyaki Res o Pollo', 'description' => 'Res o pollo a la plancha estilo teppanyaki', 'price' => 156, 'category' => 'Teppanyaki', 'image_url' => '/images/menu/Teppanyaki/teppanyaki-res-pollo.png', 'modifiers' => [['name' => 'Res', 'price' => 0], ['name' => 'Pollo', 'price' => 0]], 'sort_order' => 2],
            ['name' => 'Teppanyaki Camarón', 'description' => 'Camarón a la plancha estilo teppanyaki', 'price' => 173, 'category' => 'Teppanyaki', 'image_url' => '/images/menu/Teppanyaki/teppanyaki-camaron.png', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Teppanyaki Mixto', 'description' => 'Mixto a la plancha estilo teppanyaki', 'price' => 199, 'category' => 'Teppanyaki', 'image_url' => '/images/menu/Teppanyaki/Mixto.jpeg', 'modifiers' => [], 'sort_order' => 4],

            // ═══ TEMPURAS ═══
            ['name' => 'Tempura Verduras', 'description' => 'Verduras en tempura crujiente', 'price' => 130, 'category' => 'Tempuras', 'image_url' => '/images/menu/Teppanyaki/tempura-verduras.png', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Tempura Camarón', 'description' => 'Camarones en tempura crujiente', 'price' => 199, 'category' => 'Tempuras', 'image_url' => '/images/menu/Teppanyaki/tempura-camaron.png', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Tempura Mixto', 'description' => 'Mezcla de verduras y camarón en tempura', 'price' => 233, 'category' => 'Tempuras', 'image_url' => '/images/menu/Teppanyaki/tempura-mixto.png', 'modifiers' => [], 'sort_order' => 3],

            // ═══ PAQUETES ═══
            ['name' => 'Paquete Eby Furai', 'description' => 'Camarón empanizado. Incluye Yakimeshi, Ensalada y Kushiage de queso', 'price' => 311, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/paquete-eby-furai.png', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Paquete Sakana Furai', 'description' => 'Pescado empanizado. Incluye Yakimeshi, Ensalada y Kushiage de queso', 'price' => 242, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/sakana-furai.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Paquete Pechuga Maki', 'description' => 'Pechuga maki. Incluye Yakimeshi, Ensalada y Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/pechuga-maki.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Paquete Yakisoba', 'description' => 'Yakisoba. Incluye Yakimeshi, Ensalada y Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/paquete-yakishoba.jpeg', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Paquete Sushi Maki', 'description' => 'Sushi maki empanizado o ajonjolí tostado. Incluye Yakimeshi, Ensalada y Kushiage', 'price' => 181, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/sushi-maki.jpeg', 'modifiers' => [['name' => 'Empanizado', 'price' => 0], ['name' => 'Ajonjolí tostado', 'price' => 0]], 'sort_order' => 5],
            ['name' => 'Paquete Tori Queso', 'description' => 'Tori queso. Incluye Yakimeshi, Ensalada y Kushiage de queso', 'price' => 181, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/tori-queso.jpeg', 'modifiers' => [], 'sort_order' => 6],
            ['name' => 'Camarones Coco', 'description' => 'Camarones empanizados con coco. Incluye Yakimeshi, Ensalada y Kushiage', 'price' => 311, 'category' => 'Paquetes', 'image_url' => '/images/menu/Paquete Alcance/camarones-coco.jpeg', 'modifiers' => [], 'sort_order' => 7],

            // ═══ PASTAS QUEEN ═══
            ['name' => 'Pasta Boloñesa', 'description' => 'Puré de tomate, vino tinto, carne molida, finas hierbas y queso parmesano', 'price' => 160, 'category' => 'Pastas Queen', 'image_url' => '/images/menu/Pasta/pasta-bolognesa.png', 'modifiers' => $pastaMods, 'sort_order' => 1],
            ['name' => 'Pasta Alfredo', 'description' => 'Pasta a la crema con mantequilla, queso parmesano y finas hierbas', 'price' => 140, 'category' => 'Pastas Queen', 'image_url' => '/images/menu/Pasta/Alfredo.jpeg', 'modifiers' => $pastaMods, 'sort_order' => 2],
            ['name' => 'Pasta Poblana', 'description' => 'Crema de chile poblano, elote, pechuga de pollo y queso parmesano', 'price' => 165, 'category' => 'Pastas Queen', 'image_url' => '/images/menu/Pasta/Poblana.jpeg', 'modifiers' => $pastaMods, 'sort_order' => 3],
            ['name' => 'Pasta 4 Quesos', 'description' => 'Pasta cremosa de parmesano, queso crema, manchego y mozzarella', 'price' => 165, 'category' => 'Pastas Queen', 'image_url' => '/images/menu/Pasta/4 quesos.jpeg', 'modifiers' => $pastaMods, 'sort_order' => 4],
            ['name' => 'Pasta di Salmón', 'description' => 'Pasta a la mantequilla con jitomate cherry, espinaca y salmón', 'price' => 250, 'category' => 'Pastas Queen', 'image_url' => '/images/menu/Pasta/pasta-di-salmon.png', 'modifiers' => $pastaMods, 'sort_order' => 5],

            // ═══ POSTRES ═══
            ['name' => 'Camelado', 'description' => 'Postre japonés caramelizado', 'price' => 89, 'category' => 'Postres', 'image_url' => '/images/menu/Postres/Camelado.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Maki Oreo', 'description' => 'Maki dulce con galleta Oreo', 'price' => 115, 'category' => 'Postres', 'image_url' => '/images/menu/Postres/Maki oreo.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Tempura Banana', 'description' => 'Plátano en tempura con miel y ajonjolí', 'price' => 101, 'category' => 'Postres', 'image_url' => '/images/menu/Postres/Tempura banana.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Tempura Helado', 'description' => 'Helado envuelto en tempura crujiente', 'price' => 130, 'category' => 'Postres', 'image_url' => '/images/menu/Postres/Tempura helado.jpeg', 'modifiers' => [], 'sort_order' => 4],

            // ═══ BEBIDAS ═══
            ['name' => 'Agua Natural', 'description' => 'Agua natural 600ml', 'price' => 25, 'category' => 'Bebidas', 'image_url' => '/images/menu/Agua/Natural.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Agua Mineral', 'description' => 'Agua mineral 600ml', 'price' => 30, 'category' => 'Bebidas', 'image_url' => '/images/menu/Agua/Mineral.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Agua Mineral de Fruta', 'description' => 'Agua mineral con sabor a fruta', 'price' => 35, 'category' => 'Bebidas', 'image_url' => '/images/menu/Agua/Mineral fruta.jpeg', 'modifiers' => [], 'sort_order' => 3],
            ['name' => 'Limonada', 'description' => 'Limonada natural', 'price' => 40, 'category' => 'Bebidas', 'image_url' => '/images/menu/Agua/Limonada.jpeg', 'modifiers' => [], 'sort_order' => 4],
            ['name' => 'Refresco Lata', 'description' => 'Refresco en lata', 'price' => 30, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas sin/Refresco lata.jpeg', 'modifiers' => [], 'sort_order' => 5],
            ['name' => 'Calpis', 'description' => 'Bebida japonesa Calpis', 'price' => 45, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas sin/Calpis.jpeg', 'modifiers' => [], 'sort_order' => 6],
            ['name' => 'Calpis de Fruta', 'description' => 'Bebida japonesa Calpis con sabor a fruta', 'price' => 50, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas sin/Calpis fruta.jpeg', 'modifiers' => [], 'sort_order' => 7],
            ['name' => 'Café', 'description' => 'Café caliente', 'price' => 35, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas otras/cafe.jpeg', 'modifiers' => [], 'sort_order' => 8],
            ['name' => 'Té Verde', 'description' => 'Té verde japonés', 'price' => 35, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas otras/te-verde.jpeg', 'modifiers' => [], 'sort_order' => 9],
            ['name' => 'Cerveza Lata', 'description' => 'Cerveza en lata', 'price' => 45, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas con/Cerveza lata.jpeg', 'modifiers' => [], 'sort_order' => 10],
            ['name' => 'Nochebuena', 'description' => 'Cerveza Nochebuena', 'price' => 55, 'category' => 'Bebidas', 'image_url' => '/images/menu/Bebidas con/Nochebuena.jpeg', 'modifiers' => [], 'sort_order' => 11],

            // ═══ SALSAS / EXTRAS ═══
            ['name' => 'Salsa Anguila', 'description' => 'Salsa de anguila dulce', 'price' => 25, 'category' => 'Extras', 'image_url' => '/images/menu/Salsas/Salsa anguila.jpeg', 'modifiers' => [], 'sort_order' => 1],
            ['name' => 'Salsa Mayo Chipotle', 'description' => 'Mayonesa con chipotle', 'price' => 25, 'category' => 'Extras', 'image_url' => '/images/menu/Salsas/Salsa mayo chipotle.jpeg', 'modifiers' => [], 'sort_order' => 2],
            ['name' => 'Salsa Tampico', 'description' => 'Salsa estilo Tampico', 'price' => 25, 'category' => 'Extras', 'image_url' => '/images/menu/Salsas/Salsa tampico.jpeg', 'modifiers' => [], 'sort_order' => 3],
        ];

        foreach ($menuItems as $item) {
            $item['available'] = true;
            MenuItem::updateOrCreate(['name' => $item['name']], $item);
        }
        $this->command->info('Seeded ' . count($menuItems) . ' menu items with modifiers');

        // ─── Promotions ──────────────────────────────────────────
        $promotions = [
            ['title' => '2x1 en Makis', 'description' => 'Lleva 2 makis y paga solo 1. Válido de lunes a miércoles.', 'discount_type' => '2x1', 'discount_value' => 50.0, 'applicable_items' => ['Makis'], 'starts_at' => now(), 'expires_at' => now()->addMonths(1), 'active' => true, 'code' => 'MAKI2X1', 'usage_count' => 0, 'max_usage' => 500],
            ['title' => '15% OFF Primera Compra', 'description' => '15% de descuento en tu primer pedido por la web.', 'discount_type' => 'percentage', 'discount_value' => 15.0, 'applicable_items' => [], 'starts_at' => now(), 'expires_at' => now()->addMonths(3), 'active' => true, 'code' => 'BIENVENIDO15', 'usage_count' => 0, 'max_usage' => 1000],
            ['title' => 'Paquete Queen -$30', 'description' => '$30 de descuento en cualquier Paquete. Solo por WhatsApp.', 'discount_type' => 'fixed', 'discount_value' => 30.0, 'applicable_items' => ['Paquetes'], 'starts_at' => now(), 'expires_at' => now()->addWeeks(2), 'active' => true, 'code' => 'QUEENDESC', 'usage_count' => 0, 'max_usage' => 200],
        ];
        foreach ($promotions as $promo) {
            Promotion::updateOrCreate(['code' => $promo['code']], $promo);
        }
        $this->command->info('Seeded ' . count($promotions) . ' promotions');
    }
}
