<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use Illuminate\Console\Command;

class SeedMenuFromData extends Command
{
    protected $signature = 'menu:seed-from-data
        {--file= : Path to JSON file with menu data (defaults to storage/app/menu_seed_data.json)}
        {--json= : Inline JSON string with menu data}';

    protected $description = 'Seed MongoDB menu_items from menuData.ts JSON export. Upserts by name, preserves _id, soft-deletes missing items.';

    public function handle(): int
    {
        $items = $this->loadMenuData();

        if ($items === null) {
            $this->error('No menu data found. Provide --file, --json, or place menu_seed_data.json in storage/app/.');
            return 1;
        }

        if (!is_array($items) || empty($items)) {
            $this->error('Menu data must be a non-empty JSON array.');
            return 1;
        }

        $result = $this->seedMenu($items);

        $this->info("✅ Menu seed complete:");
        $this->info("   Created:      {$result['created']}");
        $this->info("   Updated:      {$result['updated']}");
        $this->info("   Soft-deleted: {$result['soft_deleted']}");
        $this->info("   Total active: {$result['total_active']}");

        return 0;
    }

    /**
     * Load menu data from --json, --file, or default JSON file.
     */
    private function loadMenuData(): ?array
    {
        // Priority 1: inline JSON
        if ($json = $this->option('json')) {
            return json_decode($json, true);
        }

        // Priority 2: explicit file path
        if ($file = $this->option('file')) {
            if (!file_exists($file)) {
                $this->error("File not found: {$file}");
                return null;
            }
            return json_decode(file_get_contents($file), true);
        }

        // Priority 3: default location
        $default = storage_path('app/menu_seed_data.json');
        if (file_exists($default)) {
            return json_decode(file_get_contents($default), true);
        }

        return null;
    }

    /**
     * Core seed logic — can be called from the command or from the API endpoint.
     *
     * @param array $items Array of menu item data from menuData.ts
     * @return array Summary with created, updated, soft_deleted, total_active counts
     */
    public static function seedMenu(array $items): array
    {
        $created = 0;
        $updated = 0;
        $processedNames = [];

        foreach ($items as $item) {
            $name = $item['name'] ?? null;
            if (!$name) {
                continue;
            }

            $processedNames[] = $name;

            $fields = [
                'image_url'   => $item['image_url'] ?? '',
                'price'       => (float) ($item['price'] ?? 0),
                'description' => $item['description'] ?? '',
                'category'    => $item['category'] ?? 'General',
                'modifiers'   => $item['modifiers'] ?? [],
                'sort_order'  => (int) ($item['sort_order'] ?? 0),
                'available'   => $item['available'] ?? true,
            ];

            $existing = MenuItem::where('name', $name)->first();

            if ($existing) {
                $existing->update($fields);
                $updated++;
            } else {
                MenuItem::create(array_merge(['name' => $name], $fields));
                $created++;
            }
        }

        // Soft-delete: mark items NOT in menuData as available: false
        $softDeleted = MenuItem::whereNotIn('name', $processedNames)
            ->where('available', true)
            ->count();

        MenuItem::whereNotIn('name', $processedNames)
            ->where('available', true)
            ->update(['available' => false]);

        $totalActive = MenuItem::where('available', true)->count();

        return [
            'created'      => $created,
            'updated'      => $updated,
            'soft_deleted' => $softDeleted,
            'total_active' => $totalActive,
        ];
    }
}
