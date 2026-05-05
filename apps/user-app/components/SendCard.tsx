"use client";
import { p2pTransfer } from "../app/lib/actions/p2pTransfer";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextInput } from "@repo/ui/textinput";
import { useState } from "react";
import { useToast } from "./Toast";

export function SendCard() {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="max-w-md">
      <Card title="Send Money">
        <div className="pt-2 space-y-1">
          <TextInput
            placeholder={"Enter phone number"}
            label="Phone Number"
            onChange={(value) => setNumber(value)}
          />
          <TextInput
            placeholder={"Enter amount"}
            label="Amount (₹)"
            onChange={(value) => setAmount(value)}
          />
          <div className="pt-5">
            <Button
              onClick={async () => {
                if (!number || !amount || Number(amount) <= 0) {
                  showToast("Please enter a valid number and amount", "error");
                  return;
                }
                setLoading(true);
                try {
                  const result = await p2pTransfer(
                    number,
                    Number(amount) * 100,
                  );
                  if (result?.message === "Transfer successful") {
                    showToast(`₹${amount} sent successfully!`, "success");
                    setNumber("");
                    setAmount("");
                  } else {
                    showToast(result?.message || "Transfer failed", "error");
                  }
                } catch (e) {
                  showToast("Something went wrong. Please try again.", "error");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Sending..." : "Send Money →"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
