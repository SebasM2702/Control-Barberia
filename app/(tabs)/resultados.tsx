import React, { useState, useEffect } from 'react';
import { useRefresh } from '../../utils/RefreshContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import transactionsAPI from '../../data/transactions';
import { Transaccion } from '../../utils/storage';
import {
  calcularTotales,
  agruparPorPeriodo,
  calcularTotalesPeriodo,
  formatearFecha,
  formatearMoneda,
} from '../../utils/calculation';

export default function ResultadosScreen() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [tipoResultado, setTipoResultado] = useState<'negocio' | 'personal'>('negocio');
  const [filtro, setFiltro] = useState<'todas' | 'entrada' | 'salida'>('todas');

  const { refreshKey, setLoading, showToast, session, sessionLoaded } = useRefresh();

  useEffect(() => {
    let unsub: any;
    if (sessionLoaded && session?.businessId) {
      try {
        setLoading(true);
        unsub = transactionsAPI.subscribeTransactions(session.businessId, (items: any[]) => {
          // map firestore items to local Transaccion shape
          const mapped: Transaccion[] = items.map((it) => {
            const created = (it.createdAt && typeof it.createdAt.toDate === 'function') ? it.createdAt.toDate().toISOString() : (it.fecha || new Date().toISOString());
            const scope = it.scope || (it.tipo && String(it.tipo).startsWith('personal') ? 'personal' : 'negocio');
            return {
              id: it.id,
              tipo: it.type || it.tipo,
              scope,
              servicio: it.servicio || null,
              serviceId: it.serviceId || null,
              categoria: it.categoria || null,
              categoryId: it.categoryId || null,
              concepto: it.description || it.concepto || null,
              monto: it.amount || it.monto || 0,
              amount: it.amount || it.monto || 0,
              precio: it.amount || it.precio || 0,
              metodoPago: it.method || it.metodoPago || 'efectivo',
              fecha: (it.date && typeof it.date.toDate === 'function') ? it.date.toDate().toISOString() : created,
            } as Transaccion;
          });
          setTransacciones(mapped);
          setLoading(false);
        });
      } catch (err) {
        console.error(err);
        showToast('No se pudieron cargar las transacciones', 'error');
        setLoading(false);
      }
    }
    return () => {
      if (unsub) unsub();
    };
  }, [session, sessionLoaded, refreshKey]);

  const transaccionesFiltradas = transacciones.filter((t) => {
    // Filtrar por tipo de resultado (negocio o personal)
    if (tipoResultado === 'negocio') {
      if (t.scope !== 'negocio') return false;
    } else {
      // Personal incluye ambos
      // No filter needed for scope here if we want to show everything
    }

    // Filtrar por tipo de transacción (entrada/salida)
    if (filtro === 'todas') return true;
    if (filtro === 'entrada') return t.tipo === 'entrada' || t.tipo === 'personal-entrada';
    if (filtro === 'salida') return t.tipo === 'salida' || t.tipo === 'personal-salida';
    return true;
  });

  const totales = calcularTotales(transacciones, tipoResultado);
  const periodos = agruparPorPeriodo(transaccionesFiltradas);

  const exportarDatos = async () => {
    try {
      const datos = {
        fecha_exportacion: new Date().toLocaleString(),
        tipo_resultado: tipoResultado,
        totales,
        transacciones_por_periodo: periodos,
        transacciones: transaccionesFiltradas,
      };

      const fileName = `negocio-${tipoResultado}-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = (FileSystem.documentDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(datos, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        showToast('Datos exportados correctamente', 'success');
      } else {
        showToast('No se puede compartir archivos en este dispositivo', 'error');
      }
    } catch (error) {
      showToast('No se pudo exportar los datos', 'error');
      console.error(error);
    }
  };

  const confirmarEliminarTransaccion = (id: string) => {
    Alert.alert(
      'Eliminar Transacción',
      '¿Estás seguro de que deseas eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (!session?.businessId) throw new Error('Caja no disponible');
              await transactionsAPI.deleteTransaction(session.businessId, id);
              showToast('Transacción eliminada', 'success');
            } catch (err) {
              console.error(err);
              showToast('No se pudo eliminar la transacción', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const confirmarLimpiarTodo = () => {
    Alert.alert(
      'Limpiar Todas las Transacciones',
      '¿Estás seguro de que deseas eliminar TODAS las transacciones? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (!session?.businessId) throw new Error('Caja no disponible');
              await transactionsAPI.clearAllTransactions(session.businessId);
              showToast('Todas las transacciones han sido eliminadas', 'success');
            } catch (err) {
              console.error(err);
              showToast('No se pudieron eliminar las transacciones', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const obtenerDescripcion = (transaccion: Transaccion) => {
    const isEntrada = transaccion.tipo === 'entrada' || transaccion.tipo === 'personal-entrada';
    const isPersonal = transaccion.scope === 'personal';

    let tipoLabel = '';
    if (isPersonal) {
      tipoLabel = isEntrada ? 'Personal (I)' : 'Personal (G)';
    } else {
      tipoLabel = isEntrada ? 'Servicio' : 'Gasto';
    }

    // Nombre de la operación (Servicio o Categoría)
    let nombreOperacion = isEntrada ? transaccion.servicio : transaccion.categoria;
    const desc = transaccion.concepto || '';

    let descripcionFinal = '';
    if (nombreOperacion && desc) {
      descripcionFinal = `${nombreOperacion} - ${desc}`;
    } else {
      descripcionFinal = nombreOperacion || desc || 'Sin descripción';
    }

    return { descripcion: descripcionFinal, tipoLabel };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultados y Balance</Text>
          <Text style={styles.subtitle}>Resumen financiero</Text>
        </View>

        {/* Selector de tipo de resultado */}
        <View style={styles.tipoButtons}>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipoResultado === 'negocio' && styles.tipoButtonActive,
            ]}
            onPress={() => setTipoResultado('negocio')}
          >
            <Ionicons
              name="business"
              size={20}
              color={tipoResultado === 'negocio' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[
                styles.tipoButtonText,
                tipoResultado === 'negocio' && styles.tipoButtonTextActive,
              ]}
            >
              Negocio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipoResultado === 'personal' && styles.tipoButtonActive,
            ]}
            onPress={() => setTipoResultado('personal')}
          >
            <Ionicons
              name="person"
              size={20}
              color={tipoResultado === 'personal' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[
                styles.tipoButtonText,
                tipoResultado === 'personal' && styles.tipoButtonTextActive,
              ]}
            >
              Personal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Descripción */}
        <Card style={StyleSheet.flatten([styles.card, styles.infoCard])}>
          <CardContent>
            <Text style={styles.infoText}>
              {tipoResultado === 'negocio'
                ? '📊 Mostrando solo ingresos y gastos de tu negocio'
                : '💼 Mostrando todos los ingresos y gastos (negocio + personal)'}
            </Text>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <Button onPress={exportarDatos} variant="outline" style={{ flex: 1, marginRight: 8 }}>
            <Ionicons name="download-outline" size={16} color="#0f172a" />
            <Text>{' Exportar'}</Text>
          </Button>
          <Button onPress={confirmarLimpiarTodo} variant="destructive" style={{ flex: 1 }}>
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text>{' Limpiar'}</Text>
          </Button>
        </View>

        {/* Resumen de totales */}
        <View style={styles.grid2}>
          <Card style={styles.gridCard}>
            <View style={styles.statHeader}>
              <Ionicons name="trending-up" size={16} color="#22c55e" />
              <Text style={styles.statLabel}>Entradas</Text>
            </View>
            <Text style={styles.statValueGreen}>
              {formatearMoneda(totales.totalEntradas)}
            </Text>
          </Card>

          <Card style={styles.gridCard}>
            <View style={styles.statHeader}>
              <Ionicons name="trending-down" size={16} color="#ef4444" />
              <Text style={styles.statLabel}>Salidas</Text>
            </View>
            <Text style={styles.statValueRed}>
              {formatearMoneda(totales.totalSalidas)}
            </Text>
          </Card>

          <Card style={styles.gridCard}>
            <View style={styles.statHeader}>
              <Ionicons name="bar-chart" size={16} color="#64748b" />
              <Text style={styles.statLabel}>Balance</Text>
            </View>
            <Text style={totales.balance >= 0 ? styles.statValueGreen : styles.statValueRed}>
              {formatearMoneda(totales.balance)}
            </Text>
          </Card>

          <Card style={styles.gridCard}>
            <View style={styles.statHeader}>
              <Ionicons name="receipt" size={16} color="#64748b" />
              <Text style={styles.statLabel}>Transacciones</Text>
            </View>
            <Text style={styles.statValue}>{totales.cantidadTransacciones}</Text>
          </Card>
        </View>

        {/* Métodos de pago */}
        <View style={styles.grid2}>
          <Card style={styles.gridCard}>
            <CardHeader>
              <CardTitle style={styles.paymentTitle}>💵 Efectivo</CardTitle>
            </CardHeader>
            <Text style={totales.efectivo >= 0 ? styles.statValueGreen : styles.statValueRed}>
              {formatearMoneda(totales.efectivo)}
            </Text>
          </Card>

          <Card style={styles.gridCard}>
            <CardHeader>
              <CardTitle style={styles.paymentTitle}>📱 Sinpe</CardTitle>
            </CardHeader>
            <Text style={totales.sinpe >= 0 ? styles.statValueGreen : styles.statValueRed}>
              {formatearMoneda(totales.sinpe)}
            </Text>
          </Card>
        </View>

        {/* Filtros */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Historial por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.filtroButtons}>
              <Button
                onPress={() => setFiltro('todas')}
                variant={filtro === 'todas' ? 'default' : 'outline'}
                size="sm"
                style={{ flex: 1 }}
              >
                Todas
              </Button>
              <Button
                onPress={() => setFiltro('entrada')}
                variant={filtro === 'entrada' ? 'default' : 'outline'}
                size="sm"
                style={{ flex: 1 }}
              >
                Entradas
              </Button>
              <Button
                onPress={() => setFiltro('salida')}
                variant={filtro === 'salida' ? 'default' : 'outline'}
                size="sm"
                style={{ flex: 1 }}
              >
                Salidas
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Períodos con transacciones */}
        {periodos.length === 0 ? (
          <Card style={styles.card}>
            <CardContent>
              <Text style={styles.emptyText}>No hay transacciones registradas</Text>
            </CardContent>
          </Card>
        ) : (
          periodos.map((periodo) => {
            const totalesPeriodo = calcularTotalesPeriodo(periodo.transacciones);

            return (
              <Card key={periodo.periodo} style={styles.periodoCard}>
                {/* Cabecera del período */}
                <View style={styles.periodoHeader}>
                  <View>
                    <Text style={styles.periodoNombre}>{periodo.nombrePeriodo}</Text>
                    <Text style={styles.periodoCount}>
                      {periodo.transacciones.length} transacciones
                    </Text>
                  </View>
                </View>

                {/* Totales del período */}
                <View style={styles.periodoTotales}>
                  <View style={styles.periodoTotalItem}>
                    <Text style={styles.periodoTotalLabel}>Entradas</Text>
                    <Text style={styles.periodoTotalGreen}>
                      +{formatearMoneda(totalesPeriodo.totalEntrada)}
                    </Text>
                  </View>
                  <View style={styles.periodoTotalItem}>
                    <Text style={styles.periodoTotalLabel}>Salidas</Text>
                    <Text style={styles.periodoTotalRed}>
                      -{formatearMoneda(totalesPeriodo.totalSalida)}
                    </Text>
                  </View>
                  <View style={styles.periodoTotalItem}>
                    <Text style={styles.periodoTotalLabel}>Balance</Text>
                    <Text
                      style={
                        totalesPeriodo.balance >= 0
                          ? styles.periodoTotalGreen
                          : styles.periodoTotalRed
                      }
                    >
                      {formatearMoneda(totalesPeriodo.balance)}
                    </Text>
                  </View>
                </View>

                {/* Transacciones */}
                <View style={styles.transaccionesContainer}>
                  {periodo.transacciones.map((transaccion) => {
                    const esEntrada =
                      transaccion.tipo === 'entrada' || transaccion.tipo === 'personal-entrada';
                    const monto = transaccion.precio || transaccion.monto || 0;
                    const { descripcion, tipoLabel } = obtenerDescripcion(transaccion);

                    return (
                      <View key={transaccion.id} style={styles.transaccionItem}>
                        <View style={styles.transaccionContent}>
                          <View style={styles.transaccionBadges}>
                            <View
                              style={[
                                styles.badge,
                                esEntrada ? styles.badgeGreen : styles.badgeRed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  esEntrada ? styles.badgeTextGreen : styles.badgeTextRed,
                                ]}
                              >
                                {tipoLabel}
                              </Text>
                            </View>
                            <View style={styles.badgeOutline}>
                              <Text style={styles.badgeTextOutline}>
                                {transaccion.metodoPago === 'efectivo' ? '💵' : '📱'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.transaccionDescripcion} numberOfLines={1}>
                            {descripcion}
                          </Text>
                          <Text style={styles.transaccionFecha}>
                            {formatearFecha(transaccion.fecha)}
                          </Text>
                        </View>
                        <View style={styles.transaccionActions}>
                          <Text
                            style={[
                              styles.transaccionMonto,
                              esEntrada ? styles.montoGreen : styles.montoRed,
                            ]}
                          >
                            {esEntrada ? '+' : '-'}
                            {formatearMoneda(monto)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => confirmarEliminarTransaccion(transaccion.id)}
                            style={styles.deleteButton}
                          >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tipoButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 16,
  },
  tipoButtonActive: {
    borderColor: '#0f172a',
    backgroundColor: '#f1f5f9',
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tipoButtonTextActive: {
    color: '#0f172a',
  },
  card: {
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  statValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  statValueRed: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  paymentTitle: {
    fontSize: 16,
  },
  filtroButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  periodoCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  periodoHeader: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodoNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  periodoCount: {
    fontSize: 12,
    color: '#64748b',
  },
  periodoTotales: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  periodoTotalItem: {
    flex: 1,
  },
  periodoTotalLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  periodoTotalGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  periodoTotalRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  transaccionesContainer: {
    padding: 12,
  },
  transaccionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  transaccionContent: {
    flex: 1,
    marginRight: 8,
  },
  transaccionBadges: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextGreen: {
    color: '#166534',
  },
  badgeTextRed: {
    color: '#991b1b',
  },
  badgeOutline: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeTextOutline: {
    fontSize: 11,
  },
  transaccionDescripcion: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  transaccionFecha: {
    fontSize: 11,
    color: '#64748b',
  },
  transaccionActions: {
    alignItems: 'flex-end',
  },
  transaccionMonto: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  montoGreen: {
    color: '#22c55e',
  },
  montoRed: {
    color: '#ef4444',
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 20,
  },
});
