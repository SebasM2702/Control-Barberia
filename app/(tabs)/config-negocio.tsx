import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import {
  Building2,
  User,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Mail,
  Phone,
  UserCircle2,
  X,
  ChevronRight,
  Settings,
  HelpCircle,
  ShieldCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [viewMode, setViewMode] = useState<'negocio' | 'personal'>('negocio');
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
      if (!session?.businessId) throw new Error('Negocio no disponible');

      if (modalType === 'service') {
        const p = parseFloat(price) || 0;
        if (editId) {
          await servicesAPI.updateService(session.businessId!, editId, { name: name.trim(), price: p });
          showToast('Servicio actualizado', 'success');
        } else {
          await servicesAPI.createService(session.businessId!, { name: name.trim(), price: p, scope: viewMode });
          showToast('Servicio creado', 'success');
        }
      } else if (modalType === 'category') {
        if (editId) {
          await categoriesAPI.updateCategory(session.businessId!, editId, { name: name.trim() });
          showToast('Categoría actualizada', 'success');
        } else {
          await categoriesAPI.createCategory(session.businessId!, { name: name.trim(), scope: viewMode });
          showToast('Categoría creada', 'success');
        }
      }
      setModalType(null);
      setEditId(null);
      refresh();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'No se pudo guardar', 'error');
    } finally { setLoading(false); }
  };

  const confirmDelete = (type: 'service' | 'category', id: string) => {
    Alert.alert('Eliminar permanentemente', '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            if (!session?.businessId) throw new Error('Negocio no disponible');
            if (type === 'service') await servicesAPI.deleteService(session.businessId, id);
            else await categoriesAPI.deleteCategory(session.businessId, id);
            showToast('Eliminado correctamente', 'success');
            refresh();
          } catch (e) { showToast('No se pudo eliminar', 'error'); } finally { setLoading(false); }
        }
      }
    ]);
  };

  const filteredServices = services.filter(s => (s.scope || 'negocio') === viewMode);
  const filteredCategories = categories.filter(c => (c.scope || 'negocio') === viewMode);

  return (
    <LinearGradient colors={['#f8fafc', '#fff7ed', '#fffbeb']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza catálogos y gestiona tu cuenta</Text>
        </View>

        {/* Toggle de Vista */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.toggleBtn, viewMode === 'negocio' && styles.toggleBtnActive]}
            onPress={() => setViewMode('negocio')}
          >
            <Building2 size={18} color={viewMode === 'negocio' ? '#ea580c' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.toggleText, viewMode === 'negocio' && styles.toggleTextActive]}>Negocio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.toggleBtn, viewMode === 'personal' && styles.toggleBtnActive]}
            onPress={() => setViewMode('personal')}
          >
            <User size={18} color={viewMode === 'personal' ? '#ea580c' : '#64748b'} strokeWidth={2.5} />
            <Text style={[styles.toggleText, viewMode === 'personal' && styles.toggleTextActive]}>Personal</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN CATÁLOGOS */}
        <View style={styles.sectionHeader}>
          <Settings size={18} color="#ea580c" strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Catálogos</Text>
        </View>

        <TouchableOpacity onPress={openNewService} style={styles.addCard}>
          <Plus size={24} color="#ea580c" strokeWidth={3} />
          <Text style={styles.addText}>Añadir {viewMode === 'negocio' ? 'Servicio' : 'Ingreso'}</Text>
        </TouchableOpacity>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle>{viewMode === 'negocio' ? 'Servicios Disponibles' : 'Fuentes de Ingreso'}</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardList}>
            {filteredServices.length === 0 ? (
              <Text style={styles.emptyText}>No hay elementos registrados</Text>
            ) : (
              filteredServices.map((s, idx) => (
                <View key={s.id}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{s.name}</Text>
                      <Text style={styles.itemSub}>Monto sugerido: ₡{(s.price || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity onPress={() => { setModalType('service'); setEditId(s.id); setName(s.name); setPrice(String(s.price || 0)); }} style={styles.actionIcon}>
                        <Edit2 size={18} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete('service', s.id)} style={styles.actionIcon}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < filteredServices.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </CardContent>
        </Card>

        <TouchableOpacity onPress={openNewCategory} style={styles.addCard}>
          <Plus size={24} color="#ea580c" strokeWidth={3} />
          <Text style={styles.addText}>Añadir {viewMode === 'negocio' ? 'Categoría de Gasto' : 'Gasto Personal'}</Text>
        </TouchableOpacity>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle>{viewMode === 'negocio' ? 'Categorías de Gasto' : 'Gastos Personales'}</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardList}>
            {filteredCategories.length === 0 ? (
              <Text style={styles.emptyText}>No hay categorías registradas</Text>
            ) : (
              filteredCategories.map((c, idx) => (
                <View key={c.id}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>{c.name}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity onPress={() => { setModalType('category'); setEditId(c.id); setName(c.name); }} style={styles.actionIcon}>
                        <Edit2 size={18} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete('category', c.id)} style={styles.actionIcon}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < filteredCategories.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </CardContent>
        </Card>

        {/* SECCIÓN SOPORTE */}
        <View style={styles.sectionHeader}>
          <HelpCircle size={18} color="#ea580c" strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Soporte y Cuenta</Text>
        </View>

        <View>
          <View style={styles.supportItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f0f9ff' }]}>
              <UserCircle2 size={20} color="#0369a1" />
            </View>
            <View>
              <Text style={styles.supportText}>Sebastian Moreno</Text>
              <Text style={styles.itemSub}>Desarrollador</Text>
            </View>
          </View>
          <View style={styles.supportItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fdf2f8' }]}>
              <Mail size={20} color="#be185d" />
            </View>
            <View>
              <Text style={styles.supportText}>sebastianlmoreno02@gmail.com</Text>
              <Text style={styles.itemSub}>Correo Electrónico</Text>
            </View>
          </View>
          <View style={styles.supportItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f0fdf4' }]}>
              <Phone size={20} color="#15803d" />
            </View>
            <View>
              <Text style={styles.supportText}>+506 6305-0664</Text>
              <Text style={styles.itemSub}>WhatsApp de Soporte</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
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
                    showToast('Error al cerrar sesión', 'error');
                  } finally {
                    setLoading(false);
                  }
                },
              },
            ]);
          }}
        >
          <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ShieldCheck size={14} color="#94a3b8" />
          <Text style={styles.footerText}>Versión 1.2.0 • Control-Barberia</Text>
        </View>
      </ScrollView>

      <Modal visible={modalType !== null} animationType="fade" transparent={true} onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Editar' : 'Nuevo'} {modalType === 'service' ? (viewMode === 'negocio' ? 'Servicio' : 'Ingreso') : 'Categoría'}</Text>
              <TouchableOpacity onPress={() => setModalType(null)} style={styles.closeBtn}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <Input value={name} onChangeText={setName} placeholder="Ej: Corte Premium" />
              </View>
              {modalType === 'service' && (
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <Text style={styles.label}>Precio Sugerido (₡)</Text>
                  <Input value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
                </View>
              )}
              <View style={styles.modalActions}>
                <Button variant="outline" onPress={() => setModalType(null)} style={styles.modalBtn}>
                  Cancelar
                </Button>
                <Button onPress={save} style={styles.modalBtn}>
                  Guardar
                </Button>
              </View>
            </View>
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
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b', lineHeight: 22 },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginLeft: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1 },

  addCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    marginBottom: 20,
  },
  addText: { marginTop: 8, fontSize: 14, fontWeight: '700', color: '#64748b' },

  card: { marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardList: { paddingVertical: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 14 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  itemSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  itemActions: { flexDirection: 'row', gap: 16 },
  actionIcon: { padding: 4 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fee2e2',
    marginTop: 8,
    marginBottom: 32,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#ef4444' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 },
  footerText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
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
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  closeBtn: { padding: 4 },
  modalForm: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginLeft: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalBtn: { flex: 1, height: 54 },
  modalBtnTextCancel: { color: '#475569', fontWeight: '700' },
  modalBtnTextSave: { color: '#ffffff', fontWeight: '700' },
});
