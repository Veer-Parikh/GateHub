// Razorpay checkout for live sessions. Order creation + signature verification happen in
// the Next.js route at /api/payment; the backend bill is marked paid only after verification.

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function payWithRazorpay(opts: {
  amount: number;
  billId: string;
  userId: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}): Promise<RazorpayResponse> {
  if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Couldn't load Razorpay checkout");

  const orderRes = await fetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: opts.amount, maintenanceId: opts.billId, userId: opts.userId }),
  });
  const order = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok || !order.id) throw new Error(order.error || "Couldn't create a payment order");

  return new Promise<RazorpayResponse>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "NexGate Society",
      description: opts.description,
      prefill: opts.prefill,
      theme: { color: "#18181b" },
      handler: async (response: RazorpayResponse) => {
        const verify = await fetch("/api/payment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (verify.ok) resolve(response);
        else reject(new Error("Payment could not be verified"));
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
    rzp.open();
  });
}
