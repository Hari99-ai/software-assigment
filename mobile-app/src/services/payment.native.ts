import RazorpayCheckout from "react-native-razorpay";
export const openPayment = (options: Record<string, unknown>) =>
  RazorpayCheckout.open(options);
