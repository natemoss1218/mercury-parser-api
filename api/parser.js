const Mercury = require('@postlight/mercury-parser');
const fetch = require('node-fetch'); // ensure fetch is available in Vercel

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
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;

        console.log("Attempting KV write...");
        console.log("KV PUT URL:", cfUrl);
        console.log("Key:", key);

        const cfResp = await fetch(cfUrl, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
            "Content-Type": "text/plain"
          },
          body: result.content
        });

        const respText = await cfResp.text();
        console.log("KV write status:", cfResp.status, "Response:", respText);
      } catch (err) {
        console.error("KV write failed with exception:", err);
      }
    } else {
      console.log("No result.url or result.content to write to KV.");
    }

    // Always return parsed result
    res.status(200).json(result);
  } catch (err) {
    console.error("Mercury error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
