import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersScreen } from '../screens'
import Header from '../components/Header';

const Stack = createNativeStackNavigator();


export default function OrdersStackNavigator() {
    return (
        <Stack.Navigator
            initialRouteName='Carrito'
            screenOptions={{
                header: ({ route }) => <Header title="CorteYa" subtitle={route.name} />
            }}
        >
            <Stack.Screen name="Carrito" component={OrdersScreen} />
        </Stack.Navigator>
    );
}