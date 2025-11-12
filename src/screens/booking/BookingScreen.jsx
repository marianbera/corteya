import { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import "dayjs/locale/es";
import TextKarlaRegular from "../../components/TextKarlaRegular";
import { useRoute } from "@react-navigation/native";
import { colors } from "../../global/colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useGetBarberByIdQuery } from "../../services/barbers/barbersApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import successAnimation from "../../../assets/lottie/success.json";

dayjs.locale("es");

const SLOT_MINUTES = 60;
const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const CARD = {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 14,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 1,
};

/**
 * Misma config que en BarbershopScreen (copiada)
 */
function getLoyaltyConfig(barber) {
  const name = String(barber?.name || "").toLowerCase();
  const id = String(barber?.id || "").toLowerCase();

  if (name.includes("belgrano") || id.endsWith("1")) {
    return {
      punchesToReward: 2,
      rewardText: "20% OFF en tu próximo corte",
    };
  }

  if (name.includes("gentleman") || id.endsWith("2")) {
    return {
      punchesToReward: 3,
      rewardText: "Gel de peinado gratis",
    };
  }

  if (name.includes("vip") || id.endsWith("3")) {
    return {
      punchesToReward: 4,
      rewardText: "Un corte gratis",
    };
  }

  if (name.includes("barba") || id.endsWith("4")) {
    return {
      punchesToReward: 2,
      rewardText: "Barba a mitad de precio",
    };
  }

  return {
    punchesToReward: 2,
    rewardText: "20% OFF en tu próximo corte",
  };
}

// horarios utils
function toHHmm(value) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str.length) return null;
  if (str.includes(":")) {
    const [h, m] = str.split(":").map((s) => Number(s.trim()));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return { h, m };
  }
  const h = Number(str);
  if (Number.isNaN(h)) return null;
  return { h, m: 0 };
}

function makeSlots(open = "10:00", close = "20:00", stepMin = SLOT_MINUTES) {
  const o = toHHmm(open);
  const c = toHHmm(close);
  if (!o || !c) return [];
  let t = dayjs().hour(o.h).minute(o.m).second(0).millisecond(0);
  const end = dayjs().hour(c.h).minute(c.m).second(0).millisecond(0);
  const out = [];
  while (t.isBefore(end)) {
    out.push(t.format("HH:mm"));
    t = t.add(stepMin, "minute");
  }
  return out;
}

// calcula estado de lealtad según meta de esa barbería
async function calculateLoyalty(barberId, punchesToReward) {
  if (!barberId || !punchesToReward) return null;

  const raw = await AsyncStorage.getItem("misReservas");
  const reservas = raw ? JSON.parse(raw) : [];

  const mine = reservas.filter((r) => r.barberId === barberId);

  const paid = mine.filter((r) => !r.rewardApplied).length;
  const used = mine.filter((r) => r.rewardApplied).length;

  const unlocked =
    punchesToReward > 0
      ? Math.floor(paid / punchesToReward)
      : 0;
  const available = Math.max(unlocked - used, 0);

  const leftover = Math.max(
    paid - used * punchesToReward,
    0
  );
  const capped = Math.min(leftover, punchesToReward);

  const current = available > 0 ? punchesToReward : capped;
  const remaining =
    available > 0
      ? 0
      : Math.max(punchesToReward - current, 0);

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

export default function BookingScreen() {
  const route = useRoute();
  const { barberId, service, professional } = route.params || {};
  const { data: barber } = useGetBarberByIdQuery(barberId, {
    skip: !barberId,
  });

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const [payMethod, setPayMethod] = useState("efectivo");
  const [busyByDate, setBusyByDate] = useState({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [lastReservation, setLastReservation] = useState(null);

  const [loyalty, setLoyalty] = useState(null);
  const [useReward, setUseReward] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);

  // config de esta barbería
  useEffect(() => {
    if (!barber) {
      setLoyaltyConfig(null);
      return;
    }
    setLoyaltyConfig(getLoyaltyConfig(barber));
  }, [barber]);

  // horarios ocupados
  useEffect(() => {
    const loadBusySlots = async () => {
      const raw = await AsyncStorage.getItem("misReservas");
      const arr = raw ? JSON.parse(raw) : [];
      const busy = {};
      arr.forEach((r) => {
        if (!busy[r.date]) busy[r.date] = new Set();
        busy[r.date].add(r.time);
      });
      setBusyByDate(busy);
    };
    loadBusySlots();
  }, []);

  // estado de lealtad (cuando tengo config o después de confirmar)
  useEffect(() => {
    if (!barberId || !loyaltyConfig) {
      setLoyalty(null);
      return;
    }
    (async () => {
      const data = await calculateLoyalty(
        barberId,
        loyaltyConfig.punchesToReward
      );
      if (!data) {
        setLoyalty(null);
        return;
      }
      setLoyalty({
        ...data,
        rewardText: loyaltyConfig.rewardText,
      });
    })();
  }, [barberId, loyaltyConfig, successVisible]);

  // horarios según día
  const hoursForSelectedDay = useMemo(() => {
    if (!barber?.hours) return null;
    const idx = dayjs(selectedDate).day();
    const k = dayKey[idx];
    const h = barber.hours[k];
    return h?.open && h?.close
      ? {
          open: (h.open + "").trim(),
          close: (h.close + "").trim(),
        }
      : null;
  }, [barber, selectedDate]);

  const baseSlots = useMemo(
    () =>
      hoursForSelectedDay
        ? makeSlots(
            hoursForSelectedDay.open,
            hoursForSelectedDay.close,
            SLOT_MINUTES
          )
        : [],
    [hoursForSelectedDay]
  );

  const daySlots = useMemo(() => {
    const taken = busyByDate[selectedDate] || new Set();
    return baseSlots.filter((s) => !taken.has(s));
  }, [baseSlots, busyByDate, selectedDate]);

  const isClosed = !hoursForSelectedDay;
  const minDate = dayjs().format("YYYY-MM-DD");

  // barra de progreso
  const loyaltyProgressWidth = (() => {
    if (!loyalty) return "0%";
    if (loyalty.available > 0) return "100%";
    const ratio =
      (loyalty.current || 0) / loyalty.punchesToReward;
    return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  })();

  const loyaltyText =
    loyalty && loyalty.available > 0
      ? "Ya podés reclamar tu beneficio 💈"
      : loyalty
      ? `${loyalty.current}/${loyalty.punchesToReward} cortes en este ciclo (${loyalty.remaining} para el próximo beneficio)`
      : "";

  // confirmar turno
  const onConfirm = async () => {
    if (!selectedTime || !loyaltyConfig) return;

    // reservar horario en memoria
    setBusyByDate((prev) => {
      const next = { ...prev };
      const set = new Set(next[selectedDate] || []);
      set.add(selectedTime);
      next[selectedDate] = set;
      return next;
    });

    const raw = await AsyncStorage.getItem("misReservas");
    const arr = raw ? JSON.parse(raw) : [];

    const canApplyReward =
      useReward && loyalty && loyalty.available > 0;

    const reserva = {
      id: Date.now().toString(),
      barberId,
      date: selectedDate,
      time: selectedTime,
      service: service?.title || "",
      price: service?.price ?? null,
      professional: professional?.name || "",
      barber: barber?.name || "",
      barberLogo:
        barber?.logo || barber?.image || barber?.photo || "",
      payMethod,
      rewardApplied: !!canApplyReward, // si usa beneficio, este turno NO suma punto
      createdAt: new Date().toISOString(),
    };

    arr.push(reserva);
    await AsyncStorage.setItem("misReservas", JSON.stringify(arr));

    setLastReservation(reserva);
    setSuccessVisible(true);
    setSelectedTime(null);
    setUseReward(false);
  };

  // limpiar hora al cambiar día
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* resumen */}
        <View style={styles.card}>
          <TextKarlaRegular style={styles.bold}>
            Barbería
          </TextKarlaRegular>
          <TextKarlaRegular>
            {barber?.name}
          </TextKarlaRegular>

          <TextKarlaRegular style={styles.spaceTop}>
            <TextKarlaRegular style={styles.bold}>
              Servicio:{" "}
            </TextKarlaRegular>
            {service?.title}{" "}
            {service?.price != null &&
              `($${Number(
                service.price
              ).toLocaleString("es-AR")})`}
          </TextKarlaRegular>

          <TextKarlaRegular>
            <TextKarlaRegular style={styles.bold}>
              Profesional:{" "}
            </TextKarlaRegular>
            {professional?.name}
          </TextKarlaRegular>
        </View>

        {/* calendario */}
        <View style={styles.card}>
          <Calendar
            onDayPress={(d) => setSelectedDate(d.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: "#111",
                selectedTextColor: "#fff",
              },
            }}
            minDate={minDate}
            theme={{
              arrowColor: colors.black,
              monthTextColor: colors.black,
              textSectionTitleColor: "#8F8F8F",
              todayTextColor: colors.black,
            }}
            enableSwipeMonths
            firstDay={1}
          />
        </View>

        {/* horarios */}
        <View style={styles.card}>
          <TextKarlaRegular style={styles.bold}>
            Horarios disponibles
          </TextKarlaRegular>
          {isClosed ? (
            <TextKarlaRegular
              style={{ color: "#B00020", marginTop: 6 }}
            >
              Cerrado este día
            </TextKarlaRegular>
          ) : daySlots.length === 0 ? (
            <TextKarlaRegular
              style={{ color: colors.black, marginTop: 6 }}
            >
              No hay horarios libres.
            </TextKarlaRegular>
          ) : (
            <View style={styles.slotGrid}>
              {daySlots.map((t) => {
                const active = selectedTime === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    style={[
                      styles.slot,
                      active && styles.slotActive,
                    ]}
                  >
                    <TextKarlaRegular
                      style={[
                        styles.slotText,
                        active && { color: colors.white },
                      ]}
                    >
                      {t}
                    </TextKarlaRegular>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* puntos */}
        {loyalty && (
          <View style={styles.card}>
            <TextKarlaRegular style={styles.bold}>
              Tus puntos en esta barbería
            </TextKarlaRegular>

            <TextKarlaRegular>
              {loyaltyText}
            </TextKarlaRegular>

            <View style={styles.loyaltyBarOuter}>
              <View
                style={[
                  styles.loyaltyBarInner,
                  { width: loyaltyProgressWidth },
                ]}
              />
            </View>

            {loyalty.available > 0 && (
  <>
    <TextKarlaRegular style={{ marginTop: 6 }}>
      💈 {loyalty.rewardText}
    </TextKarlaRegular>

    <Pressable
      style={[
        styles.useRewardBtn,
        useReward && styles.useRewardBtnActive,
      ]}
      onPress={() => setUseReward((v) => !v)}
    >
      <TextKarlaRegular
        style={[
          styles.useRewardText,
          useReward && { color: colors.white },
        ]}
      >
        Usar beneficio en este turno
      </TextKarlaRegular>
    </Pressable>
  </>
)}

          </View>
        )}

        {/* método de pago */}
        <View style={styles.card}>
          <TextKarlaRegular style={styles.bold}>
            Método de pago
          </TextKarlaRegular>
          <View style={styles.payRow}>
            <Pressable
              style={styles.payOption}
              onPress={() =>
                setPayMethod("efectivo")
              }
            >
              <Icon
                name={
                  payMethod === "efectivo"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={colors.black}
              />
              <TextKarlaRegular
                style={styles.payLabel}
              >
                Efectivo
              </TextKarlaRegular>
            </Pressable>

            <Pressable
              style={styles.payOption}
              onPress={() =>
                setPayMethod("mercadopago")
              }
            >
              <Icon
                name={
                  payMethod === "mercadopago"
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={20}
                color={colors.black}
              />
              <TextKarlaRegular
                style={styles.payLabel}
              >
                Mercado Pago
              </TextKarlaRegular>
            </Pressable>
          </View>
        </View>

        {/* botón */}
        <View style={styles.footerContainer}>
          <Pressable
            style={[
              styles.cta,
              !selectedTime && styles.ctaDisabled,
            ]}
            disabled={!selectedTime}
            onPress={onConfirm}
          >
            <TextKarlaRegular
              style={styles.ctaText}
            >
              Confirmar turno
            </TextKarlaRegular>
          </Pressable>
        </View>
      </ScrollView>

      {/* modal éxito */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <LottieView
              source={successAnimation}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
            <TextKarlaRegular
              style={styles.modalTitle}
            >
              ¡Turno confirmado!
            </TextKarlaRegular>
            <View style={styles.modalDetails}>
              <TextKarlaRegular>
                📍 Barbería:{" "}
                {lastReservation?.barber || "-"}
              </TextKarlaRegular>
              <TextKarlaRegular>
                💈 Servicio:{" "}
                {lastReservation?.service || "-"}{" "}
                {lastReservation?.price != null
                  ? `($${Number(
                      lastReservation.price
                    ).toLocaleString(
                      "es-AR"
                    )})`
                  : ""}
              </TextKarlaRegular>
              <TextKarlaRegular>
                👤 Profesional:{" "}
                {lastReservation?.professional ||
                  "-"}
              </TextKarlaRegular>
              <TextKarlaRegular>
                🗓 Fecha:{" "}
                {lastReservation
                  ? dayjs(
                      lastReservation.date
                    ).format("DD/MM/YYYY")
                  : "-"}
              </TextKarlaRegular>
              <TextKarlaRegular>
                ⏰ Hora:{" "}
                {lastReservation?.time}
              </TextKarlaRegular>
              <TextKarlaRegular>
                💳 Pago:{" "}
                {lastReservation?.payMethod ===
                "efectivo"
                  ? "Efectivo"
                  : "Mercado Pago"}
              </TextKarlaRegular>
              {lastReservation?.rewardApplied && (
                <TextKarlaRegular>
                  💈 Se aplicó un beneficio en
                  este turno.
                </TextKarlaRegular>
              )}
            </View>
            <Pressable
              style={styles.modalButton}
              onPress={() =>
                setSuccessVisible(false)
              }
            >
              <TextKarlaRegular
                style={{
                  color: colors.white,
                  fontWeight: "700",
                }}
              >
                Cerrar
              </TextKarlaRegular>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  container: { padding: 16, gap: 14, paddingBottom: 120 },

  card: { ...CARD, gap: 8 },
  bold: { fontWeight: "700", color: colors.black },
  spaceTop: { marginTop: 6 },

  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F3F3F3",
  },
  slotActive: { backgroundColor: colors.black },
  slotText: { color: colors.black, fontWeight: "600" },

  loyaltyBarOuter: {
    flexDirection: "row",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    marginTop: 6,
    overflow: "hidden",
    width: "100%",
  },
  loyaltyBarInner: {
    height: "100%",
    backgroundColor: "#B4A178",
    borderRadius: 8,
  },
  useRewardBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#F3F3F3",
    alignSelf: "flex-start",
  },
  useRewardBtnActive: {
    backgroundColor: colors.black,
  },
  useRewardText: {
    color: colors.black,
    fontWeight: "600",
  },

  payRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payLabel: { color: colors.black },

  footerContainer: { marginTop: 10, marginBottom: 30 },
  cta: {
    backgroundColor: colors.black,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 10,
  },
  ctaDisabled: { backgroundColor: "#BDBDBD" },
  ctaText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
    color: colors.black,
  },
  modalDetails: { marginTop: 8, gap: 4 },
  modalButton: {
    backgroundColor: colors.black,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignSelf: "center",
  },
});
