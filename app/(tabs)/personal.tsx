import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Plus, ArrowUpCircle, ArrowDownCircle, Banknote, Smartphone, X, ChevronRight, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useRefresh } from '../../utils/RefreshContext';
import servicesAPI from '../../data/services';
import categoriesAPI from '../../data/expenseCategories';
import transactionsAPI from '../../data/transactions';

export default function PersonalScreen() {
  const { refresh, setLoading, showToast, session } = useRefresh();
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [method, setMethod] = useState<'efectivo' | 'sinpe'>('efectivo');
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let unsubS: any;
    let unsubC: any;
    if (session?.businessId) {
      unsubS = servicesAPI.subscribeServices(session.businessId, (items) => {
        setServices(items.filter(s => s.scope === 'personal'));
      });
      unsubC = categoriesAPI.subscribeCategories(session.businessId, (items) => {
        setCategories(items.filter(c => c.scope === 'personal'));
      });
    }
    return () => {
      if (unsubS) unsubS();
      if (unsubC) unsubC();
    };
  }, [session]);

  useEffect(() => {
    if (selectedService) {
      const s = services.find((x) => x.id === selectedService);
      if (s) setAmount(String(s.price ?? 0));
    }
  }, [selectedService]);

  const submit = async () => {
    const montoNum = parseFloat(amount) || 0;
    if (montoNum <= 0) {
      showToast('Ingresa un monto válido', 'error');
      return;
    }

    try {
      setLoading(true);
      if (!session?.businessId) throw new Error('Negocio no disponible');

      const sName = tipo === 'entrada' ? services.find(s => s.id === selectedService)?.name : null;
      const cName = tipo === 'salida' ? categories.find(c => c.id === selectedCategory)?.name : null;

      const payload: any = {
        type: tipo,
        scope: 'personal',
        amount: montoNum,
        method,
        serviceId: tipo === 'entrada' ? selectedService : null,
        servicio: sName,
        categoryId: tipo === 'salida' ? selectedCategory : null,
        categoria: cName,
        description: description.trim() || null,
      };

      await transactionsAPI.addTransaction(session.businessId!, payload);
      showToast('Transacción registrada', 'success');

      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedService(null);
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Error al registrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedItemName = tipo === 'entrada'
    ? (services.find((s) => s.id === selectedService)?.name || 'Selecciona una fuente')
    : (categories.find((c) => c.id === selectedCategory)?.name || 'Selecciona una categoría');

  return (
    <LinearGradient colors={['#f8fafc', '#ecfdf5', '#f0fdfa']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Finanzas Personales</Text>
          <Text style={styles.subtitle}>Registra ingresos y gastos personales</Text>
        </View>

        <Card style={styles.mainCard}>
          <CardHeader>
            <CardTitle>Nueva Transacción Personal</CardTitle>
          </CardHeader>
          <CardContent style={styles.form}>
            {/* Tipo de Transacción */}
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.typeOption, tipo === 'entrada' && styles.typeOptionActiveIngreso]}
                onPress={() => setTipo('entrada')}
              >
                <ArrowUpCircle size={28} color={tipo === 'entrada' ? '#10b981' : '#94a3b8'} strokeWidth={tipo === 'entrada' ? 2.5 : 2} />
                <Text style={[styles.typeOptionText, tipo === 'entrada' && styles.typeOptionTextActiveIngreso]}>Ingreso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.typeOption, tipo === 'salida' && styles.typeOptionActiveGasto]}
                onPress={() => setTipo('salida')}
              >
                <ArrowDownCircle size={28} color={tipo === 'salida' ? '#ef4444' : '#94a3b8'} strokeWidth={tipo === 'salida' ? 2.5 : 2} />
                <Text style={[styles.typeOptionText, tipo === 'salida' && styles.typeOptionTextActiveGasto]}>Gasto</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de Servicio/Categoría */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{tipo === 'entrada' ? 'Fuente de Ingreso' : 'Categoría de Gasto'}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.selector}
                onPress={() => setModalOpen(true)}
              >
                <Text style={[styles.selectorPressed, !selectedService && !selectedCategory && styles.selectorPlaceholder]}>
                  {selectedItemName}
                </Text>
                <ChevronRight size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Método de Pago */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Método</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.methodOption, method === 'efectivo' && styles.methodOptionActive]}
                  onPress={() => setMethod('efectivo')}
                >
                  <Text style={[styles.methodOptionText, method === 'efectivo' && styles.methodOptionTextActive]}>💵 Efectivo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.methodOption, method === 'sinpe' && styles.methodOptionActive]}
                  onPress={() => setMethod('sinpe')}
                >
                  <Text style={[styles.methodOptionText, method === 'sinpe' && styles.methodOptionTextActive]}>📱 Sinpe</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Monto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (₡)</Text>
              <Input
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                style={styles.amountInput}
              />
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Concepto / Descripción</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Opcional"
              />
            </View>

            <Button onPress={submit} size="lg" style={styles.submitBtn}>
              <Plus size={20} color="#fff" strokeWidth={3} />
              <Text style={styles.submitBtnText}>Registrar</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Nota informativa visual */}
        <View style={styles.infoCard}>
          <Info size={18} color="#2563eb" />
          <Text style={styles.infoText}>
            Los gastos personales se incluyen en los resultados personales pero no en los del negocio.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={modalOpen} animationType="fade" transparent={true} onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tipo === 'entrada' ? 'Selecciona Fuente' : 'Selecciona Categoría'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 24 }}>
              {(tipo === 'entrada' ? services : categories).map((item) => (
                <TouchableOpacity key={item.id} style={styles.modalItem} onPress={() => {
                  if (tipo === 'entrada') setSelectedService(item.id); else setSelectedCategory(item.id);
                  setModalOpen(false);
                }}>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    {tipo === 'entrada' && item.price > 0 && <Text style={styles.modalItemPrice}>₡{(item.price || 0).toLocaleString()}</Text>}
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#4b5563', lineHeight: 22 },
  mainCard: {
    marginBottom: 20,
  },
  form: { gap: 4 },
  typeSelectorContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    gap: 10,
  },
  typeOptionActiveIngreso: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  typeOptionActiveGasto: {
    backgroundColor: '#fff7ed',
    borderColor: '#94a3b8',
  },
  typeOptionText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  typeOptionTextActiveIngreso: { color: '#059669', fontWeight: '700' },
  typeOptionTextActiveGasto: { color: '#475569', fontWeight: '700' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginLeft: 2 },
  selector: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  selectorPressed: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  selectorPlaceholder: { color: '#94a3b8' },

  methodContainer: { flexDirection: 'row', gap: 12 },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    gap: 8,
  },
  methodOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  methodOptionText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  methodOptionTextActive: { color: '#2563eb', fontWeight: '700' },

  amountInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  submitBtn: {
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    marginTop: 10,
    marginBottom: 40,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', fontWeight: '500', lineHeight: 18 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 24, 39, 0.4)' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: 4 },
  modalList: { padding: 20 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  modalItemInfo: { gap: 4 },
  modalItemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalItemPrice: { fontSize: 14, fontWeight: '600', color: '#059669' },
});
