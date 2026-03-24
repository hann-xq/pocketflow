import { db } from "./database";

export type Transaction = {
  id: number; // auto-incremented by SQLite
  title: string;
  amount: number;
  date: string;
  is_expense: number;
};

export async function getTransactions(): Promise<Transaction[]> {
  const result = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions ORDER BY date DESC`
  );

  return result;
}

export async function updateTransaction(
    id: number,
    title: string,
    amount: number,
    date: string
) {
  await db.runAsync(
`UPDATE transactions SET title = ?, amount = ?, date = ? WHERE id = ?`,
[title, amount, date, id]
  );
}

export async function addTransaction(
    title: string,
    amount: number,
    date: string,
    is_expense: number
) {
  await db.runAsync(
    `INSERT INTO transactions (title, amount, date, is_expense) VALUES (?, ?, ?, ?)`,
    [title, amount, date, is_expense]
  );
}

export async function deleteTransaction(id: number) {
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
}
