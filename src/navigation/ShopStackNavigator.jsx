import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Header from '../components/Header';

// Lista de barberías (tu ProductsScreen actual)
import ProductsScreen from '../screens/shop/ProductsScreen';

// Detalle nuevo
import BarbershopScreen from '../screens/barbers/BarbershopScreen';

const Stack = createNativeStackNavigator();

export default function ShopStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Barberías"
      screenOptions={{
        header: ({ route }) => <Header title="CorteYa" subtitle={route.name} />,
      }}
    >
      <Stack.Screen name="Barberías" component={ProductsScreen} />
      <Stack.Screen name="Barbería" component={BarbershopScreen} />
    </Stack.Navigator>
  );
}
