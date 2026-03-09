<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class PostDeployCommand extends Command
{
    protected $signature = 'post-deploy:run';

    protected $description = 'Run post-deploy tasks: seed menu from data and recalculate customer stats';

    public function handle(): int
    {
        if (!$this->confirm('⚠️  This will seed the menu and recalculate all customer stats. Are you sure you want to continue?')) {
            $this->info('Post-deploy cancelled.');
            return 0;
        }

        $results = [];

        // 1. Seed menu from data
        $this->info('Seeding menu from data...');
        try {
            Artisan::call('menu:seed-from-data');
            $output = trim(Artisan::output());
            $results['menu_seed'] = $output;
            $this->info('✅ Menu seed: ' . $output);
        } catch (\Throwable $e) {
            $results['menu_seed'] = 'ERROR: ' . $e->getMessage();
            $this->error('❌ Menu seed failed: ' . $e->getMessage());
        }

        // 2. Recalculate customer stats (total_orders, total_spent)
        $this->info('Recalculating customer stats...');
        try {
            $customers = Customer::all();
            $updated = 0;
            foreach ($customers as $customer) {
                $orders = Order::where('customer.phone', $customer->phone)->get();
                $totalOrders = $orders->count();
                $totalSpent = $orders->sum('total');
                $customer->update([
                    'total_orders' => $totalOrders,
                    'total_spent' => $totalSpent,
                ]);
                $updated++;
            }
            $results['customer_stats'] = "Updated {$updated} customers";
            $this->info("✅ Customer stats: Updated {$updated} customers");
        } catch (\Throwable $e) {
            $results['customer_stats'] = 'ERROR: ' . $e->getMessage();
            $this->error('❌ Customer stats failed: ' . $e->getMessage());
        }

        $this->newLine();
        $this->info('Post-deploy complete.');
        $this->table(['Task', 'Result'], collect($results)->map(fn($v, $k) => [$k, $v])->values()->toArray());

        return 0;
    }
}
