import { configureStore, createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    email: '', 
    userData: {},
  },
  reducers: {
    setUserEmail(state, action) {
      state.email = action.payload;
    },
    setUserData(state, action) {
      state.userData = action.payload; //set during reg
    },
  },
});

export const { setUserEmail, setUserData } = userSlice.actions;

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

export default store;

export const secretKey = 'encrypted123';