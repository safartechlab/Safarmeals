import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  shopId: null,
  totalAmount: 0,
  activeCoupon: null,
  discountAmount: 0,
  loading: false
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.shopId = action.payload.shopId || null;
      state.totalAmount = action.payload.totalAmount || 0;
    },
    clearCart: (state) => {
      state.items = [];
      state.shopId = null;
      state.totalAmount = 0;
      state.activeCoupon = null;
      state.discountAmount = 0;
    },
    applyCouponSuccess: (state, action) => {
      const { coupon, discount } = action.payload;
      state.activeCoupon = coupon;
      state.discountAmount = discount;
    },
    removeCoupon: (state) => {
      state.activeCoupon = null;
      state.discountAmount = 0;
    }
  }
});

export const { setCart, clearCart, applyCouponSuccess, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
