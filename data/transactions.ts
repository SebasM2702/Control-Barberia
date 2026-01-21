import { collection, addDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, DocumentData, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export type TxType = 'entrada' | 'salida';
export type TxScope = 'negocio' | 'personal';

export type Transaction = {
  id?: string;
  type: TxType;
  scope: TxScope;
  amount: number;
  method: 'efectivo' | 'sinpe';
  serviceId?: string | null;
  categoryId?: string | null;
  description?: string | null;
  date?: any;
  createdBy?: string | null;
};

const transactionsCollection = (businessId: string) => collection(db, 'businesses', businessId, 'transactions');

export async function addTransaction(businessId: string, tx: Omit<Transaction, 'id' | 'date'>) {
  try {
    const ref = await addDoc(transactionsCollection(businessId), {
      ...tx,
      date: serverTimestamp(),
      localCreated: new Date().toISOString()
    });
    return ref.id;
  } catch (err: any) {
    console.error('addTransaction failed', err);
    throw err;
  }
}

export async function fetchTransactions(businessId: string) {
  const q = query(transactionsCollection(businessId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Transaction));
}

export function subscribeTransactions(businessId: string, onChange: (items: Transaction[]) => void) {
  const q = query(transactionsCollection(businessId), orderBy('date', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Transaction));
    onChange(items);
  });
  return unsub;
}

export async function deleteTransaction(businessId: string, transactionId: string) {
  const ref = doc(db, 'businesses', businessId, 'transactions', transactionId);
  await deleteDoc(ref);
}

export async function clearAllTransactions(businessId: string) {
  const q = query(transactionsCollection(businessId));
  const snap = await getDocs(q);
  const batchRequests = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batchRequests);
}

export default {
  addTransaction,
  fetchTransactions,
  subscribeTransactions,
  deleteTransaction,
  clearAllTransactions,
};
