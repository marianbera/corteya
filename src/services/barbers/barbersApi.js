import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const normalizeObj = (obj) =>
  Array.isArray(obj) ? obj.filter(Boolean) : Object.values(obj ?? {}).filter(Boolean);

export const barbersApi = createApi({
  reducerPath: 'barbersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_BASE_RTDB_URL, 
  }),
  endpoints: (builder) => ({
    // Lista (para la pantalla de búsqueda)
    getBarbershops: builder.query({
      async queryFn(_arg, _q, _e, baseQuery) {
        const res = await baseQuery('barbershops.json');
        if (res.error) return { error: res.error };
        const list = normalizeObj(res.data).map((b, i) => ({ id: b?.id ?? i + 1, ...b }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        return { data: list };
      },
    }),

    // Detalle por id (con servicios y profesionales adentro)
    getBarberById: builder.query({
      async queryFn(barberId, _q, _e, baseQuery) {
        const res = await baseQuery(`barbershops/${barberId}.json`);
        if (res.error) return { error: res.error };
        const raw = res.data || {};
        const services = normalizeObj(raw.services).map((s, i) => ({ id: s?.id ?? `s${i + 1}`, ...s }));
        const professionals = normalizeObj(raw.professionals).map((p, i) => ({ id: p?.id ?? `p${i + 1}`, ...p }));
        const data = { ...raw, id: raw.id ?? barberId, services, professionals };
        return { data };
      },
    }),
  }),
});

export const {
  useGetBarbershopsQuery,
  useGetBarberByIdQuery,
} = barbersApi;
