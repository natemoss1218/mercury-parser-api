const Mercury = require('@postlight/mercury-parser');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url=' });
  }

  try {
    const result = await Mercury.parse(url, { contentType: 'html' });

    // === Cloudflare KV Write ===
    if (result.url && result.content) {
      try {
        const key = "article:" + Buffer.from(result.url).toString("base64");
        const cfResp = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
              "Content-Type": "text/plain"
            },
            body: result.content
          }
        );
        console.log("KV write status:", cfResp.status);
      } catch (err) {
        console.error("KV write failed:", err.message);
      }
    }

    // Always return the parsed result to the caller
    res.status(200).json(result);
  } catch (err) {
    console.error('Mercury error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
