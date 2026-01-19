import { Transaccion } from './storage';

export interface Totales {
  totalEntradas: number;
  totalSalidas: number;
  balance: number;
  efectivo: number;
  sinpe: number;
  cantidadTransacciones: number;
}

export interface Periodo {
  periodo: string;
  nombrePeriodo: string;
  transacciones: Transaccion[];
}

// Calcular totales según el tipo de resultado
export const calcularTotales = (
  transacciones: Transaccion[],
  tipoResultado: 'negocio' | 'personal'
): Totales => {
  let transaccionesFiltradas = transacciones;

  if (tipoResultado === 'negocio') {
    // Solo lo que sea scope negocio
    transaccionesFiltradas = transacciones.filter(
      (t) => t.scope === 'negocio'
    );
  } else {
    // Scope personal incluye personal + negocio (todo)
    transaccionesFiltradas = transacciones;
  }

  const totalEntradas = transaccionesFiltradas
    .filter((t) => t.tipo === 'entrada' || t.tipo === 'personal-entrada')
    .reduce((sum, t) => sum + (t.amount || t.precio || t.monto || 0), 0);

  const totalSalidas = transaccionesFiltradas
    .filter((t) => t.tipo === 'salida' || t.tipo === 'personal-salida')
    .reduce((sum, t) => sum + (t.amount || t.monto || 0), 0);

  const efectivo = transaccionesFiltradas
    .filter((t) => t.metodoPago === 'efectivo')
    .reduce((sum, t) => {
      const monto = t.amount || t.precio || t.monto || 0;
      if (t.tipo === 'entrada' || t.tipo === 'personal-entrada') {
        return sum + monto;
      } else {
        return sum - monto;
      }
    }, 0);

  const sinpe = transaccionesFiltradas
    .filter((t) => t.metodoPago === 'sinpe')
    .reduce((sum, t) => {
      const monto = t.amount || t.precio || t.monto || 0;
      if (t.tipo === 'entrada' || t.tipo === 'personal-entrada') {
        return sum + monto;
      } else {
        return sum - monto;
      }
    }, 0);

  return {
    totalEntradas,
    totalSalidas,
    balance: totalEntradas - totalSalidas,
    efectivo,
    sinpe,
    cantidadTransacciones: transaccionesFiltradas.length,
  };
};

// Agrupar transacciones por período (mes/año)
export const agruparPorPeriodo = (transacciones: Transaccion[]): Periodo[] => {
  const grupos: { [key: string]: Transaccion[] } = {};

  transacciones.forEach((t) => {
    const fecha = new Date(t.fecha);
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    const key = `${anio}-${mes.toString().padStart(2, '0')}`;

    if (!grupos[key]) {
      grupos[key] = [];
    }
    grupos[key].push(t);
  });

  const gruposOrdenados = Object.keys(grupos)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const [anio, mes] = key.split('-');
      const fecha = new Date(parseInt(anio), parseInt(mes));
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      return {
        periodo: key,
        nombrePeriodo: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        transacciones: grupos[key].sort((a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        ),
      };
    });

  return gruposOrdenados;
};

// Calcular totales de un período
export const calcularTotalesPeriodo = (transacciones: Transaccion[]) => {
  const totalEntrada = transacciones
    .filter((t) => t.tipo === 'entrada' || t.tipo === 'personal-entrada')
    .reduce((sum, t) => sum + (t.precio || t.monto || 0), 0);

  const totalSalida = transacciones
    .filter((t) => t.tipo === 'salida' || t.tipo === 'personal-salida')
    .reduce((sum, t) => sum + (t.monto || 0), 0);

  return {
    totalEntrada,
    totalSalida,
    balance: totalEntrada - totalSalida,
  };
};

// Formatear fecha
export const formatearFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatear moneda
export const formatearMoneda = (monto: number): string => {
  return `₡${monto.toLocaleString('es-CR')}`;
};
