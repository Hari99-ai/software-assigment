import { createHmac, timingSafeEqual } from "node:crypto";

export function validateCart(
  value: unknown,
): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50)
    throw new Error("Cart must contain 1–50 products");
  const seen = new Set<string>();
  return value.map((item) => {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !/^[\w-]{1,100}$/.test(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 1000 ||
      seen.has(item.productId)
    ) {
      throw new Error(
        "Invalid product, duplicate product, or quantity (1–1000 required)",
      );
    }
    seen.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  });
}

export function validateAddress(
  value: unknown,
): Record<string, string | boolean> {
  const data = value as Record<string, unknown>;
  const result: Record<string, string | boolean> = {};
  for (const field of [
    "fullName",
    "phone",
    "street",
    "city",
    "state",
    "pincode",
  ]) {
    if (
      !data ||
      typeof data[field] !== "string" ||
      !(data[field] as string).trim() ||
      (data[field] as string).length > 300
    )
      throw new Error(`Invalid address: ${field}`);
    result[field] = (data[field] as string).trim();
  }
  if (
    !/^\d{10}$/.test(String(result.phone)) ||
    !/^\d{6}$/.test(String(result.pincode))
  )
    throw new Error("Invalid phone or pincode");
  return result;
}

export function validSignature(
  order: string,
  payment: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret)
    .update(`${order}|${payment}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export function calculateQuote(
  items: Array<{ price: number; quantity: number }>,
) {
  const subtotalPaise = items.reduce((sum, i) => {
    if (
      !Number.isFinite(i.price) ||
      i.price <= 0 ||
      !Number.isSafeInteger(i.quantity) ||
      i.quantity < 1
    )
      throw new Error("Invalid price or quantity");
    return sum + Math.round(i.price * 100) * i.quantity;
  }, 0);
  const deliveryPaise = subtotalPaise >= 1000000 ? 0 : 20000;
  if (
    !Number.isSafeInteger(subtotalPaise) ||
    subtotalPaise <= 0 ||
    subtotalPaise > 100000000
  )
    throw new Error("Order total outside supported range");
  return {
    subtotalPaise,
    deliveryPaise,
    amount: subtotalPaise + deliveryPaise,
  };
}
