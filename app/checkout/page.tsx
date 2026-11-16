import { getBrand } from "@/lib/site-config";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export async function generateMetadata() {
  const brand = await getBrand();
  return { title: `Checkout · ${brand.name}` };
}

export default async function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:py-12">
      <div className="mb-8">
        <div className="text-label-bold text-primary mb-2">CHECKOUT</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">
          Finalizar compra
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Preencha seus dados, escolha o frete e a forma de pagamento.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
