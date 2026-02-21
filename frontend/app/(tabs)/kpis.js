import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, API_URL } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';

// Recharts works on web only
const isWeb = Platform.OS === 'web';
let PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend;
if (isWeb) {
  const recharts = require('recharts');
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  Cell = recharts.Cell;
  ResponsiveContainer = recharts.ResponsiveContainer;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
}

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const COLORS_TYPE = ['#10B981', '#EF4444']; // green for income, red for expense
const COLORS_RESPONSIBLE = ['#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#84CC16', '#6B7280'];

export default function KPIsScreen() {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');

  const loadKPIs = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${API_URL}/v1/kpis/summary?period=${period}`, {
        headers: {
          ...authHeader,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Sesión expirada');
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

  // Reload on tab focus or period change
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadKPIs();
      }
    }, [isAuthenticated, period])
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

  const renderPieChartType = () => {
    if (!isWeb || !kpis?.breakdown_type?.length) return null;
    
    return (
      <View style={styles.chartCard} testID="chart-type">
        <Text style={styles.chartTitle}>Ingresos vs Gastos</Text>
        <View style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={kpis.breakdown_type}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {kpis.breakdown_type.map((entry, index) => (
                  <Cell key={`cell-type-${index}`} fill={COLORS_TYPE[index % COLORS_TYPE.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCRC(value)}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </View>
        <View style={styles.legendRow}>
          {kpis.breakdown_type.map((item, idx) => (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS_TYPE[idx] }]} />
              <Text style={styles.legendText}>{item.name}: {formatCRC(item.value)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChartResponsible = () => {
    if (!isWeb || !kpis?.breakdown_responsible?.length) return null;
    
    return (
      <View style={styles.chartCard} testID="chart-responsible">
        <Text style={styles.chartTitle}>Ingresos por Responsable</Text>
        <View style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={kpis.breakdown_responsible}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {kpis.breakdown_responsible.map((entry, index) => (
                  <Cell key={`cell-resp-${index}`} fill={COLORS_RESPONSIBLE[index % COLORS_RESPONSIBLE.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCRC(value)}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </View>
        <View style={styles.legendWrap}>
          {kpis.breakdown_responsible.map((item, idx) => (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS_RESPONSIBLE[idx % COLORS_RESPONSIBLE.length] }]} />
              <Text style={styles.legendText} numberOfLines={1}>{item.name}: {formatCRC(item.value)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

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

        {/* Period Selector */}
        <View style={styles.periodSelector} testID="period-selector">
          {PERIOD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[
                styles.periodBtn,
                period === opt.key && styles.periodBtnActive,
              ]}
              onPress={() => setPeriod(opt.key)}
              testID={`period-${opt.key}`}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  period === opt.key && styles.periodBtnTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

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
            {/* Balance Card */}
            <View style={styles.balanceCard} testID="kpi-balance">
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceIcon}>{'\u25C8'}</Text>
                <Text style={styles.balanceLabel}>Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                {formatCRC(kpis.totals.balance)}
              </Text>
            </View>

            {/* Income + Expense row */}
            <View style={styles.row}>
              <View style={styles.smallCard} testID="kpi-income">
                <View style={styles.smallHeader}>
                  <View
                    style={[
                      styles.smallIconWrap,
                      { backgroundColor: '#D1FAE5' },
                    ]}
                  >
                    <Text style={[styles.smallIcon, { color: '#10B981' }]}>
                      {'\u2191'}
                    </Text>
                  </View>
                  <Text style={styles.smallLabel}>Ingresos</Text>
                </View>
                <Text style={[styles.smallAmount, { color: '#10B981' }]}>
                  {formatCRC(kpis.totals.income_total)}
                </Text>
              </View>

              <View style={styles.smallCard} testID="kpi-expense">
                <View style={styles.smallHeader}>
                  <View
                    style={[
                      styles.smallIconWrap,
                      { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[styles.smallIcon, { color: '#EF4444' }]}
                    >
                      {'\u2193'}
                    </Text>
                  </View>
                  <Text style={styles.smallLabel}>Gastos</Text>
                </View>
                <Text
                  style={[styles.smallAmount, { color: '#EF4444' }]}
                >
                  {formatCRC(kpis.totals.expense_total)}
                </Text>
              </View>
            </View>

            {/* Pie Chart: Income vs Expense */}
            {renderPieChartType()}

            {/* Pie Chart: Income by Responsible */}
            {renderPieChartResponsible()}

            {/* Empty state hint */}
            {kpis.totals.income_total === 0 && kpis.totals.expense_total === 0 && (
              <View style={styles.hintCard}>
                <Text style={styles.hintIcon}>{'\u{1F4A1}'}</Text>
                <Text style={styles.hintText}>
                  No hay movimientos en este período. Registra tu primer movimiento en la pestaña "Registrar".
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
  content: { padding: 20, paddingTop: 12, paddingBottom: 40 },
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
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
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
  chartCard: {
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
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  chartContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
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
