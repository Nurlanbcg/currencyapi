export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const cacheKey = new Request("https://multi-currency-cache-v2");

    // Check cache
    let response = await cache.match(cacheKey);
    if (response) return response;

    // Fetch all rates with AZN as base
    const api = await fetch("https://open.er-api.com/v6/latest/AZN");
    const data = await api.json();

    // Extract base rates
    const usd = data.rates?.USD;
    const eur = data.rates?.EUR;
    const aed = data.rates?.AED;
    const tryRate = data.rates?.TRY;

    // Build full conversion table
    const rates = {
      // AZN → Major currencies
      azn_to_usd: usd,
      azn_to_eur: eur,
      azn_to_aed: aed,
      azn_to_try: tryRate,

      // Major currencies → AZN
      usd_to_azn: 1 / usd,
      eur_to_azn: 1 / eur,
      aed_to_azn: 1 / aed,
      try_to_azn: 1 / tryRate,

      // Cross conversions (optional)
      usd_to_eur: usd / eur,
      eur_to_usd: eur / usd,

      usd_to_aed: usd / aed,
      aed_to_usd: aed / usd,

      usd_to_try: usd / tryRate,
      try_to_usd: tryRate / usd,

      eur_to_aed: eur / aed,
      aed_to_eur: aed / eur,

      eur_to_try: eur / tryRate,
      try_to_eur: tryRate / eur,

      aed_to_try: aed / tryRate,
      try_to_aed: tryRate / aed,

      updated_at: data.time_last_update_utc
    };

    response = new Response(JSON.stringify(rates), {
      headers: { "Content-Type": "application/json" }
    });

    // Cache for 12 hours
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  }
};