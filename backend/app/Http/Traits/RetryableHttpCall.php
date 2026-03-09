<?php

namespace App\Http\Traits;

use Illuminate\Support\Facades\Log;

trait RetryableHttpCall
{
    /**
     * Execute a callable with retry logic and exponential backoff.
     *
     * @param callable $fn         The function to execute
     * @param int      $maxRetries Maximum number of attempts (default 3)
     * @return mixed               The result of the callable
     * @throws \Throwable          Re-throws the last exception after all retries are exhausted
     */
    protected function retryWithBackoff(callable $fn, int $maxRetries = 3)
    {
        $attempt = 0;
        $delays = [1, 2, 4]; // seconds

        while (true) {
            try {
                return $fn();
            } catch (\Throwable $e) {
                $attempt++;

                if ($attempt >= $maxRetries) {
                    throw $e;
                }

                $delay = $delays[$attempt - 1] ?? 4;

                Log::warning("RetryableHttpCall: Attempt {$attempt}/{$maxRetries} failed", [
                    'error' => $e->getMessage(),
                    'next_retry_in' => $delay,
                ]);

                sleep($delay);
            }
        }
    }
}
