import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
import Stripe from 'stripe';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('MY_STRIPE_SECRET_KEY') || key === '') {
    return null;
  }
  
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // YouTube OAuth Setup
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    // Redirect URI will be dynamic based on request for better flexibility in preview
    ""
  );

  const SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
  ];

  app.get("/api/auth/youtube/url", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"];
    const redirectUri = `${protocol}://${host}/auth/youtube/callback`;
    
    // Update redirectUri in client for this request
    oauth2Client.setCredentials({ 
       // dummy to ensure client is fresh
    });
    
    // We can't easily change redirectUri after initialization in some versions,
    // so we create a new one if needed or just use the one from env if set.
    const client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    );

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/youtube/callback", async (req, res) => {
    const { code } = req.query;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"];
    const redirectUri = `${protocol}://${host}/auth/youtube/callback`;

    const client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    );

    try {
      const { tokens } = await client.getToken(code as string);
      // In a real app, store this in a database for the user.
      // For now, we'll send it back to the client to store in local storage (demo mode)
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'YOUTUBE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/sanctuary';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // YouTube API Endpoints
  const getTransformedClient = (tokens: any) => {
    const client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
    client.setCredentials(tokens);
    return client;
  };

  app.get("/api/youtube/profile", async (req, res) => {
    const tokens = JSON.parse(req.headers.authorization || "{}");
    const client = getTransformedClient(tokens);
    const youtube = google.youtube({ version: "v3", auth: client });

    try {
      const response = await youtube.channels.list({
        part: ["snippet", "statistics", "contentDetails"],
        mine: true,
      });
      res.json(response.data.items?.[0] || {});
    } catch (error: any) {
      console.error("YouTube Profile Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/videos", async (req, res) => {
    const tokens = JSON.parse(req.headers.authorization || "{}");
    const client = getTransformedClient(tokens);
    const youtube = google.youtube({ version: "v3", auth: client });

    try {
      // First get uploads playlist ID
      const channelRes = await youtube.channels.list({
        part: ["contentDetails"],
        mine: true,
      });
      const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.json([]);
      }

      const playlistItems = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: uploadsPlaylistId,
        maxResults: 20,
      });

      res.json(playlistItems.data.items || []);
    } catch (error: any) {
       console.error("YouTube Videos Error:", error.message);
       res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/youtube/video/update", async (req, res) => {
    const tokens = JSON.parse(req.headers.authorization || "{}");
    const { videoId, title, description } = req.body;
    const client = getTransformedClient(tokens);
    const youtube = google.youtube({ version: "v3", auth: client });

    try {
      const response = await youtube.videos.update({
        part: ["snippet"],
        requestBody: {
          id: videoId,
          snippet: {
            title,
            description,
            categoryId: "22", // People & Blogs
          },
        },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("YouTube Video Update Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // IoT Simulation & Reverse Feedback
  let iotState = {
    heartRate: 72,
    stressLevel: 0.3,
    ambientTemp: 22,
    activeAroma: 'None',
    lastAromaUpdate: Date.now(),
    lastUpdate: Date.now()
  };

  app.get("/api/iot/state", (req, res) => {
    // Simulate some drift in IoT data
    iotState.heartRate = Math.max(60, Math.min(100, iotState.heartRate + (Math.random() - 0.5) * 4));
    iotState.stressLevel = Math.max(0, Math.min(1, iotState.stressLevel + (Math.random() - 0.5) * 0.1));
    iotState.lastUpdate = Date.now();
    
    res.json(iotState);
  });

  app.post("/api/iot/sync", (req, res) => {
    const { action, value } = req.body;
    console.log(`[IoT Sync] Action: ${action}, Value: ${value}`);
    
    if (action === 'diffuser_trigger') {
      iotState.activeAroma = value;
      iotState.lastAromaUpdate = Date.now();
    }
    
    res.json({ status: "synced", action, value });
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { items } = req.body;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"];

    try {
      const stripe = getStripe();
      
      if (!stripe) {
        return res.json({ 
          simulatedUrl: `${protocol}://${host}/checkout/success?simulated=true`,
          message: "No valid STRIPE_SECRET_KEY found. Proceeding with simulation."
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description,
              images: [`https://picsum.photos/seed/${item.id}/800/600`],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${protocol}://${host}/checkout/success`,
        cancel_url: `${protocol}://${host}/checkout/cancel`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error.message);
      
      let message = error.message;
      let isInvalidKey = false;

      if (message.includes('Invalid API Key provided') || message.includes('No API key provided')) {
        const key = process.env.STRIPE_SECRET_KEY || '';
        const isLive = key.startsWith('sk_live_');
        message = `The Stripe API Key provided ${isLive ? '(Live Mode) ' : ''}is invalid. Please ensure your STRIPE_SECRET_KEY in the Settings menu is correct and matches your Stripe Dashboard (Test vs Live).`;
        isInvalidKey = true;
      }
      
      // Providing a simulated escape hatch for preview environments
      res.status(isInvalidKey ? 200 : 500).json({ 
        error: message, 
        isInvalidKey,
        simulatedUrl: isInvalidKey ? `${protocol}://${host}/checkout/success?simulated=true` : undefined
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
