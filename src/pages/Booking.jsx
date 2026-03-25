import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Ensure this path is correct for your project

export default function Booking() {
  // State to hold the form inputs
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleBook = async (e) => {
    e.preventDefault(); 
    
    const user = auth.currentUser;
    if (!user) {
      alert("Bro, you gotta sign in first to book an appointment!");
      return;
    }

    try {
      // Pushing the exact fields your database is expecting (Capital A for Appointments)
      await addDoc(collection(db, "Appointments"), {
        userId: user.uid,
        userEmail: user.email,
        service: service,          // e.g., "Signature Fade"
        date: date,                // e.g., "2026-03-25"
        time: time,                // e.g., "1:00 PM"
        price: "₱400",             // You can change this or make it dynamic later
        status: "Pending",
        createdAt: new Date()
      });
      
      alert("Success! Appointment booked successfully.");
      
      // Clear the form
      setService('');
      setDate('');
      setTime('');
      
    } catch (error) {
      console.error("FAILED TO SAVE APPOINTMENT: ", error);
      alert("Error saving appointment: " + error.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', minHeight: '60vh' }}>
      <h2>Book an Appointment</h2>
      <p>Logged in as: {auth.currentUser ? auth.currentUser.email : "Not signed in"}</p>
      
      <form onSubmit={handleBook} style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        
        {/* Service Input */}
        <input 
          type="text" 
          placeholder="Service Name (e.g., Signature Fade)" 
          value={service}
          onChange={(e) => setService(e.target.value)}
          required
          style={{ padding: '10px', width: '300px' }}
        />

        {/* Date Input */}
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={{ padding: '10px', width: '300px' }}
        />

        {/* Time Input */}
        <input 
          type="time" 
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          style={{ padding: '10px', width: '300px' }}
        />

        {/* Submit Button */}
        <button type="submit" className="btn-outline-dark" style={{ padding: '10px 30px', cursor: 'pointer', marginTop: '10px' }}>
          Confirm Booking
        </button>
      </form>
    </div>
  );
}