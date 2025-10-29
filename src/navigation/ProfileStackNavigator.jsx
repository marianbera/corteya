import ProfileScreen from '../screens/user/ProfileScreen';
import Header from '../components/Header';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MisReservasScreen from '../screens/user/MisReservasScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
    return (
        <Stack.Navigator
            initialRouteName='Perfil'
            screenOptions={{
                header: ({route})=><Header title="CorteYa" subtitle={route.name}  />
            }}
        >
            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="MisReservas" component={MisReservasScreen} options={{ title: 'Mis Reservas' }}/>
        </Stack.Navigator>
    );
}