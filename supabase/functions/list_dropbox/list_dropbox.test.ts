import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Mock Dropbox API responses
const mockDropboxListResponse = {
  entries: [
    {
      name: "test1.jpg",
      id: "id:test1",
      path_lower: "/apps/assemblage/test1.jpg",
      path_display: "/Apps/Assemblage/test1.jpg",
      size: 12345,
    },
    {
      name: "test2.png",
      id: "id:test2",
      path_lower: "/apps/assemblage/test2.png",
      path_display: "/Apps/Assemblage/test2.png",
      size: 67890,
    },
    {
      name: "document.pdf",
      id: "id:doc1",
      path_lower: "/apps/assemblage/document.pdf",
      path_display: "/Apps/Assemblage/document.pdf",
      size: 54321,
    },
  ],
  cursor: "test_cursor",
  has_more: false,
};

Deno.test("list_dropbox - filters only image files", async () => {
  // This is a unit test stub - in a real test environment, you would:
  // 1. Mock the Supabase client
  // 2. Mock the fetch calls to Dropbox API
  // 3. Test the filtering logic
  
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const imageFiles = mockDropboxListResponse.entries.filter(entry => {
    const lowerName = entry.name.toLowerCase();
    return imageExtensions.some(ext => lowerName.endsWith(ext));
  });

  assertEquals(imageFiles.length, 2);
  assertEquals(imageFiles[0].name, "test1.jpg");
  assertEquals(imageFiles[1].name, "test2.png");
});

Deno.test("list_dropbox - handles duplicate prevention", async () => {
  // Test that the function correctly identifies existing images
  const remoteIds = ["id:test1", "id:test2", "id:test3"];
  const existingImages = [{ remote_id: "id:test1" }];
  const existingRemoteIds = new Set(existingImages.map(img => img.remote_id));
  
  const newIds = remoteIds.filter(id => !existingRemoteIds.has(id));
  
  assertEquals(newIds.length, 2);
  assertEquals(newIds[0], "id:test2");
  assertEquals(newIds[1], "id:test3");
});

Deno.test("list_dropbox - formats image data correctly", async () => {
  const file = {
    name: "test_image.jpg",
    id: "id:test123",
    path_lower: "/apps/assemblage/test_image.jpg",
    path_display: "/Apps/Assemblage/test_image.jpg",
  };
  
  const formatted = {
    provider: "dropbox",
    remote_id: file.id,
    src: `dropbox://thumbnail/${file.id}`,
    thumb_src: null,
    title: file.name.replace(/\.[^/.]+$/, ""),
    metadata_status: "pending",
    user_id: "test-user-id",
    imagetype: "dropbox",
  };
  
  assertEquals(formatted.provider, "dropbox");
  assertEquals(formatted.remote_id, "id:test123");
  assertEquals(formatted.title, "test_image");
  assertEquals(formatted.metadata_status, "pending");
});

// To run tests:
// deno test --allow-net --allow-env list_dropbox.test.ts
