import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { colors, API_URL } from '../../lib/theme';
import { useAuth } from '../../lib/AuthContext';

export default function RegistrarScreen() {
  const { getAuthHeader } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      showMessage('Error', 'Selecciona un tipo de movimiento');
      return;
    }
    
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      showMessage('Error', 'Ingresa un monto valido');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const authHeader = await getAuthHeader();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/v1/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          type: selectedType,
          amount: parsedAmount,
          currency: 'CRC',
          description: description || `${selectedType === 'income' ? 'Ingreso' : 'Gasto'} del ${today}`,
          status: 'pending',
          date: today,
          tags: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al guardar');
      }

      // Success - reset form
      setSuccess(true);
      setSelectedType(null);
      setAmount('');
      setDescription('');
      
      showMessage('Guardado', 'Movimiento registrado correctamente');

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving movement:', error);
      showMessage('Error', error.message || 'No se pudo guardar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const formatAmountDisplay = (text) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    return numericValue;
  };

  const isFormValid = selectedType && amount && parseFloat(amount) > 0;

  return (
    <View style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.brand}>SUMA</Text>
        <Text style={styles.title}>Registrar</Text>
        <Text style={styles.subtitle}>Nuevo movimiento</Text>

        {success && (
          <View style={styles.successBanner} testID="success-banner">
            <Text style={styles.successIcon}>{'\u2713'}</Text>
            <Text style={styles.successText}>Movimiento guardado</Text>
          </View>
        )}

        {/* Type selector */}
        <View style={styles.typeRow}>
          <Pressable
            testID="type-income-btn"
            onPress={() => setSelectedType('income')}
            style={[
              styles.typeCard,
              selectedType === 'income' && styles.typeCardActiveIncome,
            ]}
          >
            <View
              style={[
                styles.typeIconWrap,
                { backgroundColor: 'rgba(27,77,62,0.1)' },
              ]}
            >
              <Text style={[styles.typeIcon, { color: colors.primary }]}>
                {'\u2191'}
              </Text>
            </View>
            <Text style={styles.typeLabel}>Ingreso</Text>
          </Pressable>

          <Pressable
            testID="type-expense-btn"
            onPress={() => setSelectedType('expense')}
            style={[
              styles.typeCard,
              selectedType === 'expense' && styles.typeCardActiveExpense,
            ]}
          >
            <View
              style={[
                styles.typeIconWrap,
                { backgroundColor: 'rgba(224,122,95,0.1)' },
              ]}
            >
              <Text style={[styles.typeIcon, { color: colors.secondary }]}>
                {'\u2193'}
              </Text>
            </View>
            <Text style={styles.typeLabel}>Gasto</Text>
          </Pressable>
        </View>

        {/* Amount */}
        <Text style={styles.fieldLabel}>Monto (CRC)</Text>
        <TextInput
          testID="amount-input"
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => setAmount(formatAmountDisplay(text))}
          editable={!loading}
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>Descripcion</Text>
        <TextInput
          testID="description-input"
          style={styles.textInput}
          placeholder="Que fue este movimiento?"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        {/* Placeholder fields - to be implemented */}
        {['Unidad de negocio', 'Responsable', 'Etiquetas'].map((field) => (
          <Pressable
            key={field}
            testID={`field-${field.toLowerCase().replace(/ /g, '-')}`}
            style={styles.fieldBtn}
          >
            <Text style={styles.fieldBtnText}>{field}</Text>
            <Text style={styles.fieldBtnArrow}>{'\u203A'}</Text>
          </Pressable>
        ))}

        {/* Submit */}
        <Pressable
          testID="submit-movement-btn"
          disabled={!isFormValid || loading}
          style={[
            styles.submitBtn,
            (!isFormValid || loading) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Guardar movimiento</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 12, paddingBottom: 120 },
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  successIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  successText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardActiveIncome: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeCardActiveExpense: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: { fontSize: 22, fontWeight: '700' },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 56,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  fieldBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  fieldBtnArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
