"use client";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTransaction } from "../app/lib/actions/createOnrampTransaction";
import { useToast } from "./Toast";

const SUPPORTED_BANKS = [
  {
    name: "HDFC Bank",
  },
  {
    name: "Axis Bank",
  },
];

export const AddMoney = () => {
  const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name || "");
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  return (
    <Card title="Add Money">
      <div className="w-full space-y-1">
        <TextInput
          label={"Amount (₹)"}
          placeholder={"Enter amount"}
          onChange={(val) => {
            setValue(Number(val));
          }}
        />
        <div className="pt-3">
          <label className="block mb-1.5 text-sm font-medium text-slate-700">
            Bank
          </label>
          <Select
            onSelect={(value) => {
              setProvider(
                SUPPORTED_BANKS.find((x) => x.name === value)?.name || "",
              );
            }}
            options={SUPPORTED_BANKS.map((x) => ({
              key: x.name,
              value: x.name,
            }))}
          />
        </div>
        <div className="pt-5">
          <Button
            onClick={async () => {
              if (value <= 0) {
                showToast("Please enter a valid amount", "error");
                return;
              }
              setLoading(true);
              try {
                const result = await createOnRampTransaction(provider, value);
                if (result.message === "Done") {
                  showToast(
                    `₹${value} deposit initiated via ${provider}. Processing...`,
                    "success",
                  );
                } else {
                  showToast(result.message, "error");
                }
              } catch (e) {
                showToast("Something went wrong. Please try again.", "error");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Processing..." : "Add Money →"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
