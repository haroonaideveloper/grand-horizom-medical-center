// Reads SUPABASE_URL / SUPABASE_ANON_KEY from Vercel's Environment Variables
// at runtime. Set these once in Vercel dashboard → never commit them to GitHub.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
}
