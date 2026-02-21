import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';
import AppHeader from '../../components/AppHeader';

function TabIcon({ name, focused, isCenter }) {
  if (isCenter) {
    return (
      <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
        <Text style={styles.centerIcon}>+</Text>
      </View>
    );
  }

  // Clear icons using unicode symbols
  // Inbox/List for movements, Bar chart for KPIs
  const getIcon = () => {
    if (name === 'Pendientes') {
      return (
        <View style={styles.listIconWrap}>
          <View style={[styles.listLine, focused && styles.listLineActive]} />
          <View style={[styles.listLine, focused && styles.listLineActive]} />
          <View style={[styles.listLine, focused && styles.listLineActive]} />
        </View>
      );
    }
    if (name === 'KPIs') {
      return (
        <View style={styles.chartIconWrap}>
          <View style={[styles.chartBar, styles.chartBar1, focused && styles.chartBarActive]} />
          <View style={[styles.chartBar, styles.chartBar2, focused && styles.chartBarActive]} />
          <View style={[styles.chartBar, styles.chartBar3, focused && styles.chartBarActive]} />
        </View>
      );
    }
    return <Text style={styles.tabIcon}>{'\u25CB'}</Text>;
  };

  return (
    <View style={styles.tabIconWrap}>
      {getIcon()}
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pendientes',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Pendientes" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: 'Registrar',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Registrar" focused={focused} isCenter />
          ),
          tabBarLabel: () => (
            <Text style={styles.centerLabel}>Registrar</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="kpis"
        options={{
          title: 'KPIs',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="KPIs" focused={focused} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  tabIconActive: {
    color: colors.primary,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerBtnActive: {
    backgroundColor: colors.secondaryDark,
    transform: [{ scale: 1.05 }],
  },
  centerIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  // List icon (3 horizontal lines)
  listIconWrap: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  listLine: {
    width: 20,
    height: 3,
    backgroundColor: colors.textMuted,
    borderRadius: 1.5,
  },
  listLineActive: {
    backgroundColor: colors.primary,
  },
  // Chart icon (3 vertical bars)
  chartIconWrap: {
    width: 20,
    height: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 5,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
  },
  chartBar1: {
    height: 8,
  },
  chartBar2: {
    height: 14,
  },
  chartBar3: {
    height: 11,
  },
  chartBarActive: {
    backgroundColor: colors.primary,
  },
});
