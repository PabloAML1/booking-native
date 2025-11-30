import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications',
  'functionality provided by expo-notifications was removed',
  'Use a development build instead of Expo Go',
]);

LogBox.ignoreLogs([
  'Clerk: Clerk has been loaded with development keys',
]);

console.warn = (function(originalWarn) {
  return function(...args) {
    const message = args[0];
    
    if (
      typeof message === 'string' && 
      (message.includes('expo-notifications') || 
       message.includes('Android Push notifications') ||
       message.includes('Expo Go'))
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
})(console.warn);

console.error = (function(originalError) {
  return function(...args) {
    const message = args[0];
    
    if (
      typeof message === 'string' && 
      (message.includes('expo-notifications') || 
       message.includes('Android Push notifications') ||
       message.includes('removed from Expo Go'))
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };
})(console.error);