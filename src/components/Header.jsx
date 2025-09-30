// src/components/Header.jsx
import { StyleSheet, View, Pressable, Image, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../global/colors';

const LOGO = require('../../assets/logo.png');
const SHOW_BACK_ON = ['Barbería', 'Booking'];

const BAR_H = 88;     // alto visual del appbar (sin contar el inset superior)
const BTN    = 36;    // tamaño del botón back
const ICON   = 20;    // tamaño del ícono

export default function Header({ routeName: routeNameProp }) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const currentName = routeNameProp || route.name;
  const showBack = navigation.canGoBack() && SHOW_BACK_ON.includes(currentName);

  // pintamos el status bar del color del header (Android)
  StatusBar.setBackgroundColor(colors.white);
  StatusBar.setBarStyle('dark-content'); // texto/íconos oscuros sobre fondo claro

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        {showBack && (
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            android_ripple={{ color: '#E5E5E5', borderless: true }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-left" size={ICON} color={'#2D2D2D'} />
          </Pressable>
        )}
      </View>
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white, // pinta el área del notch
  },
  bar: {
    height: BAR_H,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 5,
  },
  logo: {
    width: 140,
    height: 36,
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    // centrado vertical en la “bar”:
    top: (BAR_H - BTN) / 2,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAEAEA',
  },
});
