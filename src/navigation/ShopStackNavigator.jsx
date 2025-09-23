import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Header from '../components/Header';

import ProductsScreen from '../screens/shop/ProductsScreen';     // Lista de barberías
import BarbershopScreen from '../screens/barbers/BarbershopScreen'; // Detalle
import BookingScreen from '../screens/booking/BookingScreen';       // NUEVA: Reserva

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
      <Stack.Screen name="Booking" component={BookingScreen} />
    </Stack.Navigator>
  );
}
