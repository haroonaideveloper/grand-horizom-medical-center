// Vercel serverless function.
// Reads SUPABASE_URL and SUPABASE_ANON_KEY from your Vercel project's
// Environment Variables (set in the dashboard — never committed to GitHub)
// and hands them to the front end at runtime.
//
// Note: the "anon" key is designed to be public-safe — Supabase's own docs
// say it's meant to ship in client apps. This setup still keeps it out of
// your git history, which is the part worth avoiding regardless.

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null
  });
}
