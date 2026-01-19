import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaccion {
  id: string;
  tipo: 'entrada' | 'salida' | 'personal-entrada' | 'personal-salida';
  scope: 'negocio' | 'personal';
  servicio?: string;
  serviceId?: string;
  categoria?: string;
  categoryId?: string;
  concepto?: string;
  precio?: number;
  monto?: number;
  amount?: number;
  metodoPago: string;
  fecha: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  precio: number;
}

// Servicios iniciales
export const serviciosIniciales: Servicio[] = [
  { id: '1', nombre: 'Cortes', precio: 4000 },
  { id: '2', nombre: 'Ceja hombre', precio: 1000 },
  { id: '3', nombre: 'Barba', precio: 3000 },
  { id: '4', nombre: 'Barba+Corte', precio: 6000 },
  { id: '5', nombre: 'Ceja de mujer', precio: 2000 },
  { id: '6', nombre: 'Limpieza facial', precio: 3000 },
  { id: '7', nombre: 'Ceja+Limpieza', precio: 4000 },
];

// Claves de almacenamiento
const KEYS = {
  TRANSACCIONES: 'transacciones',
  SERVICIOS: 'servicios',
};

// Guardar transacciones
export const guardarTransacciones = async (transacciones: Transaccion[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.TRANSACCIONES, JSON.stringify(transacciones));
  } catch (error) {
    console.error('Error guardando transacciones:', error);
    throw error;
  }
};

// Cargar transacciones
export const cargarTransacciones = async (): Promise<Transaccion[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRANSACCIONES);
    if (data) {
      const transacciones = JSON.parse(data);
      return transacciones.sort((a: Transaccion, b: Transaccion) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    }
    return [];
  } catch (error) {
    console.error('Error cargando transacciones:', error);
    return [];
  }
};

// Agregar transacción
export const agregarTransaccion = async (transaccion: Transaccion): Promise<void> => {
  try {
    const transacciones = await cargarTransacciones();
    transacciones.push(transaccion);
    await guardarTransacciones(transacciones);
  } catch (error) {
    console.error('Error agregando transacción:', error);
    throw error;
  }
};

// Eliminar transacción
export const eliminarTransaccion = async (id: string): Promise<void> => {
  try {
    const transacciones = await cargarTransacciones();
    const nuevasTransacciones = transacciones.filter(t => t.id !== id);
    await guardarTransacciones(nuevasTransacciones);
  } catch (error) {
    console.error('Error eliminando transacción:', error);
    throw error;
  }
};

// Limpiar todas las transacciones
export const limpiarTodasTransacciones = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.TRANSACCIONES);
  } catch (error) {
    console.error('Error limpiando transacciones:', error);
    throw error;
  }
};

// Guardar servicios
export const guardarServicios = async (servicios: Servicio[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SERVICIOS, JSON.stringify(servicios));
  } catch (error) {
    console.error('Error guardando servicios:', error);
    throw error;
  }
};

// Cargar servicios
export const cargarServicios = async (): Promise<Servicio[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SERVICIOS);
    if (data) {
      return JSON.parse(data);
    }
    // Si no hay servicios guardados, guardar los iniciales
    await guardarServicios(serviciosIniciales);
    return serviciosIniciales;
  } catch (error) {
    console.error('Error cargando servicios:', error);
    return serviciosIniciales;
  }
};

// Agregar servicio
export const agregarServicio = async (servicio: Servicio): Promise<void> => {
  try {
    const servicios = await cargarServicios();
    servicios.push(servicio);
    await guardarServicios(servicios);
  } catch (error) {
    console.error('Error agregando servicio:', error);
    throw error;
  }
};

// Actualizar servicio
export const actualizarServicio = async (id: string, precio: number): Promise<void> => {
  try {
    const servicios = await cargarServicios();
    const nuevosServicios = servicios.map(s =>
      s.id === id ? { ...s, precio } : s
    );
    await guardarServicios(nuevosServicios);
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    throw error;
  }
};

// Eliminar servicio
export const eliminarServicio = async (id: string): Promise<void> => {
  try {
    const servicios = await cargarServicios();
    const nuevosServicios = servicios.filter(s => s.id !== id);
    await guardarServicios(nuevosServicios);
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    throw error;
  }
};
