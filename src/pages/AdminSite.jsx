import React, { useState } from 'react';
import AdminServices from '../AdminServices'; // Make sure this path points to your AdminServices.jsx

function AdminSite() {
  // --- NEW: State to toggle between views ---
  const [currentView, setCurrentView] = useState('appointments'); 

  // --- EXISTING: State to simulate database changes ---
  const [appointments, setAppointments] = useState([
    { id: 'REQ-991', origin: 'Client Portal', payload: 'Premium Haircut | Juan D.', dbSync: 'Synced', status: 'Pending' },
    { id: 'REQ-992', origin: 'Client Portal', payload: 'Signature Fade | Carlos M.', dbSync: 'Synced', status: 'Confirmed' }
  ]);

  // --- EXISTING: Function simulating Admin confirming data ---
  const updateStatus = (id) => {
    setAppointments(appointments.map(appt => 
      appt.id === id ? { ...appt, status: 'Confirmed', dbSync: 'Updating...' } : appt
    ));
    
    // Simulate Firebase delay
    setTimeout(() => {
      setAppointments(appointments.map(appt => 
        appt.id === id ? { ...appt, status: 'Confirmed', dbSync: 'Synced' } : appt
      ));
    }, 1000);
  };

  return (
    <div className="admin-body">
      {/* SYSTEM ADMIN NAV */}
      <nav className="admin-nav">
        <div className="nav-brand">SYSTEM<span>ADMIN</span></div>
        
        {/* VIEW TOGGLE BUTTONS */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${currentView === 'appointments' ? 'active' : ''}`}
            onClick={() => setCurrentView('appointments')}
          >
            DATA PAYLOADS (APPOINTMENTS)
          </button>
          <button 
            className={`tab-btn ${currentView === 'services' ? 'active' : ''}`}
            onClick={() => setCurrentView('services')}
          >
            SERVICE REGISTRY (EDIT)
          </button>
        </div>

        <div className="admin-info">
          <span className="pulse-dot"></span>  <strong style={{color:'#28b4a4'}}>ONLINE</strong> | Firebase DB: <strong style={{color:'#28b4a4'}}>CONNECTED</strong>
        </div>
      </nav>

      <div className="admin-content">
        
        {/* --- VIEW 1: YOUR EXISTING APPOINTMENTS TABLE --- */}
        {currentView === 'appointments' && (
          <>
            <div className="header-flex">
              <h1></h1>
              <p>Review and commit client payloads to main database.</p>
            </div>

            {/* SYSTEM DATA TABLE */}
            <table className="integration-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Origin Node</th>
                  <th>Data Payload</th>
                  <th>Firebase DB Sync</th>
                  <th>Process Status</th>
                  <th>System Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td style={{ color: '#aaa', fontFamily: 'monospace' }}>{appt.id}</td>
                    <td>{appt.origin}</td>
                    <td>{appt.payload}</td>
                    <td style={{ color: appt.dbSync === 'Synced' ? '#28b4a4' : 'orange' }}>
                      {appt.dbSync}
                    </td>
                    <td style={{ fontWeight: 'bold', color: appt.status === 'Pending' ? 'orange' : '#C9B497' }}>
                      {appt.status.toUpperCase()}
                    </td>
                    <td className="action-buttons">
                      {appt.status === 'Pending' ? (
                        <button className="btn-accept" onClick={() => updateStatus(appt.id)}>Acknowledge & Confirm</button>
                      ) : (
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>Data Committed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* --- VIEW 2: THE SERVICES EDITOR WE BUILT --- */}
        {currentView === 'services' && (
           <AdminServices />
        )}

      </div>
    </div>
  );
}

export default AdminSite;