import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

// reducers “normales”
import shopReducer from "../features/shop/shopSlice";
import cartReducer from "../features/cart/cartSlice";
import userReducer from "../features/user/userSlice";

// RTK Query APIs (cada una una sola vez)
import { shopApi } from "../services/shop/shopApi";
import { authApi } from "../services/auth/authApi";
import { userApi } from "../services/user/userApi";
import { barbersApi } from "../services/barbers/barbersApi";

const store = configureStore({
  reducer: {
    shopReducer,
    cartReducer,
    userReducer,

    // Registrá CADA api una vez
    [shopApi.reducerPath]: shopApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [barbersApi.reducerPath]: barbersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // Agregá cada middleware una sola vez
      shopApi.middleware,
      authApi.middleware,
      userApi.middleware,
      barbersApi.middleware
    ),
});

setupListeners(store.dispatch);
export default store;
