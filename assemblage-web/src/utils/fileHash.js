/**
 * Calculate SHA-1 hash of a file in the browser
 * @param {File} file - The file to hash
 * @returns {Promise<string>} The SHA-1 hash as a hex string
 */
export async function calculateSHA1(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if a file already exists in the database by SHA-1 hash
 * @param {string} hash - The SHA-1 hash to check
 * @param {string} collectionId - The collection to check in
 * @param {any} supabase - The Supabase client
 * @returns {Promise<boolean>} True if the file exists
 */
export async function checkDuplicateByHash(hash, collectionId, supabase) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('id')
      .eq('file_hash', hash)
      .eq('user_collection_id', collectionId)
      .limit(1);

    if (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('Error checking duplicate:', err);
    return false;
  }
}
