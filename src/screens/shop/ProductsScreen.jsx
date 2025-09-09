// src/screens/shop/ProductsScreen.jsx
import { StyleSheet, FlatList, Image, Pressable, View } from 'react-native';
import FlatCard from '../../components/FlatCard';
import TextKarlaRegular from '../../components/TextKarlaRegular';
import Search from '../../components/Search';
import { colors } from '../../global/colors';
import { useMemo, useState } from 'react';
import { useGetBarbershopsQuery } from '../../services/barbers/barbersApi';
import Icon from 'react-native-vector-icons/MaterialIcons'

const ProductsScreen = ({ navigation }) => {
  const { data: barbers = [] } = useGetBarbershopsQuery();
  const [keyword, setKeyword] = useState('');

  // Preparo un string para búsqueda rápida
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

const renderItem = ({ item }) => (
  <Pressable onPress={() => navigation.navigate('Barbería', { barberId: item.id })}>
    <FlatCard>
      <View style={styles.row}>
        <Image style={styles.thumb} source={{ uri: item.image }} />
        <View style={styles.info}>
          <TextKarlaRegular style={styles.name}>{item.name}</TextKarlaRegular>
          {!!item.address && <TextKarlaRegular>{item.address}</TextKarlaRegular>}
          <View style={styles.rating}>
            <TextKarlaRegular>{Number(item.rating ?? 0).toFixed(1)}</TextKarlaRegular>
            <Icon name="star" size={16} color={colors.yellow ?? '#F2C94C'} />
          </View>
        </View>
      </View>
    </FlatCard>
  </Pressable>
)

  return (
    <>
      <Search keyword={keyword} setKeyword={setKeyword} />
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(it, idx) => String(it?.id ?? idx)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <TextKarlaRegular style={styles.muted}>Sin resultados</TextKarlaRegular>
          </View>
        }
      />
    </>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 80, height: 60, borderRadius: 8, backgroundColor: '#ddd', marginLeft: 12 }, // ← empuja la foto a la derecha
  info: { flex: 1, minHeight: 60, justifyContent: 'center', position: 'relative' },
  name: { marginBottom: 2 },
  rating: { position: 'absolute', right: 8, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { padding: 24, alignItems: 'center' },
  muted: { color: colors.textMuted },
})



