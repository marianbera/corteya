import { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { useRoute } from '@react-navigation/native';
import { colors } from '../../global/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGetBarberByIdQuery } from '../../services/barbers/barbersApi';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ★ NUEVO

dayjs.locale('es');

const SLOT_MINUTES = 60; // 1 hora
const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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

/* ------------------ utils robustas para horarios ------------------ */
function toHHmm(value) {
  // acepta "10:00", "10", 10, " 10 : 00 "
  if (value == null) return null;
  const str = String(value).trim();
  if (!str.length) return null;
  if (str.includes(':')) {
    const [h, m] = str.split(':').map(s => Number(s.trim()));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return { h, m };
  }
  const h = Number(str);
  if (Number.isNaN(h)) return null;
  return { h, m: 0 };
}

function makeSlots(open = '10:00', close = '20:00', stepMin = SLOT_MINUTES) {
  const o = toHHmm(open);
  const c = toHHmm(close);
  if (!o || !c) return [];
  let t = dayjs().hour(o.h).minute(o.m).second(0).millisecond(0);
  const end = dayjs().hour(c.h).minute(c.m).second(0).millisecond(0);
  const out = [];
  // genera 10:00, 11:00, ... mientras sea < close
  while (t.isBefore(end)) {
    out.push(t.format('HH:mm'));
    t = t.add(stepMin, 'minute');
  }
  return out;
}
/* ------------------------------------------------------------------ */

export default function BookingScreen() {
  const route = useRoute();
  const { barberId, service, professional } = route.params || {};
  const { data: barber } = useGetBarberByIdQuery(barberId, { skip: !barberId });

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [payMethod, setPayMethod] = useState('efectivo');

  // busy simulado por fecha: { 'YYYY-MM-DD': Set('HH:mm', ...) }
  const [busyByDate, setBusyByDate] = useState({});

  // horario de atención del día elegido
  const hoursForSelectedDay = useMemo(() => {
    if (!barber?.hours) return null;
    const idx = dayjs(selectedDate).day();
    const k = dayKey[idx];
    const h = barber.hours[k];
    return h?.open && h?.close ? { open: (h.open + '').trim(), close: (h.close + '').trim() } : null;
  }, [barber, selectedDate]);

  // slots base del día
  const baseSlots = useMemo(() => {
    if (!hoursForSelectedDay) return [];
    return makeSlots(hoursForSelectedDay.open, hoursForSelectedDay.close, SLOT_MINUTES);
  }, [hoursForSelectedDay]);

  // slots filtrados por ocupados simulados
  const daySlots = useMemo(() => {
    const taken = busyByDate[selectedDate] || new Set();
    return baseSlots.filter(s => !taken.has(s));
  }, [baseSlots, busyByDate, selectedDate]);

  const isClosed = !hoursForSelectedDay;

  const onConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('Falta elegir horario', 'Seleccioná un horario disponible.');
      return;
    }

    // marcar ocupado en memoria para este día
    setBusyByDate(prev => {
      const next = { ...prev };
      const set = new Set(next[selectedDate] || []);
      set.add(selectedTime);
      next[selectedDate] = set;
      return next;
    });

    // ★★★ GUARDAR LOCALMENTE LA RESERVA EN AsyncStorage ★★★
    try {
      const start = dayjs(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');

      const reserva = {
        id: Date.now().toString(),
        date: selectedDate,                     // 'YYYY-MM-DD'
        time: selectedTime,                     // 'HH:mm'
        service: service?.title || '',
        price: service?.price ?? null,
        professional: professional?.name || '',
        barber: barber?.name || '',
        barberLogo: barber?.logo || barber?.image || barber?.photo || '',
        payMethod,                              // 'efectivo' | 'mercadopago'
        createdAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem('misReservas');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(reserva);
      await AsyncStorage.setItem('misReservas', JSON.stringify(arr));
    } catch (e) {
      console.log('Error guardando reserva local:', e);
    }
    // ★★★ FIN PERSISTENCIA LOCAL ★★★

    const fecha = dayjs(selectedDate).format('DD/MM/YYYY');
    const msg =
      `Reserva registrada con éxito.\n\n` +
      `📍 Barbería: ${barber?.name || '-'}\n` +
      `💈 Servicio: ${service?.title || '-'} (${service?.price ? `$${Number(service.price).toLocaleString('es-AR')}` : '-'})\n` +
      `👤 Profesional: ${professional?.name || '-'}\n` +
      `🗓 Fecha: ${fecha}\n` +
      `⏰ Hora: ${selectedTime} hs\n` +
      `💳 Pago: ${payMethod === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}\n\n` +
      `¡Te esperamos!`;

    Alert.alert('¡Turno confirmado!', msg);

    setSelectedTime(null);
  };

  useEffect(() => {
    // si cambiás de día, no quede un horario viejo seleccionado
    setSelectedTime(null);
  }, [selectedDate]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Resumen */}
      <View style={styles.card}>
        <TextKarlaRegular style={styles.bold}>Barbería</TextKarlaRegular>
        <TextKarlaRegular>{barber?.name}</TextKarlaRegular>

        <TextKarlaRegular style={styles.spaceTop}>
          <TextKarlaRegular style={styles.bold}>Servicio: </TextKarlaRegular>
          {service?.title} {service?.price != null && `($${Number(service.price).toLocaleString('es-AR')})`}
        </TextKarlaRegular>

        <TextKarlaRegular>
          <TextKarlaRegular style={styles.bold}>Profesional: </TextKarlaRegular>
          {professional?.name}
        </TextKarlaRegular>
      </View>

      {/* Calendario */}
      <View style={styles.card}>
        <Calendar
          onDayPress={(d) => setSelectedDate(d.dateString)}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: '#111', selectedTextColor: '#fff' } }}
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
        <TextKarlaRegular style={styles.bold}>Horarios disponibles</TextKarlaRegular>

        {isClosed ? (
          <TextKarlaRegular style={{ color: '#B00020', marginTop: 6 }}>Cerrado este día</TextKarlaRegular>
        ) : daySlots.length === 0 ? (
          <TextKarlaRegular style={{ color: colors.black, marginTop: 6 }}>No hay horarios libres.</TextKarlaRegular>
        ) : (
          <View style={styles.slotGrid}>
            {daySlots.map((t) => {
              const active = selectedTime === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTime(t)}
                  style={[styles.slot, active && styles.slotActive]}
                >
                  <TextKarlaRegular style={[styles.slotText, active && { color: colors.white }]}>
                    {t}
                  </TextKarlaRegular>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Método de pago */}
      <View style={styles.card}>
        <TextKarlaRegular style={styles.bold}>Método de pago</TextKarlaRegular>
        <View style={styles.payRow}>
          <Pressable style={styles.payOption} onPress={() => setPayMethod('efectivo')}>
            <Icon name={payMethod === 'efectivo' ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={colors.black} />
            <TextKarlaRegular style={styles.payLabel}>Efectivo</TextKarlaRegular>
          </Pressable>

          <Pressable style={styles.payOption} onPress={() => setPayMethod('mercadopago')}>
            <Icon name={payMethod === 'mercadopago' ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={colors.black} />
            <TextKarlaRegular style={styles.payLabel}>Mercado Pago</TextKarlaRegular>
          </Pressable>
        </View>
      </View>

      {/* Botón como VIEW al final */}
      <View style={styles.footerContainer}>
        <Pressable
          style={[styles.cta, !selectedTime && styles.ctaDisabled]}
          disabled={!selectedTime}
          onPress={onConfirm}
        >
          <TextKarlaRegular style={styles.ctaText}>Confirmar turno</TextKarlaRegular>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  container: { padding: 16, gap: 14, paddingBottom: 120 },

  card: { ...CARD, gap: 8 },
  bold: { fontWeight: '700', color: colors.black },
  spaceTop: { marginTop: 6 },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  slot: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F3F3F3' },
  slotActive: { backgroundColor: colors.black },
  slotText: { color: colors.black, fontWeight: '600' },

  payRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payLabel: { color: colors.black },

  footerContainer: { marginTop: 10, marginBottom: 30 },
  cta: {
    backgroundColor: colors.black,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 10,
  },
  ctaDisabled: { backgroundColor: '#BDBDBD' },
  ctaText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
