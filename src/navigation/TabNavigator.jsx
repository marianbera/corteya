import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ShopStackNavigator from './ShopStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
//Puedo utilizar acá también el barrel (index.js)
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../global/colors';
import { useWindowDimensions } from 'react-native';
import { useEffect,useState } from 'react';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const [isLargeScreeen,setIsLargeScreen] = useState(null)

    const {width,height} = useWindowDimensions()
    //console.log(isLargeScreeen)

    useEffect(()=>{
        if(width>height){
            setIsLargeScreen(true)
        }else{
            setIsLargeScreen(false)
        }
    },[width])

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                position: 'absolute',
                backgroundColor: '#FFFFFF',   // <-- blanco sólido
                borderTopColor: '#EDEDED',
                height: 64,
                paddingBottom: 8,
                paddingTop: 8,
                elevation: 8,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: -2 },
                },
                tabBarActiveTintColor: colors.black,
                tabBarInactiveTintColor: '#9E9E9E',
        }}
        >
            <Tab.Screen
                name="Home"
                component={ShopStackNavigator}
                options={{
                    tabBarIcon: ({focused}) => <Icon name="search" size={24} color={focused?colors.darkGray:colors.mediumGray} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackNavigator}
                options={{
                    tabBarIcon: ({focused}) => <Icon name="user" size={24} color={focused?colors.darkGray:colors.mediumGray} />
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar:{
        backgroundColor:colors.white
    }
})