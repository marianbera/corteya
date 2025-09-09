import { useMemo, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../global/colors';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { useRoute } from '@react-navigation/native';
import { useGetBarberByIdQuery } from '../../services/barbers/barbersApi';

const dayKey = ['sun','mon','tue','wed','thu','fri','sat'];

const fmtToday = (hours) => {
  const k = dayKey[new Date().getDay()];
  const h = hours?.[k];
  if (!h || !h.open || !h.close) return 'Hoy: Cerrado';
  const pretty = (hhmm) => (hhmm?.endsWith(':00') ? `${hhmm.slice(0,2)}hs` : hhmm);
  return `Hoy: ${pretty(h.open)} a ${pretty(h.close)}`;
};

const Chip = ({ children }) => (
  <View style={styles.chip}><TextKarlaRegular style={styles.chipText}>{children}</TextKarlaRegular></View>
);

const RowIconText = ({ icon, children }) => (
  <View style={styles.rowIcon}>
    <Icon name={icon} size={16} color={colors.white} />
    <TextKarlaRegular style={styles.rowIconText}>{children}</TextKarlaRegular>
  </View>
);

const Section = ({ title, open, onToggle, children }) => (
  <View style={styles.section}>
    <Pressable style={styles.sectionHeader} onPress={onToggle}>
      <TextKarlaRegular style={styles.sectionTitle}>{title}</TextKarlaRegular>
      <Icon name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.black} />
    </Pressable>
    {open && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

const BarbershopScreen = () => {
  const route = useRoute();
  const barberId = route.params?.barberId ?? route.params?.product?.id;

  const { data: barber } = useGetBarberByIdQuery(barberId, { skip: !barberId });

  const [openLoyalty, setOpenLoyalty] = useState(true);
  const [openServices, setOpenServices] = useState(false);
  const [openPros, setOpenPros] = useState(false);

  const services = useMemo(() => barber?.services ?? [], [barber]);
  const pros = useMemo(() => barber?.professionals ?? [], [barber]);

  const ratingLabel = useMemo(() => {
    const r = Number(barber?.rating ?? 0).toFixed(1);
    const n = barber?.reviews ?? 0;
    return `${r} (${n})`;
  }, [barber]);

  if (!barber) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!!barber.heroImage && (
        <Image source={{ uri: barber.heroImage }} style={styles.hero} />
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

      <Section title="Sumá puntos y ganá" open={openLoyalty} onToggle={() => setOpenLoyalty(v => !v)}>
        <View style={styles.loyaltyBox}>
          <View style={styles.loyaltyLeft}>
            <TextKarlaRegular style={styles.loyaltyBig}>
              {barber?.loyalty?.punchesToReward ?? 6}
            </TextKarlaRegular>
            <TextKarlaRegular style={styles.muted}>restantes</TextKarlaRegular>
          </View>
          <View style={{ flex: 1 }}>
            <TextKarlaRegular>{barber?.loyalty?.rewardText ?? 'Programa de puntos'}</TextKarlaRegular>
            <Pressable style={styles.moreBtn}><TextKarlaRegular style={styles.moreBtnText}>Ver más</TextKarlaRegular></Pressable>
          </View>
        </View>
      </Section>

      <Section title="Servicios" open={openServices} onToggle={() => setOpenServices(v => !v)}>
        <View style={styles.services}>
          {services.map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <View style={{ flex: 1 }}>
                <TextKarlaRegular style={styles.serviceTitle}>{s.title}</TextKarlaRegular>
                <TextKarlaRegular style={styles.muted}>{s.duration} min</TextKarlaRegular>
              </View>
              <TextKarlaRegular style={styles.price}>${s.price}</TextKarlaRegular>
              <Pressable style={styles.addBtn}><TextKarlaRegular style={styles.addBtnText}>Agregar</TextKarlaRegular></Pressable>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Profesionales" open={openPros} onToggle={() => setOpenPros(v => !v)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prosList}>
          {pros.map((p) => (
            <View key={p.id} style={styles.proItem}>
              <Image source={{ uri: p.avatar }} style={styles.proAvatar} />
              <TextKarlaRegular style={styles.proName}>{p.name}</TextKarlaRegular>
            </View>
          ))}
        </ScrollView>
      </Section>

      <Pressable style={styles.cta}><TextKarlaRegular style={styles.ctaText}>Agendar</TextKarlaRegular></Pressable>
    </ScrollView>
  );
};

export default BarbershopScreen;

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor:'#747474ff'},
  hero: { width: '100%', height: 190, borderRadius: 16 },
  header: { gap: 8 },
  title: { fontSize: 18, color: colors.white },
  meta: { gap: 8 },
  rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowIconText: { color: colors.white },
  ratingWrap: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#2c2c2c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { color: colors.white },

  section: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  sectionTitle: { fontSize: 14 },
  sectionBody: { padding: 14, paddingTop: 0 },

  loyaltyBox: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  loyaltyLeft: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#b4a178ff', alignItems: 'center', justifyContent: 'center' },
  loyaltyBig: { fontSize: 20, fontWeight: '700' },
  moreBtn: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#959595ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  moreBtnText: { color: colors.white },

  services: { gap: 8 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFEFEF', borderRadius: 10, padding: 10 },
  serviceTitle: { fontSize: 14 },
  price: { fontWeight: '700' },
  addBtn: { backgroundColor: '#EAEAEA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { },

  prosList: { gap: 14, paddingHorizontal: 4 },
  proItem: { alignItems: 'center' },
  proAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 6 },
  proName: { maxWidth: 90, textAlign: 'center' },

  chip: { backgroundColor: '#959595ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipText: { color: colors.white },

  cta: { marginTop: 4, backgroundColor: colors.white, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  ctaText: { fontWeight: '700' },
});
