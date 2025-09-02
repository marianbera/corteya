
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_AUTH_BASE_URL, 
  }),
  endpoints: (builder) => ({
    signUp: builder.mutation({
      query: ({ email, password }) => ({
        url: `accounts:signUp?key=${process.env.EXPO_PUBLIC_API_KEY}`,
        method: 'POST',
        body: { email, password, returnSecureToken: true },
      }),
    }),
    signIn: builder.mutation({
      query: ({ email, password }) => ({
        url: `accounts:signInWithPassword?key=${process.env.EXPO_PUBLIC_API_KEY}`,
        method: 'POST',
        body: { email, password, returnSecureToken: true },
      }),
    }),
  }),
})


export const {
  useSignUpMutation,
  useSignInMutation,                  
} = authApi

export const useLoginMutation = authApi.useSignInMutation
