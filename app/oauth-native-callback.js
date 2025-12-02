import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente después del callback
    router.replace('/(tabs)/rooms');
  }, []);

  return null;
}