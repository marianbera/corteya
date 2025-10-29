import { useRef, useState } from 'react'
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
  Alert,
  ActivityIndicator,
} from 'react-native'
import { colors } from '../../global/colors'
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'
import { auth, firebaseConfig } from '../../firebase'
import {
  PhoneAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  signOut,
} from 'firebase/auth'

const textInputWidth = Math.min(Dimensions.get('window').width * 0.86, 420)
const LOGO = require('../../../assets/logo.png')

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('') // solo dígitos, sin +54

  const [verificationId, setVerificationId] = useState(null)
  const [code, setCode] = useState('')
  const recaptchaRef = useRef(null)

  const [sendingCode, setSendingCode] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const validateBasics = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completá email y ambas contraseñas')
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas', 'Las contraseñas no coinciden')
      return false
    }
    if (password.length < 6) {
      Alert.alert('Contraseña', 'Debe tener al menos 6 caracteres')
      return false
    }
    if (!phone) {
      Alert.alert('Teléfono', 'Ingresá tu número de teléfono')
      return false
    }
    return true
  }

  const sendCode = async () => {
    if (!validateBasics()) return
    try {
      setSendingCode(true)
      const provider = new PhoneAuthProvider(auth)
      const id = await provider.verifyPhoneNumber(
        `+54${phone.replace(/\D/g, '')}`,
        recaptchaRef.current
      )
      setVerificationId(id)
      Alert.alert('SMS enviado', 'Revisá tu teléfono para el código de 6 dígitos.')
    } catch (e) {
      console.log('ERR sendCode', e)
      Alert.alert('Error enviando SMS', e?.message ?? 'Intentalo de nuevo')
    } finally {
      setSendingCode(false)
    }
  }

  const confirmCodeAndRegister = async () => {
    if (!verificationId || !code) {
      return Alert.alert('Código', 'Ingresá el código de 6 dígitos del SMS.')
    }
    try {
      setConfirming(true)

      // 1) Verificar teléfono (esto crea/abre sesión con un usuario "de teléfono")
      const phoneCred = PhoneAuthProvider.credential(verificationId, code)
      const { user: phoneUser } = await signInWithCredential(auth, phoneCred)

      // 2) Si el teléfono YA está asociado a una cuenta con email (o cualquier provider),
      //    bloqueamos: no permitimos reutilizar el número
      const alreadyHasEmailProvider = phoneUser.providerData.some(
        (p) => p.providerId === 'password' || !!phoneUser.email
      )
      if (alreadyHasEmailProvider) {
        await signOut(auth)
        return Alert.alert(
          'Teléfono en uso',
          'Este número ya está asociado a otra cuenta. Usá otro número.'
        )
      }

      // 3) Linkear email+password a ESTE MISMO usuario (crear credencial de email)
      const emailCred = EmailAuthProvider.credential(email.trim(), password)
      await linkWithCredential(phoneUser, emailCred)

      // (Opcional) guardar perfil mínimo en tu RTDB si querés:
      // try {
      //   const uid = phoneUser.uid
      //   await fetch(`${process.env.EXPO_PUBLIC_BASE_RTDB_URL}/users/${uid}.json`, {
      //     method: 'PATCH',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ email, phone: `+54${phone.replace(/\D/g, '')}` }),
      //   })
      // } catch {}

      // 4) Cerrar sesión y llevar a Login (no dejamos la sesión iniciada)
      await signOut(auth)
      Alert.alert('✅ Listo', 'Teléfono verificado y cuenta creada. Ahora podés iniciar sesión.')
      navigation.replace('Login')
    } catch (e) {
      console.log('ERR confirm & link', e)
      // Si el teléfono ya está usado por otra cuenta, linkWithCredential o signInWithCredential
      // podrían arrojar errores como auth/credential-already-in-use o similares.
      const msg =
        e?.code === 'auth/credential-already-in-use'
          ? 'Este número ya está asociado a otra cuenta.'
          : e?.message || 'Error al confirmar el código'
      Alert.alert('Error', msg)
    } finally {
      setConfirming(false)
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
          <FirebaseRecaptchaVerifierModal
            ref={recaptchaRef}
            firebaseConfig={firebaseConfig}
            attemptInvisibleVerification
          />
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Crear cuenta</Text>

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
              placeholder="Contraseña"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repetir Contraseña"
              placeholderTextColor="#9AA0A6"
              style={styles.input}
              secureTextEntry
            />

            {/* Teléfono con bandera y prefijo */}
            <View style={styles.phoneContainer}>
              <View style={styles.flagContainer}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w20/ar.png' }}
                  style={styles.flag}
                />
                <Text style={styles.prefix}>+54</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Número de teléfono"
                placeholderTextColor="#9AA0A6"
                style={styles.phoneInput}
                keyboardType="phone-pad"
              />
            </View>

            {!verificationId ? (
              <Pressable
                onPress={sendCode}
                style={({ pressed }) => [styles.btn, (pressed || sendingCode) && styles.btnPressed]}
                disabled={sendingCode}
                android_ripple={{ color: '#E5E5E5' }}
              >
                {sendingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Continuar </Text>
                )}
              </Pressable>
            ) : (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Código de 6 dígitos"
                  placeholderTextColor="#9AA0A6"
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Pressable
                  onPress={confirmCodeAndRegister}
                  style={({ pressed }) => [styles.btn, (pressed || confirming) && styles.btnPressed]}
                  disabled={confirming}
                  android_ripple={{ color: '#E5E5E5' }}
                >
                  {confirming ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Confirmar código</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.muted}>¿Ya tenés una cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Iniciar sesión</Text>
            </Pressable>
          </View>
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
    justifyContent: 'center',
  },
  logo: { width: 180, height: 90, marginTop: 12, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: colors.black, marginTop: 12 },
  form: { width: textInputWidth, gap: 12, marginTop: 16 },
  input: { ...CARD, paddingVertical: 14, paddingHorizontal: 16, color: colors.black },
  phoneContainer: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  flagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flag: { width: 20, height: 14, borderRadius: 2 },
  prefix: { fontWeight: '600', color: colors.black },
  phoneInput: { flex: 1, color: colors.black, fontSize: 15 },
  rowBetween: {
    width: textInputWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  muted: { color: '#6B7280' },
  link: { color: colors.black, fontWeight: '700', textDecorationLine: 'underline' },
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
