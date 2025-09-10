/* public/api-client.js
 * Simple helper to call backend analyze API if you decide to wire UI later.
 * Usage (optional):
 *   window.API.analyze({ imageBase64, meatType: 'pork' }).then(console.log)
 */
window.API = (function () {
  const BASE = "";
  async function analyze(payload) {
    const res = await fetch(`${BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const t = await res.text().catch(()=> "");
      throw new Error(`Analyze failed: ${res.status} ${t}`);
    }
    return res.json();
  }
  async function health() {
    const res = await fetch(`${BASE}/api/health`);
    return res.json();
  }
  return { analyze, health };
})();
