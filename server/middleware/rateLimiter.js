const submissionHistory = new Map();

function prayerRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const key = req.user ? `user_${req.user.id}` : `ip_${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes window
  const maxSubmissions = 5;

  let records = submissionHistory.get(key) || [];
  records = records.filter(timestamp => now - timestamp < windowMs);

  if (records.length >= maxSubmissions) {
    return res.status(429).json({
      error: 'Please wait a few moments before submitting another prayer request to prevent duplicate submissions.'
    });
  }

  records.push(now);
  submissionHistory.set(key, records);
  next();
}

function basicSpamCheck(req, res, next) {
  const { title = '', content = '' } = req.body;
  const combined = (title + ' ' + content).toLowerCase();

  const spamKeywords = [
    'viagra', 'cialis', 'casino', 'betting', 'crypto bonus',
    'earn $', 'make money fast', 'seo ranking service', 'whatsapp lottery'
  ];

  for (const keyword of spamKeywords) {
    if (combined.includes(keyword)) {
      return res.status(400).json({
        error: 'Your submission contains flagged promotional or inappropriate terms. Please revise your prayer request.'
      });
    }
  }

  // Honeypot check if present
  if (req.body.website_url_check && req.body.website_url_check.trim() !== '') {
    return res.status(400).json({ error: 'Automated submission detected.' });
  }

  next();
}

module.exports = {
  prayerRateLimiter,
  basicSpamCheck
};
