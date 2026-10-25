// src/types/index.ts — Shared TypeScript types

export type UserRole = "customer" | "dealer" | "admin";
export type DealerStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type ServiceStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  dealerStatus?: DealerStatus;
  fcmToken?: string;
  createdAt: Date;
  addresses?: Address[];
}

export interface Address {
  id: string;
  label: string; // "Home", "Office", etc.
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string;
  price: number;
  wholesalePrice: number;
  image: string;
  stock: number;
  available: boolean;
  specifications: Record<string, string>;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
  createdAt: Date;
}

export type ProductCategory =
  | "water-purifiers"
  | "water-dispensers"
  | "water-pumps"
  | "filters-cartridges"
  | "spare-parts";

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  userType: "customer" | "dealer";
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: string;
  note: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface ServiceBooking {
  id: string;
  userId: string;
  serviceType: ServiceType;
  purifierDetails?: string;
  address: Address;
  preferredDate: Date;
  preferredTime: string;
  contactName: string;
  contactPhone: string;
  status: ServiceStatus;
  notes?: string;
  assignedTechnician?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceType =
  | "installation"
  | "amc"
  | "repair"
  | "filter-replacement"
  | "general-servicing";

export interface DealerApplication {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  yearsInBusiness?: string;
  status: DealerStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

// Razorpay response type
export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
