import { useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Dimensions,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { colors } from '../../global/colors'
import { useLoginMutation } from '../../services/auth/authApi'
import { setUser } from '../../features/user/userSlice'
import { useDispatch } from 'react-redux'
import { saveSession, clearSession } from '../../db'

const textInputWidth = Math.min(Dimensions.get('window').width * 0.86, 420)
const LOGO = require('../../../assets/logo.png') // <- poné tu imagen en /assets/logo.png

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [persistSession, setPersistSession] = useState(false)
  const [triggerLogin, result] = useLoginMutation()
  const dispatch = useDispatch()

  const onsubmit = () => {
    triggerLogin({ email, password })
  }

  useEffect(() => {
    const saveLoginSession = async () => {
      if (result.status === 'fulfilled') {
        try {
          const { localId, email } = result.data
          if (persistSession) {
            await saveSession(localId, email)
          } else {
            await clearSession()
          }
          dispatch(setUser({ localId, email }))
        } catch (error) {
          console.log('Error al guardar sesión:', error)
        }
      } else if (result.status === 'rejected') {
        console.log('Hubo un error al iniciar sesión')
      }
    }
    saveLoginSession()
  }, [result])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Logo */}
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />

          {/* Título */}
          <Text style={styles.title}>Iniciar sesión</Text>

          {/* Inputs */}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              secureTextEntry
            />
          </View>

          {/* Link a registro */}
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>¿No tenés una cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>Crear cuenta</Text>
            </Pressable>
          </View>

          {/* Errores */}
          {result.isError && (
            <Text style={styles.error}>
              {result?.error?.data?.error?.message || 'Error al iniciar sesión'}
            </Text>
          )}

          {/* Botón */}
          <Pressable
            onPress={onsubmit}
            style={({ pressed }) => [
              styles.btn,
              (pressed || result.isLoading) && styles.btnPressed,
            ]}
            disabled={result.isLoading}
            android_ripple={{ color: '#E5E5E5' }}
          >
            <Text style={styles.btnText}>
              {result.isLoading ? 'Ingresando…' : 'Ingresar'}
            </Text>
          </Pressable>

          {/* Recordarme */}
          <View style={styles.rememberMe}>
            <Text style={styles.muted}>¿Mantener sesión iniciada?</Text>
            <Switch
              onValueChange={() => setPersistSession(!persistSession)}
              value={persistSession}
              trackColor={{ false: '#D1D5DB', true: '#B4A178' }}
              thumbColor={persistSession ? '#fff' : '#fff'}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const CARD = {
  backgroundColor: '#F7F7F7',
  borderColor: '#EAEAEA',
  borderWidth: 1,
  borderRadius: 14,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 90,
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginTop: 12,
  },
  form: {
    width: textInputWidth,
    gap: 12,
    marginTop: 16,
  },
  input: {
    ...CARD,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.black,
  },
  rowBetween: {
    width: textInputWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  muted: { color: '#6B7280' },
  link: {
    color: colors.black,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  error: {
    width: textInputWidth,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    color: '#991B1B',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    textAlign: 'center',
  },
  btn: {
    width: textInputWidth,
    backgroundColor: colors.black,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  btnPressed: { opacity: 0.85 },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  rememberMe: {
    width: textInputWidth,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
})
