// src/services/serviceBookingService.ts
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ServiceBooking, ServiceType, Address } from "../types";

const toBooking = (id: string, data: any): ServiceBooking => ({
  id,
  userId: data.userId,
  serviceType: data.serviceType,
  purifierDetails: data.purifierDetails,
  address: data.address,
  preferredDate: data.preferredDate?.toDate() || new Date(),
  preferredTime: data.preferredTime,
  contactName: data.contactName,
  contactPhone: data.contactPhone,
  status: data.status,
  notes: data.notes,
  assignedTechnician: data.assignedTechnician,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

export const createServiceBooking = async (params: {
  userId: string;
  serviceType: ServiceType;
  purifierDetails?: string;
  address: Address;
  preferredDate: Date;
  preferredTime: string;
  contactName: string;
  contactPhone: string;
}): Promise<string> => {
  const ref = await addDoc(collection(db, "serviceBookings"), {
    ...params,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserServiceBookings = async (
  userId: string,
): Promise<ServiceBooking[]> => {
  const q = query(
    collection(db, "serviceBookings"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBooking(d.id, d.data()));
};

export const SERVICE_TYPES: {
  value: ServiceType;
  label: string;
  description: string;
  price: string;
}[] = [
  {
    value: "installation",
    label: "New Installation",
    description: "Install a new water purifier at your location",
    price: "₹500 - ₹1500",
  },
  {
    value: "amc",
    label: "Annual Maintenance Contract",
    description: "Comprehensive yearly service coverage",
    price: "₹1200 - ₹3500/year",
  },
  {
    value: "repair",
    label: "Repair Service",
    description: "Fix issues with your existing purifier",
    price: "₹200 + parts",
  },
  {
    value: "filter-replacement",
    label: "Filter Replacement",
    description: "Replace sediment, carbon, and RO membrane filters",
    price: "₹400 - ₹2000",
  },
  {
    value: "general-servicing",
    label: "General Servicing",
    description: "Periodic cleaning and maintenance check",
    price: "₹300 - ₹800",
  },
];
