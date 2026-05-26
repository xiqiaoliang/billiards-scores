import Dexie, { type Table } from 'dexie';
import type { MatchRecord } from '../domain/types';

export class BilliardsDatabase extends Dexie {
  matches!: Table<MatchRecord, string>;

  constructor() {
    super('billiards-scores');
    this.version(1).stores({
      matches: 'id, status, createdAt',
    });
  }
}

export const db = new BilliardsDatabase();
