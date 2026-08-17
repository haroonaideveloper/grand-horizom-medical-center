// Called when the browser lands back on the site after Stripe Checkout,
// to confirm the session actually completed before we mark the order paid.
import Stripe from "stripe";

export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY not set." });
    return;
  }
  const stripe = new Stripe(secretKey);
  const { session_id } = req.query;

  if (!session_id) {
    res.status(400).json({ error: "Missing session_id" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.status(200).json({
      paid: session.payment_status === "paid",
      orderId: session.client_reference_id,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || null
    });
  } catch (err) {
    console.error("Session verification failed:", err);
    res.status(500).json({ error: err.message });
  }
}
