// src/screens/shop/ProductsScreen.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, FlatList, Image, Pressable, View, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Search from '../../components/Search';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import { colors } from '../../global/colors';
import { useGetBarbershopsQuery } from '../../services/barbers/barbersApi';

const FALLBACK_REGION = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

// Sombras + bordes para cards
const CARD_ELEV = {
  backgroundColor: colors.white,
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 2,
};

export default function ProductsScreen({ navigation }) {
  const { data: barbers = [] } = useGetBarbershopsQuery();
  const [keyword, setKeyword] = useState('');

  // ---- Map / BottomSheet refs
  const mapRef = useRef(null);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['24%', '55%', '92%'], []);

  // ---- Ubicación del usuario
  const [region, setRegion] = useState(FALLBACK_REGION);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;

        const nextRegion = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setRegion(nextRegion);
        setHasLocation(true);
        mapRef.current?.animateToRegion(nextRegion, 400);
      } catch {
        // si falla, seguimos con fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Búsqueda local
  const normalized = useMemo(
    () =>
      barbers.map((b) => ({
        ...b,
        _q: `${b.name} ${b.address ?? ''} ${b.city ?? ''}`.toLowerCase(),
      })),
    [barbers]
  );

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return normalized;
    return normalized.filter((b) => b._q.includes(k));
  }, [keyword, normalized]);

  // ---- Item de lista (card mejorada)
  const renderItem = ({ item }) => (
    <Pressable onPress={() => navigation.navigate('Barbería', { barberId: item.id })}>
      <View style={styles.card}>
        <Image style={styles.thumb} source={{ uri: item.image }} />
        <View style={styles.info}>
          <TextKarlaRegular numberOfLines={2} style={styles.name}>
            {item.name}
          </TextKarlaRegular>
          {!!item.address && (
            <TextKarlaRegular numberOfLines={1} style={styles.addr}>
              {item.address}
            </TextKarlaRegular>
          )}
        </View>

        <View style={styles.badge}>
          <TextKarlaRegular style={styles.badgeText}>
            {Number(item.rating ?? 0).toFixed(1)}
          </TextKarlaRegular>
          <Icon name="star" size={16} color="#D4AF37" />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* MAPA fijo al fondo */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={FALLBACK_REGION}
        region={region}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
        toolbarEnabled={false}
      >
        {filtered.map((b) =>
          b.lat && b.lng ? (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.lat, longitude: b.lng }}
              title={b.name}
              description={b.address}
              onPress={() => navigation.navigate('Barbería', { barberId: b.id })}
            />
          ) : null
        )}
      </MapView>

      {/* PANEL (lista) */}
      <BottomSheet
        ref={sheetRef}
        index={1} // 55% visible de entrada
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.grabber}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Search keyword={keyword} setKeyword={setKeyword} />
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(it, idx) => String(it?.id ?? idx)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <TextKarlaRegular style={styles.muted}>
                  {hasLocation ? 'Sin resultados' : 'Sin permisos de ubicación'}
                </TextKarlaRegular>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  // ---- BottomSheet
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: Platform.select({ ios: 24, android: 12 }),
  },
  grabber: {
    width: 42,
    height: 5,
    backgroundColor: '#DADADA',
    borderRadius: 3,
  },

  // ---- Lista
  list: { paddingVertical: 8 },

  card: {
    ...CARD_ELEV,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 84,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E9E9E9',
    marginRight: 12,
  },
  info: { flex: 1, minHeight: 64, justifyContent: 'flex-start' },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  addr: { fontSize: 12, color: '#6B7280' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF8E1', // dorado suave
    alignSelf: 'flex-end',
    marginTop: 'auto',
    marginLeft: 10,
  },
  badgeText: { fontWeight: '700', color: colors.black },

  empty: { padding: 24, alignItems: 'center' },
  muted: { color: '#8F8F8F' },
});
