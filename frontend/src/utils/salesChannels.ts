/**
 * Sales channel types and utilities for POS
 */

export type SalesChannel = 'tables' | 'counter' | 'delivery' | 'express';

export interface SalesChannelTab {
  id: SalesChannel;
  label: string;
  icon: string;
}

export const SALES_CHANNELS: SalesChannelTab[] = [
  { id: 'tables', label: 'Mesas', icon: '🪑' },
  { id: 'counter', label: 'Mostrador', icon: '🏪' },
  { id: 'delivery', label: 'Delivery', icon: '🛵' },
  { id: 'express', label: 'Mostrador Express', icon: '⚡' },
];

/**
 * Determines if a channel requires a table assignment.
 * Only the "tables" channel requires a table.
 */
export function channelRequiresTable(channel: SalesChannel): boolean {
  return channel === 'tables';
}

/**
 * Determines if a channel allows orders without a table.
 * "counter" and "express" channels allow tableless orders.
 */
export function channelAllowsTablelessOrder(channel: SalesChannel): boolean {
  return channel === 'counter' || channel === 'express';
}

/**
 * Maps a sales channel to the corresponding OrderType.
 */
export function channelToOrderType(channel: SalesChannel): 'dine_in' | 'takeout' | 'delivery' {
  if (channel === 'tables') return 'dine_in';
  if (channel === 'delivery') return 'delivery';
  return 'takeout'; // counter and express
}

/**
 * Returns the default customer name for a channel when no customer is specified.
 */
export function channelDefaultCustomerName(channel: SalesChannel, tableNum?: number): string {
  if (channel === 'counter') return 'Mostrador';
  if (channel === 'express') return 'Express';
  if (channel === 'tables' && tableNum) return `Mesa ${tableNum}`;
  return '';
}
