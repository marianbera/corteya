import { useMemo, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../global/colors';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGetBarberByIdQuery } from '../../services/barbers/barbersApi';

const dayKey = ['sun','mon','tue','wed','thu','fri','sat'];

const fmtToday = (hours) => {
  const k = dayKey[new Date().getDay()];
  const h = hours?.[k];
  if (!h || !h.open || !h.close) return 'Hoy: Cerrado';
  const pretty = (hhmm) => (hhmm?.endsWith(':00') ? `${hhmm.slice(0,2)}hs` : hhmm);
  return `Hoy: ${pretty(h.open)} a ${pretty(h.close)}`;
};

const RowIconText = ({ icon, children }) => (
  <View style={styles.rowIcon}>
    <Icon name={icon} size={16} color={colors.black} />
    <TextKarlaRegular style={styles.rowIconText}>{children}</TextKarlaRegular>
  </View>
);

const Section = ({ title, open, onToggle, children }) => (
  <View style={styles.section}>
    <Pressable style={styles.sectionHeader} onPress={onToggle}>
      <TextKarlaRegular style={styles.sectionTitle}>{title}</TextKarlaRegular>
      <Icon name={open ? 'expand-less' : 'expand-more'} size={22} color={colors.black} />
    </Pressable>
    {open && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

export default function BarbershopScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const barberId = route.params?.barberId ?? route.params?.product?.id;
  const { data: barber } = useGetBarberByIdQuery(barberId, { skip: !barberId });

  const [openLoyalty, setOpenLoyalty] = useState(true);
  const [openServices, setOpenServices] = useState(true);
  const [openPros, setOpenPros] = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);

  const services = useMemo(() => barber?.services ?? [], [barber]);
  const pros = useMemo(() => barber?.professionals ?? [], [barber]);

  const ratingLabel = useMemo(() => {
    const r = Number(barber?.rating ?? 0).toFixed(1);
    const n = barber?.reviews ?? 0;
    return `${r} (${n})`;
  }, [barber]);

  if (!barber) return null;

  // seleccionar servicio
  const onSelectService = (s) => {
    const same = selectedService?.id === s.id;
    setSelectedService(same ? null : s);
  };

  // seleccionar profesional
  const onSelectPro = (p) => {
    const same = selectedPro?.id === p.id;
    setSelectedPro(same ? null : p);
  };

  const canBook = !!(selectedService && selectedPro);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {!!barber.heroImage && (
        <View style={styles.heroWrap}>
          <Image source={{ uri: barber.heroImage }} style={styles.hero} />
        </View>
      )}

      <View style={styles.header}>
        <TextKarlaRegular style={styles.title}>{barber.name}</TextKarlaRegular>
        <View style={styles.meta}>
          <RowIconText icon="place">{barber.address}</RowIconText>
          <RowIconText icon="schedule">{fmtToday(barber.hours)}</RowIconText>
          <View style={styles.ratingWrap}>
            <Icon name="star" size={14} color={colors.yellow ?? '#F2C94C'} />
            <TextKarlaRegular style={styles.ratingText}>{ratingLabel}</TextKarlaRegular>
          </View>
        </View>
      </View>

      {/* Puntos */}
      <Section
        title="Sumá puntos y ganá"
        open={openLoyalty}
        onToggle={() => setOpenLoyalty(v => !v)}
      >
        <View style={styles.loyaltyBox}>
          <View style={styles.loyaltyLeft}>
            <TextKarlaRegular style={styles.loyaltyBig}>
              {barber?.loyalty?.punchesToReward ?? 6}
            </TextKarlaRegular>
            <TextKarlaRegular style={styles.muted}>restantes</TextKarlaRegular>
          </View>
          <View style={{ flex: 1 }}>
            <TextKarlaRegular>
              {barber?.loyalty?.rewardText ?? 'Programa de puntos'}
            </TextKarlaRegular>
            <Pressable style={styles.moreBtn}>
              <TextKarlaRegular style={styles.moreBtnText}>Ver más</TextKarlaRegular>
            </Pressable>
          </View>
        </View>
      </Section>

      {/* Servicios */}
      <Section
        title="Servicios"
        open={openServices}
        onToggle={() => setOpenServices(v => !v)}
      >
        <View style={{ gap: 10 }}>
          {services.map((s) => {
            const active = selectedService?.id === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => onSelectService(s)}
                style={({ pressed }) => [
                  styles.serviceRow,
                  active && styles.serviceRowActive,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <View style={{ flex: 1 }}>
                  <TextKarlaRegular style={styles.serviceTitle}>{s.title}</TextKarlaRegular>
                  {!!s.duration && (
                    <TextKarlaRegular style={styles.muted}>
                      {s.duration} min
                    </TextKarlaRegular>
                  )}
                </View>
                <TextKarlaRegular style={styles.price}>
                  ${Number(s.price).toLocaleString('es-AR')}
                </TextKarlaRegular>
                <View style={[styles.selector, active && styles.selectorActive]}>
                  <Icon
                    name={active ? 'check' : 'radio-button-unchecked'}
                    size={18}
                    color={active ? colors.white : colors.black}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Profesionales (ahora siempre disponible) */}
      <Section
        title="Profesionales"
        open={openPros}
        onToggle={() => setOpenPros(v => !v)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prosList}
        >
          {pros.map((p) => {
            const active = selectedPro?.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelectPro(p)}
                style={({ pressed }) => [
                  styles.proItem,
                  active && styles.proItemActive,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                android_ripple={{ color: '#E0E0E0', borderless: false }}
              >
                <Image source={{ uri: p.avatar }} style={styles.proAvatar} />
                <TextKarlaRegular style={styles.proName}>{p.name}</TextKarlaRegular>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      {/* CTA */}
      <Pressable
        style={[styles.cta, !canBook && styles.ctaDisabled]}
        disabled={!canBook}
        onPress={() =>
          navigation.navigate('Booking', {
            barberId,
            service: selectedService,
            professional: selectedPro,
          })
        }
      >
        <TextKarlaRegular style={styles.ctaText}>
          {canBook ? 'Agendar' : 'Elegí servicio y barbero'}
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
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  heroWrap: { marginBottom: 12, ...CARD, padding: 0 },
  hero: { width: '100%', height: 190, borderRadius: 12 },
  header: { ...CARD, gap: 10, marginBottom: 12 },
  title: { fontSize: 18, color: colors.black, fontWeight: '700' },
  meta: { gap: 8 },
  rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowIconText: { color: colors.black },
  ratingWrap: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#F7F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { color: colors.black },
  section: { ...CARD, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, color: colors.black, fontWeight: '700' },
  sectionBody: { marginTop: 10 },
  muted: { color: '#6F6F6F' },
  loyaltyBox: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  loyaltyLeft: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#B4A178', alignItems: 'center', justifyContent: 'center' },
  loyaltyBig: { fontSize: 22, fontWeight: '800', color: colors.white },
  moreBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#EAEAEA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  moreBtnText: { color: colors.black, fontWeight: '600' },
  serviceRow: { ...CARD, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  serviceRowActive: { borderWidth: 1, borderColor: '#B4A178' },
  serviceTitle: { fontSize: 14, color: colors.black },
  price: { fontWeight: '700', color: colors.black },
  selector: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  selectorActive: { backgroundColor: '#B4A178' },
  prosList: { gap: 14, paddingHorizontal: 2 },
  proItem: { alignItems: 'center', padding: 10, backgroundColor: colors.white, borderRadius: 14, ...CARD },
  proItemActive: { borderWidth: 1, borderColor: '#B4A178' },
  proAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 6 },
  proName: { maxWidth: 100, textAlign: 'center', color: colors.black },
  cta: { ...CARD, marginTop: 4, backgroundColor: colors.black, alignItems: 'center', paddingVertical: 14, borderRadius: 24 },
  ctaDisabled: { backgroundColor: '#BDBDBD' },
  ctaText: { color: colors.white, fontWeight: '800' },
});