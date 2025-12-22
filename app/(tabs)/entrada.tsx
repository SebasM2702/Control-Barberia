import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import {
  cargarServicios,
  guardarServicios,
  agregarTransaccion,
  Servicio,
  Transaccion,
} from '../../utils/storage';

export default function EntradaScreen() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'sinpe'>('efectivo');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [precioEditado, setPrecioEditado] = useState('');
  const [mostrarServicios, setMostrarServicios] = useState(false);
  
  // Modal para agregar servicio
  const [modalNuevoServicio, setModalNuevoServicio] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  
  // Modal para seleccionar servicio
  const [modalSeleccion, setModalSeleccion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const serviciosCargados = await cargarServicios();
    setServicios(serviciosCargados);
  };

  const registrarEntrada = async () => {
    if (!servicioSeleccionado) {
      Alert.alert('Error', 'Por favor selecciona un servicio');
      return;
    }

    const servicio = servicios.find((s) => s.id === servicioSeleccionado);
    if (!servicio) return;

    const nuevaTransaccion: Transaccion = {
      id: Date.now().toString(),
      tipo: 'entrada',
      servicio: servicio.nombre,
      precio: servicio.precio,
      metodoPago,
      fecha: new Date().toISOString(),
    };

    await agregarTransaccion(nuevaTransaccion);
    Alert.alert('Éxito', 'Entrada registrada correctamente');
    setServicioSeleccionado('');
    setMetodoPago('efectivo');
  };

  const guardarEdicion = async (id: string) => {
    const precioNum = parseFloat(precioEditado);
    if (isNaN(precioNum) || precioNum < 0) {
      Alert.alert('Error', 'Precio inválido');
      return;
    }

    const nuevosServicios = servicios.map((s) =>
      s.id === id ? { ...s, precio: precioNum } : s
    );
    await guardarServicios(nuevosServicios);
    setServicios(nuevosServicios);
    setEditandoId(null);
    Alert.alert('Éxito', 'Precio actualizado');
  };

  const agregarNuevoServicio = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del servicio');
      return;
    }

    const precioNum = parseFloat(nuevoPrecio);
    if (isNaN(precioNum) || precioNum < 0) {
      Alert.alert('Error', 'Por favor ingresa un precio válido');
      return;
    }

    const nuevoServicio: Servicio = {
      id: Date.now().toString(),
      nombre: nuevoNombre.trim(),
      precio: precioNum,
    };

    const nuevosServicios = [...servicios, nuevoServicio];
    await guardarServicios(nuevosServicios);
    setServicios(nuevosServicios);
    
    Alert.alert('Éxito', 'Servicio agregado correctamente');
    setNuevoNombre('');
    setNuevoPrecio('');
    setModalNuevoServicio(false);
  };

  const confirmarEliminar = (id: string) => {
    Alert.alert(
      'Eliminar Servicio',
      '¿Estás seguro de que deseas eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const nuevosServicios = servicios.filter((s) => s.id !== id);
            await guardarServicios(nuevosServicios);
            setServicios(nuevosServicios);
            Alert.alert('Éxito', 'Servicio eliminado');
          },
        },
      ]
    );
  };

  const servicioActual = servicios.find(s => s.id === servicioSeleccionado);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Servicios</Text>
          <Text style={styles.subtitle}>Registra los ingresos por servicios</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Nuevo Ingreso</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Selector de servicio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Servicio</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalSeleccion(true)}
              >
                <Text style={servicioActual ? styles.selectorTextSelected : styles.selectorText}>
                  {servicioActual ? `${servicioActual.nombre} - ₡${servicioActual.precio.toLocaleString()}` : 'Selecciona un servicio'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
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

            <Button onPress={registrarEntrada} size="lg" style={styles.submitButton}>
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              Registrar Entrada
            </Button>
          </CardContent>
        </Card>

        {/* Lista de servicios */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeaderCollapsible}
            onPress={() => setMostrarServicios(!mostrarServicios)}
          >
            <View>
              <Text style={styles.cardTitle}>Lista de Servicios</Text>
              <Text style={styles.cardDescription}>
                Toca para {mostrarServicios ? 'ocultar' : 'ver'} precios
              </Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {mostrarServicios && (
            <CardContent>
              {servicios.map((servicio) => (
                <View key={servicio.id} style={styles.servicioItem}>
                  <View style={styles.servicioInfo}>
                    <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                    {editandoId === servicio.id ? (
                      <View style={styles.editContainer}>
                        <Input
                          value={precioEditado}
                          onChangeText={setPrecioEditado}
                          keyboardType="numeric"
                          placeholder="Precio"
                          style={styles.editInput}
                        />
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => guardarEdicion(servicio.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="#22c55e" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => setEditandoId(null)}
                        >
                          <Ionicons name="close" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.servicioPrecio}>
                        ₡{servicio.precio.toLocaleString()}
                      </Text>
                    )}
                  </View>
                  {editandoId !== servicio.id && (
                    <View style={styles.servicioActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setEditandoId(servicio.id);
                          setPrecioEditado(servicio.precio.toString());
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => confirmarEliminar(servicio.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              <Button
                onPress={() => setModalNuevoServicio(true)}
                variant="outline"
                style={styles.addServiceButton}
              >
                <Ionicons name="add" size={20} color="#0f172a" style={{ marginRight: 8 }} />
                Agregar Servicio
              </Button>
            </CardContent>
          )}
        </Card>
      </View>

      {/* Modal de selección de servicio */}
      <Modal
        visible={modalSeleccion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalSeleccion(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona un Servicio</Text>
              <TouchableOpacity onPress={() => setModalSeleccion(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {servicios.map((servicio) => (
                <TouchableOpacity
                  key={servicio.id}
                  style={[
                    styles.modalItem,
                    servicioSeleccionado === servicio.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setServicioSeleccionado(servicio.id);
                    setModalSeleccion(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemName}>{servicio.nombre}</Text>
                    <Text style={styles.modalItemPrice}>
                      ₡{servicio.precio.toLocaleString()}
                    </Text>
                  </View>
                  {servicioSeleccionado === servicio.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para agregar nuevo servicio */}
      <Modal
        visible={modalNuevoServicio}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalNuevoServicio(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Nuevo Servicio</Text>
              <TouchableOpacity onPress={() => setModalNuevoServicio(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Servicio</Text>
                <Input
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                  placeholder="Ej: Tinte de cabello"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Precio (₡)</Text>
                <Input
                  value={nuevoPrecio}
                  onChangeText={setNuevoPrecio}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.modalActions}>
                <Button
                  onPress={() => setModalNuevoServicio(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button onPress={agregarNuevoServicio} style={{ flex: 1 }}>
                  <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                  Agregar
                </Button>
              </View>
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
  cardHeaderCollapsible: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  servicioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  servicioInfo: {
    flex: 1,
  },
  servicioNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  servicioPrecio: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  servicioActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editInput: {
    flex: 1,
  },
  addServiceButton: {
    marginTop: 8,
    width: '100%',
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
    maxHeight: '80%',
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
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 14,
    color: '#64748b',
  },
  modalForm: {
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
