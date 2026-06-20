import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AionosLogo } from "@/components/AionosLogo";

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAF7F2',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '480px',
        width: '100%'
      }}>
        
        {/* Logo - Professional Size */}
        <div style={{ marginBottom: '48px' }}>
          <AionosLogo size="sm" showText={false} />
        </div>

        {/* Header Text */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#2d3436',
            margin: '0 0 16px 0',
            lineHeight: '1.3'
          }}>
            Welcome to AIONOS Diagnostics
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666666',
            margin: '0',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Advanced Intelligence for Optical Neurodiagnostic Operating System
          </p>
        </div>

        {/* Features List */}
        <div style={{
          width: '100%',
          marginBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#FF7B6B',
              fontWeight: 'bold',
              marginTop: '2px'
            }}>✓</div>
            <div>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#2d3436',
                fontWeight: '500'
              }}>Real-time Diagnostic Imaging</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#FF7B6B',
              fontWeight: 'bold',
              marginTop: '2px'
            }}>✓</div>
            <div>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#2d3436',
                fontWeight: '500'
              }}>Comprehensive Analysis Reports</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#FF7B6B',
              fontWeight: 'bold',
              marginTop: '2px'
            }}>✓</div>
            <div>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#2d3436',
                fontWeight: '500'
              }}>Secure Patient Data Management</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/loggedin")}
          style={{
            width: '100%',
            backgroundColor: '#FF7B6B',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            padding: '16px 32px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 123, 107, 0.25)',
            marginBottom: '16px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#FF5A45';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 123, 107, 0.35)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FF7B6B';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 123, 107, 0.25)';
          }}
        >
          Continue to Login
        </button>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#999999',
          textAlign: 'center',
          margin: '24px 0 0 0'
        }}>
          Enterprise diagnostic platform for healthcare professionals
        </p>
      </div>
    </div>
  );
};

export default Login;
