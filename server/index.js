import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration - allow GitHub Pages and localhost
const allowedOrigins = [
  'https://aj-botpress.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now, can restrict later
  },
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'search-compare-proxy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
});
