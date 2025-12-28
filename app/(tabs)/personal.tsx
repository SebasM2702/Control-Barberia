import React, { useState } from 'react';
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
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { agregarTransaccion, Transaccion } from '../../utils/storage';

export default function PersonalScreen() {
  const { refreshKey, refresh, setLoading, showToast } = useRefresh();
  React.useEffect(() => {
    // trigger reloads if needed when global refresh happens
  }, [refreshKey]);
  const [tipo, setTipo] = useState<'personal-entrada' | 'personal-salida'>('personal-entrada');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'sinpe'>('efectivo');

  const registrarTransaccion = async () => {
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
      tipo,
      concepto: concepto.trim(),
      monto: montoNum,
      metodoPago,
      fecha: new Date().toISOString(),
    };

    try {
      setLoading(true);
      await agregarTransaccion(nuevaTransaccion);
      showToast(
        tipo === 'personal-entrada' ? 'Ingreso personal registrado' : 'Gasto personal registrado',
        'success'
      );
      // Limpiar formulario
      setConcepto('');
      setMonto('');
      setMetodoPago('efectivo');
      refresh();
    } catch (err) {
      console.error(err);
      showToast('No se pudo registrar la transacción', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Finanzas Personales</Text>
          <Text style={styles.subtitle}>Registra ingresos y gastos personales</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Nueva Transacción Personal</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tipo de transacción */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Transacción</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tipo === 'personal-entrada' && styles.typeButtonEntrada,
                  ]}
                  onPress={() => setTipo('personal-entrada')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={tipo === 'personal-entrada' ? '#22c55e' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      tipo === 'personal-entrada' && styles.typeButtonTextActive,
                    ]}
                  >
                    Ingreso
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tipo === 'personal-salida' && styles.typeButtonSalida,
                  ]}
                  onPress={() => setTipo('personal-salida')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={20}
                    color={tipo === 'personal-salida' ? '#ef4444' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      tipo === 'personal-salida' && styles.typeButtonTextActive,
                    ]}
                  >
                    Gasto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Concepto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Concepto</Text>
              <Input
                value={concepto}
                onChangeText={setConcepto}
                placeholder={
                  tipo === 'personal-entrada'
                    ? 'Ej: Préstamo, Inversión'
                    : 'Ej: Comida, Transporte'
                }
              />
            </View>

            {/* Monto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto (₡)</Text>
              <Input
                value={monto}
                onChangeText={setMonto}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            {/* Método de pago */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Método de Pago</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    metodoPago === 'efectivo' && styles.paymentButtonActive,
                  ]}
                  onPress={() => setMetodoPago('efectivo')}
                >
                  <Text style={styles.emoji}>💵</Text>
                  <Text style={styles.paymentButtonText}>Efectivo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    metodoPago === 'sinpe' && styles.paymentButtonActive,
                  ]}
                  onPress={() => setMetodoPago('sinpe')}
                >
                  <Text style={styles.emoji}>📱</Text>
                  <Text style={styles.paymentButtonText}>Sinpe</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button onPress={registrarTransaccion} size="lg" style={styles.submitButton}>
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              Registrar Transacción
            </Button>
          </CardContent>
        </Card>

        {/* Información */}
        <Card style={[styles.card, styles.infoCard]}>
          <CardContent>
            <Text style={styles.infoText}>
              💼 Los gastos personales se incluyen en los resultados personales pero no en los de
              la barbería
            </Text>
          </CardContent>
        </Card>
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
  typeButtons: {
    flexDirection: 'row',
  },
  typeButton: {
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
  typeButtonEntrada: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  typeButtonSalida: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  typeButtonTextActive: {
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
});
