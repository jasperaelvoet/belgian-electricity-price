import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "belgian-electricity-price",
});

export const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value || null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
    return true;
  },
  removeItem: (name: string) => {
    storage.delete(name);
    return;
  },
};
