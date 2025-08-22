const Mercury = require('@postlight/mercury-parser');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url=' });
  }

  try {
    const result = await Mercury.parse(url, { contentType: 'html' });
    res.status(200).json(result);
  } catch (err) {
    console.error('Mercury error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
