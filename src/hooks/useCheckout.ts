import { useState } from "react";
import { useCart } from "@/src/context/CartContext";

type CheckoutPaymentData = {
  paymentUrl?: string;
  [key: string]: any;
};

export type CheckoutResult = {
  orderId: string;
  paymentRequired: boolean;
  paymentData?: CheckoutPaymentData | null;
} | null;

const CUSTOMISATION_PRICING = {
  badge: 200,
  name: 100,
  number: 100,
};

function getCustomisationCost(item: any) {
  return (
    (item.competitionBadge && item.competitionBadge !== "NONE" ? CUSTOMISATION_PRICING.badge : 0) +
    (item.playerName ? CUSTOMISATION_PRICING.name : 0) +
    (item.playerNumber ? CUSTOMISATION_PRICING.number : 0)
  );
}

export function useCheckout() {
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckoutProcess = async (
    shippingDetails: any,
    discount: any,
    paymentMethod: string,
    mpesaPhone?: string,
    paymentDetails?: any,
    shippingCost = 0
  ): Promise<CheckoutResult> => {
    setLoading(true);
    setError(null);

    const jerseyTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const customisationTotal = cart.reduce((sum, item) => sum + getCustomisationCost(item), 0);
    const grandTotal = jerseyTotal + customisationTotal + shippingCost - (discount?.discountAmount ?? 0);

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: shippingDetails,
          paymentMethod,
          shippingFee: shippingCost,
          discountCode: discount?.code || null,
          total: grandTotal,
          items: cart.map((item) => ({
            productId: item.id,
            variantId: item.variantId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            customizationCost: getCustomisationCost(item),
            customizationDetails: [
              item.competitionBadge && item.competitionBadge !== "NONE" ? `Badge: ${item.competitionBadge}` : null,
              item.playerName ? `Name: ${item.playerName}` : null,
              item.playerNumber ? `Number: ${item.playerNumber}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          })),
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || "Order generation runtime bottleneck");

      const { orderId, paymentRequired, total: orderTotal } = orderData;
      if (!paymentRequired) {
        return { orderId, paymentData: null, paymentRequired: false };
      }

      const amountToPay = Math.ceil(Number(orderTotal ?? grandTotal));
      if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
        throw new Error("Invalid payment amount calculated");
      }

      const paymentPath = paymentMethod === "mpesa" ? "/api/payments/mpesa/initiate" : "/api/payments/flutterwave/initiate";
      const paymentResponse = await fetch(paymentPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: amountToPay,
          phone: mpesaPhone || shippingDetails.phone,
          email: shippingDetails.email,
          paymentDetails: paymentDetails || null,
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Payment routing infrastructure error");

      return { orderId, paymentRequired: true, paymentData };
    } catch (err: any) {
      setError(err.message || "Generic operational exception triggered");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { initiateCheckoutProcess, loading, error };
}
