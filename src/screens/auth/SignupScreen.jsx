
import { StyleSheet, Text, View, TextInput, Pressable, Dimensions } from 'react-native'
import { colors } from '../../global/colors'
import { useState } from 'react'
import { useSignUpMutation } from '../../services/auth/authApi'
const textInputWidth = Dimensions.get('window').width * 0.7

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUp, { isLoading, error }] = useSignUpMutation()

  const handleRegister = async () => {

    console.log('CLICK REGISTRAR', { email, password, confirmPassword })

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
    <View style={styles.gradient}>
      <Text style={styles.title}>CorteYa</Text>
      <Text style={styles.subTitle}>Registrate</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={colors.white}
          placeholder="Email"
          style={styles.textInput}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={colors.white}
          placeholder="Password"
          style={styles.textInput}
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor={colors.white}
          placeholder="Repetir password"
          style={styles.textInput}
          secureTextEntry
        />
      </View>

      <View style={styles.footTextContainer}>
        <Text style={styles.whiteText}>¿Ya tienes una cuenta?</Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={{ ...styles.whiteText, ...styles.underLineText }}>
            Iniciar sesión
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text style={styles.error}>
          {error?.data?.error?.message || 'Error'}
        </Text>
      )}

      <Pressable
        style={[styles.btn, isLoading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.btnText}>{isLoading ? 'Creando...' : 'Crear cuenta'}</Text>
      </Pressable>
    </View>
  )
}

export default SignupScreen

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary
  },
  title: {
    color: colors.primary,
    fontFamily: 'Mulidey',
    fontSize: 80
  },
  subTitle: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 3
  },
  inputContainer: {
    gap: 16,
    margin: 16,
    marginTop: 48,
    alignItems: 'center'
  },
  textInput: {
    padding: 8,
    paddingLeft: 16,
    borderRadius: 16,
    backgroundColor: colors.darkGray,
    width: textInputWidth,
    color: colors.white
  },
  footTextContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8
  },
  whiteText: {
    color: colors.white
  },
  underLineText: {
    textDecorationLine: 'underline'
  },
  strongText: {
    fontWeight: '900',
    fontSize: 16
  },
  btn: {
    padding: 16,
    paddingHorizontal: 32,
    backgroundColor: colors.black,
    borderRadius: 16,
    marginTop: 16
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700'
  },
  error: {
    padding: 16,
    backgroundColor: colors.red,
    borderRadius: 8,
    color: colors.white,
    marginTop: 12,
    marginBottom: 4
  }
})
