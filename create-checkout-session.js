// Creates a real Stripe Checkout Session server-side. The secret key never
// reaches the browser — only Stripe's own hosted page (session.url) does,
// which is what keeps this PCI-compliant: card numbers go straight to
// Stripe, never through this server or Supabase.
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY not set in Vercel environment variables." });
    return;
  }

  const stripe = new Stripe(secretKey);

  try {
    const { cart, orderId, customerEmail, origin } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ error: "Cart is empty." });
      return;
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: `${item.name} (${item.size}ml)` },
        unit_amount: Math.round(Number(item.price) * 100)
      },
      quantity: item.qty
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: customerEmail || undefined,
      client_reference_id: orderId,
      success_url: `${origin}/?order_success=1&order_id=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?order_cancelled=1&order_id=${encodeURIComponent(orderId)}`
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe session creation failed:", err);
    res.status(500).json({ error: err.message || "Could not start checkout." });
  }
}
