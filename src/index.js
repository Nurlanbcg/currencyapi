export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const cacheKey = new Request("https://multi-currency-cache");

    // Return cached version if exists
    let response = await cache.match(cacheKey);
    if (response) return response;

    // Fetch base AZN rates
    const api = await fetch("https://open.er-api.com/v6/latest/AZN");
    const data = await api.json();

    // Extract rates
    const usdRate = data.rates?.USD; // 1 AZN -> USD
    const eurRate = data.rates?.EUR; // 1 AZN -> EUR

    // Conversions
    const rates = {
      // Base AZN conversions
      azn_to_usd: usdRate,
      azn_to_eur: eurRate,

      // Reverse conversions
      usd_to_azn: 1 / usdRate,
      eur_to_azn: 1 / eurRate,

      // Cross conversions
      usd_to_eur: usdRate / eurRate,
      eur_to_usd: eurRate / usdRate,

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
