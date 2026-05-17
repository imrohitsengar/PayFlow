"use client";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { useToast } from "./Toast";
import { useRouter } from "next/navigation";
import Script from "next/script";

export const AddMoney = () => {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handlePayment = async () => {
    if (value <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order via our API
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        showToast(err.message || "Failed to create order", "error");
        setLoading(false);
        return;
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay Checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PayFlow",
        description: `Add ₹${value} to wallet`,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify payment on our server
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            if (verifyRes.ok) {
              showToast(
                `₹${value} added to your wallet successfully!`,
                "success",
              );
              router.refresh();
            } else {
              const err = await verifyRes.json();
              showToast(err.message || "Payment verification failed", "error");
            }
          } catch {
            showToast("Payment verification failed. Contact support.", "error");
          }
        },
        prefill: {},
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        showToast("Payment failed. Please try again.", "error");
        setLoading(false);
      });
      rzp.open();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Card title="Add Money">
        <div className="w-full space-y-1">
          <TextInput
            label={"Amount (₹)"}
            placeholder={"Enter amount"}
            onChange={(val) => {
              setValue(Number(val));
            }}
          />
          <div className="pt-5">
            <Button onClick={handlePayment}>
              {loading ? "Processing..." : "Add Money →"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
