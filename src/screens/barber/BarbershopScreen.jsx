import { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../global/colors';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGetBarberByIdQuery } from '../../services/barbers/barbersApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Config de beneficios por barbería (DEMO).
 * Podés ajustar por nombre o por id.
 */
function getLoyaltyConfig(barber) {
  const name = String(barber?.name || '').toLowerCase();
  const id = String(barber?.id || '').toLowerCase();

  // Ejemplos de demo:
  if (name.includes('belgrano') || id.endsWith('1')) {
    return {
      punchesToReward: 2,
      rewardText: '20% OFF en tu próximo corte',
    };
  }

  if (name.includes('gentleman') || id.endsWith('2')) {
    return {
      punchesToReward: 3,
      rewardText: 'Gel de peinado gratis',
    };
  }

  if (name.includes('vip') || id.endsWith('3')) {
    return {
      punchesToReward: 4,
      rewardText: 'Un corte gratis',
    };
  }

  if (name.includes('barba') || id.endsWith('4')) {
    return {
      punchesToReward: 2,
      rewardText: 'Barba a mitad de precio',
    };
  }

  // Default si no matchea nada
  return {
    punchesToReward: 2,
    rewardText: '20% OFF en tu próximo corte',
  };
}

const fmtToday = (hours) => {
  const k = dayKey[new Date().getDay()];
  const h = hours?.[k];
  if (!h || !h.open || !h.close) return 'Hoy: Cerrado';
  const pretty = (hhmm) =>
    hhmm?.endsWith(':00') ? `${hhmm.slice(0, 2)}hs` : hhmm;
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
      <Icon
        name={open ? 'expand-less' : 'expand-more'}
        size={22}
        color={colors.black}
      />
    </Pressable>
    {open && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

// Calcula estado de puntos con la meta indicada
async function calculateLoyalty(barberId, punchesToReward) {
  if (!barberId || !punchesToReward) return null;

  const raw = await AsyncStorage.getItem('misReservas');
  const reservas = raw ? JSON.parse(raw) : [];

  const mine = reservas.filter((r) => r.barberId === barberId);

  const paid = mine.filter((r) => !r.rewardApplied).length;
  const used = mine.filter((r) => r.rewardApplied).length;

  const unlocked =
    punchesToReward > 0 ? Math.floor(paid / punchesToReward) : 0;
  const available = Math.max(unlocked - used, 0);

  const leftover = Math.max(paid - used * punchesToReward, 0);
  const capped = Math.min(leftover, punchesToReward);

  const current = available > 0 ? punchesToReward : capped;
  const remaining =
    available > 0 ? 0 : Math.max(punchesToReward - current, 0);

  return {
    punchesToReward,
    paid,
    used,
    unlocked,
    available,
    current,
    remaining,
  };
}

export default function BarbershopScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const barberId = route.params?.barberId ?? route.params?.product?.id;
  const { data: barber } = useGetBarberByIdQuery(barberId, { skip: !barberId });

  const [loyalty, setLoyalty] = useState(null);

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

  // cargar puntos cuando tengo barber
  useEffect(() => {
    if (!barberId || !barber) {
      setLoyalty(null);
      return;
    }
    (async () => {
      const config = getLoyaltyConfig(barber);
      const data = await calculateLoyalty(barberId, config.punchesToReward);
      if (!data) {
        setLoyalty(null);
        return;
      }
      setLoyalty({
        ...data,
        rewardText: config.rewardText,
      });
    })();
  }, [barberId, barber]);

  if (!barber) return null;

  // --- helpers UI loyalty ---

  const progressWidth = (() => {
    if (!loyalty) return '0%';
    if (loyalty.available > 0) return '100%'; // beneficio listo → barra llena
    const ratio =
      (loyalty.current || 0) / loyalty.punchesToReward;
    return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  })();

  const circleNumber =
    loyalty?.available > 0
      ? loyalty.available
      : loyalty
      ? loyalty.remaining
      : 0;

  const circleLabel =
    loyalty?.available > 0
      ? 'beneficios'
      : 'visitas\nrestantes';

  const baseText = loyalty
    ? `Completá ${loyalty.punchesToReward} visitas en esta barbería y obtené tu beneficio 💈`
    : 'Sumá visitas y obtené beneficios 💈';

  const headerText =
    loyalty && loyalty.available > 0
      ? `Ya podés reclamar tu beneficio 💈`
      : baseText;

  // seleccionar servicio / pro
  const onSelectService = (s) => {
    const same = selectedService?.id === s.id;
    setSelectedService(same ? null : s);
  };

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
      {!!barber?.heroImage && (
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
            <TextKarlaRegular style={styles.ratingText}>
              {ratingLabel}
            </TextKarlaRegular>
          </View>
        </View>
      </View>

      {/* LOYALTY */}
      <Section
        title="Sumá puntos y ganá"
        open={openLoyalty}
        onToggle={() => setOpenLoyalty((v) => !v)}
      >
        <View style={styles.loyaltyBox}>
          <View style={styles.loyaltyLeft}>
            <TextKarlaRegular style={styles.loyaltyBig}>
              {circleNumber ?? 0}
            </TextKarlaRegular>
            <TextKarlaRegular style={styles.loyaltyLabel}>
              {circleLabel}
            </TextKarlaRegular>
          </View>

          <View style={{ flex: 1 }}>
            <TextKarlaRegular>{headerText}</TextKarlaRegular>

            <View style={styles.loyaltyBarOuter}>
              <View
                style={[
                  styles.loyaltyBarInner,
                  { width: progressWidth },
                ]}
              />
            </View>

                  {loyalty?.available > 0 && (
        <TextKarlaRegular style={{ marginTop: 4 }}>
          💈 {loyalty.rewardText}
        </TextKarlaRegular>
      )}

          </View>
        </View>
      </Section>

      {/* Servicios */}
      <Section
        title="Servicios"
        open={openServices}
        onToggle={() => setOpenServices((v) => !v)}
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
                  <TextKarlaRegular style={styles.serviceTitle}>
                    {s.title}
                  </TextKarlaRegular>
                  {!!s.duration && (
                    <TextKarlaRegular style={styles.muted}>
                      {s.duration} min
                    </TextKarlaRegular>
                  )}
                </View>
                <TextKarlaRegular style={styles.price}>
                  ${Number(s.price).toLocaleString('es-AR')}
                </TextKarlaRegular>
                <View
                  style={[
                    styles.selector,
                    active && styles.selectorActive,
                  ]}
                >
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

      {/* Profesionales */}
      <Section
        title="Profesionales"
        open={openPros}
        onToggle={() => setOpenPros((v) => !v)}
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
                  pressed && {
                    opacity: 0.85,
                    transform: [{ scale: 0.97 }],
                  },
                ]}
                android_ripple={{ color: '#E0E0E0', borderless: false }}
              >
                <Image source={{ uri: p.avatar }} style={styles.proAvatar} />
                <TextKarlaRegular style={styles.proName}>
                  {p.name}
                </TextKarlaRegular>
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
  ratingWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { color: colors.black },

  section: { ...CARD, marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, color: colors.black, fontWeight: '700' },
  sectionBody: { marginTop: 10 },
  muted: { color: '#6F6F6F' },

  loyaltyBox: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  loyaltyLeft: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B4A178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyBig: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  loyaltyLabel: {
    fontSize: 10,
    color: '#F4F4F4',
    textAlign: 'center',
  },
  loyaltyBarOuter: {
    marginTop: 6,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    width: '100%',
  },
  loyaltyBarInner: {
    height: '100%',
    backgroundColor: '#B4A178',
    borderRadius: 8,
  },

  serviceRow: {
    ...CARD,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  serviceRowActive: { borderWidth: 1, borderColor: '#B4A178' },
  serviceTitle: { fontSize: 14, color: colors.black },
  price: { fontWeight: '700', color: colors.black },
  selector: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorActive: { backgroundColor: '#B4A178' },

  proItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    ...CARD,
    minWidth: 130,
  },
  proItemActive: { borderWidth: 2, borderColor: '#B4A178' },
  proAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 8,
  },
  proName: {
    maxWidth: 120,
    textAlign: 'center',
    color: colors.black,
    fontWeight: '600',
  },
  prosList: { gap: 16, paddingHorizontal: 2 },

  cta: {
    ...CARD,
    marginTop: 4,
    backgroundColor: colors.black,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaDisabled: { backgroundColor: '#BDBDBD' },
  ctaText: { color: colors.white, fontWeight: '800' },
});
