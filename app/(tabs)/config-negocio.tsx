import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useRefresh } from '../../utils/RefreshContext';
import servicesAPI from '../../data/services';
import categoriesAPI from '../../data/expenseCategories';
import { signOut } from '../../utils/auth';
import { useRouter } from 'expo-router';

export default function ConfigNegocio() {
  const { setLoading, showToast, refresh, session, sessionLoaded } = useRefresh();
  const router = useRouter();
  const [scope, setScope] = useState<'negocio' | 'personal'>('negocio');
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [modalType, setModalType] = useState<'service' | 'category' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    let unsubS: any;
    let unsubC: any;
    if (session?.businessId) {
      unsubS = servicesAPI.subscribeServices(session.businessId, (items) => setServices(items));
      unsubC = categoriesAPI.subscribeCategories(session.businessId, (items) => setCategories(items));
    }
    return () => { if (unsubS) unsubS(); if (unsubC) unsubC(); };
  }, [session]);

  if (!sessionLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  const openNewService = () => { setModalType('service'); setEditId(null); setName(''); setPrice(''); };
  const openNewCategory = () => { setModalType('category'); setEditId(null); setName(''); };

  const save = async () => {
    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    try {
      setLoading(true);
      if (!session?.businessId) {
        const detail = session
          ? (session.uid ? `UID:${session.uid} pero sin BusinessId` : 'Sesión vacía {}')
          : 'Sesión null/undefined';
        const errorMsg = `[DEBUG_ERROR_001] Negocio no disponible: ${detail}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[ConfigNegocio] Saving to businessId:', session.businessId);
      if (modalType === 'service') {
        const p = parseFloat(price) || 0;
        if (editId) {
          await servicesAPI.updateService(session.businessId!, editId, { name: name.trim(), price: p });
          showToast('Servicio actualizado', 'success');
        } else {
          await servicesAPI.createService(session.businessId!, { name: name.trim(), price: p, scope });
          showToast('Servicio creado', 'success');
        }
      } else if (modalType === 'category') {
        if (editId) {
          await categoriesAPI.updateCategory(session.businessId!, editId, { name: name.trim() });
          showToast('Categoría actualizada', 'success');
        } else {
          await categoriesAPI.createCategory(session.businessId!, { name: name.trim(), scope });
          showToast('Categoría creada', 'success');
        }
      }
      setModalType(null);
      setEditId(null);
      refresh();
    } catch (e: any) {
      console.error('[ConfigNegocio] Save failed:', e);
      showToast(e.message || 'No se pudo guardar', 'error');
    } finally { setLoading(false); }
  };

  const confirmDelete = (type: 'service' | 'category', id: string) => {
    Alert.alert('Eliminar', '¿Seguro?', [{ text: 'Cancelar', style: 'cancel' }, {
      text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          if (!session?.businessId) throw new Error('[DEBUG_ERROR_002] Negocio no disponible');
          if (type === 'service') await servicesAPI.deleteService(session.businessId, id);
          else await categoriesAPI.deleteCategory(session.businessId, id);
          showToast('Eliminado', 'success');
          refresh();
        } catch (e) { console.error(e); showToast('No se pudo eliminar', 'error'); } finally { setLoading(false); }
      }
    }]);
  };

  const filteredServices = services.filter(s => (s.scope || 'negocio') === scope);
  const filteredCategories = categories.filter(c => (c.scope || 'negocio') === scope);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Gestiona tus catálogos de datos</Text>
        </View>

        <View style={styles.scopeSelector}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'negocio' && styles.scopeBtnActive]}
            onPress={() => setScope('negocio')}
          >
            <Ionicons name="business-outline" size={20} color={scope === 'negocio' ? '#fff' : '#64748b'} />
            <Text style={[styles.scopeBtnText, scope === 'negocio' && styles.scopeBtnTextActive]}>Mi Negocio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'personal' && styles.scopeBtnActive]}
            onPress={() => setScope('personal')}
          >
            <Ionicons name="person-outline" size={20} color={scope === 'personal' ? '#fff' : '#64748b'} />
            <Text style={[styles.scopeBtnText, scope === 'personal' && styles.scopeBtnTextActive]}>Personal</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>{scope === 'negocio' ? 'Servicios del Negocio' : 'Fuentes de Ingreso'}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredServices.map((s) => (
              <View key={s.id} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>{s.name}</Text>
                  <Text style={styles.itemSub}>₡{(s.price || 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => { setModalType('service'); setEditId(s.id); setName(s.name); setPrice(String(s.price || 0)); }} style={{ marginRight: 8 }}>
                    <Ionicons name="create-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete('service', s.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Button onPress={openNewService} variant="outline" style={{ marginTop: 8 }}>
              Agregar {scope === 'negocio' ? 'Servicio' : 'Ingreso'}
            </Button>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>{scope === 'negocio' ? 'Categorías de Gasto' : 'Categorías de Gasto Personal'}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCategories.map((c) => (
              <View key={c.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{c.name}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => { setModalType('category'); setEditId(c.id); setName(c.name); }} style={{ marginRight: 8 }}>
                    <Ionicons name="create-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete('category', c.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Button onPress={openNewCategory} variant="outline" style={{ marginTop: 8 }}>
              Agregar Categoría
            </Button>
          </CardContent>
        </Card>



        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Soporte y Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.contactRow}>
              <Ionicons name="person-circle-outline" size={24} color="#0f172a" />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Desarrollador</Text>
                <Text style={styles.contactValue}>Sebastian Moreno</Text>
              </View>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={24} color="#0f172a" />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Correo Electrónico</Text>
                <Text style={styles.contactValue}>sebastianlmoreno02@gmail.com</Text>
              </View>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={24} color="#0f172a" />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Teléfono</Text>
                <Text style={styles.contactValue}>+506 6305-0664</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardContent>
            <Button
              variant="destructive"
              onPress={() => {
                Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        setLoading(true);
                        await signOut();
                        router.replace('/login');
                      } catch (e) {
                        console.error(e);
                        showToast('No se pudo cerrar sesión', 'error');
                      } finally {
                        setLoading(false);
                      }
                    },
                  },
                ]);
              }}
            >
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </View>

      <Modal visible={modalType !== null} animationType="slide" transparent={true} onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Editar' : 'Nuevo'} {modalType === 'service' ? (scope === 'negocio' ? 'Servicio' : 'Ingreso') : 'Categoría'}</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <Input value={name} onChangeText={setName} placeholder="Ej: Corte de cabello" />
              </View>
              {modalType === 'service' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Precio / Monto Sugerido</Text>
                  <Input value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
                </View>
              )}
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Button variant="outline" onPress={() => setModalType(null)} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
                <Button onPress={save} style={{ flex: 1 }}>Guardar</Button>
              </View>
            </View>
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
  scopeSelector: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  scopeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  scopeBtnActive: { backgroundColor: '#0f172a' },
  scopeBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#64748b' },
  scopeBtnTextActive: { color: '#fff' },
  card: { marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2ff' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  itemSub: { color: '#64748b' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalForm: { padding: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  contactText: { marginLeft: 12 },
  contactLabel: { fontSize: 12, color: '#64748b' },
  contactValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
});
