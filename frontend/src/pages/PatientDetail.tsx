import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ScanRecord {
  _id: string;
  patientName: string;
  patientId: string;
  organ: string;
  scanStatus: string;
  findings?: string;
  summary?: any;
  bmode_png_b64?: string;
  doppler_png_b64?: string;
  elast_png_b64?: string;
  mask_png_b64?: string;
  createdAt: string;
}

interface PatientState {
  patientId: string;
  patientName: string;
  organ?: string;
}

const PatientDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state?.patient as PatientState | undefined;

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patient?.patientId) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/patient/${patient.patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch patient details.");
        return res.json();
      })
      .then((data) => {
        setScans(data.scans || []);
      })
      .catch((err) => {
        console.error("Patient detail load error:", err);
        setError("Unable to load patient history. Make sure the AI server is running.");
      })
      .finally(() => setLoading(false));
  }, [patient]);

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  if (!patient) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#2d3436', margin: '0 0 12px 0' }}>No patient selected</h2>
          <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 24px 0' }}>
            Please open a patient from the Patients or History page.
          </p>
          <button
            onClick={() => navigate("/patients")}
            style={{
              padding: '12px 28px', background: 'linear-gradient(135deg, #FF7B6B, #FF9A84)',
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer'
            }}
          >
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: '40px', fontFamily: font }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1px solid #f0f0f0',
        padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF7B6B 0%, #FF9A84 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '18px', fontWeight: 'bold'
            }}>A</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3436', margin: '0' }}>Patient Details</h1>
              <p style={{ fontSize: '12px', color: '#FF7B6B', margin: '2px 0 0 0', fontWeight: '600' }}>
                {patient.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/patients")}
            style={{
              padding: '8px 16px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0',
              borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#2d3436', cursor: 'pointer'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FF7B6B'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#FF7B6B'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.color = '#2d3436'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
          >
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Patient Info Card */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#FFE8E1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: '#FF7B6B', flexShrink: 0
          }}>
            {patient.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#2d3436', margin: '0 0 4px 0' }}>{patient.patientName}</h2>
            <p style={{ fontSize: '13px', color: '#666666', margin: '0 0 2px 0' }}>Patient ID: <strong>{patient.patientId}</strong></p>
            {patient.organ && <p style={{ fontSize: '13px', color: '#666666', margin: '0' }}>Organ: {patient.organ}</p>}
          </div>
          <button
            onClick={() => navigate('/history')}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #FF7B6B, #FF9A84)',
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer'
            }}
          >
            Full History
          </button>
        </div>

        {/* Scans */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3436', margin: '0 0 16px 0' }}>
          Scan Records ({scans.length})
        </h3>

        {loading ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '14px', color: '#999999', margin: 0 }}>Loading patient scan history…</p>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fff5f5', border: '1px solid #ffcccc', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <p style={{ fontSize: '14px', color: '#e74c3c', margin: 0, fontWeight: '600' }}>{error}</p>
          </div>
        ) : scans.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '14px', color: '#999999', margin: 0 }}>No scan results found for this patient yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {scans.map((scan) => (
              <div
                key={scan._id}
                onClick={() => navigate("/final-report", {
                  state: {
                    patientName: scan.patientName,
                    patientId: scan.patientId,
                    organ: scan.organ,
                    images: {
                      bmode:   scan.bmode_png_b64   ? `data:image/png;base64,${scan.bmode_png_b64}`   : null,
                      doppler: scan.doppler_png_b64  ? `data:image/png;base64,${scan.doppler_png_b64}` : null,
                      elast:   scan.elast_png_b64    ? `data:image/png;base64,${scan.elast_png_b64}`   : null,
                      mask:    scan.mask_png_b64     ? `data:image/png;base64,${scan.mask_png_b64}`    : null,
                    },
                    summary: JSON.stringify(scan.summary),
                  },
                })}
                style={{
                  backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,123,107,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#2d3436', margin: '0 0 4px 0' }}>
                      {scan.organ || 'Ultrasound Scan'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#999999', margin: 0 }}>
                      {new Date(scan.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: scan.scanStatus === 'Completed' ? '#e8f5e9' : '#fff3e0',
                      color: scan.scanStatus === 'Completed' ? '#2e7d32' : '#e65100'
                    }}>
                      {scan.scanStatus || 'Completed'}
                    </span>
                    <span style={{ fontSize: '14px', color: '#FF7B6B', fontWeight: '600' }}>View →</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#FAF7F2', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#999999', margin: '0 0 6px 0' }}>Findings</p>
                    <p style={{ fontSize: '13px', color: '#2d3436', margin: 0, lineHeight: '1.5' }}>
                      {scan.findings || scan.summary?.interpretation || 'No findings recorded.'}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#FAF7F2', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#999999', margin: '0 0 6px 0' }}>Scan ID</p>
                    <p style={{ fontSize: '12px', color: '#2d3436', margin: 0, wordBreak: 'break-all' }}>{scan._id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
