import React, { useState, useEffect } from 'react';
import { useRefresh } from '../../utils/RefreshContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Building2,
  User,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ReceiptText,
  Wallet,
  Smartphone,
  Info,
  ChevronRight,
  FilterX,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
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
    if (tipoResultado === 'negocio') {
      if (t.scope !== 'negocio') return false;
    }
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
        fecha_exportacion: formatearFecha(new Date().toISOString()),
        tipo_resultado: tipoResultado,
        totales,
        transacciones_por_periodo: periodos.map(p => ({
          ...p,
          transacciones: p.transacciones.map(t => ({
            ...t,
            fecha_formateada: formatearFecha(t.fecha)
          }))
        })),
        transacciones: transaccionesFiltradas.map(t => ({
          ...t,
          fecha_formateada: formatearFecha(t.fecha)
        })),
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

    let tipoLabel = isPersonal ? (isEntrada ? 'Ingreso' : 'Gasto') : (isEntrada ? 'Servicio' : 'Gasto');
    let color = isEntrada ? '#16a34a' : '#be185d'; // Deep green for income, deep pink/red for expense
    let bgColor = isEntrada ? '#f0fdf4' : '#fff1f2';

    let nombreOperacion = isEntrada ? transaccion.servicio : transaccion.categoria;
    const desc = transaccion.concepto || '';

    let descripcionFinal = (nombreOperacion && desc) ? `${nombreOperacion}: ${desc}` : (nombreOperacion || desc || 'Sin descripción');
    return { descripcion: descripcionFinal, tipoLabel, color, bgColor };
  };

  return (
    <LinearGradient colors={['#f8fafc', '#f5f3ff', '#fdf2f8']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultados y Balance</Text>
          <Text style={styles.subtitle}>Resumen detallado de tu actividad financiera</Text>
        </View>

        {/* Toggle de Tipo de Resultado */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.toggleBtn, tipoResultado === 'negocio' && styles.toggleBtnActive]}
            onPress={() => setTipoResultado('negocio')}
          >
            <Building2 size={18} color={tipoResultado === 'negocio' ? '#6d28d9' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.toggleText, tipoResultado === 'negocio' && styles.toggleTextActive]}>Negocio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.toggleBtn, tipoResultado === 'personal' && styles.toggleBtnActive]}
            onPress={() => setTipoResultado('personal')}
          >
            <User size={18} color={tipoResultado === 'personal' ? '#6d28d9' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.toggleText, tipoResultado === 'personal' && styles.toggleTextActive]}>Todos</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={16} color="#4338ca" />
          <Text style={styles.infoBannerText}>
            {tipoResultado === 'negocio'
              ? 'Mostrando solo ingresos y gastos operativos del negocio.'
              : 'Vista consolidada: flujos del negocio y gastos personales.'}
          </Text>
        </View>

        {/* Botones de acción rápida */}
        <View style={styles.quickActions}>
          <Button
            variant="outline"
            size="md"
            onPress={exportarDatos} // Changed from exportarCSV
            style={{ flex: 1 }}
          >
            <Download size={18} color="#334155" style={{ marginRight: 8 }} />
            <Text style={{ color: '#334155', fontWeight: '700' }}>Exportar</Text>
          </Button>
          <Button
            variant="destructive"
            size="md"
            onPress={confirmarLimpiarTodo} // Changed from handleClearHistory
            style={{ flex: 1 }}
          >
            <Trash2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Limpiar</Text>
          </Button>
        </View>

        {/* Métricas Principales */}
        <View style={styles.metricsGrid}>
          <Card style={[styles.metricCard, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
            <View style={styles.metricHeader}>
              <ArrowUpCircle size={16} color="#ffffff" opacity={0.9} />
              <Text style={[styles.metricLabel, { color: '#ffffff', opacity: 0.9 }]}>Entradas</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#ffffff' }]}>{formatearMoneda(totales.totalEntradas)}</Text>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: '#ef4444', borderColor: '#ef4444' }]}>
            <View style={styles.metricHeader}>
              <ArrowDownCircle size={16} color="#ffffff" opacity={0.9} />
              <Text style={[styles.metricLabel, { color: '#ffffff', opacity: 0.9 }]}>Salidas</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#ffffff' }]}>{formatearMoneda(totales.totalSalidas)}</Text>
          </Card>
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Wallet size={16} color="#2563eb" />
              <Text style={styles.metricLabel}>Balance</Text>
            </View>
            <Text style={[styles.metricValue, { color: totales.balance >= 0 ? '#10b981' : '#ef4444' }]}>
              {formatearMoneda(totales.balance)}
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <TrendingUp size={16} color="#9333ea" />
              <Text style={styles.metricLabel}>Transacciones</Text>
            </View>
            <Text style={styles.metricValue}>{totales.cantidadTransacciones}</Text>
          </Card>
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={{ fontSize: 16 }}>💵</Text>
              <Text style={styles.metricLabel}>Efectivo</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#10b981' }]}>{formatearMoneda(totales.efectivo)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={{ fontSize: 16 }}>📱</Text>
              <Text style={styles.metricLabel}>Sinpe</Text>
            </View>
            <Text style={[styles.metricValue, { color: totales.sinpe >= 0 ? '#10b981' : '#ef4444' }]}>{formatearMoneda(totales.sinpe)}</Text>
          </Card>
        </View>

        {/* Historial con Filtros */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Historial</Text>
            <View style={styles.filterPills}>
              {(['todas', 'entrada', 'salida'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, filtro === f && styles.filterPillActive]}
                  onPress={() => setFiltro(f)}
                >
                  <Text style={[styles.filterPillText, filtro === f && styles.filterPillTextActive]}>
                    {f === 'todas' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Salidas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {periodos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <FilterX size={48} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No hay registros para mostrar</Text>
            </Card>
          ) : (
            periodos.map((periodo) => {
              const stats = calcularTotalesPeriodo(periodo.transacciones);
              return (
                <View key={periodo.periodo} style={styles.periodoGroup}>
                  {/* Card de Resumen Mensual */}
                  <Card style={styles.mesCard}>
                    <View style={styles.mesHeader}>
                      <Text style={styles.mesName}>{periodo.nombrePeriodo}</Text>
                      <View style={styles.txCountBadge}>
                        <Text style={styles.txCountText}>{periodo.transacciones.length} transacciones</Text>
                      </View>
                    </View>

                    <View style={styles.mesStatsGrid}>
                      <View style={styles.mesStatItem}>
                        <Text style={styles.mesStatLabel}>Entradas</Text>
                        <Text style={[styles.mesStatValue, { color: '#16a34a' }]}>
                          +{formatearMoneda(stats.totalEntrada)}
                        </Text>
                      </View>
                      <View style={styles.mesStatItem}>
                        <Text style={styles.mesStatLabel}>Salidas</Text>
                        <Text style={[styles.mesStatValue, { color: '#dc2626' }]}>
                          -{formatearMoneda(stats.totalSalida)}
                        </Text>
                      </View>
                      <View style={styles.mesStatItem}>
                        <Text style={styles.mesStatLabel}>Balance</Text>
                        <Text style={[styles.mesStatValue, { color: stats.balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                          {formatearMoneda(stats.balance)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemsContainer}>
                      {periodo.transacciones.map((t) => {
                        const esEntrada = t.tipo === 'entrada' || t.tipo === 'personal-entrada';
                        const { descripcion, tipoLabel, color, bgColor } = obtenerDescripcion(t);
                        return (
                          <View key={t.id} style={styles.itemRefContainer}>
                            <View style={styles.itemBadgeRow}>
                              <View style={[styles.typeBadge, { backgroundColor: esEntrada ? '#0f172a' : '#be185d' }]}>
                                <Text style={styles.typeBadgeText}>{tipoLabel}</Text>
                              </View>
                              {t.metodoPago === 'efectivo' ? (
                                <Text style={{ fontSize: 13 }}>💵</Text>
                              ) : (
                                <Text style={{ fontSize: 13 }}>📱</Text>
                              )}
                            </View>

                            <View style={styles.itemMainRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.itemTargetDesc}>{descripcion}</Text>
                                <Text style={styles.itemFullDate}>
                                  {(() => {
                                    const d = new Date(t.fecha);
                                    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                    return `${formatearFecha(t.fecha).split(' ')[0]}, ${time}`;
                                  })()}
                                </Text>
                              </View>

                              <View style={styles.itemRightSide}>
                                <Text style={[styles.itemAmountVal, { color: esEntrada ? '#16a34a' : '#dc2626' }]}>
                                  {esEntrada ? '+' : '-'}{formatearMoneda(t.amount || 0)}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => confirmarEliminarTransaccion(t.id)}
                                  style={styles.trashBtn}
                                >
                                  <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </Card>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 80 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b', lineHeight: 22 },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#1e293b', fontWeight: '700' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: '#4338ca', fontWeight: '500' },

  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', gap: 8, height: 48 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },

  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, padding: 14, backgroundColor: '#ffffff' },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },

  historySection: { gap: 16 },
  historyHeader: { marginBottom: 8 },
  historyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  filterPills: { flexDirection: 'row', gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterPillTextActive: { color: '#ffffff' },

  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },

  periodoGroup: { marginBottom: 24 },
  mesCard: { padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  mesHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mesName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  txCountBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txCountText: { fontSize: 11, color: '#64748b', fontWeight: '700' },

  mesStatsGrid: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mesStatItem: { flex: 1 },
  mesStatLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  mesStatValue: { fontSize: 14, fontWeight: '700' },

  itemsContainer: { padding: 12, gap: 12 },
  itemRefContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  itemMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTargetDesc: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  itemFullDate: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  itemRightSide: { alignItems: 'flex-end', gap: 4 },
  itemAmountVal: { fontSize: 16, fontWeight: '800' },
  trashBtn: {
    padding: 8,
    marginRight: -8,
  },
});
