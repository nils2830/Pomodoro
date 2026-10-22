"use client";

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { Dialog } from "../ui/Dialog";
import { config } from "../config";

/** Minimal shape of the parts of Stripe.js (Dahlia) the embedded form uses. */
interface CheckoutFormSdk {
  createForm(opts: { layout: "expanded" }): {
    mount(selector: string | HTMLElement): void;
    on(event: "confirm", cb: (e: unknown) => void): void;
    destroy?(): void;
  };
  loadActions(): Promise<
    { type: "success"; actions: { confirm(opts: { formConfirmEvent: unknown }): Promise<unknown> } } | { type: "error"; error: { message: string } }
  >;
}
declare global {
  interface Window {
    Stripe?: (key: string) => { initCheckoutFormSdk(opts: { clientSecret: string | Promise<string>; appearance: object }): CheckoutFormSdk };
  }
}

/** Appearance configured in Stripe's Checkout Studio. */
const APPEARANCE = {
  theme: "stripe",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#0570de",
    colorSuccess: "#00c853",
    colorText: "#30313d",
    fontFamily: "Noto Sans",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

// Stripe.js must load from js.stripe.com (PCI), never from the bundle.
const STRIPE_JS = "https://js.stripe.com/dahlia/stripe.js";
let loading: Promise<void> | null = null;
function loadStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = STRIPE_JS;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Stripe."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export const useCheckout = create<{ clientSecret: string | null; open(secret: string): void; close(): void }>()((set) => ({
  clientSecret: null,
  open: (clientSecret) => set({ clientSecret }),
  close: () => set({ clientSecret: null }),
}));

/** Stripe's embedded payment form in a dialog. On success Stripe sends the customer to the return URL. */
export function CheckoutDialog() {
  const clientSecret = useCheckout((s) => s.clientSecret);
  const close = useCheckout((s) => s.close);
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret) return;
    let cancelled = false;
    let form: ReturnType<CheckoutFormSdk["createForm"]> | null = null;
    setError(null);
    (async () => {
      try {
        if (!config.stripePublishableKey) throw new Error("Payments aren't fully set up yet.");
        await loadStripeJs();
        if (cancelled || !host.current || !window.Stripe) return;
        const checkout = window.Stripe(config.stripePublishableKey).initCheckoutFormSdk({ clientSecret, appearance: APPEARANCE });
        form = checkout.createForm({ layout: "expanded" });
        form.mount(host.current);
        const result = await checkout.loadActions();
        if (result.type !== "success") throw new Error(result.error.message);
        const { actions } = result;
        form.on("confirm", async (event) => {
          try {
            await actions.confirm({ formConfirmEvent: event });
          } catch (err) {
            console.error("Payment confirmation error:", err);
          }
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't open checkout.");
      }
    })();
    return () => {
      cancelled = true;
      form?.destroy?.();
    };
  }, [clientSecret]);

  return (
    <Dialog open={clientSecret !== null} onClose={close} eyebrow="Steen Pro" title="Upgrade to Pro" size="md">
      {error ? (
        <p className="py-6 text-[15px] text-bad">{error}</p>
      ) : (
        <div className="min-h-[420px] rounded-2xl bg-white p-4">
          <div ref={host} />
        </div>
      )}
    </Dialog>
  );
}
