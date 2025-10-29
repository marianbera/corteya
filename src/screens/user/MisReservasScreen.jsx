import { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { colors } from '../../global/colors';

export default function MisReservasScreen() {
  const navigation = useNavigation();
  const [reservas, setReservas] = useState([]);

  // Cargar cada vez que se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('misReservas');
          setReservas(raw ? JSON.parse(raw) : []);
        } catch (e) {
          setReservas([]);
        }
      })();
    }, [])
  );

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Header propio con back */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={colors.black} />
        </Pressable>
        <TextKarlaRegular style={styles.title}>Mis reservas</TextKarlaRegular>
        <View style={{ width: 32 }} />{/* spacer para balancear */}
      </View>

      {reservas.length === 0 ? (
        <TextKarlaRegular style={{ color: '#666', marginTop: 20 }}>
          Aún no tenés reservas guardadas.
        </TextKarlaRegular>
      ) : (
        reservas
          .slice()              // copia para no mutar
          .reverse()            // más recientes arriba
          .map((r) => (
            <View key={r.id} style={styles.card}>
              {/* Logo / placeholder */}
              {r.barberLogo ? (
                <Image source={{ uri: r.barberLogo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <TextKarlaRegular style={styles.logoInitials}>
                    {initials(r.barber)}
                  </TextKarlaRegular>
                </View>
              )}

              {/* Datos */}
              <View style={styles.info}>
                <TextKarlaRegular style={styles.barberName}>
                  {r.barber || 'Barbería'}
                </TextKarlaRegular>
                <TextKarlaRegular style={styles.line}>
                  {r.service || '-'}{r.professional ? ` - ${r.professional}` : ''}
                </TextKarlaRegular>
                <TextKarlaRegular style={styles.line}>
                  {r.date} - {r.time} hs
                </TextKarlaRegular>
                <TextKarlaRegular style={[styles.line, { color: '#555' }]}>
                  Pago: {r.payMethod === 'mercadopago' ? 'Mercado Pago' : 'Efectivo'}
                </TextKarlaRegular>
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
}

const CARD = {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 1,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  container: { padding: 16, paddingBottom: 40, gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: colors.white,
    marginRight: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.black, flex: 1, textAlign: 'center' },

  card: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: { width: 54, height: 54, borderRadius: 10, backgroundColor: '#F2F2F2' },
  logoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: { color: '#444', fontWeight: '800' },

  info: { flex: 1, gap: 2 },
  barberName: { color: colors.black, fontWeight: '700' },
  line: { color: colors.black },
});
