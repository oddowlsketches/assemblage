import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const handler: Handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Extract code and state from query parameters
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  // Handle OAuth errors
  if (error) {
    console.error("Dropbox OAuth error:", error);
    return {
      statusCode: 302,
      headers: {
        Location: "/?error=dropbox_auth_failed",
      },
      body: "",
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing authorization code" }),
    };
  }

  // Check required environment variables
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required configuration");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Get user session from cookie
  const cookieHeader = event.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => c.split("=").map(decodeURIComponent))
  );
  
  const accessToken = cookies["sb-access-token"];
  if (!accessToken) {
    return {
      statusCode: 302,
      headers: {
        Location: "/?error=not_authenticated",
      },
      body: "",
    };
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the user's session
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    console.error("Failed to verify user session:", userError);
    return {
      statusCode: 302,
      headers: {
        Location: "/?error=session_invalid",
      },
      body: "",
    };
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: appKey,
        client_secret: appSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 14400)); // Default 4 hours

    // Encrypt tokens (TODO: Implement proper encryption)
    // For now, we'll store them as-is but mark with TODO
    const accessTokenEncrypted = access_token; // TODO: Encrypt this
    const refreshTokenEncrypted = refresh_token; // TODO: Encrypt this

    // Upsert token to database
    const { error: dbError } = await supabase
      .from("external_tokens")
      .upsert({
        user_id: user.id,
        provider: "dropbox",
        access_token: accessTokenEncrypted,
        refresh_token: refreshTokenEncrypted,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider",
      });

    if (dbError) {
      console.error("Failed to save tokens:", dbError);
      throw new Error("Failed to save authentication");
    }

    // Redirect back to app with success
    return {
      statusCode: 302,
      headers: {
        Location: "/?dropbox=connected",
      },
      body: "",
    };
  } catch (error) {
    console.error("Dropbox callback error:", error);
    return {
      statusCode: 302,
      headers: {
        Location: "/?error=dropbox_connection_failed",
      },
      body: "",
    };
  }
};

export { handler };
