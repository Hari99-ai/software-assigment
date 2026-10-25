import * as functions from "firebase-functions/v1";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { randomUUID, createHash } from "node:crypto";
import Razorpay from "razorpay";
import {
  validateCart,
  validateAddress,
  validSignature,
  calculateQuote,
} from "./validation";
import { sendExternalNotifications } from "./notificationAdapters";

admin.initializeApp();
const db = admin.firestore();
const timestamp = () => admin.firestore.FieldValue.serverTimestamp();
const secret = defineSecret("RAZORPAY_KEY_SECRET");
const emailSecret = defineSecret("EMAILJS_PRIVATE_KEY");
const smsSecret = defineSecret("TEXTBEE_API_KEY");
const regional = functions.region("asia-south1");
const payments = regional.runWith({ secrets: [secret] });
const error = (
  code: functions.https.FunctionsErrorCode,
  message: string,
): never => {
  throw new functions.https.HttpsError(code, message);
};
function uid(context: functions.https.CallableContext): string {
  return context.auth?.uid || error("unauthenticated", "Login required");
}
async function role(userId: string) {
  return (await db.doc(`users/${userId}`).get()).data() || {};
}
async function requireAdmin(context: functions.https.CallableContext) {
  const userId = uid(context);
  if ((await role(userId)).role !== "admin")
    error("permission-denied", "Admin only");
  return userId;
}
function razorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !secret.value())
    error("failed-precondition", "Payment provider is not configured");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: secret.value(),
  });
}
function validated<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    return error("invalid-argument", (e as Error).message);
  }
}

// Notification documents are the durable outbox; a push failure never rolls back an order.
function notify(
  tx: admin.firestore.Transaction,
  id: string,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  tx.set(db.doc(`notifications/${userId}/messages/${id}`), {
    title,
    body,
    data,
    read: false,
    createdAt: timestamp(),
  });
}
export const deliverNotification = regional
  .runWith({
    secrets: [
      ...(process.env.EMAILJS_SERVICE_ID ? [emailSecret] : []),
      ...(process.env.TEXTBEE_DEVICE_ID ? [smsSecret] : []),
    ],
  })
  .firestore.document("notifications/{userId}/messages/{id}")
  .onCreate(async (snapshot, context) => {
    const profile = await role(context.params.userId);
    const token = profile.fcmToken;
    const { title, body, data } = snapshot.data();
    try {
      if (token)
        await admin
          .messaging()
          .send({
            token,
            notification: { title, body },
            data,
            android: { notification: { channelId: "orders" } },
          });
    } catch (e) {
      functions.logger.warn(
        "FCM delivery failed; notification remains in inbox",
        { code: (e as { code?: string }).code },
      );
    }
    const results = await sendExternalNotifications(
      {
        email: profile.email,
        phone: profile.phone,
        name: profile.displayName,
        title,
        body,
      },
      {
        emailService: process.env.EMAILJS_SERVICE_ID,
        emailTemplate: process.env.EMAILJS_TEMPLATE_ID,
        emailPublicKey: process.env.EMAILJS_PUBLIC_KEY,
        emailPrivateKey: process.env.EMAILJS_SERVICE_ID
          ? emailSecret.value()
          : undefined,
        smsDevice: process.env.TEXTBEE_DEVICE_ID,
        smsApiKey: process.env.TEXTBEE_DEVICE_ID
          ? smsSecret.value()
          : undefined,
      },
    );
    if (Object.keys(results).length)
      await snapshot.ref.update({ delivery: results });
  });

export const createRazorpayOrder = payments.https.onCall(
  async (data, context) => {
    const userId = uid(context);
    const cart = validated(() => validateCart(data.cartItems));
    const user = await role(userId);
    const dealer = user.role === "dealer" && user.dealerStatus === "approved";
    const docs = await db.getAll(
      ...cart.map((i) => db.doc(`products/${i.productId}`)),
    );
    const items = cart.map((item, index) => {
      const product = docs[index].data();
      if (!product || !product.available || product.stock < item.quantity)
        return error(
          "failed-precondition",
          `Unavailable or insufficient stock: ${item.productId}`,
        );
      const price = dealer ? product.wholesalePrice : product.price;
      return { ...item, name: product.name, price, image: product.image };
    });
    const quote = validated(() => calculateQuote(items));
    // UUID receipt stays under Razorpay's 40-character receipt limit.
    const order = await razorpay().orders.create({
      amount: quote.amount,
      currency: "INR",
      receipt: randomUUID(),
      notes: { userId },
    });
    await db.doc(`pendingOrders/${order.id}`).set({
      userId,
      userType: dealer ? "dealer" : "customer",
      items,
      totalAmount: quote.amount / 100,
      subtotal: quote.subtotalPaise / 100,
      deliveryFee: quote.deliveryPaise / 100,
      amount: quote.amount,
      createdAt: timestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(
        Date.now() + 30 * 60 * 1000,
      ),
    });
    return {
      razorpayOrderId: order.id,
      amount: quote.amount,
      currency: "INR",
      totalAmount: quote.amount / 100,
      validatedItems: items,
    };
  },
);

export const verifyAndCreateOrder = payments.https.onCall(
  async (data, context) => {
    const userId = uid(context);
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;
    if (
      ![razorpayOrderId, razorpayPaymentId, razorpaySignature].every(
        (v) => typeof v === "string" && /^[\w-]{1,100}$/.test(v),
      )
    )
      error("invalid-argument", "Invalid payment response");
    const deliveryAddress = validated(() =>
      validateAddress(data.deliveryAddress),
    );
    if (
      !validSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        secret.value(),
      )
    )
      error("permission-denied", "Payment signature verification failed");
    const payment = await razorpay().payments.fetch(razorpayPaymentId);
    const orderRef = db.doc(`orders/${razorpayOrderId}`);
    const pendingRef = db.doc(`pendingOrders/${razorpayOrderId}`);
    await db.runTransaction(async (tx) => {
      const [existing, pendingDoc] = await tx.getAll(orderRef, pendingRef);
      if (existing.exists) {
        if (
          existing.data()!.userId !== userId ||
          existing.data()!.razorpayPaymentId !== razorpayPaymentId
        )
          error("permission-denied", "Order mismatch");
        return; // Repeated or concurrent confirmations return the same order.
      }
      const pending = pendingDoc.data();
      if (!pending || pending.userId !== userId)
        return error(
          "permission-denied",
          "Pending order does not belong to this user",
        );
      if (
        payment.order_id !== razorpayOrderId ||
        payment.currency !== "INR" ||
        Number(payment.amount) !== pending.amount ||
        payment.status !== "captured"
      )
        error(
          "failed-precondition",
          "Payment must be captured for the exact quoted amount",
        );
      const items = pending.items as Array<{
        productId: string;
        quantity: number;
      }>;
      const products = await tx.getAll(
        ...items.map((i) => db.doc(`products/${i.productId}`)),
      );
      products.forEach((snapshot, index) => {
        if (!snapshot.exists || snapshot.data()!.stock < items[index].quantity)
          error(
            "failed-precondition",
            "Stock changed after payment. Contact support with the payment ID for fulfillment or refund.",
          );
      });
      // All reads precede writes. Inventory and fulfillment commit atomically.
      products.forEach((snapshot, index) =>
        tx.update(snapshot.ref, {
          stock: snapshot.data()!.stock - items[index].quantity,
        }),
      );
      tx.set(orderRef, {
        userId,
        userType: pending.userType,
        items: pending.items,
        subtotal: pending.subtotal,
        deliveryFee: pending.deliveryFee,
        totalAmount: pending.totalAmount,
        deliveryAddress,
        razorpayOrderId,
        razorpayPaymentId,
        status: "confirmed",
        paymentStatus: "paid",
        createdAt: timestamp(),
        updatedAt: timestamp(),
        statusHistory: [
          {
            status: "confirmed",
            note: "Payment captured and verified",
            updatedBy: userId,
            updatedAt: admin.firestore.Timestamp.now(),
          },
        ],
      });
      tx.delete(pendingRef);
      notify(
        tx,
        `order-${razorpayOrderId}`,
        userId,
        "Order confirmed",
        `Your order ${razorpayOrderId} is confirmed.`,
        { orderId: razorpayOrderId },
      );
    });
    return { orderId: razorpayOrderId, status: "confirmed" };
  },
);

async function reviewDealer(
  data: any,
  context: functions.https.CallableContext,
  status: "approved" | "rejected",
) {
  const reviewer = await requireAdmin(context);
  const applicationId = String(data.applicationId || "");
  if (!/^[\w-]{1,128}$/.test(applicationId))
    error("invalid-argument", "Application required");
  await db.runTransaction(async (tx) => {
    const application = await tx.get(
      db.doc(`dealerApplications/${applicationId}`),
    );
    if (!application.exists) error("not-found", "Application not found");
    const applicant = application.data()!;
    if (applicant.status !== "pending")
      error("failed-precondition", "Application already reviewed");
    const userRef = db.doc(`users/${applicant.userId}`);
    const user = await tx.get(userRef);
    if (!user.exists || user.data()!.role === "admin")
      error("failed-precondition", "Invalid applicant");
    tx.update(userRef, {
      role: status === "approved" ? "dealer" : "customer",
      dealerStatus: status,
    });
    tx.update(application.ref, {
      status,
      reviewedBy: reviewer,
      reviewedAt: timestamp(),
      rejectionReason: String(data.reason || "").slice(0, 1000),
    });
    notify(
      tx,
      `dealer-${applicationId}-${status}`,
      applicant.userId,
      `Dealer application ${status}`,
      status === "approved"
        ? "Wholesale pricing is now available. Sign in again to refresh your account."
        : String(data.reason || "Please contact support for details."),
    );
  });
  return { success: true };
}
export const approveDealer = regional.https.onCall((data, context) =>
  reviewDealer(data, context, "approved"),
);
export const rejectDealer = regional.https.onCall((data, context) =>
  reviewDealer(data, context, "rejected"),
);
export const setDealerAccess = regional.https.onCall(async (data, context) => {
  const reviewer = await requireAdmin(context);
  if (
    typeof data.enabled !== "boolean" ||
    typeof data.applicationId !== "string" ||
    !/^[\w-]{1,128}$/.test(data.applicationId)
  )
    error("invalid-argument", "Application and access decision required");
  await db.runTransaction(async (tx) => {
    const application = await tx.get(
      db.doc(`dealerApplications/${data.applicationId}`),
    );
    if (!application.exists) error("not-found", "Application not found");
    const applicant = application.data()!;
    const userRef = db.doc(`users/${applicant.userId}`);
    const user = await tx.get(userRef);
    if (!user.exists || user.data()!.role === "admin")
      error("failed-precondition", "Invalid dealer account");
    const status = data.enabled ? "approved" : "rejected";
    tx.update(userRef, {
      role: data.enabled ? "dealer" : "customer",
      dealerStatus: status,
    });
    tx.update(application.ref, {
      status,
      reviewedBy: reviewer,
      reviewedAt: timestamp(),
      rejectionReason: String(data.note || "").slice(0, 1000),
    });
    notify(
      tx,
      `dealer-access-${randomUUID()}`,
      applicant.userId,
      "Dealer access updated",
      data.enabled
        ? "Wholesale access has been enabled."
        : "Wholesale access has been disabled. Contact support for details.",
    );
  });
  return { success: true };
});

const orderTransitions: Record<string, string[]> = {
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};
const serviceTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
async function updateStatus(
  data: any,
  context: functions.https.CallableContext,
  service: boolean,
) {
  const reviewer = await requireAdmin(context);
  const id = service ? data.bookingId : data.orderId;
  if (typeof id !== "string" || !/^[\w-]{1,128}$/.test(id))
    error("invalid-argument", "Invalid record ID");
  const status = String(data.status);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(
      db.doc(`${service ? "serviceBookings" : "orders"}/${id}`),
    );
    if (!snapshot.exists) error("not-found", "Record not found");
    const record = snapshot.data()!;
    if (
      !(service ? serviceTransitions : orderTransitions)[
        record.status
      ]?.includes(status)
    )
      error("failed-precondition", "Invalid status transition");
    const note = String(data.note || "").slice(0, 2000);
    const update: Record<string, unknown> = {
      status,
      updatedAt: timestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status,
        note,
        updatedBy: reviewer,
        updatedAt: admin.firestore.Timestamp.now(),
      }),
    };
    if (service) {
      update.notes = note;
      update.assignedTechnician = String(
        data.assignedTechnician || record.assignedTechnician || "",
      ).slice(0, 200);
      if (status === "assigned" && !update.assignedTechnician)
        error("invalid-argument", "Technician required");
    }
    // Cancellation does not claim a refund. A captured payment requires manual refund reconciliation.
    tx.update(snapshot.ref, update);
    notify(
      tx,
      `${id}-${status}`,
      record.userId,
      service ? "Service update" : "Order update",
      `Status: ${status.replace(/_/g, " ")}`,
      { [service ? "bookingId" : "orderId"]: id, status },
    );
  });
  return { success: true };
}
export const updateOrderStatus = regional.https.onCall((data, context) =>
  updateStatus(data, context, false),
);
export const updateServiceStatus = regional.https.onCall((data, context) =>
  updateStatus(data, context, true),
);
export const serviceConfirmation = regional.firestore
  .document("serviceBookings/{id}")
  .onCreate(async (snapshot, context) => {
    const booking = snapshot.data();
    await db
      .doc(
        `notifications/${booking.userId}/messages/service-${context.params.id}`,
      )
      .set({
        title: "Service requested",
        body: "Your service request has been received.",
        data: { bookingId: context.params.id },
        read: false,
        createdAt: timestamp(),
      });
  });
export const updateFCMToken = regional.https.onCall(async (data, context) => {
  const userId = uid(context);
  if (typeof data.token !== "string" || data.token.length > 4096)
    error("invalid-argument", "Invalid token");
  await db.doc(`users/${userId}`).update({ fcmToken: data.token });
  return { success: true };
});

// Opt-in geocoder: point this at a self-hosted Nominatim-compatible instance.
// No public geocoding server is silently selected for the project owner.
export const searchPlaces = regional.https.onCall(async (data, context) => {
  uid(context);
  const query = String(data.query || "").trim();
  if (query.length < 3 || query.length > 120)
    error("invalid-argument", "Enter a city or locality (3–120 characters)");
  const base = process.env.GEOCODER_BASE_URL;
  if (!base)
    error(
      "failed-precondition",
      "Place search is not configured. Enter the delivery address manually.",
    );
  const cacheRef = db.doc(
    `geocodeCache/${createHash("sha256").update(query.toLowerCase()).digest("hex")}`,
  );
  const cached = (await cacheRef.get()).data();
  if (cached && cached.expiresAt.toMillis() > Date.now()) return cached.results;
  await db.runTransaction(async (tx) => {
    const ref = db.doc("internal/geocoderRate");
    const current = await tx.get(ref);
    if ((current.data()?.lastRequest || 0) > Date.now() - 1100)
      error(
        "resource-exhausted",
        "Please wait a moment before searching again",
      );
    tx.set(ref, { lastRequest: Date.now() });
  });
  const url = new URL("search", base!.replace(/\/?$/, "/"));
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "in",
    limit: "5",
  }).toString();
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        process.env.GEOCODER_USER_AGENT || "AquaPure-assignment/1.0",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) error("unavailable", "Place search unavailable");
  const rows = (await response.json()) as any[];
  const results = rows.map((row) => ({
    name: String(row.display_name),
    latitude: Number(row.lat),
    longitude: Number(row.lon),
    city: String(
      row.address?.city || row.address?.town || row.address?.village || "",
    ),
    state: String(row.address?.state || ""),
    pincode: String(row.address?.postcode || ""),
  }));
  await cacheRef.set({
    results,
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 86400000),
  });
  return results;
});
