import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F4F1DE' }}>
      <StatusBar style="dark" />
      <Slot />
    </View>
  );
}
