export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const cacheKey = new Request("https://azn-usd-bidirectional");

    // Try using cache
    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }

    // Fetch the latest rates
    const api = await fetch("https://open.er-api.com/v6/latest/AZN");
    const data = await api.json();

    const usdRate = data.rates?.USD;      // 1 AZN → USD
    const aznFromUsd = 1 / usdRate;       // 1 USD → AZN

    response = new Response(
      JSON.stringify({
        azn_to_usd: usdRate,
        usd_to_azn: aznFromUsd,
        updated_at: data.time_last_update_utc,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Cache for 12 hours
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};
