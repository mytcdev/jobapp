"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = ["USD", "SGD", "MYR", "GBP", "AUD", "EUR", "CAD", "INR"];

export default function ManualProfileForm({
  initialName,
  initialCity,
  initialState,
  initialCountry,
  initialSalary,
  initialCurrency,
}: {
  initialName: string;
  initialCity: string;
  initialState: string;
  initialCountry: string;
  initialSalary?: number;
  initialCurrency?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string | number | null> = {
      name: fd.get("name") as string,
      city: fd.get("city") as string,
      state: fd.get("state") as string,
      country: fd.get("country") as string,
      preferred_currency: fd.get("preferred_currency") as string,
    };
    const salary = fd.get("preferred_salary") as string;
    body.preferred_salary = salary ? Number(salary) : null;

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to update");
      }
      setStatus("success");
      router.refresh();
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-sm font-medium" htmlFor="name">Full Name</label>
          <input id="name" name="name" type="text" defaultValue={initialName}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="city">City</label>
          <input id="city" name="city" type="text" defaultValue={initialCity}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="state">State / Province</label>
          <input id="state" name="state" type="text" defaultValue={initialState}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="country">Country</label>
          <input id="country" name="country" type="text" defaultValue={initialCountry}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="preferred_currency">Currency</label>
          <select id="preferred_currency" name="preferred_currency"
            defaultValue={initialCurrency ?? "USD"}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="preferred_salary">Preferred Salary (optional)</label>
          <input id="preferred_salary" name="preferred_salary" type="number" min={0}
            defaultValue={initialSalary ?? ""}
            placeholder="e.g. 120000"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      </div>

      {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}
      {status === "success" && <p className="text-green-600 text-sm">Profile updated.</p>}

      <button type="submit" disabled={loading}
        className="bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
