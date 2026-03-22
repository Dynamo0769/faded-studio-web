import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import './UserSite.css';

function UserSite() {
  // --- UI STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // --- BOOKING STATE ---
  const [activeView, setActiveView] = useState('services'); // 'services' or 'booking'
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // High-quality placeholder images for the gallery
  const galleryImages = [
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1593702284287-418d182fd9ff?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1598908314732-07113901949b?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200"
  ];

  const servicesList = [
    { id: 1, name: 'Premium Haircut', duration: '1 hr', price: '₱500', img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800', desc: 'Experience a top-tier haircut by our expert stylists for a fresh, stylish look.' },
    { id: 2, name: 'Signature Fade', duration: '1 hr', price: '₱400', img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800', desc: 'Precision fading tailored to your head shape for a sharp, clean finish.' },
    { id: 3, name: 'Buzz Cut', duration: '45 min', price: '₱350', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800', desc: 'A clean, uniform buzz cut completed with crisp line-ups.' },
    { id: 4, name: 'Beard Trim & Sculpt', duration: '30 min', price: '₱250', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800', desc: 'Detailed beard grooming, shaping, and a relaxing hot towel finish.' }
  ];

  const allTimes = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ];

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // Gallery Auto-Slide Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGalleryIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  // Fetch Booked Slots
  useEffect(() => {
    if (activeView === 'booking') {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate, activeView]);

  const fetchAvailableTimes = async (dateObj) => {
    setIsLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateString = dateObj.toISOString().split('T')[0];
      const q = query(collection(db, 'Appointments'), where('date', '==', dateString));
      const querySnapshot = await getDocs(q);
      
      const booked = [];
      querySnapshot.forEach((doc) => booked.push(doc.data().time));
      setBookedSlots(booked);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
    setIsLoadingSlots(false);
  };

  const handleBookClick = (service) => {
    setSelectedService(service);
    setActiveView('booking');
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      alert("Please sign in to book an appointment.");
      return window.location.href = '/signup';
    }
    if (!selectedTime) return alert("Please select a time slot.");

    setIsBooking(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      await addDoc(collection(db, 'Appointments'), {
        service: selectedService.name,
        price: selectedService.price,
        date: dateString,
        time: selectedTime,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'Confirmed',
        createdAt: serverTimestamp()
      });
      
      setBookingSuccess(true);
      fetchAvailableTimes(selectedDate);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book appointment.");
    }
    setIsBooking(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
  };

  const scrollToServices = () => {
    document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' });
  };

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = selectedDate.toLocaleString('default', { month: 'long' });

  const renderCalendar = () => {
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const headers = weekDays.map(day => <div key={day} className="cal-header">{day}</div>);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const isPast = dateObj < today;
      const isSelected = dateObj.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={d} 
          className={`cal-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
          onClick={() => !isPast && setSelectedDate(dateObj)}
        >
          {d}
        </div>
      );
    }

    return (
      <div className="calendar-widget">
        <div className="cal-month-title">
          <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}>&lt;</button>
          <span>{monthName} {currentYear}</span>
          <button onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}>&gt;</button>
        </div>
        <div className="cal-grid">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="user-site">
      {/* HEADER */}
      <header className="site-header">
        <div className="logo">FADEDSTUDIO</div>
        
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-badge">2</span>
          </button>
          
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="profile-dropdown">
                {currentUser ? (
                  <>
                    <p className="signed-in-text">Signed in as:<br/><strong>{currentUser.email}</strong></p>
                    <button className="dropdown-link">Bookings</button>
                    <button className="dropdown-link">My Account</button>
                    <button className="dropdown-link" onClick={handleLogout}>Sign Out</button>
                  </>
                ) : (
                  <>
                    <p className="signed-in-text">Welcome</p>
                    <button className="dropdown-link" onClick={() => window.location.href='/signup'}>Sign In / Register</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section"></section>

      {/* SERVICES BANNER */}
      <section className="services-banner">
        <h2>Expert Hair Styling Services</h2>
        <p>Transform your look with our skilled barbers today!</p>
        <button className="btn-primary" onClick={scrollToServices}>— BOOK YOUR APPOINTMENT —</button>
        <div className="banner-logo-circle">FS</div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-section">
        <h3 className="section-title">ABOUT FADEDSTUDIO</h3>
        <div className="about-grid">
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800" alt="Barber Tools" />
          </div>
          <div className="about-text">
            <h4>Our Philosophy</h4>
            <p>At Fadedstudio, we believe that beautiful hair starts with healthy hair. That's why we use only the best products and techniques to ensure that your hair is healthy, strong, and vibrant. We also believe that every client is unique, and we strive to create a personalized experience that meets your individual needs.</p>
          </div>
        </div>
      </section>

      {/* ONLINE APPOINTMENTS SECTION (Integrated) */}
      <section id="services-section" className="booking-section">
        <h3 className="section-title">ONLINE APPOINTMENTS</h3>
        
        {activeView === 'services' ? (
          <div className="services-grid">
            {servicesList.map(service => (
              <div className="service-card" key={service.id}>
                <img src={service.img} alt={service.name} className="service-img" />
                <div className="service-info">
                  <h4>{service.name}</h4>
                  <p className="service-meta">{service.duration} | {service.price}</p>
                  <button className="btn-outline-dark" onClick={() => handleBookClick(service)}>SELECT</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="booking-interface fade-in">
            <div className="booking-left">
              <button className="dropdown-link" style={{marginBottom: '20px'}} onClick={() => setActiveView('services')}>
                &larr; Back to services
              </button>
              
              {renderCalendar()}

              <div className="timeslot-container">
                {isLoadingSlots ? (
                  <p style={{textAlign: 'center', color: '#888'}}>Loading times...</p>
                ) : (
                  <div className="timeslot-split">
                    <div className="timeslot-column">
                      <h5>Morning</h5>
                      <div className="timeslot-grid">
                        {allTimes.slice(0, 7).map(time => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <button 
                              key={time} disabled={isBooked}
                              className={`time-btn ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                              onClick={() => setSelectedTime(time)}>
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="timeslot-column">
                      <h5>Afternoon</h5>
                      <div className="timeslot-grid">
                        {allTimes.slice(7).map(time => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <button 
                              key={time} disabled={isBooked}
                              className={`time-btn ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                              onClick={() => setSelectedTime(time)}>
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="booking-right">
              <div className="booking-summary-card">
                <h3>{selectedService.name}</h3>
                <p className="meta">{selectedService.duration} | {selectedService.price} (Pay later)</p>
                <img src={selectedService.img} alt={selectedService.name} className="detail-img" />
                <p className="desc">{selectedService.desc}</p>
                
                {bookingSuccess ? (
                  <div className="success-message">
                    <h4>Booking Confirmed!</h4>
                    <p>We'll see you on {selectedDate.toDateString()} at {selectedTime}.</p>
                    <button className="btn-primary" style={{width: '100%'}} onClick={() => setActiveView('services')}>Book Another</button>
                  </div>
                ) : (
                  <button 
                    className="btn-primary" 
                    style={{width: '100%', marginTop: '30px'}}
                    onClick={handleConfirmBooking}
                    disabled={!selectedTime || isBooking}
                  >
                    {isBooking ? 'Processing...' : 'CONFIRM BOOKING'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery-section">
        <h3 className="section-title">EXPLORE OUR STUNNING HAIRSTYLE TRANSFORMATIONS</h3>
        
        <div className="gallery-main" onClick={() => setCurrentGalleryIndex((p) => (p + 1) % galleryImages.length)}>
          <img 
            src={galleryImages[currentGalleryIndex]} 
            alt="Hairstyle Transformation" 
            className="gallery-active-img fade-in"
            key={currentGalleryIndex}
          />
          <div className="gallery-overlay-hint">Tap to see next</div>
        </div>

        <div className="gallery-thumbnails">
          {galleryImages.map((img, index) => (
            <img 
              key={index}
              src={img} 
              alt={`Thumbnail ${index + 1}`}
              className={currentGalleryIndex === index ? 'thumb active' : 'thumb'}
              onClick={() => setCurrentGalleryIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* REVIEWS PARALLAX BANNER */}
      <section className="reviews-banner">
        <h2>See what our clients are raving about!</h2>
        <button className="btn-outline-light">Reviews coming soon!</button>
      </section>

      {/* CONTACT & MAP SECTION */}
      <section className="contact-section">
        <div className="contact-info">
          <h3 className="section-title left-align">CONTACT US</h3>
          
          <div className="info-block">
            <h5>Fadedstudio</h5>
            <p>East Sabellano Street, Cebu City, 6000 Cebu, Philippines</p>
            <p>+63 9622036953</p>
          </div>

          <div className="info-block">
            <h5>Hours</h5>
            <p>Open today 10:00 am - 05:00 pm</p>
          </div>

          <button className="btn-outline-dark">— GET IN TOUCH —</button>
        </div>

        <div className="contact-map">
          {/* Replaced with an actual Google Maps Embed matching Cebu City */}
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.594738722442!2d123.8640700147963!3d10.294199992649035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a99c4b78db57ed%3A0xc319114f09cb8b9a!2sE%20Sabellano%20St%2C%20Cebu%20City%2C%20Cebu%2C%20Philippines!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus" 
            width="100%" 
            height="100%" 
            style={{ border: 0, minHeight: '350px', filter: 'grayscale(20%)' }} 
            allowFullScreen="" 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      {/* NEWSLETTER & FOOTER */}
      <footer className="site-footer">
        <div className="social-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
        </div>
        
        <h2>Stay on the cutting-edge</h2>
        <p className="newsletter-sub">Sign up to hear from us about specials, sales, events, and fashion tips.</p>
        
        <div className="newsletter-form">
          <input type="email" placeholder="Email Address" />
          <button className="btn-outline-dark">— SIGN UP —</button>
        </div>
      </footer>
      
      <div className="copyright-bar">
        COPYRIGHT © 2026 FADEDSTUDIO - ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}

export default UserSite;