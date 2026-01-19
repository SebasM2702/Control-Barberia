import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../utils/firebase';

export type ExpenseCategory = {
  id?: string;
  name: string;
  scope: 'negocio' | 'personal';
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const categoriesCollection = (businessId: string) => collection(db, 'businesses', businessId, 'expenseCategories');

export async function fetchCategories(businessId: string): Promise<ExpenseCategory[]> {
  const q = query(categoriesCollection(businessId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as ExpenseCategory));
}

export function subscribeCategories(businessId: string, onChange: (items: ExpenseCategory[]) => void) {
  const q = query(categoriesCollection(businessId), orderBy('createdAt', 'asc'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as ExpenseCategory));
    onChange(items);
  });
  return unsub;
}

export async function createCategory(businessId: string, data: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(categoriesCollection(businessId), { ...data, active: data.active ?? true, createdAt: new Date() });
  return ref.id;
}

export async function updateCategory(businessId: string, categoryId: string, data: Partial<Omit<ExpenseCategory, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'businesses', businessId, 'expenseCategories', categoryId);
  await updateDoc(ref, { ...data, updatedAt: new Date() } as any);
}

export async function deleteCategory(businessId: string, categoryId: string) {
  const ref = doc(db, 'businesses', businessId, 'expenseCategories', categoryId);
  await deleteDoc(ref);
}

export default {
  fetchCategories,
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
