import { getUncachableStripeClient } from '../server/lib/stripeClient';

async function createProducts() {
  console.log('Creating ImoLead AI Pro subscription products in Stripe...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ 
    query: "active:'true' AND metadata['app']:'imolead'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Products already exist in Stripe:');
    existingProducts.data.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    console.log('\nSkipping creation. Delete existing products in Stripe Dashboard to recreate.');
    return;
  }

  const basicProduct = await stripe.products.create({
    name: 'ImoLead Basic',
    description: 'Plano básico para agentes imobiliários. Inclui prospeção automática, análise AI de leads, e mensagens WhatsApp.',
    metadata: {
      app: 'imolead',
      tier: 'basic',
      features: 'prospection,ai_analysis,whatsapp,calendar',
    },
  });
  console.log(`Created Basic product: ${basicProduct.id}`);

  const basicMonthlyPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 4999,
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: {
      app: 'imolead',
      plan: 'basic_monthly',
    },
  });
  console.log(`Created Basic monthly price: ${basicMonthlyPrice.id} (€49.99/mês)`);

  const basicYearlyPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 49990,
    currency: 'eur',
    recurring: { interval: 'year' },
    metadata: {
      app: 'imolead',
      plan: 'basic_yearly',
    },
  });
  console.log(`Created Basic yearly price: ${basicYearlyPrice.id} (€499.90/ano - 2 meses grátis)`);

  const proProduct = await stripe.products.create({
    name: 'ImoLead Pro',
    description: 'Plano profissional para equipas e agências. Inclui tudo do Basic, plus relatórios avançados, múltiplos utilizadores, e suporte prioritário.',
    metadata: {
      app: 'imolead',
      tier: 'pro',
      features: 'prospection,ai_analysis,whatsapp,calendar,advanced_reports,multi_user,priority_support',
    },
  });
  console.log(`Created Pro product: ${proProduct.id}`);

  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 19900,
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: {
      app: 'imolead',
      plan: 'pro_monthly',
    },
  });
  console.log(`Created Pro monthly price: ${proMonthlyPrice.id} (€199/mês)`);

  const proYearlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 199000,
    currency: 'eur',
    recurring: { interval: 'year' },
    metadata: {
      app: 'imolead',
      plan: 'pro_yearly',
    },
  });
  console.log(`Created Pro yearly price: ${proYearlyPrice.id} (€1990/ano - 2 meses grátis)`);

  console.log('\n✅ All products and prices created successfully!');
  console.log('\nProducts summary:');
  console.log(`  Basic: ${basicProduct.id}`);
  console.log(`    - Monthly: ${basicMonthlyPrice.id} (€49.99/mês)`);
  console.log(`    - Yearly: ${basicYearlyPrice.id} (€499.90/ano)`);
  console.log(`  Pro: ${proProduct.id}`);
  console.log(`    - Monthly: ${proMonthlyPrice.id} (€199/mês)`);
  console.log(`    - Yearly: ${proYearlyPrice.id} (€1990/ano)`);
}

createProducts().catch(console.error);
