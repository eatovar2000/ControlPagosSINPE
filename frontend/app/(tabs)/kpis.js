import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, API_URL } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';

export default function KPIsScreen() {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadKPIs = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/v1/kpis/summary`, {
        headers: {
          ...authHeader,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Sesion expirada');
          return;
        }
        throw new Error('Error al cargar KPIs');
      }
      
      const data = await res.json();
      setKpis(data);
    } catch (e) {
      console.error('Error loading KPIs:', e);
      setError('No se pudieron cargar los KPIs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on tab focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadKPIs();
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadKPIs(false);
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
        <Text style={styles.title}>KPIs</Text>
        <Text style={styles.subtitle}>Resumen de tu negocio</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorIcon}>{'\u26A0'}</Text>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadKPIs()}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : kpis ? (
          <View style={styles.cards}>
            {/* Balance */}
            <View style={styles.balanceCard} testID="kpi-balance">
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceIcon}>{'\u25C8'}</Text>
                <Text style={styles.balanceLabel}>Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                {formatCRC(kpis.balance)}
              </Text>
              <Text style={styles.balanceMeta}>
                {kpis.movement_count} movimiento{kpis.movement_count !== 1 ? 's' : ''} total{kpis.movement_count !== 1 ? 'es' : ''}
              </Text>
            </View>

            {/* Income + Expense row */}
            <View style={styles.row}>
              <View style={styles.smallCard} testID="kpi-income">
                <View style={styles.smallHeader}>
                  <View
                    style={[
                      styles.smallIconWrap,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.smallIcon, { color: colors.primary }]}>
                      {'\u2191'}
                    </Text>
                  </View>
                  <Text style={styles.smallLabel}>Ingresos</Text>
                </View>
                <Text style={[styles.smallAmount, { color: colors.primary }]}>
                  {formatCRC(kpis.total_income)}
                </Text>
              </View>

              <View style={styles.smallCard} testID="kpi-expense">
                <View style={styles.smallHeader}>
                  <View
                    style={[
                      styles.smallIconWrap,
                      { backgroundColor: colors.secondaryLight },
                    ]}
                  >
                    <Text
                      style={[styles.smallIcon, { color: colors.secondary }]}
                    >
                      {'\u2193'}
                    </Text>
                  </View>
                  <Text style={styles.smallLabel}>Gastos</Text>
                </View>
                <Text
                  style={[styles.smallAmount, { color: colors.secondary }]}
                >
                  {formatCRC(kpis.total_expense)}
                </Text>
              </View>
            </View>

            {/* Pending */}
            <View style={styles.pendingCard} testID="kpi-pending">
              <View style={styles.pendingLeft}>
                <View style={styles.pendingIconWrap}>
                  <Text style={styles.pendingIcon}>{'\u23F0'}</Text>
                </View>
                <View>
                  <Text style={styles.pendingTitle}>Pendientes</Text>
                  <Text style={styles.pendingMeta}>
                    Movimientos sin clasificar
                  </Text>
                </View>
              </View>
              <Text style={styles.pendingCount}>{kpis.pending_count}</Text>
            </View>

            {/* Empty state hint */}
            {kpis.movement_count === 0 && (
              <View style={styles.hintCard}>
                <Text style={styles.hintIcon}>{'\u{1F4A1}'}</Text>
                <Text style={styles.hintText}>
                  Comienza registrando tu primer movimiento en la pestana "Registrar"
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>
              No se pudieron cargar los KPIs
            </Text>
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
  errorWrap: { alignItems: 'center', paddingTop: 60 },
  errorIcon: {
    fontSize: 36,
    color: colors.warning,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
  },
  errorText: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
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
  cards: { gap: 14 },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceIcon: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  smallIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIcon: { fontSize: 14, fontWeight: '700' },
  smallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  smallAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
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
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: { fontSize: 18 },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  pendingCount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.warning,
  },
  hintCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintIcon: { fontSize: 24 },
  hintText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
});
