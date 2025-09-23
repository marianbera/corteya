// TextKarlaRegular.jsx (o .js)
import { Text } from 'react-native';
import { colors } from '../global/colors';

const base = { fontFamily: 'Karla-Regular', color: colors.black };

export default function TextKarlaRegular({ style, ...props }) {
  // El estilo externo (style) va último para que sobrescriba color/tamaño
  return <Text {...props} style={[base, style]} />;
}
