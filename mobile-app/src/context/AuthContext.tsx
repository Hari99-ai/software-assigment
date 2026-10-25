// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  login: (
    email: string,
    password: string,
    dealerOnly?: boolean,
  ) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (fbUser: FirebaseUser): Promise<User | null> => {
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: fbUser.uid,
      email: fbUser.email || "",
      displayName: data.displayName || fbUser.displayName || "",
      phone: data.phone || "",
      role: data.role || "customer",
      dealerStatus: data.dealerStatus,
      fcmToken: data.fcmToken,
      createdAt: data.createdAt?.toDate() || new Date(),
      addresses: data.addresses || [],
    } as User;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          setUser(await fetchUser(fbUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, dealerOnly = false) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userData = await fetchUser(cred.user);
    if (!userData)
      throw new Error(
        "Your account profile could not be loaded. Contact support.",
      );
    if (
      dealerOnly &&
      (userData.role !== "dealer" || userData.dealerStatus !== "approved")
    ) {
      await signOut(auth);
      throw new Error("Dealer access requires an approved dealer application.");
    }
    setUser(userData);
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    // Create user document — role MUST be 'customer', validated by Firestore rules
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      displayName,
      role: "customer",
      createdAt: serverTimestamp(),
      addresses: [],
    });

    const userData = await fetchUser(cred.user);
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await fetchUser(firebaseUser);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        role: user?.role || null,
        login,
        register,
        logout,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
