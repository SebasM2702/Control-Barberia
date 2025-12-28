import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useRefresh } from '../../utils/RefreshContext';
import { agregarTransaccion, Transaccion } from '../../utils/storage';

const CATEGORIAS = ['Productos', 'Arriendo', 'Servicios', 'Otros'];

export default function SalidaScreen() {
  const { refreshKey, refresh, setLoading, showToast } = useRefresh();

  const [categoria, setCategoria] = useState<string>('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'sinpe'>('efectivo');
  const [modalCategoria, setModalCategoria] = useState(false);

  React.useEffect(() => {
    // reload when global refresh is triggered
  }, [refreshKey]);

  const registrarSalida = async () => {
    if (!categoria) {
      showToast('Por favor selecciona una categoría', 'error');
      return;
    }

    if (!concepto.trim()) {
      showToast('Por favor ingresa un concepto', 'error');
      return;
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    const nuevaTransaccion: Transaccion = {
      id: Date.now().toString(),
      tipo: 'salida',
      categoria,
      concepto: concepto.trim(),
      monto: montoNum,
      metodoPago,
      fecha: new Date().toISOString(),
    };

    try {
      setLoading(true);
      await agregarTransaccion(nuevaTransaccion);
      showToast('Gasto registrado correctamente', 'success');
      // Limpiar formulario
      setCategoria('');
      setConcepto('');
      setMonto('');
      setMetodoPago('efectivo');
      refresh();
    } catch (err) {
      console.error(err);
      showToast('No se pudo registrar el gasto', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Gastos de Barbería</Text>
          <Text style={styles.subtitle}>Registra los gastos del negocio</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Nuevo Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Categoría */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setModalCategoria(true)}>
                <Text style={categoria ? styles.selectorTextSelected : styles.selectorText}>{categoria || 'Selecciona una categoría'}</Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Concepto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Concepto</Text>
              <Input value={concepto} onChangeText={setConcepto} placeholder="Ej: Champú profesional" />
            </View>

            {/* Monto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (₡)</Text>
              <Input value={monto} onChangeText={setMonto} keyboardType="numeric" placeholder="0" />
            </View>

            {/* Método de pago */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Método de Pago</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity style={[styles.paymentButton, metodoPago === 'efectivo' && styles.paymentButtonActive]} onPress={() => setMetodoPago('efectivo')}>
                  <Text style={styles.emoji}>💵</Text>
                  <Text style={styles.paymentButtonText}>Efectivo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.paymentButton, metodoPago === 'sinpe' && styles.paymentButtonActive]} onPress={() => setMetodoPago('sinpe')}>
                  <Text style={styles.emoji}>📱</Text>
                  <Text style={styles.paymentButtonText}>Sinpe</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button onPress={registrarSalida} size="lg" style={styles.submitButton}>
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              Registrar Gasto
            </Button>
          </CardContent>
        </Card>

        {/* Información de categorías */}
        <Card style={[styles.card, styles.infoCard]}>
          <CardContent>
            <Text style={styles.infoText}>💡 Registra aquí todos los gastos relacionados con el negocio de la barbería</Text>
          </CardContent>
        </Card>
      </View>

      {/* Modal de selección de categoría */}
      <Modal visible={modalCategoria} animationType="slide" transparent={true} onRequestClose={() => setModalCategoria(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <TouchableOpacity onPress={() => setModalCategoria(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.modalItem, categoria === cat && styles.modalItemSelected]} onPress={() => { setCategoria(cat); setModalCategoria(false); }}>
                  <Text style={styles.modalItemName}>{cat}</Text>
                  {categoria === cat && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectorText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  selectorTextSelected: {
    fontSize: 16,
    color: '#0f172a',
  },
  paymentButtons: {
    flexDirection: 'row',
  },
  paymentButton: {
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
  paymentButtonActive: {
    borderColor: '#0f172a',
    backgroundColor: '#f1f5f9',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emoji: {
    fontSize: 20,
  },
  submitButton: {
    marginTop: 8,
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  modalItemSelected: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
});
