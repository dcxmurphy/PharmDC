export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    supabaseUrl: 'https://gakjmoiwsqfxdmmpfmga.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
}
