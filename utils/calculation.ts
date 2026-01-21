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
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const nombreMes = meses[parseInt(mes)];

      return {
        periodo: key,
        nombrePeriodo: `${nombreMes} ${anio}`,
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

  if (isNaN(date.getTime())) return 'Fecha inválida';

  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const anio = date.getFullYear();
  const horas = date.getHours().toString().padStart(2, '0');
  const minutos = date.getMinutes().toString().padStart(2, '0');

  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

// Formatear moneda
export const formatearMoneda = (monto: number): string => {
  return `₡${monto.toLocaleString('es-CR')}`;
};
