import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabase } from '../supabaseClient';

export default function AuthComponent({ onAuthChange, onClose }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      onAuthChange?.(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.email);
        setSession(session);
        onAuthChange?.(session);
        
        // Close modal after successful sign in
        if (session && onClose) {
          onClose();
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [supabase, onAuthChange, onClose]);

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (session) {
    return (
      <div className="auth-user-info">
        <span>Welcome, {session.user.email}</span>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="auth-signout-btn"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>Sign in to save your collages</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="auth-close-btn"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              input: { 
                color: '#000',
                backgroundColor: '#fff',
                border: '1px solid #ccc'
              },
              button: { 
                backgroundColor: '#000',
                color: '#fff',
                border: 'none'
              }
            }
          }}
          providers={[]}
          redirectTo={window.location.origin}
          onlyThirdPartyProviders={false}
        />
      </div>
    </div>
  );
}
