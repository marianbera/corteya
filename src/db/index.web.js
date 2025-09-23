import AsyncStorage from '@react-native-async-storage/async-storage';

export const initDB = async () => {};
export const initSessionTable = async () => {};

export const saveSession = async (localId, email) => {
  await AsyncStorage.setItem('session', JSON.stringify({ localId, email }));
};

export const getSession = async () => {
  const s = await AsyncStorage.getItem('session');
  return s ? JSON.parse(s) : null;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('session');
};
