import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Profile } from "@/types/user";

// Profile state is directly the Profile object (not nested in .user)
const initialState: Profile | null = null;

const slice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Profile | null>) {
      return action.payload;
    },
    clearProfile() {
      return null;
    },
  },
});

export const { setProfile, clearProfile } = slice.actions;
export default slice.reducer;
