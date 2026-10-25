export async function openPayment(
  _options: Record<string, unknown>,
): Promise<{ razorpay_payment_id: string; razorpay_signature: string }> {
  throw new Error(
    "Use the Android development or preview build to complete Razorpay checkout.",
  );
}
