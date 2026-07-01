const priceMap = {
  "Foundation Artist": process.env.STRIPE_PRICE_FOUNDATION_ARTIST,
  "Foundation Studio": process.env.STRIPE_PRICE_FOUNDATION_STUDIO,
  "Foundation Supplier": process.env.STRIPE_PRICE_FOUNDATION_SUPPLIER,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { tier } = req.body || {};
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = priceMap[tier];

  if (!secret || !price) {
    return res.status(503).json({ error: "Stripe environment variables are not configured for this tier." });
  }

  const origin = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://inkverse.com";
  const params = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[tier]": tier,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(500).json({ error: data.error?.message || "Stripe checkout failed." });
  }

  return res.status(200).json({ url: data.url });
}
