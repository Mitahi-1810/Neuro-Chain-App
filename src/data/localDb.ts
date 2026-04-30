import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'neurochain.localdb';

export interface OfflineRecord<T> {
  id: string;
  payload: T;
  sync_status: boolean;
  updated_at: string;
}

const getKey = (table: string) => `${STORAGE_PREFIX}.${table}`;

const encryptPayload = (payload: unknown): string => {
  // TODO: Replace with AES-256 encryption (HIPAA requirement).
  return JSON.stringify(payload);
};

const decryptPayload = (payload: string): any => {
  // TODO: Replace with AES-256 decryption.
  return JSON.parse(payload);
};

const readTable = async <T>(table: string): Promise<OfflineRecord<T>[]> => {
  const raw = await AsyncStorage.getItem(getKey(table));
  if (!raw) return [];
  const encrypted = JSON.parse(raw) as OfflineRecord<string>[];
  return encrypted.map((record) => ({
    ...record,
    payload: decryptPayload(record.payload),
  })) as OfflineRecord<T>[];
};

const writeTable = async <T>(table: string, rows: OfflineRecord<T>[]) => {
  const encrypted = rows.map((row) => ({
    ...row,
    payload: encryptPayload(row.payload),
  }));
  await AsyncStorage.setItem(getKey(table), JSON.stringify(encrypted));
};

export const localDb = {
  async upsert<T>(table: string, record: OfflineRecord<T>) {
    const rows = await readTable<T>(table);
    const next = rows.filter((row) => row.id !== record.id).concat(record);
    await writeTable(table, next);
  },
  async list<T>(table: string) {
    return readTable<T>(table);
  },
  async markSynced(table: string, ids: string[]) {
    const rows = await readTable<any>(table);
    const next = rows.map((row) =>
      ids.includes(row.id)
        ? { ...row, sync_status: true, updated_at: new Date().toISOString() }
        : row
    );
    await writeTable(table, next);
  },
};
