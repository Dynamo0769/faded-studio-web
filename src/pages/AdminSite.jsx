import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import './AdminSite.css';

function AdminSite() {
  const [currentView, setCurrentView] = useState('bookings'); 
  
  // Data States
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State (Handles both Add & Edit)
  const [newService, setNewService] = useState({ serviceName: '', price: '', duration: '', imageUrl: '' });
  
  // NEW: Track if we are editing a service
  const [editingServiceId, setEditingServiceId] = useState(null);

  // --- FETCH ALL DATA ONCE FOR THE DASHBOARD ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Appointments
      const apptSnapshot = await getDocs(collection(db, 'Appointments'));
      const appts = apptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      appts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAppointments(appts);

      // 2. Fetch Services
      const servSnapshot = await getDocs(collection(db, 'Services'));
      setServices(servSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 3. Fetch Clients
      const clientSnapshot = await getDocs(collection(db, 'users'));
      setClients(clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Error fetching data: ", error);
    }
    setIsLoading(false);
  };

  // --- BOOKING ACTIONS ---
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'Appointments', id), { status: newStatus });
      setAppointments(appointments.map(appt => 
        appt.id === id ? { ...appt, status: newStatus } : appt
      ));
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  // --- SERVICE ACTIONS ---
  
  // NEW: Handle Form Submit (Both Add and Update)
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        // UPDATE EXISTING
        const serviceRef = doc(db, 'Services', editingServiceId);
        await updateDoc(serviceRef, newService);
        
        // Update local state so it shows immediately
        setServices(services.map(srv => 
          srv.id === editingServiceId ? { id: editingServiceId, ...newService } : srv
        ));
        
        alert("Service updated successfully!");
        setEditingServiceId(null); // Exit edit mode
      } else {
        // ADD NEW
        const docRef = await addDoc(collection(db, 'Services'), newService);
        setServices([...services, { id: docRef.id, ...newService }]);
        alert("Service added successfully!");
      }
      
      // Clear form
      setNewService({ serviceName: '', price: '', duration: '', imageUrl: '' }); 
    } catch (error) {
      alert("Error saving service: " + error.message);
    }
  };

  // NEW: Trigger Edit Mode
  const handleEditClick = (service) => {
    setEditingServiceId(service.id);
    setNewService({
      serviceName: service.serviceName || service.name || '',
      price: service.price || '',
      duration: service.duration || '',
      imageUrl: service.imageUrl || ''
    });
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setNewService({ serviceName: '', price: '', duration: '', imageUrl: '' });
  };

  const handleDeleteService = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, 'Services', id));
        setServices(services.filter(service => service.id !== id));
      } catch (error) {
        alert("Error deleting service: " + error.message);
      }
    }
  };

  // --- CALCULATE QUICK STATS ---
  const pendingBookings = appointments.filter(a => !a.status || a.status.toLowerCase() === 'pending').length;
  const totalRevenue = appointments
    .filter(a => a.status?.toLowerCase() === 'completed')
    .reduce((sum, appt) => sum + (parseFloat(appt.price) || 0), 0);

  return (
    <div className="admin-dashboard">
      {/* TOP NAVIGATION */}
      <header className="admin-header">
        <div className="admin-brand">FADED STUDIO <span>| ADMIN</span></div>
        <div className="admin-nav-links">
          <button className={`admin-tab ${currentView === 'bookings' ? 'active' : ''}`} onClick={() => setCurrentView('bookings')}>Bookings</button>
          <button className={`admin-tab ${currentView === 'services' ? 'active' : ''}`} onClick={() => setCurrentView('services')}>Menu</button>
          <button className={`admin-tab ${currentView === 'clients' ? 'active' : ''}`} onClick={() => setCurrentView('clients')}>Clients</button>
        </div>
        <div className="admin-profile"></div>
      </header>

      <main className="admin-main">
        {isLoading ? (
          <div className="loading-state">Syncing with Firebase...</div>
        ) : (
          <div className="admin-layout-wrapper">
            
            {/* LEFT SIDE: MAIN CONTENT AREA */}
            <div className="admin-content-area">
              {/* --- BOOKINGS VIEW --- */}
              {currentView === 'bookings' && (
                <div className="admin-section fade-in">
                  <div className="section-header">
                    <h2>Schedule & Bookings</h2>
                    <p>Manage your client appointments and statuses.</p>
                  </div>
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Ref Code</th>
                          <th>Date & Time</th>
                          <th>Client</th>
                          <th>Barber</th>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 && <tr><td colSpan="7" className="empty-text">No bookings found.</td></tr>}
                        {appointments.map((appt) => (
                          <tr key={appt.id}>
                            <td className="bold-text">{appt.refCode || 'N/A'}</td>
                            <td>{appt.date} <br/><span className="sub-text">{appt.time}</span></td>
                            <td>{appt.userEmail}</td>
                            <td>{appt.barber}</td>
                            <td>{appt.service} <br/><span className="sub-text">₱{appt.price}</span></td>
                            <td>
                              <span className={`status-badge ${appt.status?.toLowerCase() || 'pending'}`}>
                                {appt.status || 'Pending'}
                              </span>
                            </td>
                            <td className="action-cell">
                              {appt.status !== 'Completed' && appt.status !== 'Declined' && (
                                <select 
                                  className="status-dropdown"
                                  value={appt.status || 'Confirmed'}
                                  onChange={(e) => handleUpdateStatus(appt.id, e.target.value)}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Declined">Decline</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- SERVICES VIEW --- */}
              {currentView === 'services' && (
                <div className="admin-section fade-in">
                  <div className="section-header">
                    <h2>Service Menu Management</h2>
                    <p>Add new cuts or remove old ones from your booking page.</p>
                  </div>
                  <div className="services-admin-grid">
                    <div className="admin-form-card">
                      {/* DYNAMIC TITLE */}
                      <h3>{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
                      <form onSubmit={handleServiceSubmit} className="admin-form">
                        <input type="text" placeholder="Service Name (e.g. Buzz Cut)" value={newService.serviceName} onChange={e => setNewService({...newService, serviceName: e.target.value})} required />
                        <input type="number" placeholder="Price (₱)" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} required />
                        <input type="text" placeholder="Duration (e.g. 45 Min)" value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})} required />
                        <input type="text" placeholder="Image URL (Optional)" value={newService.imageUrl} onChange={e => setNewService({...newService, imageUrl: e.target.value})} />
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className="btn-action accept" style={{ flex: 1 }}>
                            {editingServiceId ? 'SAVE CHANGES' : '+ ADD SERVICE'}
                          </button>
                          
                          {/* SHOW CANCEL BUTTON IF EDITING */}
                          {editingServiceId && (
                            <button type="button" className="btn-action edit" onClick={handleCancelEdit}>
                              CANCEL
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                    
                    <div className="services-list">
                      {services.map(srv => (
                        <div className="admin-service-card" key={srv.id}>
                          <div className="srv-info">
                            <h4>{srv.serviceName || srv.name}</h4>
                            <p>₱{srv.price} | {srv.duration}</p>
                          </div>
                          {/* ADDED EDIT BUTTON HERE */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-action edit" onClick={() => handleEditClick(srv)}>Edit</button>
                            <button className="btn-action decline" onClick={() => handleDeleteService(srv.id)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- CLIENTS VIEW --- */}
              {currentView === 'clients' && (
                <div className="admin-section fade-in">
                  <div className="section-header">
                    <h2>Client Database</h2>
                    <p>View registered users from your website.</p>
                  </div>
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 && <tr><td colSpan="3" className="empty-text">No clients found.</td></tr>}
                        {clients.map((client) => (
                          <tr key={client.id}>
                            <td className="bold-text">{client.firstName} {client.lastName}</td>
                            <td>{client.email}</td>
                            <td>{client.phone || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: DASHBOARD STATS */}
            <aside className="admin-sidebar fade-in">
              <div className="stat-card">
                <h3>Action Needed</h3>
                <div className="stat-value highlight">{pendingBookings}</div>
                <p>Pending Appointments</p>
              </div>

              <div className="stat-card">
                <h3>Total Revenue</h3>
                <div className="stat-value">₱{totalRevenue}</div>
                <p>From Completed Cuts</p>
              </div>

              <div className="stat-card">
                <h3>Client Base</h3>
                <div className="stat-value">{clients.length}</div>
                <p>Registered Users</p>
              </div>

              <div className="stat-card">
                <h3>Services Offered</h3>
                <div className="stat-value">{services.length}</div>
                <p>Active Menu Items</p>
              </div>
            </aside>

          </div>
        )}
      </main>
    </div>
  );
}

export default AdminSite;