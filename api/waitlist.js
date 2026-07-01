export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { email, role } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required." });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return res.status(503).json({ error: "Supabase environment variables are not configured." });
  }

  const response = await fetch(`${url}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const message = await response.text();
    return res.status(500).json({ error: message });
  }

  return res.status(200).json({ ok: true });
}
