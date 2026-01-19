import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

export type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const servicesCollectionPath = (barberShopId: string) => collection(db, 'barberShops', barberShopId, 'services');

export async function fetchServices(barberShopId: string): Promise<Service[]> {
  const q = query(servicesCollectionPath(barberShopId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  const items: Service[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Service));
  return items;
}

export function subscribeServices(barberShopId: string, onChange: (items: Service[]) => void) {
  const q = query(servicesCollectionPath(barberShopId), orderBy('createdAt', 'asc'));
  const unsub = onSnapshot(q, (snap) => {
    const items: Service[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Service));
    onChange(items);
  });
  return unsub;
}

export async function createService(barberShopId: string, data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
  const col = servicesCollectionPath(barberShopId);
  const docRef = await addDoc(col, { ...data, active: data.active ?? true, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function updateService(barberShopId: string, serviceId: string, data: Partial<Omit<Service, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'barberShops', barberShopId, 'services', serviceId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() } as any);
}

export async function deleteService(barberShopId: string, serviceId: string) {
  const ref = doc(db, 'barberShops', barberShopId, 'services', serviceId);
  await deleteDoc(ref);
}

export default {
  fetchServices,
  subscribeServices,
  createService,
  updateService,
  deleteService,
};
