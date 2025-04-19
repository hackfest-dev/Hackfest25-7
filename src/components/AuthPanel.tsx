import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthPanel: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, maxWidth: 400, margin: '16px auto', background: '#fafbfc' }}>
      <h3 style={{ marginBottom: 8 }}>Firebase Auth Panel</h3>
      {user ? (
        <div>
          <div style={{ marginBottom: 8 }}>
            <b>Signed in as:</b> {user.email}
          </div>
          <button onClick={handleLogout} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ width: '100%', padding: 8, marginBottom: 4 }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      )}
    </div>
  );
};

export default AuthPanel;
