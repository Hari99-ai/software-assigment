// Firebase exposes this at runtime in its React Native entry point, but its
// shared declaration file omits the platform-specific export.
import "firebase/auth";
import type { Persistence } from "firebase/auth";
import type AsyncStorage from "@react-native-async-storage/async-storage";
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): Persistence;
}
