import { Stack } from "expo-router";
import { LogBox } from 'react-native';
import { AuthProvider } from "../context/AuthContext";
import './globals.css';

// Suppress known CSS Interop warnings at module load
LogBox.ignoreLogs([
  "Couldn't find a navigation context",
  'Writing to `value` during component render',
]);

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
      </Stack>
    </AuthProvider>
  );
}
