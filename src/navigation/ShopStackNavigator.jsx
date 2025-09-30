import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Header from '../components/Header'

import BarberiasScreen from '../screens/barberias/BarberiasScreen'
import BarbershopScreen from '../screens/barber/BarbershopScreen'
import BookingScreen from '../screens/booking/BookingScreen'

const Stack = createNativeStackNavigator()

export default function ShopStackNavigator() {
  return (
    // en tu ShopStackNavigator
<Stack.Navigator
  initialRouteName="Barberías"
  screenOptions={{
    header: ({ route }) => <Header routeName={route.name} />,
  }}
>
  <Stack.Screen name="Barberías" component={BarberiasScreen} />
  <Stack.Screen name="Barbería"  component={BarbershopScreen} />
  <Stack.Screen name="Booking"   component={BookingScreen} />
</Stack.Navigator>

  )
}
