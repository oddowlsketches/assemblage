import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export const DropboxConnect: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Dropbox is already connected
    const checkConnection = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('external_tokens')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'dropbox')
          .single();
        
        setIsConnected(!!data && !error);
      } catch (err) {
        console.error('Error checking Dropbox connection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [user, supabase]);

  const handleConnect = () => {
    // Redirect to Dropbox OAuth start
    window.location.href = '/.netlify/functions/dropbox-auth-start';
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('external_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'dropbox');
      
      if (error) throw error;
      setIsConnected(false);
    } catch (err) {
      console.error('Error disconnecting Dropbox:', err);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/functions/v1/list_dropbox', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: '/Apps/Assemblage' }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync Dropbox images');
      }

      const result = await response.json();
      alert(`Sync complete! Found ${result.found} images, imported ${result.new} new images.`);
    } catch (err) {
      console.error('Error syncing Dropbox:', err);
      alert('Failed to sync Dropbox images. Please try again.');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Dropbox Integration</h3>
      
      {isConnected ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Dropbox is connected</p>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sync Images
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Connect your Dropbox to import images from your Apps/Assemblage folder
          </p>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Connect Dropbox
          </button>
        </div>
      )}
    </div>
  );
};
