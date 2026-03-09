<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateFudoProductionCommand extends Command
{
    protected $signature = 'fudo:migrate-production {--fresh : Drop existing collections before migrating}';

    protected $description = 'Run Fudo data migration with interactive confirmation (safe for production use)';

    public function handle(): int
    {
        $fresh = $this->option('fresh');

        $warning = $fresh
            ? '⚠️  This will DROP existing collections and re-migrate all Fudo data. Are you sure?'
            : '⚠️  This will migrate Fudo data into MongoDB. Are you sure you want to continue?';

        if (!$this->confirm($warning)) {
            $this->info('Migration cancelled.');
            return 0;
        }

        $this->info('Running Fudo migration...');

        try {
            $args = $fresh ? ['--fresh' => true] : [];
            Artisan::call('fudo:migrate', $args);
            $output = Artisan::output();

            $this->info('✅ Fudo migration completed successfully.');

            if (trim($output)) {
                $this->line($output);
            }

            return 0;
        } catch (\Throwable $e) {
            $this->error('❌ Fudo migration failed: ' . $e->getMessage());
            return 1;
        }
    }
}
