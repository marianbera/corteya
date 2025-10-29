import { StyleSheet, View, Image, Pressable, ScrollView, Alert, Text } from 'react-native';
import { colors } from '../../global/colors';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { usePutProfilePictureMutation } from '../../services/user/userApi';
import { setProfilePicture, setUser } from '../../features/user/userSlice';
import { clearSession } from '../../db';
import Icon from 'react-native-vector-icons/Feather';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();

  const email   = useSelector(state => state.userReducer.userEmail);
  const localId = useSelector(state => state.userReducer.localId);
  const image   = useSelector(state => state.userReducer.profilePicture);

  const [triggerPutProfilePicture] = usePutProfilePictureMutation();
  const [name, setName] = useState('');

  // Trae (si existe) el nombre desde RTDB, o toma el pre-@ del email
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!localId) return;
      try {
        const url = `${process.env.EXPO_PUBLIC_BASE_RTDB_URL}/users/${localId}.json`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted) return;
        setName(data?.name || email?.split('@')[0] || '');
      } catch {
        setName(email?.split('@')[0] || '');
      }
    })();
    return () => { mounted = false; };
  }, [localId]);

  // ---- helpers foto
  const ensurePermissions = async () => {
    const { status: lib } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cam } = await ImagePicker.requestCameraPermissionsAsync();
    return lib === 'granted' && cam === 'granted';
  };

  const updateImage = (base64) => {
    const img = `data:image/jpeg;base64,${base64}`;
    dispatch(setProfilePicture(img));
    if (localId) triggerPutProfilePicture({ localId, image: img });
  };

  const pickFromCamera = async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled) updateImage(res.assets[0].base64);
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled) updateImage(res.assets[0].base64);
  };

  const onEditPhoto = async () => {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert('Permisos', 'Necesitamos permisos de cámara y galería para cambiar la foto.');
      return;
    }
    Alert.alert(
      'Foto de perfil',
      'Elegí una opción',
      [
        { text: 'Sacar foto', onPress: pickFromCamera },
        { text: 'Elegir de la galería', onPress: pickFromLibrary },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const onLogout = async () => {
    try { await clearSession(); } catch {}
    dispatch(setUser({ localId: null, email: null }));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Avatar + botón cámara */}
      <View style={styles.avatarWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="user" size={36} color={colors.white} />
          </View>
        )}
        <Pressable onPress={onEditPhoto} style={styles.camBtn} hitSlop={10}>
          <Icon name="camera" size={16} color={colors.white} />
        </Pressable>
      </View>

      {/* Nombre + email */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.email}>{email}</Text>

      {/* ---- NUEVO: botón Mis reservas ---- */}
      <Pressable
        onPress={() => navigation.navigate('MisReservas')}
        style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.menuBtnLeft}>
          <Icon name="calendar" size={18} color={colors.black} />
          <Text style={styles.menuText}>Mis reservas</Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.black} />
      </Pressable>

      {/* Botón Cerrar sesión */}
      <Pressable onPress={onLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { alignItems: 'center', padding: 20, gap: 14 },

  // Avatar
  avatarWrap: { width: 130, height: 130, position: 'relative', marginTop: 12 },
  avatar: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 3, borderColor: '#F2F2F2', backgroundColor: '#EAEAEA',
  },
  avatarPlaceholder: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#B4A178', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#F2F2F2',
  },
  camBtn: {
    position: 'absolute', right: 4, bottom: 6,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },

  name: { fontSize: 20, fontWeight: '700', color: colors.black, marginTop: 6 },
  email: { color: '#6F6F6F', marginBottom: 8 },

  // ---- NUEVO: botón Mis reservas
  menuBtn: {
    width: '92%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },

  logoutBtn: {
    marginTop: 12,
    width: '92%',
    backgroundColor: colors.black,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  logoutText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
