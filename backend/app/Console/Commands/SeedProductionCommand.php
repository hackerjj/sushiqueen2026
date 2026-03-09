<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SeedProductionCommand extends Command
{
    protected $signature = 'db:seed-production';

    protected $description = 'Run database seeder with interactive confirmation (safe for production use)';

    public function handle(): int
    {
        if (!$this->confirm('⚠️  This will run the database seeder with --force. Are you sure you want to continue?')) {
            $this->info('Seeding cancelled.');
            return 0;
        }

        $this->info('Running database seeder...');

        try {
            Artisan::call('db:seed', ['--force' => true]);
            $output = Artisan::output();

            $this->info('✅ Database seeded successfully.');

            if (trim($output)) {
                $this->line($output);
            }

            return 0;
        } catch (\Throwable $e) {
            $this->error('❌ Seeding failed: ' . $e->getMessage());
            return 1;
        }
    }
}
