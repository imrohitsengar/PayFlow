/* eslint-disable no-unused-vars */

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

interface Window {
  Razorpay: new (options: Record<string, unknown>) => RazorpayCheckout;
}
