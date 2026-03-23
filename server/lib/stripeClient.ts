import Stripe from "stripe";

let stripe: Stripe | null = null;

function ensureStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

  if (!stripeSecretKey) {
    console.warn("STRIPE_SECRET_KEY nao definido");
    throw new Error("STRIPE_SECRET_KEY nao definido");
  }

  if (!stripe) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    });
  }

  return stripe;
}

export function getStripeClient() {
  return ensureStripeClient();
}

export async function getUncachableStripeClient() {
  return ensureStripeClient();
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
