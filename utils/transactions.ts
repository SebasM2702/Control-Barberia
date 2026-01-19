import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export type TransactionType = 'entrada' | 'salida';
export type TransactionScope = 'barberia' | 'personal';

export type Transaction = {
  id?: string;
  type: TransactionType;
  scope: TransactionScope;
  amount: number;
  serviceId?: string | null;
  staffId?: string | null;
  note?: string | null;
  createdAt?: any;
  createdBy?: string | null;
};

const transactionsCollectionPath = (barberShopId: string) => collection(db, 'barberShops', barberShopId, 'transactions');

export async function addTransaction(barberShopId: string, tx: Omit<Transaction, 'id' | 'createdAt'>) {
  const col = transactionsCollectionPath(barberShopId);
  const docRef = await addDoc(col, { ...tx, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function fetchTransactions(barberShopId: string, opts?: { start?: Date; end?: Date }) {
  let q = query(transactionsCollectionPath(barberShopId), orderBy('createdAt', 'desc'));
  if (opts?.start || opts?.end) {
    const clauses: any[] = [];
    if (opts.start) clauses.push(where('createdAt', '>=', opts.start));
    if (opts.end) clauses.push(where('createdAt', '<=', opts.end));
    // rebuild a query with where clauses and ordering
    q = query(transactionsCollectionPath(barberShopId), ...clauses, orderBy('createdAt', 'desc'));
  }

  const snap = await getDocs(q);
  const items: Transaction[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Transaction));
  return items;
}

export function subscribeTransactions(barberShopId: string, onChange: (items: Transaction[]) => void, opts?: { start?: Date; end?: Date }) {
  let q = query(transactionsCollectionPath(barberShopId), orderBy('createdAt', 'desc'));
  if (opts?.start || opts?.end) {
    const clauses: any[] = [];
    if (opts.start) clauses.push(where('createdAt', '>=', opts.start));
    if (opts.end) clauses.push(where('createdAt', '<=', opts.end));
    q = query(transactionsCollectionPath(barberShopId), ...clauses, orderBy('createdAt', 'desc'));
  }

  const unsub = onSnapshot(q, (snap) => {
    const items: Transaction[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Transaction));
    onChange(items);
  });
  return unsub;
}

export async function deleteTransaction(barberShopId: string, transactionId: string) {
  const ref = doc(db, 'barberShops', barberShopId, 'transactions', transactionId);
  await deleteDoc(ref);
}

export async function clearAllTransactions(barberShopId: string) {
  // Note: batched delete might be preferable for production; here we delete sequentially
  const snap = await getDocs(collection(db, 'barberShops', barberShopId, 'transactions'));
  const deletes = snap.docs.map((d) => deleteDoc(doc(db, 'barberShops', barberShopId, 'transactions', d.id)));
  await Promise.all(deletes);
}

export default {
  addTransaction,
  fetchTransactions,
  subscribeTransactions,
};
