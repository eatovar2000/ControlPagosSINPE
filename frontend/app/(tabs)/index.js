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
  
  // Modal state for claim/classify
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [responsibleName, setResponsibleName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMovements = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/v1/movements?status=pending`, {
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

  // Reload on tab focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadMovements();
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMovements(false);
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
        <Text style={styles.title}>Pendientes</Text>
        <Text style={styles.subtitle}>
          {movements.length} movimiento{movements.length !== 1 ? 's' : ''} por
          clasificar
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
            <Text style={styles.emptyTitle}>Todo al dia</Text>
            <Text style={styles.emptyText}>No hay movimientos pendientes</Text>
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
                </Pressable>
              );
            })}
          </View>
        )}
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
    marginLeft: 8,
  },
});
