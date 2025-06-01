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

  // Update header based on current auth view
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const headerTitle = document.getElementById('auth-header-title');
      if (!headerTitle) return;
      
      // Check if we're in sign up view
      const signUpForm = document.querySelector('[data-supabase-auth-ui] form[id*="sign_up"]');
      const signInForm = document.querySelector('[data-supabase-auth-ui] form[id*="sign_in"]');
      
      if (signUpForm && signUpForm.offsetParent !== null) {
        headerTitle.textContent = 'Create an account';
      } else if (signInForm && signInForm.offsetParent !== null) {
        headerTitle.textContent = 'Sign in to save collages and add your own images';
      }
    });
    
    const authContainer = document.querySelector('[data-supabase-auth-ui]');
    if (authContainer) {
      observer.observe(authContainer, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => observer.disconnect();
  }, []);

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
          <h2 id="auth-header-title">Sign in to save collages and add your own images</h2>
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
              },
              anchor: {
                color: '#000',
                textDecoration: 'underline'
              }
            },
            variables: {
              default: {
                colors: {
                  brand: '#000',
                  brandAccent: '#333'
                }
              }
            }
          }}
          providers={[]}
          redirectTo={window.location.origin}
          onlyThirdPartyProviders={false}
          view="sign_in"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Your Password'
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password'
              }
            }
          }}
        />

      </div>
    </div>
  );
}
