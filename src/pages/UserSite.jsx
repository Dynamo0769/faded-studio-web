import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import './UserSite.css';

function UserSite() {
  // --- UI STATE ---
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'createAccount', 'signIn'
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // --- FORM DATA STATE ---
  const [signUpData, setSignUpData] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- DYNAMIC DATA STATE ---
  const [servicesList, setServicesList] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [userAppointments, setUserAppointments] = useState([]);

  // --- BOOKING STATE ---
  const [activeView, setActiveView] = useState('services'); // 'services' or 'booking'
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRefCode, setBookingRefCode] = useState('');

  // High-quality placeholder images for the gallery
  const galleryImages = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1593702284287-418d182fd9ff?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1598908314732-07113901949b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200'
  ];

  const allTimes = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM'
  ];

  // --- FIREBASE FETCH: SERVICES ---
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Services"));
        const fetchedServices = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (fetchedServices.length === 0) {
           setServicesList([
             { id: 1, name: 'Signature Fade', duration: '45 Min', price: '450', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=500&q=60' },
             { id: 2, name: 'Classic Cut & Beard', duration: '60 Min', price: '600', imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=500&q=60' }
           ]);
        } else {
           setServicesList(fetchedServices);
        }
      } catch (error) {
        console.error("Error fetching services: ", error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // --- AUTOMATIC SLIDESHOW EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGalleryIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  // Fetch Booked Slots when Date Changes
  useEffect(() => {
    if (activeView === 'booking') {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate, activeView]);

  const fetchAvailableTimes = async (dateObj) => {
    setIsLoadingSlots(true);
    setSelectedTime(null);
    try {
      const offset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj - offset)).toISOString().split('T')[0];
      const q = query(collection(db, 'Appointments'), where('date', '==', localISOTime));
      const querySnapshot = await getDocs(q);
      const booked = [];
      querySnapshot.forEach((doc) => booked.push(doc.data().time));
      setBookedSlots(booked);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
    setIsLoadingSlots(false);
  };

  // --- AUTH FUNCTIONS ---
  const handleSignUpChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  const handleSignInChange = (e) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password);
      const user = userCredential.user;
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        phone: signUpData.phone,
        email: signUpData.email,
        createdAt: serverTimestamp()
      });
      setSignUpData({ firstName: '', lastName: '', email: '', password: '', phone: '' });
      setCurrentPage('home');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, signInData.email, signInData.password);
      setSignInData({ email: '', password: '' });
      setCurrentPage('home');
    } catch (error) {
      setAuthError('Invalid email or password.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
    setCurrentPage('home');
  };

  // --- BOOKING LOGIC ---
  const handleBookClick = (service) => {
    setSelectedService(service);
    setActiveView('booking');
    setBookingSuccess(false);
    setBookingRefCode('');
  };

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      alert("Please sign in to book an appointment.");
      return setCurrentPage('signIn');
    }
    if (!selectedTime) return alert("Please select a time slot.");

    setIsBooking(true);
    try {
      const offset = selectedDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(selectedDate - offset)).toISOString().split('T')[0];
      const docRef = await addDoc(collection(db, 'Appointments'), {
        service: selectedService.name,
        price: selectedService.price,
        date: localISOTime,
        time: selectedTime,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'Confirmed',
        createdAt: serverTimestamp()
      });
      const generatedCode = docRef.id.substring(0, 6).toUpperCase();
      setBookingRefCode(generatedCode);
      setBookingSuccess(true);
      fetchAvailableTimes(selectedDate);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book appointment.");
    }
    setIsBooking(false);
  };

  const fetchUserAppointments = async () => {
    if (!currentUser) return;
    setIsLoadingBookings(true);
    try {
      const q = query(collection(db, 'Appointments'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserAppointments(appointments);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
    }
    setIsLoadingBookings(false);
  };

  const handleNavClick = (view) => {
    setCurrentPage('home'); // Ensure we are on home page to show the main content area
    setActiveView(view);
    setDropdownOpen(false);
    if (view === 'bookingsList') {
      fetchUserAppointments();
    }
    setTimeout(() => {
      document.getElementById('main-content-area')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToServices = () => {
    if(currentPage !== 'home') setCurrentPage('home');
    setActiveView('services');
    setTimeout(() => {
      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
          <button aria-label="Previous Month" onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span>{monthName} {currentYear}</span>
          <button aria-label="Next Month" onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div className="cal-grid">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  // --- VIEW RENDERING FUNCTIONS ---

  // 1. HEADER (Dynamic Class fixes the white space issue)
  const renderHeader = () => (
    <header className={`site-header ${currentPage === 'home' ? 'header-transparent' : 'header-solid'}`}>
        <div className="logo" style={{cursor: 'pointer'}} onClick={() => setCurrentPage('home')}>FADEDSTUDIO</div>
        
        <div className="header-actions">
          {/* My Bookings Text Button replaces the Cart Icon */}
          {currentUser && (
            <button className="icon-btn my-bookings-nav-btn" onClick={() => handleNavClick('bookingsList')}>
              MY BOOKINGS
            </button>
          )}
          
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)} aria-label="Profile Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="profile-dropdown dark-theme fade-in">
                {!currentUser ? (
                  <>
                    <button className="dropdown-link" onClick={() => { setCurrentPage('signIn'); setDropdownOpen(false); }}>SIGN IN</button>
                    <button className="dropdown-link" onClick={() => { setCurrentPage('createAccount'); setDropdownOpen(false); }}>CREATE ACCOUNT</button>
                  </>
                ) : (
                  <>
                    <p className="signed-in-text">SIGNED IN AS:<br/><span>{currentUser.email}</span></p>
                    <button className="dropdown-link" onClick={handleLogout}>SIGN OUT</button>
                  </>
                )}
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-link" onClick={() => handleNavClick('bookingsList')}>BOOKINGS</button>
                <button className="dropdown-link" onClick={() => handleNavClick('account')}>MY ACCOUNT</button>
              </div>
            )}
          </div>
        </div>
    </header>
  );

  // 2. MAIN LANDING PAGE VIEW
  const renderMainPage = () => (
    <>
      <section className="hero-section hero-home">
        <div className="hero-overlay">
          <h1>ELEVATE YOUR STYLE</h1>
          <p>Premium grooming and styling in the heart of Cebu City.</p>
          <button className="btn-outline-light" onClick={scrollToServices}>BOOK AN APPOINTMENT</button>
        </div>
      </section>

      <section className="services-banner">
        <h2>Expert Hair Styling Services</h2>
        <p>Transform your look with our skilled barbers today!</p>
        <button className="btn-primary" onClick={scrollToServices}>— VIEW SERVICES —</button>
        <div className="banner-logo-circle">FS</div>
      </section>

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

      {/* DYNAMIC CONTENT AREA */}
      <section id="main-content-area" className="booking-section">
        
        {/* VIEW: SERVICES */}
        {activeView === 'services' && (
          <>
            <h3 className="section-title">ONLINE APPOINTMENTS</h3>
            {isLoadingServices ? (
              <p style={{ textAlign: 'center', margin: '50px 0', color: '#888' }}>Loading Premium Services...</p>
            ) : servicesList.length === 0 ? (
              <p style={{ textAlign: 'center', margin: '50px 0', color: '#888' }}>No services available at this time.</p>
            ) : (
              <div className="services-grid fade-in">
                {servicesList.map(service => (
                  <div className="service-card" key={service.id}>
                    <img src={service.imageUrl || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80"} alt={service.name} className="service-img" />
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p className="service-meta">{service.duration} | ₱{service.price}</p>
                      <button className="btn-outline-dark" onClick={() => handleBookClick(service)}>SELECT</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIEW: BOOKING INTERFACE */}
        {activeView === 'booking' && (
          <>
            <h3 className="section-title">CHOOSE A TIME</h3>
            <div className="booking-interface fade-in">
              <div className="booking-left">
                <button className="back-btn" onClick={() => setActiveView('services')}>← Back to services</button>
                {renderCalendar()}
                <div className="timeslot-container">
                  {isLoadingSlots ? (
                    <p style={{textAlign: 'center', color: '#888'}}>Checking availability...</p>
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
                  <p className="meta">{selectedService.duration} | ₱{selectedService.price} (Pay at shop)</p>
                  <img src={selectedService.imageUrl || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80"} alt={selectedService.name} className="detail-img" />
                  <p className="desc">{selectedService.detail || "Experience a top-tier cut by our expert styling team."}</p>
                  
                  {bookingSuccess ? (
                    <div className="success-message fade-in">
                      <div className="success-icon">✓</div>
                      <h4>Booking Confirmed!</h4>
                      <p>We'll see you on <strong>{selectedDate.toDateString()}</strong> at <strong>{selectedTime}</strong>.</p>
                      <div className="booking-code-box">
                        <small>BOOKING REF:</small>
                        <span>{bookingRefCode}</span>
                      </div>
                      <button className="btn-primary" style={{width: '100%'}} onClick={() => setActiveView('services')}>Book Another</button>
                    </div>
                  ) : (
                    <button 
                      className="btn-primary confirm-btn" 
                      onClick={handleConfirmBooking}
                      disabled={!selectedTime || isBooking}
                    >
                      {isBooking ? 'Processing...' : 'CONFIRM BOOKING'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW: MY BOOKINGS LIST */}
        {activeView === 'bookingsList' && (
          <div className="user-dashboard fade-in">
             <h3 className="section-title">MY BOOKINGS</h3>
             <div className="dashboard-card center-text">
                {!currentUser ? (
                  <>
                    <p>Please sign in to view your bookings.</p>
                    <button className="btn-primary" onClick={() => setCurrentPage('signIn')}>SIGN IN</button>
                  </>
                ) : isLoadingBookings ? (
                    <p>Loading your appointments...</p>
                ) : userAppointments.length === 0 ? (
                  <>
                    <p style={{color: '#666', marginBottom: '20px'}}>You have no upcoming appointments at the moment.</p>
                    <button className="btn-outline-dark" onClick={() => setActiveView('services')}>BOOK AN APPOINTMENT</button>
                  </>
                ) : (
                  <div className="dash-appointments-list">
                      {userAppointments.map((app, index) => (
                          <div className="dash-appointment-card" key={index}>
                              <div className="app-card-left">
                                  <span className="status-label">{app.status}</span>
                                  <h5>{app.service}</h5>
                                  <p>{app.price ? `₱${app.price}` : 'Price TBD'}</p>
                              </div>
                              <div className="app-card-right">
                                  <p className="app-date">{new Date(app.date).toDateString()}</p>
                                  <p className="app-time">{app.time}</p>
                              </div>
                              <p className="app-booking-code">Ref Code: <strong>{app.id.substring(0, 6).toUpperCase()}</strong></p>
                          </div>
                      ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* VIEW: MY ACCOUNT */}
        {activeView === 'account' && (
          <div className="user-dashboard fade-in">
             <h3 className="section-title">MY ACCOUNT</h3>
             <div className="dashboard-card">
                {!currentUser ? (
                  <div className="center-text">
                    <p>Please sign in to access your account details.</p>
                    <button className="btn-primary" onClick={() => setCurrentPage('signIn')}>SIGN IN</button>
                  </div>
                ) : (
                  <div className="account-details-block center-text">
                    <p><strong>Email Address:</strong><br/> {currentUser.email}</p>
                    <p><strong>Status:</strong> Active Member</p>
                    <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #eaeaea'}} />
                    <button className="btn-outline-dark" onClick={handleLogout}>SIGN OUT</button>
                  </div>
                )}
             </div>
          </div>
        )}
      </section>

      <section className="gallery-section">
        <h3 className="section-title">EXPLORE OUR STUNNING HAIRSTYLE TRANSFORMATIONS</h3>
        <div className="gallery-container">
          <div className="gallery-main">
            <button className="gallery-nav gallery-prev" onClick={() => setCurrentGalleryIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length)} aria-label="Previous Image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <img src={galleryImages[currentGalleryIndex]} alt="Transformation" className="gallery-active-img fade-in" key={currentGalleryIndex} />
            <button className="gallery-nav gallery-next" onClick={() => setCurrentGalleryIndex((prevIndex) => (prevIndex + 1) % galleryImages.length)} aria-label="Next Image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div className="gallery-dots">
            {galleryImages.map((_, index) => (
              <button key={index} className={`gallery-dot ${currentGalleryIndex === index ? 'active' : ''}`} onClick={() => setCurrentGalleryIndex(index)}></button>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-banner">
        <h2>See what our clients are raving about!</h2>
        <button className="btn-outline-light">Reviews coming soon</button>
      </section>

      <section className="contact-section">
        <div className="contact-info">
          <h3 className="section-title left-align">CONTACT US</h3>
          <div className="info-block">
            <h5>Fadedstudio</h5>
            <p>East Sabellano Street, Cebu City</p>
            <p>6000 Cebu, Philippines</p>
            <p>+63 962 203 6953</p>
          </div>
          <div className="info-block">
            <h5>Hours</h5>
            <p>Open Today: 10:00 AM - 05:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
          <button className="btn-outline-dark">— GET IN TOUCH —</button>
        </div>
        <div className="contact-map">
          <iframe 
            src="https://maps.google.com/maps?q=East%20Sabellano%20Street,%20Cebu%20City&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%" height="100%" style={{ border: 0, minHeight: '350px', filter: 'grayscale(30%) contrast(1.2)' }} 
            allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Location"
          ></iframe>
        </div>
      </section>
    </>
  );

  // 3. CREATE ACCOUNT PAGE
  const renderCreateAccountPage = () => (
    <div className="auth-page-container container-center fade-in">
        <h2 className="auth-title">CREATE ACCOUNT</h2>
        <p className="auth-subtitle">By creating an account, you may receive newsletters or promotions.</p>
        
        <form className="auth-form" onSubmit={handleSignUp}>
            {authError && <p className="error-message">{authError}</p>}
            
            <input type="text" name="firstName" placeholder="First name" value={signUpData.firstName} onChange={handleSignUpChange} required />
            <input type="text" name="lastName" placeholder="Last name" value={signUpData.lastName} onChange={handleSignUpChange} required />
            <input type="email" name="email" placeholder="Email" value={signUpData.email} onChange={handleSignUpChange} required />
            
            <div className="password-input-container">
              <input 
                type={isPasswordVisible ? 'text' : 'password'} 
                name="password" placeholder="Password (min 6 chars)" 
                value={signUpData.password} onChange={handleSignUpChange} required minLength={6} 
              />
              <button type="button" className="password-toggle" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </button>
            </div>

            <input type="tel" name="phone" placeholder="Phone (optional)" value={signUpData.phone} onChange={handleSignUpChange} />
            
            <button className="btn-primary" type="submit" style={{width: '100%'}}>— CREATE ACCOUNT —</button>
        </form>
        
        <button className="auth-link-text" onClick={() => setCurrentPage('signIn')}>
            Already have an account? Sign in
        </button>
          
        <p className="captcha-text">
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
        </p>
    </div>
  );

  // 4. SIGN IN PAGE
  const renderSignInPage = () => (
    <div className="auth-page-container container-center fade-in">
        <h2 className="auth-title">SIGN IN</h2>
        <p className="auth-subtitle">Enter your email and password to sign in.</p>
        
        <form className="auth-form" onSubmit={handleSignIn}>
            {authError && <p className="error-message">{authError}</p>}
            
            <input type="email" name="email" placeholder="Email" value={signInData.email} onChange={handleSignInChange} required />
            
            <div className="password-input-container">
              <input 
                type={isPasswordVisible ? 'text' : 'password'} 
                name="password" placeholder="Password" 
                value={signInData.password} onChange={handleSignInChange} required 
              />
              <button type="button" className="password-toggle" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            
            <button className="btn-primary" type="submit" style={{width: '100%'}}>— SIGN IN —</button>
        </form>
        
        <div className="auth-links-group">
            <button className="auth-link-text" onClick={() => alert("Password recovery requires Firebase configuration.")}>
              Forgot password?
            </button>
            <button className="auth-link-text" onClick={() => setCurrentPage('createAccount')}>
              Don't have an account? Create one
            </button>
        </div>
    </div>
  );

  return (
    <div className="user-site">
      {renderHeader()}

      {currentPage === 'home' && renderMainPage()}
      {currentPage === 'createAccount' && renderCreateAccountPage()}
      {currentPage === 'signIn' && renderSignInPage()}

      {/* FOOTER - Shared across all views */}
      <footer className="site-footer">
        <div className="social-icon">
           <a href="https://www.instagram.com/faded_studiocebu/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', display: 'flex' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
             </svg>
           </a>
        </div>
        <h2>Stay on the cutting-edge</h2>
        <p className="newsletter-sub">Sign up to hear from us about specials, styling tips, and events.</p>
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