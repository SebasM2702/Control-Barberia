import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../utils/firebase';

export type Service = {
  id?: string;
  name: string;
  price: number;
  scope: 'negocio' | 'personal';
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const servicesCollection = (businessId: string) => collection(db, 'businesses', businessId, 'services');

export async function fetchServices(businessId: string): Promise<Service[]> {
  const q = query(servicesCollection(businessId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Service));
}

export function subscribeServices(businessId: string, onChange: (items: Service[]) => void) {
  const q = query(servicesCollection(businessId), orderBy('createdAt', 'asc'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Service));
    onChange(items);
  });
  return unsub;
}

export async function createService(businessId: string, data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(servicesCollection(businessId), { ...data, active: data.active ?? true, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateService(businessId: string, serviceId: string, data: Partial<Omit<Service, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'businesses', businessId, 'services', serviceId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() } as any);
}

export async function deleteService(businessId: string, serviceId: string) {
  const ref = doc(db, 'businesses', businessId, 'services', serviceId);
  await deleteDoc(ref);
}

export default {
  fetchServices,
  subscribeServices,
  createService,
  updateService,
  deleteService,
};
