import type { Handler } from "@netlify/functions";

const handler: Handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check required environment variables
  const appKey = process.env.DROPBOX_APP_KEY;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;

  if (!appKey || !redirectUri) {
    console.error("Missing Dropbox configuration");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Dropbox integration not configured" }),
    };
  }

  // Build Dropbox OAuth URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appKey,
    redirect_uri: redirectUri,
    token_access_type: "offline",
    // Request necessary scopes
    scope: "files.content.read files.metadata.read account_info.read",
  });

  const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;

  // Redirect to Dropbox OAuth
  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
    },
    body: "",
  };
};

export { handler };
