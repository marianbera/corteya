import { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { useRoute } from '@react-navigation/native';
import { colors } from '../../global/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGetBarberByIdQuery } from '../../services/barbers/barbersApi';

dayjs.locale('es');

const SLOT_MINUTES = 30;

const makeSlots = (open = '10:00', close = '20:00', step = SLOT_MINUTES) => {
  const start = dayjs(open, 'HH:mm');
  const end = dayjs(close, 'HH:mm');
  const out = [];
  let t = start;
  while (t.isBefore(end)) {
    out.push(t.format('HH:mm'));
    t = t.add(step, 'minute');
  }
  return out;
};

const dayKey = ['sun','mon','tue','wed','thu','fri','sat'];

export default function BookingScreen() {
  const route = useRoute();
  const { barberId, service, professional } = route.params || {};
  const { data: barber } = useGetBarberByIdQuery(barberId, { skip: !barberId });

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [payMethod, setPayMethod] = useState('efectivo'); // 'efectivo' | 'mercadopago'

  // horas de atención del barbero según día
  const hoursForSelectedDay = useMemo(() => {
    const idx = dayjs(selectedDate).day(); // 0=domingo
    const k = dayKey[idx];
    const h = barber?.hours?.[k];
    return h && h.open && h.close ? { open: h.open, close: h.close } : null;
  }, [barber, selectedDate]);

  // slots de ese día (si está cerrado, vacío)
  const daySlots = useMemo(() => {
    if (!hoursForSelectedDay) return [];
    return makeSlots(hoursForSelectedDay.open, hoursForSelectedDay.close, SLOT_MINUTES);
  }, [hoursForSelectedDay]);

  const isClosed = !hoursForSelectedDay;

  const onSelectDate = (dayObj) => {
    setSelectedDate(dayObj.dateString);
    setSelectedTime(null);
  };

  const onConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('Falta elegir horario', 'Seleccioná un horario disponible.');
      return;
    }

    const durationMin = Number(service?.duration || 30);
    const start = dayjs(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');
    const end = start.add(durationMin, 'minute');

    // Mensaje de éxito
    Alert.alert(
      '¡Turno confirmado!',
      `Te esperamos el ${start.format('DD/MM')} a las ${start.format('HH:mm')} hs.\n` +
      `Servicio: ${service?.title}\n` +
      `Profesional: ${professional?.name}\n` +
      `Pago: ${payMethod === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}`
    );

    // (Opcional) abrir Google Calendar pre-completado:
    // Esto NO requiere API, es un link con parámetros.
    const addToGCal = true; // si no querés abrirlo automático, ponelo en false
    if (addToGCal) {
      const d1 = start.utc().format('YYYYMMDD[T]HHmmss[Z]');
      const d2 = end.utc().format('YYYYMMDD[T]HHmmss[Z]');
      const text = encodeURIComponent(`${service?.title} - ${professional?.name} @ ${barber?.name}`);
      const details = encodeURIComponent(`Reserva hecha desde CorteYa. Pago: ${payMethod}.`);
      const location = encodeURIComponent(barber?.address || '');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${d1}/${d2}&details=${details}&location=${location}`;
      try {
        await Linking.openURL(url);
      } catch {}
    }
  };

  // UI
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <TextKarlaRegular style={styles.title}>Elegí fecha y horario</TextKarlaRegular>

      {/* Resumen */}
      <View style={styles.card}>
        <TextKarlaRegular style={styles.bold}>Barbería</TextKarlaRegular>
        <TextKarlaRegular>{barber?.name}</TextKarlaRegular>
        <TextKarlaRegular style={styles.spaceTop}>
          <TextKarlaRegular style={styles.bold}>Servicio: </TextKarlaRegular>
          {service?.title} (${Number(service?.price || 0).toLocaleString('es-AR')})
        </TextKarlaRegular>
        <TextKarlaRegular>
          <TextKarlaRegular style={styles.bold}>Profesional: </TextKarlaRegular>
          {professional?.name}
        </TextKarlaRegular>
      </View>

      {/* Calendario */}
      <View style={styles.card}>
        <Calendar
          onDayPress={onSelectDate}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#111' },
          }}
          theme={{
            arrowColor: colors.black,
            monthTextColor: colors.black,
            textSectionTitleColor: '#8F8F8F',
            todayTextColor: colors.black,
          }}
          enableSwipeMonths
          firstDay={1}
        />
      </View>

      {/* Horarios */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <TextKarlaRegular style={styles.bold}>Horarios</TextKarlaRegular>
          {isClosed && <TextKarlaRegular style={{color:'#B00020'}}>Cerrado este día</TextKarlaRegular>}
        </View>

        <View style={styles.slotGrid}>
          {!isClosed && daySlots.map((t) => {
            const active = selectedTime === t;
            return (
              <Pressable
                key={t}
                onPress={() => setSelectedTime(t)}
                style={({ pressed }) => [
                  styles.slot,
                  active && styles.slotActive,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <TextKarlaRegular style={[styles.slotText, active && { color: colors.white }]}>
                  {t}
                </TextKarlaRegular>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Pago */}
      <View style={styles.card}>
        <TextKarlaRegular style={styles.bold}>Método de pago</TextKarlaRegular>

        <View style={styles.payRow}>
          <Pressable
            style={styles.payOption}
            onPress={() => setPayMethod('efectivo')}
          >
            <Icon
              name={payMethod === 'efectivo' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color={colors.black}
            />
            <TextKarlaRegular style={styles.payLabel}>Efectivo</TextKarlaRegular>
          </Pressable>

          <Pressable
            style={styles.payOption}
            onPress={() => setPayMethod('mercadopago')}
          >
            <Icon
              name={payMethod === 'mercadopago' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color={colors.black}
            />
            <TextKarlaRegular style={styles.payLabel}>Mercado Pago</TextKarlaRegular>
          </Pressable>
        </View>
      </View>

      {/* Confirmar */}
      <Pressable
        style={[styles.cta, (!selectedTime) && styles.ctaDisabled]}
        disabled={!selectedTime}
        onPress={onConfirm}
      >
        <TextKarlaRegular style={styles.ctaText}>
          Confirmar turno
        </TextKarlaRegular>
      </Pressable>
    </ScrollView>
  );
}

const CARD = {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 1,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', color: colors.black },
  card: { ...CARD, gap: 8 },
  bold: { fontWeight: '700', color: colors.black },
  spaceTop: { marginTop: 6 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  slot: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: '#F3F3F3',
  },
  slotActive: { backgroundColor: colors.black },
  slotText: { color: colors.black, fontWeight: '600' },

  payRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payLabel: { color: colors.black },

  cta: {
    ...CARD,
    backgroundColor: colors.black,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaDisabled: { backgroundColor: '#BDBDBD' },
  ctaText: { color: colors.white, fontWeight: '800' },
});
