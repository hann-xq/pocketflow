import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("database.db");
const schema = `
    CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        is_expense INTEGER NOT NULL
    )`;
export async function initDatabase() {
    await db.execAsync(`DROP TABLE IF EXISTS transactions`);
    await db.execAsync(schema);
}

export async function seedDatabase() {
    const result = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM transactions`
    );

    if (result.count > 0) return;

    await db.execAsync(
        `INSERT INTO transactions (title, amount, date, is_expense) VALUES ("McDonald's", 15.99, "2026-02-01", 1);
        INSERT INTO transactions (title, amount, date, is_expense) VALUES ("Jumbo Deventer", 12.57, "2026-02-01", 1);
        INSERT INTO transactions (title, amount, date, is_expense) VALUES ("Donerix", 12.99, "2026-02-01", 1);
    `);
}
