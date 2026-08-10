import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AionosLogo } from "@/components/AionosLogo";
import { AUTH_API_URL } from "@/config/api";

const LoggedIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response from ${AUTH_API_URL}/login: ${text.slice(0, 100)}`);
      }

      if (res.ok) {
        localStorage.setItem(
          "user",
          JSON.stringify({ name: data.user?.name || email.split("@")[0], email })
        );
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      const isLocal = AUTH_API_URL.includes("localhost");
      if (isLocal) {
        setError(`Connection error: Frontend is attempting to connect to ${AUTH_API_URL}. Please set VITE_AUTH_API_URL in your hosting environment variables to your live backend URL.`);
      } else {
        setError(`Connection error: Could not reach backend at ${AUTH_API_URL}. If your backend is hosted on Render free tier, it may be spinning up (takes 30-50 seconds). Please try again in a moment.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAF7F2',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        padding: '48px 32px'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <AionosLogo size="md" showText={false} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#2d3436',
            margin: '0 0 8px 0'
          }}>
            Sign In
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666666',
            margin: '0'
          }}>
            Access your diagnostic accounts
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #ffb3a7',
            color: '#d9534f',
            padding: '12px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E8E3DE',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#2d3436',
                backgroundColor: '#FAF7F2',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF7B6B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,123,107,0.08)';
                e.currentTarget.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E8E3DE';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#FAF7F2';
              }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E8E3DE',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#2d3436',
                backgroundColor: '#FAF7F2',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF7B6B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,123,107,0.08)';
                e.currentTarget.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E8E3DE';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#FAF7F2';
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: loading ? '#ccc' : '#FF7B6B',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginTop: '8px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#FF5A45';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,123,107,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#FF7B6B';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#666666',
            margin: '0'
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: '#FF7B6B',
              textDecoration: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoggedIn;
