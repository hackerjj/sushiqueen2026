<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password {--email=admin@sushiqueen.com} {--password=admin123}';
    protected $description = 'Reset admin user password';

    public function handle(): int
    {
        $email = $this->option('email');
        $password = $this->option('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->info("User not found. Creating admin user...");
            User::create([
                'name' => 'Admin Sushi Queen',
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
            ]);
            $this->info("Admin user created: {$email}");
            return 0;
        }

        $user->update(['password' => Hash::make($password)]);
        $this->info("Password reset for: {$email}");
        return 0;
    }
}
