import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useRefresh } from '../../utils/RefreshContext';
import servicesAPI from '../../data/services';
import categoriesAPI from '../../data/expenseCategories';
import transactionsAPI from '../../data/transactions';

export default function NegocioScreen() {
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
        setServices(items.filter(s => (s.scope || 'negocio') === 'negocio'));
      });
      unsubC = categoriesAPI.subscribeCategories(session.businessId, (items) => {
        setCategories(items.filter(c => (c.scope || 'negocio') === 'negocio'));
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
    if (tipo === 'entrada' && !selectedService) {
      showToast('Selecciona un servicio', 'error');
      return;
    }
    if (tipo === 'salida' && !selectedCategory) {
      showToast('Selecciona una categoría', 'error');
      return;
    }
    const montoNum = parseFloat(amount) || 0;
    if (montoNum <= 0) {
      showToast('Ingresa un monto válido', 'error');
      return;
    }

    try {
      setLoading(true);
      if (!session?.businessId) throw new Error('Caja no disponible');

      const sName = tipo === 'entrada' ? services.find(s => s.id === selectedService)?.name : null;
      const cName = tipo === 'salida' ? categories.find(c => c.id === selectedCategory)?.name : null;

      const payload: any = {
        type: tipo,
        scope: 'negocio',
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Negocio</Text>
          <Text style={styles.subtitle}>Registra entradas y salidas de tu negocio</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Nueva Transacción</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity style={[styles.typeButton, tipo === 'entrada' && styles.typeActive]} onPress={() => setTipo('entrada')}>
                <Ionicons name="arrow-up" size={18} color={tipo === 'entrada' ? '#22c55e' : '#64748b'} />
                <Text style={[styles.typeText, tipo === 'entrada' && styles.typeTextActive]}>Entrada</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeButton, tipo === 'salida' && styles.typeActive]} onPress={() => setTipo('salida')}>
                <Ionicons name="arrow-down" size={18} color={tipo === 'salida' ? '#ef4444' : '#64748b'} />
                <Text style={[styles.typeText, tipo === 'salida' && styles.typeTextActive]}>Salida</Text>
              </TouchableOpacity>
            </View>

            {tipo === 'entrada' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Servicio</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setModalOpen(true)}>
                  <Text>{selectedService ? (services.find((s) => s.id === selectedService)?.name) : 'Selecciona un servicio'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoría</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setModalOpen(true)}>
                  <Text>{selectedCategory ? (categories.find((c) => c.id === selectedCategory)?.name) : 'Selecciona una categoría'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Método</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={[styles.methodBtn, method === 'efectivo' && styles.methodActive]} onPress={() => setMethod('efectivo')}>
                  <Text>💵 Efectivo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.methodBtn, method === 'sinpe' && styles.methodActive]} onPress={() => setMethod('sinpe')}>
                  <Text>📱 Sinpe</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (₡)</Text>
              <Input value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <Input value={description} onChangeText={setDescription} placeholder="Opcional" />
            </View>

            <Button onPress={submit} size="lg">
              <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
              Registrar
            </Button>
          </CardContent>
        </Card>
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent={true} onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tipo === 'entrada' ? 'Selecciona un servicio' : 'Selecciona una categoría'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {(tipo === 'entrada' ? services : categories).map((item) => (
                <TouchableOpacity key={item.id} style={styles.modalItem} onPress={() => {
                  if (tipo === 'entrada') setSelectedService(item.id); else setSelectedCategory(item.id);
                  setModalOpen(false);
                }}>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>{tipo === 'entrada' ? `₡${(item.price || 0).toLocaleString()}` : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },
  card: { marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  selector: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  typeButton: { flex: 1, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginRight: 8 },
  typeActive: { backgroundColor: '#f1f5f9', borderColor: '#0f172a' },
  typeText: { marginLeft: 8 },
  typeTextActive: { color: '#0f172a', fontWeight: '700' },
  methodBtn: { flex: 1, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginRight: 8 },
  methodActive: { borderColor: '#0f172a', backgroundColor: '#f1f5f9' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalList: { padding: 16 },
  modalItem: { padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 8 },
  modalItemName: { fontSize: 16, fontWeight: '600' },
  modalItemPrice: { fontSize: 14, color: '#64748b' },
});
