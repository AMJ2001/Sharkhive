import { configureStore, createSlice } from '@reduxjs/toolkit';

// User slice (state + reducers in one place)
const userSlice = createSlice({
  name: 'user',
  initialState: {
    email: '', // Initial state for email
  },
  reducers: {
    setUserEmail(state, action) {
      state.email = action.payload; // Set email when the user provides it
    },
  },
});

// Export actions directly from the slice
export const { setUserEmail } = userSlice.actions;

// Configure the store with just one slice
const store = configureStore({
  reducer: {
    user: userSlice.reducer, // Include other reducers here if needed later
  },
});

export default store;