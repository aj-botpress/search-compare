import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Exa Search Proxy
app.post('/api/exa', async (req, res) => {
  const startTime = performance.now();
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing x-api-key header' });
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Exa API error', latencyMs });
    }

    res.json({ ...data, serverLatencyMs: latencyMs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Brave Search Proxy
app.get('/api/brave', async (req, res) => {
  const startTime = performance.now();
  const apiKey = req.headers['x-subscription-token'];

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-Subscription-Token header' });
  }

  try {
    const params = new URLSearchParams(req.query);
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    const data = await response.json();
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Brave API error', latencyMs });
    }

    res.json({ ...data, serverLatencyMs: latencyMs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
