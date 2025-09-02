import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_BASE_RTDB_URL, // ...firebaseio.com/
  }),
  endpoints: (builder) => ({
    // Categorías: soporta array u objeto en RTDB y elimina nulos
    getCategories: builder.query({
      async queryFn(_arg, _q, _e, baseQuery) {
        const res = await baseQuery('categories.json');
        if (res.error) return { error: res.error };
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw.filter(Boolean)
          : Object.values(raw ?? {}).filter(Boolean);
        // Aseguramos id (si falta)
        const data = list.map((c, i) => ({ id: c?.id ?? i, ...c }));
        return { data };
      },
    }),

    // Productos: traemos TODO y filtramos acá.
    // Funciona tanto si RTDB guarda 'products' como array u objeto.
    getProductsByCategory: builder.query({
      async queryFn(category, _q, _e, baseQuery) {
        const res = await baseQuery('products.json');
        if (res.error) return { error: res.error };
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw.filter(Boolean)
          : Object.values(raw ?? {}).filter(Boolean);

        const cat = String(category || '').toLowerCase();
        const filtered = list.filter(
          (p) => p?.category?.toLowerCase?.() === cat
        );

        // Aseguramos id (si falta)
        const data = filtered.map((p, i) => ({ id: p?.id ?? i, ...p }));
        return { data };
      },
    }),
  }),
});

export const { useGetCategoriesQuery, useGetProductsByCategoryQuery } = shopApi;
