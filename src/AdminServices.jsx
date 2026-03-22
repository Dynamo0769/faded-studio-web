import React, { useState, useEffect } from "react";
import { db } from "./firebase"; // Make sure this path is correct!
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import "./AdminServices.css"; // We will create this next

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [activeService, setActiveService] = useState(null); // The service currently being edited

  // Fetch services from Firebase when the page loads
  const fetchServices = async () => {
    const querySnapshot = await getDocs(collection(db, "services"));
    const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setServices(servicesData);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle Form Inputs
  const handleChange = (e) => {
    setActiveService({ ...activeService, [e.target.name]: e.target.value });
  };

  // Save (Add or Update) to Firebase
  const handleSave = async (e) => {
    e.preventDefault();
    if (activeService.id) {
      // Update existing
      const serviceRef = doc(db, "services", activeService.id);
      await updateDoc(serviceRef, activeService);
    } else {
      // Add new
      await addDoc(collection(db, "services"), activeService);
    }
    setActiveService(null); // Close the form
    fetchServices(); // Refresh the list
  };

  // Delete from Firebase
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this service?")) {
      await deleteDoc(doc(db, "services", id));
      setActiveService(null);
      fetchServices();
    }
  };

  return (
    <div className="admin-services-container">
      {/* LEFT PANEL: Services List */}
      <div className="services-list-panel">
        <div className="panel-header">
          <h2>Services</h2>
          <button 
            className="btn-gold-full"
            onClick={() => setActiveService({ name: "", detail: "", price: "", duration: "", image: "" })}
          >
            + Add new service
          </button>
        </div>

        <div className="services-scroll">
          {services.map((srv) => (
            <div className="service-admin-card" key={srv.id}>
              <img src={srv.image || "https://via.placeholder.com/300x150?text=No+Image"} alt="service" />
              <div className="card-content">
                <p className="service-detail-text">{srv.detail || srv.name}</p>
                <div className="card-actions">
                  <span className="price-tag">₱ {srv.price}</span>
                  <button className="btn-edit-remove" onClick={() => setActiveService(srv)}>
                    Edit/Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && <p style={{color: '#888', marginTop: '20px'}}>No services added yet.</p>}
        </div>
      </div>

      {/* RIGHT PANEL: Edit Form (Only shows if activeService is not null) */}
      {activeService && (
        <div className="service-edit-panel">
          <div className="edit-header">
            <span className="back-arrow" onClick={() => setActiveService(null)}>←</span>
            <h2>{activeService.id ? "Edit service" : "Add service"}</h2>
          </div>

          <form className="edit-form" onSubmit={handleSave}>
            <label>Name</label>
            <input type="text" name="name" value={activeService.name} onChange={handleChange} required />

            <label>Detail</label>
            <textarea name="detail" rows="3" value={activeService.detail} onChange={handleChange} required></textarea>

            <label>Price</label>
            <input type="number" name="price" value={activeService.price} onChange={handleChange} required />

            <label>Duration</label>
            <input type="text" name="duration" placeholder="e.g. 1 hr" value={activeService.duration} onChange={handleChange} required />

            <label>Image URL</label>
            <input type="text" name="image" placeholder="Paste an image link here" value={activeService.image} onChange={handleChange} />
            
            {activeService.image && (
                <img src={activeService.image} alt="preview" className="image-preview" />
            )}

            <div className="form-buttons">
              <button type="submit" className="btn-gold-full">Save Service</button>
              {activeService.id && (
                <button type="button" className="btn-danger" onClick={() => handleDelete(activeService.id)}>
                  Delete Service
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}