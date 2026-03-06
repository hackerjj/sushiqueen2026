export interface TableInfo {
  _id: string;
  number: number;
  zone: string;
  status: string;
  capacity: number;
}

export function getZoneTables(tables: TableInfo[], zone: string): TableInfo[] {
  return tables
    .filter(t => t.zone === zone)
    .sort((a, b) => a.number - b.number);
}

export function calculateGridColumns(tableCount: number): number {
  if (tableCount <= 0) return 1;
  return Math.min(6, Math.ceil(Math.sqrt(tableCount)));
}


export type TableColor = 'orange' | 'red' | 'green';

export function getTableColor(hasItems: boolean, status: string): TableColor {
  if (hasItems) return 'orange';
  if (status === 'occupied') return 'red';
  return 'green';
}
