// src/services/barbers/barbersApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const barbersApi = createApi({
  reducerPath: 'barbersApi',
  baseQuery: fetchBaseQuery({
    // Debe terminar en /
    baseUrl: process.env.EXPO_PUBLIC_BASE_RTDB_URL,
  }),
  endpoints: (builder) => ({
    getBarbershops: builder.query({
      // Trae /barbershops, soporta array u objeto y limpia nulos
      async queryFn(_arg, _q, _e, baseQuery) {
        const res = await baseQuery('barbershops.json');
        if (res.error) return { error: res.error };

        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw.filter(Boolean)
          : Object.values(raw ?? {}).filter(Boolean);

        // Aseguramos id y ordenamos por nombre
        const data = list
          .map((b, i) => ({ id: b?.id ?? i, ...b }))
          .sort((a, b) => a.name.localeCompare(b.name));

        return { data };
      },
    }),
  }),
});

export const { useGetBarbershopsQuery } = barbersApi;
