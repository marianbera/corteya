// src/navigation/ShopStackNavigator.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductsScreen, ProductScreen } from '../screens';
import Header from '../components/Header';

const Stack = createNativeStackNavigator();

export default function ShopStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Productos"
      screenOptions={{
        header: ({ route }) => <Header title="CorteYa" subtitle={route.name} />,
      }}
    >
      <Stack.Screen name="Productos" component={ProductsScreen} />
      <Stack.Screen name="Producto" component={ProductScreen} />
    </Stack.Navigator>
  );
}
