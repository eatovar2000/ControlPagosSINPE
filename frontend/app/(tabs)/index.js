import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, API_URL } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';

export default function PendientesScreen() {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state: 'pending' or 'all' - always defaults to 'pending'
  const [filter, setFilter] = useState('pending');
  
  // Modal state for claim/classify
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [responsibleName, setResponsibleName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMovements = async (showLoader = true, currentFilter = filter) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const authHeader = await getAuthHeader();
      const url = currentFilter === 'pending' 
        ? `${API_URL}/v1/movements?status=pending`
        : `${API_URL}/v1/movements`;
      const res = await fetch(url, {
        headers: {
          ...authHeader,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Sesion expirada');
          return;
        }
        throw new Error('Error al cargar movimientos');
      }
      
      const data = await res.json();
      setMovements(data);
    } catch (e) {
      console.error('Error loading movements:', e);
      setError('No se pudieron cargar los movimientos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on tab focus - always reset to 'pending' filter
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setFilter('pending');
        loadMovements(true, 'pending');
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMovements(false, filter);
  };

  const handleFilterChange = (newFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      loadMovements(true, newFilter);
    }
  };

  const openClaimModal = (movement) => {
    setSelectedMovement(movement);
    setResponsibleName(movement.responsible || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMovement(null);
    setResponsibleName('');
  };

  const updateMovementStatus = async (newStatus) => {
    if (!selectedMovement) return;
    
    setSaving(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/v1/movements/${selectedMovement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          status: newStatus,
          responsible: responsibleName.trim() || null,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Error al actualizar');
      }
      
      closeModal();
      loadMovements(false, filter);
    } catch (e) {
      console.error('Error updating movement:', e);
      Alert.alert('Error', 'No se pudo actualizar el movimiento');
    } finally {
      setSaving(false);
    }
  };

  const formatCRC = (amount) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <View style={styles.safe}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.brand}>SUMA</Text>
        <Text style={styles.title}>Movimientos</Text>
        
        {/* Filter Selector */}
        <View style={styles.filterRow} testID="filter-selector">
          <Text style={styles.filterLabel}>Mostrar:</Text>
          <View style={styles.filterPills}>
            <Pressable
              style={[styles.filterPill, filter === 'pending' && styles.filterPillActive]}
              onPress={() => handleFilterChange('pending')}
              testID="filter-pending-btn"
            >
              <Text style={[styles.filterPillText, filter === 'pending' && styles.filterPillTextActive]}>
                Pendientes
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              onPress={() => handleFilterChange('all')}
              testID="filter-all-btn"
            >
              <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
                Todos
              </Text>
            </Pressable>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
          {filter === 'pending' ? ' por clasificar' : ''}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.errorIcon}>{'\u26A0'}</Text>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadMovements()}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : movements.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>{'\u2713'}</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'pending' ? 'Todo al dia' : 'Sin movimientos'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' 
                ? 'No hay movimientos pendientes' 
                : 'No hay movimientos registrados'}
            </Text>
            <Text style={styles.emptyHint}>
              Usa la pestana "Registrar" para agregar movimientos
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {movements.map((mov, i) => {
              const isIncome = mov.type === 'income';
              return (
                <Pressable
                  key={mov.id}
                  testID={`movement-card-${i}`}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => openClaimModal(mov)}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isIncome
                            ? colors.primaryLight
                            : colors.secondaryLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.icon,
                          {
                            color: isIncome
                              ? colors.primary
                              : colors.secondary,
                          },
                        ]}
                      >
                        {isIncome ? '\u2191' : '\u2193'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {mov.description || 'Sin descripcion'}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {mov.date}
                        {mov.responsible ? ` \u00B7 ${mov.responsible}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text
                      style={[
                        styles.cardAmount,
                        {
                          color: isIncome ? colors.primary : colors.secondary,
                        },
                      ]}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCRC(mov.amount)}
                    </Text>
                    <Text style={styles.tapHint}>Tocar para clasificar</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Claim/Classify Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Clasificar Movimiento</Text>
              
              {selectedMovement && (
                <View style={styles.modalMovementInfo}>
                  <Text style={styles.modalMovementDesc}>
                    {selectedMovement.description || 'Sin descripcion'}
                  </Text>
                  <Text style={[
                    styles.modalMovementAmount,
                    { color: selectedMovement.type === 'income' ? colors.primary : colors.secondary }
                  ]}>
                    {selectedMovement.type === 'income' ? '+' : '-'}
                    {formatCRC(selectedMovement.amount)}
                  </Text>
                </View>
              )}
              
              <Text style={styles.inputLabel}>Responsable (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={responsibleName}
                onChangeText={setResponsibleName}
                placeholder="Nombre del responsable"
                placeholderTextColor={colors.textMuted}
                testID="responsible-input"
              />
              
              <View style={styles.statusButtons}>
                <Pressable
                  style={[styles.statusBtn, styles.classifyBtn]}
                  onPress={() => updateMovementStatus('classified')}
                  disabled={saving}
                  testID="classify-btn"
                >
                  <Text style={styles.statusBtnText}>
                    {saving ? 'Guardando...' : 'Clasificar'}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[styles.statusBtn, styles.closeBtn]}
                  onPress={() => updateMovementStatus('closed')}
                  disabled={saving}
                  testID="close-btn"
                >
                  <Text style={styles.statusBtnText}>
                    {saving ? 'Guardando...' : 'Cerrar'}
                  </Text>
                </Pressable>
              </View>
              
              <Pressable
                style={styles.cancelBtn}
                onPress={closeModal}
                disabled={saving}
                testID="cancel-modal-btn"
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    fontSize: 36,
    color: colors.primary,
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 36,
    color: colors.warning,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  tapHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMovementInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalMovementDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  modalMovementAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  classifyBtn: {
    backgroundColor: colors.primary,
  },
  closeBtn: {
    backgroundColor: colors.secondary,
  },
  statusBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
