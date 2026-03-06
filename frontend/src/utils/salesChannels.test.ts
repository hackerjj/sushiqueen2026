import { describe, it, expect } from 'vitest';
import {
  SALES_CHANNELS,
  channelRequiresTable,
  channelAllowsTablelessOrder,
  channelToOrderType,
  channelDefaultCustomerName,
} from './salesChannels';
import type { SalesChannel } from './salesChannels';

describe('salesChannels', () => {
  describe('SALES_CHANNELS', () => {
    it('should have exactly 4 channels', () => {
      expect(SALES_CHANNELS).toHaveLength(4);
    });

    it('should contain Mesas, Mostrador, Delivery, Mostrador Express', () => {
      const ids = SALES_CHANNELS.map(c => c.id);
      expect(ids).toEqual(['tables', 'counter', 'delivery', 'express']);
    });

    it('should have labels matching the spec', () => {
      const labels = SALES_CHANNELS.map(c => c.label);
      expect(labels).toEqual(['Mesas', 'Mostrador', 'Delivery', 'Mostrador Express']);
    });
  });

  describe('channelRequiresTable', () => {
    it('should return true for tables channel', () => {
      expect(channelRequiresTable('tables')).toBe(true);
    });

    it('should return false for counter, delivery, express', () => {
      expect(channelRequiresTable('counter')).toBe(false);
      expect(channelRequiresTable('delivery')).toBe(false);
      expect(channelRequiresTable('express')).toBe(false);
    });
  });

  describe('channelAllowsTablelessOrder', () => {
    it('should return true for counter and express', () => {
      expect(channelAllowsTablelessOrder('counter')).toBe(true);
      expect(channelAllowsTablelessOrder('express')).toBe(true);
    });

    it('should return false for tables and delivery', () => {
      expect(channelAllowsTablelessOrder('tables')).toBe(false);
      expect(channelAllowsTablelessOrder('delivery')).toBe(false);
    });
  });

  describe('channelToOrderType', () => {
    it('should map tables to dine_in', () => {
      expect(channelToOrderType('tables')).toBe('dine_in');
    });

    it('should map delivery to delivery', () => {
      expect(channelToOrderType('delivery')).toBe('delivery');
    });

    it('should map counter and express to takeout', () => {
      expect(channelToOrderType('counter')).toBe('takeout');
      expect(channelToOrderType('express')).toBe('takeout');
    });
  });

  describe('channelDefaultCustomerName', () => {
    it('should return "Mostrador" for counter channel', () => {
      expect(channelDefaultCustomerName('counter')).toBe('Mostrador');
    });

    it('should return "Express" for express channel', () => {
      expect(channelDefaultCustomerName('express')).toBe('Express');
    });

    it('should return "Mesa N" for tables channel with table number', () => {
      expect(channelDefaultCustomerName('tables', 5)).toBe('Mesa 5');
    });

    it('should return empty string for tables channel without table number', () => {
      expect(channelDefaultCustomerName('tables')).toBe('');
    });

    it('should return empty string for delivery channel', () => {
      expect(channelDefaultCustomerName('delivery')).toBe('');
    });
  });
});
