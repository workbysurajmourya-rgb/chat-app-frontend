import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'chatapp.db';
let db: SQLite.SQLiteDatabase | null = null;

export interface StoredMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

export async function initDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_conversation ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_receiver ON messages(receiver_id);
  `);
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDb();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  return db;
}

export async function saveMessage(message: StoredMessage): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO messages (id, sender_id, receiver_id, message, created_at, synced_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.sender_id,
      message.receiver_id,
      message.message,
      message.created_at,
      new Date().toISOString()
    ]
  );
}

export async function saveMessages(messages: StoredMessage[]): Promise<void> {
  const database = await getDb();

  await database.withTransactionAsync(async () => {
    for (const message of messages) {
      await database.runAsync(
        `INSERT OR REPLACE INTO messages (id, sender_id, receiver_id, message, created_at, synced_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.sender_id,
          message.receiver_id,
          message.message,
          message.created_at,
          new Date().toISOString()
        ]
      );
    }
  });
}

export async function loadMessages(userId: number, recipientId: number): Promise<StoredMessage[]> {
  const database = await getDb();
  try {
    const result = await database.getAllAsync(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [userId, recipientId, recipientId, userId]
    );

    return result as StoredMessage[];
  } catch (error) {
    return [];
  }
}

export async function clearAllMessages(): Promise<void> {
  try {
    if (!db) {
      return;
    }

    await db.runAsync('DELETE FROM messages');
  } catch (error) {
  }
}

export async function saveItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
