import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY nao definido");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-02-25.clover",
});

export function getStripeClient() {
  return stripe;
}

export async function getUncachableStripeClient() {
  return stripe;
}

export async function getStripeSync() {
  return {
    async processWebhook(payload: Buffer, signature: string, uuid: string) {
      console.log("Stripe webhook recebido", {
        uuid,
        signaturePresent: Boolean(signature),
        payloadBytes: payload.length,
      });
    },
  };
}
