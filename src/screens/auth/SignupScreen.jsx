import { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { colors } from '../../global/colors'
import { useSignUpMutation } from '../../services/auth/authApi'

const textInputWidth = Math.min(Dimensions.get('window').width * 0.86, 420)
const LOGO = require('../../../assets/logo.png') // <- poné tu imagen en /assets/logo.png

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUp, { isLoading, error }] = useSignUpMutation()

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      alert('Completá email y ambas contraseñas')
      return
    }
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      const res = await signUp({ email, password }).unwrap()
      console.log('OK signup', res)
      navigation.replace('Login')
    } catch (e) {
      console.log('ERR signup', e)
      alert(e?.data?.error?.message || 'Error registrando')
    }
  }

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
          <Text style={styles.title}>Crear cuenta</Text>

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
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repetir password"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              secureTextEntry
            />
          </View>

          {/* Link a login */}
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>¿Ya tenés una cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Iniciar sesión</Text>
            </Pressable>
          </View>

          {/* Errores */}
          {error && (
            <Text style={styles.error}>
              {error?.data?.error?.message || 'Error'}
            </Text>
          )}

          {/* Botón */}
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.btn,
              (pressed || isLoading) && styles.btnPressed,
            ]}
            disabled={isLoading}
            android_ripple={{ color: '#E5E5E5' }}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Creando…' : 'Crear cuenta'}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default SignupScreen

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
    justifyContent: 'center'
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
})
