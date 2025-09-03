import { StyleSheet, Text, View, Pressable, Platform, StatusBar } from 'react-native'
import { colors } from '../global/colors'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'

const Header = ({ title, subtitle }) => {
  const navigation = useNavigation()
  const canGoBack = navigation.canGoBack()

 
  const padTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0

  return (
    <View style={[styles.container, { paddingTop: padTop }]}>
      <Text style={styles.title}>{title}</Text>

      {canGoBack && (
        <Pressable
          style={[styles.goBack, { top: padTop + 54 }]} // <- alineado con el título
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Icon name="chevron-left" size={28} color={colors.white} />
        </Pressable>
      )}
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    height: 140, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
  },
  title: {
    fontSize: 44,
    color: colors.white,
    fontFamily: 'Mulidey',
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    marginTop: 4,
  },
  goBack: {
    position: 'absolute',
    left: 16,
  },
})
