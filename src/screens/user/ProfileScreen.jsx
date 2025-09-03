import { StyleSheet, Text, View, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native'
import { colors } from '../../global/colors'
import CameraIcon from '../../components/CameraIcon'
import { useState, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useSelector, useDispatch } from 'react-redux'
import { usePutProfilePictureMutation } from '../../services/user/userApi'
import { setProfilePicture, clearUser } from '../../features/user/userSlice'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { clearSession } from '../../db'

const ProfileScreen = () => {
  const dispatch = useDispatch()

  // user / foto
  const user = useSelector(state => state.userReducer.userEmail)
  const localId = useSelector(state => state.userReducer.localId)
  const image = useSelector(state => state.userReducer.profilePicture)
  const [triggerPutProfilePicture] = usePutProfilePictureMutation()

  // ubicación
  const [location, setLocation] = useState(null)
  const [locationLoaded, setLocationLoaded] = useState(false)
  const [address, setAddress] = useState('')

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled) {
      const imgBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`
      dispatch(setProfilePicture(imgBase64))
      triggerPutProfilePicture({ localId, image: imgBase64 })
    }
  }

  useEffect(() => {
    async function getCurrentLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          setLocationLoaded(true)
          return
        }

        const loc = await Location.getCurrentPositionAsync({})
        if (loc) {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&key=${process.env.EXPO_PUBLIC_GMAPS_API_KEY}`
          )
          const data = await resp.json()
          setAddress(data?.results?.[0]?.formatted_address || '')
          setLocation(loc)
        }
      } catch (e) {
        console.log('Error al obtener la ubicación:', e)
      } finally {
        setLocationLoaded(true)
      }
    }
    getCurrentLocation()
  }, [])

  const handleLogout = async () => {
    try { await clearSession() } catch {}
    dispatch(clearUser())
  }

  return (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      {/* Avatar */}
      <View style={styles.imageProfileContainer}>
        {image ? (
          <Image source={{ uri: image }} resizeMode="cover" style={styles.profileImage} />
        ) : (
          <Text style={styles.textProfilePlaceHolder}>{(user || 'U').charAt(0).toUpperCase()}</Text>
        )}
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, styles.cameraIcon]}
        >
          <CameraIcon />
        </Pressable>
      </View>

      {/* Datos */}
      <Text style={styles.profileData}>Email: {user}</Text>

      {/* Ubicación */}
      <View style={styles.titleContainer}>
        <Text>Mi ubicación:</Text>
      </View>
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
              title={'CorteYa'}
            />
          </MapView>
        ) : locationLoaded ? (
          <Text>Hubo un problema al obtener la ubicación</Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>

      <View style={styles.placeDescriptionContainer}>
        <View style={styles.addressContainer}>
          <Text style={styles.address}>{address || ''}</Text>
        </View>
      </View>

      {/* Botón Salir */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={18} color={colors.white} />
        <Text style={styles.logoutText}>Salir</Text>
      </Pressable>
    </ScrollView>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  profileContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
  },
  imageProfileContainer: {
    width: 128,
    height: 128,
    borderRadius: 128,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  textProfilePlaceHolder: {
    color: colors.white,
    fontSize: 48,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 128,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  profileData: {
    paddingVertical: 8,
    fontSize: 16,
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  mapContainer: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
    elevation: 5,
    marginBottom: 4,
    borderRadius: 12,
  },
  map: {
    height: 240,
  },
  placeDescriptionContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  addressContainer: {
    paddingVertical: 8,
  },
  address: {
    color: colors.black,
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: colors.black,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
  },
  logoutText: { color: colors.white, fontWeight: '700' },
})
