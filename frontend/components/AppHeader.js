/**
 * App Header with user info and logout
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';

export default function AppHeader() {
  const { user, dbUser, logout } = useAuth();

  const displayName = dbUser?.display_name || user?.displayName || user?.email || user?.phoneNumber || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <Pressable
        testID="logout-btn"
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(224,122,95,0.1)',
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(224,122,95,0.2)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
});
