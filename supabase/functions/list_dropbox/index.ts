import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface DropboxFile {
  name: string;
  id: string;
  path_lower: string;
  path_display: string;
  size?: number;
}

interface DropboxListResponse {
  entries: DropboxFile[];
  cursor: string;
  has_more: boolean;
}

Deno.serve(async (req) => {
  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Dropbox token
    const { data: tokenData, error: tokenError } = await supabase
      .from("external_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "dropbox")
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Dropbox not connected" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    
    if (expiresAt && expiresAt < new Date()) {
      // Refresh token
      const appKey = Deno.env.get("DROPBOX_APP_KEY");
      const appSecret = Deno.env.get("DROPBOX_APP_SECRET");
      
      if (!appKey || !appSecret) {
        throw new Error("Missing Dropbox configuration");
      }

      const refreshResponse = await fetch("https://api.dropboxapi.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
          client_id: appKey,
          client_secret: appSecret,
        }),
      });

      if (!refreshResponse.ok) {
        console.error("Failed to refresh token");
        return new Response(
          JSON.stringify({ error: "Failed to refresh Dropbox token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (refreshData.expires_in || 14400));

      await supabase
        .from("external_tokens")
        .update({
          access_token: accessToken, // TODO: Encrypt this
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("provider", "dropbox");
    }

    // Parse request body for optional path
    const body = await req.json().catch(() => ({}));
    const path = body.path || "/Apps/Assemblage";

    // List files from Dropbox
    const listResponse = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path === "/" ? "" : path,
        recursive: false,
        include_media_info: true,
        include_deleted: false,
        limit: 100,
      }),
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error("Dropbox API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to list Dropbox files" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const listData: DropboxListResponse = await listResponse.json();

    // Filter for image files
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const imageFiles = listData.entries.filter(entry => {
      const lowerName = entry.name.toLowerCase();
      return imageExtensions.some(ext => lowerName.endsWith(ext));
    });

    // Get existing remote_ids to avoid duplicates
    const remoteIds = imageFiles.map(f => f.id);
    const { data: existingImages } = await supabase
      .from("images")
      .select("remote_id")
      .eq("provider", "dropbox")
      .in("remote_id", remoteIds);

    const existingRemoteIds = new Set(existingImages?.map(img => img.remote_id) || []);

    // Prepare new images for insertion
    const newImages = imageFiles
      .filter(file => !existingRemoteIds.has(file.id))
      .map(file => ({
        provider: "dropbox",
        remote_id: file.id,
        src: `dropbox://thumbnail/${file.id}`, // Placeholder, will be updated by process_image
        thumb_src: null,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        metadata_status: "pending",
        user_id: user.id,
        imagetype: "dropbox",
      }));

    let insertedCount = 0;

    if (newImages.length > 0) {
      // Use advisory lock to prevent concurrent duplicates
      const lockResult = await supabase.rpc("pg_try_advisory_lock", { key: 12345 });
      
      try {
        // Insert new images
        const { data: inserted, error: insertError } = await supabase
          .from("images")
          .insert(newImages)
          .select();

        if (insertError) {
          console.error("Failed to insert images:", insertError);
          throw new Error("Failed to save images");
        }

        insertedCount = inserted?.length || 0;

        // Queue images for processing
        if (inserted && inserted.length > 0) {
          // Trigger process_image for each new image
          const processingPromises = inserted.map(img => 
            fetch(`${supabaseUrl}/functions/v1/process_image`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image_id: img.id }),
            })
          );

          // Fire and forget - don't wait for processing
          Promise.all(processingPromises).catch(err => 
            console.error("Failed to queue some images for processing:", err)
          );
        }
      } finally {
        // Release advisory lock
        await supabase.rpc("pg_advisory_unlock", { key: 12345 });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        found: imageFiles.length,
        new: insertedCount,
        existing: existingRemoteIds.size,
        has_more: listData.has_more,
        cursor: listData.cursor,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("list_dropbox error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
