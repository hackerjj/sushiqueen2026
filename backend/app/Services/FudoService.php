<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * @deprecated Fudo POS integration has been migrated away.
 * This stub exists to prevent runtime errors from legacy references.
 */
class FudoService
{
    /**
     * Send order to Fudo POS (deprecated stub).
     *
     * @param  mixed  $order
     * @return null
     */
    public function sendOrderToFudo($order)
    {
        Log::warning('FudoService: sendOrderToFudo() called but Fudo integration is deprecated. No action taken.', [
            'order_id' => (string) ($order->_id ?? 'unknown'),
        ]);

        return null;
    }
}
