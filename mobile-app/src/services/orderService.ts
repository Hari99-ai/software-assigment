// src/services/orderService.ts
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../config/firebase";
import { Order, CartItem, Address } from "../types";

const toOrder = (id: string, data: any): Order => ({
  id,
  userId: data.userId,
  userType: data.userType,
  items: data.items || [],
  totalAmount: data.totalAmount,
  deliveryAddress: data.deliveryAddress,
  status: data.status,
  paymentStatus: data.paymentStatus,
  razorpayOrderId: data.razorpayOrderId,
  razorpayPaymentId: data.razorpayPaymentId,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
  statusHistory: data.statusHistory || [],
});

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toOrder(d.id, d.data()));
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return toOrder(snap.id, snap.data());
};

// Create Razorpay order (server-side price validation)
export const createRazorpayOrder = async (
  cartItems: CartItem[],
): Promise<{
  razorpayOrderId: string;
  amount: number;
  currency: string;
  totalAmount: number;
}> => {
  const fn = httpsCallable(functions, "createRazorpayOrder");
  const result = await fn({
    cartItems: cartItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
  });
  return result.data as any;
};

// Verify payment and create confirmed order
export const verifyAndCreateOrder = async (params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  deliveryAddress: Address;
}): Promise<{ orderId: string; status: string }> => {
  const fn = httpsCallable(functions, "verifyAndCreateOrder");
  const result = await fn(params);
  return result.data as any;
};
