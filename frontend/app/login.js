/**
 * Login Screen with Google Sign-In and SMS OTP
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';

export default function LoginScreen() {
  const {
    loginWithGoogle,
    sendSmsCode,
    verifySmsCode,
    confirmationResult,
    loading,
    error,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState(null); // null, 'google', 'phone'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setAuthMethod('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setLocalError('Ingresa un numero de telefono valido');
      return;
    }

    setLocalError(null);
    setSendingCode(true);
    try {
      await sendSmsCode(phoneNumber);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setLocalError('Ingresa el codigo de 6 digitos');
      return;
    }

    setLocalError(null);
    setVerifyingCode(true);
    try {
      await verifySmsCode(verificationCode);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  const displayError = localError || error;

  // Show code verification step
  if (confirmationResult) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.brand}>SUMA</Text>
            <Text style={styles.title}>Verificar codigo</Text>
            <Text style={styles.subtitle}>
              Enviamos un codigo SMS al {phoneNumber}
            </Text>

            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Codigo de verificacion</Text>
              <TextInput
                testID="verification-code-input"
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              {displayError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              )}

              <Pressable
                testID="verify-code-btn"
                style={[styles.primaryBtn, verifyingCode && styles.btnDisabled]}
                onPress={handleVerifyCode}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verificar</Text>
                )}
              </Pressable>

              <Pressable
                testID="back-to-phone-btn"
                style={styles.linkBtn}
                onPress={() => {
                  setVerificationCode('');
                  setLocalError(null);
                }}
              >
                <Text style={styles.linkBtnText}>Cambiar numero</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Show phone number input
  if (authMethod === 'phone') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.brand}>SUMA</Text>
            <Text style={styles.title}>Ingresar con SMS</Text>
            <Text style={styles.subtitle}>
              Te enviaremos un codigo de verificacion
            </Text>

            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Numero de telefono</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+506</Text>
                </View>
                <TextInput
                  testID="phone-input"
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="8888 8888"
                  placeholderTextColor="#ccc"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>

              {displayError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              )}

              <Pressable
                testID="send-code-btn"
                style={[styles.primaryBtn, sendingCode && styles.btnDisabled]}
                onPress={handleSendCode}
                disabled={sendingCode}
              >
                {sendingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar codigo</Text>
                )}
              </Pressable>

              <Pressable
                testID="back-btn"
                style={styles.linkBtn}
                onPress={() => {
                  setAuthMethod(null);
                  setPhoneNumber('');
                  setLocalError(null);
                }}
              >
                <Text style={styles.linkBtnText}>Volver</Text>
              </Pressable>
            </View>

            {/* reCAPTCHA container - invisible */}
            <View nativeID="recaptcha-container" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main login screen
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>SUMA</Text>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>
            Controla tus ingresos y gastos de forma simple
          </Text>
        </View>

        <View style={styles.authOptions}>
          {displayError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          {/* Google Sign-In */}
          <Pressable
            testID="google-login-btn"
            style={({ pressed }) => [
              styles.authBtn,
              styles.googleBtn,
              pressed && styles.btnPressed,
              loading && styles.btnDisabled,
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading && authMethod === 'google' ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <View style={styles.authIconWrap}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.authBtnText}>Continuar con Google</Text>
              </>
            )}
          </Pressable>

          {/* Phone Sign-In */}
          <Pressable
            testID="phone-login-btn"
            style={({ pressed }) => [
              styles.authBtn,
              styles.phoneBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={() => {
              setAuthMethod('phone');
              setLocalError(null);
            }}
          >
            <View style={[styles.authIconWrap, styles.phoneIconWrap]}>
              <Text style={styles.phoneIcon}>📱</Text>
            </View>
            <Text style={[styles.authBtnText, styles.phoneBtnText]}>
              Continuar con SMS
            </Text>
          </Pressable>

          {/* reCAPTCHA container - invisible */}
          <View nativeID="recaptcha-container" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar, aceptas nuestros terminos de servicio
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  authOptions: {
    gap: 16,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneBtn: {
    backgroundColor: colors.primary,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.7,
  },
  authIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  phoneIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  phoneIcon: {
    fontSize: 16,
  },
  authBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneBtnText: {
    color: '#FFFFFF',
  },
  form: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCode: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 1,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    letterSpacing: 8,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(224,122,95,0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(224,122,95,0.2)',
  },
  errorText: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
