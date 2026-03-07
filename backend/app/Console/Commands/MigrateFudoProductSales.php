<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateFudoProductSales extends Command
{
    protected $signature = 'fudo:product-sales {--fresh : Drop existing collection first}';
    protected $description = 'Migrate Fudo product sales data from productos.json into product_sales collection';

    // Map Fudo product names to our menu names (fuzzy match + manual overrides)
    private array $nameMap = [
        // Makis
        'Maki Empanizado' => 'Maki Empanizado',
        'Maki Empanizado De Manchego' => 'Maki Empanizado Manchego',
        'Maki Ajonjoli Tostado' => 'Maki Ajonjolí Tostado',
        'Maki Manchego' => 'Maki Manchego',
        'Maki Philadelphia' => 'Maki Philadelphia',
        'Maki Mango' => 'Maki Mango',
        'Maki Nori' => 'Maki Nori',
        'Maki Surimi' => 'Maki Surimi',
        'Maki Camaron' => 'Maki Camarón',
        'Maki Salmon' => 'Maki Salmón',
        'Maki Atun' => 'Maki Atún',
        'Tekka Maki' => 'Tekka Maki',
        'Temaki' => 'Temaki',
        'Onigiri' => 'Onigiri',
        'Maki Sandwich' => 'Maki Sandwich',
        'Kappa Maki' => 'Kappa Maki',
        'Mini Rollo' => 'Mini Rollo',
        'Nigiri' => 'Nigiri',
        // Makis Especiales
        'Queen Maki' => 'Queen Maki',
        'Dragon Queen' => 'Dragon Queen',
        'Salmon Picante' => 'Salmón Picante',
        'Salmón Picante' => 'Salmón Picante',
        'Atún Spicy' => 'Spicy Tuna',
        'Spicy Tuna' => 'Spicy Tuna',
        'Maki Masago' => 'Maki Masago',
        'Maki Anguila' => 'Maki Anguila',
        'Combinacion Queen' => 'Combinación Queen',
        'Combinación Queen' => 'Combinación Queen',
        'Arcoiris Maki' => 'Arcoíris Maki',
        'Arcoíris Maki' => 'Arcoíris Maki',
        'Maki Frutas' => 'Maki Frutas',
        'Ariday' => 'Ariday Maki',
        'Big Almond' => 'Big Almond',
        'Maki Samurai' => 'Maki Samurai',
        'Maki Yin' => 'Maki Yin',
        'Maki Yang' => 'Maki Yang',
        'Niku Maki' => 'Niku Maki',
        // Yakimeshi
        'Yakimeshi Yasai Verduras' => 'Yakimeshi Yasai (Verduras)',
        'Yakimeshi Tori Pollo' => 'Yakimeshi Tori (Pollo)',
        'Yakimeshi Gyuniku Res' => 'Yakimeshi Gyuniku (Res)',
        'Yakimeshi Ebi Camaron' => 'Yakimeshi Ebi (Camarón)',
        'Yakimeshi Shifudo Mariscos' => 'Yakimeshi Shifudo (Mariscos)',
        'Yakimeshi Mixto' => 'Yakimeshi Mixto',
        'Yakimeshi Arrachera' => 'Yakimeshi Mixto',
        // Yakisoba
        'Yakisoba Verduras' => 'Yakisoba Verduras',
        'Yakisoba Pollo' => 'Yakisoba Pollo',
        'Yakisoba Res' => 'Yakisoba Res',
        'Yakisoba Camaron' => 'Yakisoba Camarón',
        'Yakisoba Mixto' => 'Yakisoba Mixto',
        // Teppanyaki
        'Teppanyaki Verduras' => 'Teppanyaki Verduras',
        'Teppanyaki Res' => 'Teppanyaki Res o Pollo',
        'Teppanyaki Pollo' => 'Teppanyaki Res o Pollo',
        'Teppanyaki Camaron' => 'Teppanyaki Camarón',
        'Teppanyaki Mixto' => 'Teppanyaki Mixto',
        // Tempuras
        'Tempura Verduras' => 'Tempura Verduras',
        'Tempura Camaron' => 'Tempura Camarón',
        'Tempura Mixto' => 'Tempura Mixto',
        // Especialidades
        'Gohan Especial' => 'Gohan Especial',
        'Gohan' => 'Gohan',
        'Gohan Tampico' => 'Gohan Tampico',
        'Gyu Don' => 'Gyu Don',
        'Tori Don' => 'Tori Don',
        'Chop Suey Mixto' => 'Chop Suey Mixto',
        // Sopas
        'Ramen Especial' => 'Ramen Especial',
        'Tori Ramen' => 'Tori Ramen',
        'Misoshiru' => 'Misoshiru',
        'Sumashi' => 'Sumashi',
        // Entradas
        'Edamames' => 'Edamames',
        'Gyosas' => 'Gyosas',
        // Kushiages
        'Orden Kushiague Queso' => 'Kushiage Queso',
        'Orden Kushiague Platano' => 'Kushiage Plátano',
        'Orden Kushiague Platano Con Queso' => 'Kushiage Plátano con Queso',
        'Orden Kushiague Pollo' => 'Kushiage Pollo',
        'Orden Kushiague Pollo Con Queso' => 'Kushiage Pollo con Queso',
        'Orden Kushiague Surimi' => 'Kushiage Surimi',
        'Orden Kushiague Surimi Con Queso' => 'Kushiage Surimi con Queso',
        'Orden Kushiague Camaron' => 'Kushiage Camarón',
        'Orden Kushiague Camaron Con Queso' => 'Kushiage Camarón con Queso',
        'Orden Kushiague Salmon' => 'Kushiage Salmón',
        'Orden Kushiague Salmon Con Queso' => 'Kushiage Salmón con Queso',
        // Paquetes
        'Paquete Sushi Maki' => 'Paquete Sushi Maki',
        'Paquete Pechuga Maki' => 'Paquete Pechuga Maki',
        'Paquete Tori Queso' => 'Paquete Tori Queso',
        'Paquete Yakisoba' => 'Paquete Yakisoba',
        'Paquete Eby Furai' => 'Paquete Eby Furai',
        'Paquete Sakana Furai' => 'Paquete Sakana Furai',
        'Camarones Coco' => 'Camarones Coco',
        // Pastas
        'espagueti bolognesa' => 'Pasta Boloñesa',
        'Espagueti Bolognesa' => 'Pasta Boloñesa',
        'espagueti alfredo' => 'Pasta Alfredo',
        'Espagueti Alfredo' => 'Pasta Alfredo',
        'espagueti poblana' => 'Pasta Poblana',
        'Espagueti Poblana' => 'Pasta Poblana',
        'espagueti 4 quesos' => 'Pasta 4 Quesos',
        'Espagueti 4 Quesos' => 'Pasta 4 Quesos',
        'espagueti di salmon' => 'Pasta di Salmón',
        'Espagueti Di Salmon' => 'Pasta di Salmón',
        // Postres
        'Camelado' => 'Camelado',
        'Maki Oreo' => 'Maki Oreo',
        'Tempura Banana' => 'Tempura Banana',
        'Tempura Helado' => 'Tempura Helado',
        // Bebidas
        'Coca Cola' => 'Refresco Lata',
        'Coca Cero' => 'Refresco Lata',
        'Refresco De Lata' => 'Refresco Lata',
        'Calpis Natural' => 'Calpis',
        'Calpis de Fresa' => 'Calpis de Fruta',
        'Calpis de Mango' => 'Calpis de Fruta',
        'Calpis de Maracuya' => 'Calpis de Fruta',
        'Calpis de Guanabana' => 'Calpis de Fruta',
        'Agua Natural (botella)' => 'Agua Natural',
        'Agua Mineral lata' => 'Agua Mineral',
        'Agua Mineral de Fresa' => 'Agua Mineral de Fruta',
        'Agua Mineral de Mango' => 'Agua Mineral de Fruta',
        'Agua Mineral de Maracuya' => 'Agua Mineral de Fruta',
        'Agua Mineral de Guanabana' => 'Agua Mineral de Fruta',
        'Agua de Fresa' => 'Limonada',
        'Agua de Mango' => 'Limonada',
        'Agua de Maracuya' => 'Limonada',
        'Agua de Guanabana' => 'Limonada',
        'Agua de Jamaica' => 'Limonada',
        'Cerveza Victoria' => 'Cerveza Lata',
        'CERVEZA NOCHE BUENA' => 'Nochebuena',
        'Café' => 'Café',
        'Cafe Americano' => 'Café',
        'Té Verde' => 'Té Verde',
        // Salsas
        'Orden Salsa de Tampico' => 'Salsa Tampico',
        'Orden Salsa de Anguila' => 'Salsa Anguila',
        'Orden Salsa Mayo Chipotle' => 'Salsa Mayo Chipotle',
    ];

    public function handle()
    {
        $file = storage_path('app/fudo_data/productos.json');
        if (!file_exists($file)) {
            $this->error('productos.json not found');
            return;
        }

        if ($this->option('fresh')) {
            DB::connection('mongodb')->collection('product_sales')->drop();
            $this->warn('Dropped product_sales collection');
        }

        $data = json_decode(file_get_contents($file), true);
        $salesEntries = array_filter($data, fn($d) => !empty($d['Producto']));
        $this->info('Processing ' . count($salesEntries) . ' product sale entries...');

        $batch = [];
        $matched = 0;
        $unmatched = 0;
        $unmatchedNames = [];

        foreach ($salesEntries as $entry) {
            $fudoName = $entry['Producto'];
            $menuName = $this->matchProduct($fudoName);
            $category = $entry['Categoría'] ?? $entry['Sub categoría'] ?? 'Otros';

            if (!$menuName) {
                $unmatched++;
                $unmatchedNames[$fudoName] = ($unmatchedNames[$fudoName] ?? 0) + ($entry['Cantidades vendidas'] ?? 0);
                $menuName = $fudoName; // Keep original name for unmatched
            } else {
                $matched++;
            }

            $date = $entry['Fecha'] ?? null;
            if (!$date) continue;

            $batch[] = [
                'fudo_name' => $fudoName,
                'product_name' => $menuName,
                'category' => $category,
                'quantity' => floatval($entry['Cantidades vendidas'] ?? 0),
                'revenue' => floatval($entry['Monto total'] ?? 0),
                'date' => new \MongoDB\BSON\UTCDateTime(new \DateTime(str_replace(' ', 'T', $date))),
                'source' => 'fudo',
            ];

            if (count($batch) >= 1000) {
                DB::connection('mongodb')->collection('product_sales')->insert($batch);
                $batch = [];
                $this->output->write("\r  Processed: " . ($matched + $unmatched) . "...");
            }
        }

        if (count($batch) > 0) {
            DB::connection('mongodb')->collection('product_sales')->insert($batch);
        }

        $this->info("\n  Matched: {$matched}, Unmatched: {$unmatched}");
        $this->info('  Total inserted: ' . ($matched + $unmatched));

        // Show top unmatched for debugging
        if ($unmatched > 0) {
            arsort($unmatchedNames);
            $this->warn('  Top unmatched products:');
            $i = 0;
            foreach ($unmatchedNames as $name => $qty) {
                if ($i++ >= 15) break;
                $this->line("    {$name}: {$qty}");
            }
        }
    }

    private function matchProduct(string $fudoName): ?string
    {
        // Direct map
        if (isset($this->nameMap[$fudoName])) {
            return $this->nameMap[$fudoName];
        }

        // Case-insensitive map
        $lower = mb_strtolower($fudoName);
        foreach ($this->nameMap as $key => $val) {
            if (mb_strtolower($key) === $lower) return $val;
        }

        // Fuzzy: remove accents and try
        $normalized = $this->removeAccents($lower);
        foreach ($this->nameMap as $key => $val) {
            if ($this->removeAccents(mb_strtolower($key)) === $normalized) return $val;
        }

        return null;
    }

    private function removeAccents(string $str): string
    {
        return str_replace(
            ['á','é','í','ó','ú','ñ','ü'],
            ['a','e','i','o','u','n','u'],
            $str
        );
    }
}
