import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import './UserSite.css'; 

function UserSite() {
  const [currentView, setCurrentView] = useState('home'); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [booking, setBooking] = useState({ barber: 'Master Jay', service: 'Premium Haircut', date: '', time: '' });
  const [msg, setMsg] = useState('');

  // FIREBASE AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  // AUTH FUNCTIONS 
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      
      // Save to your Firestore Database
      await setDoc(doc(db, "Users", userCredential.user.uid), {
        email: authData.email,
        firstName: `${authData.firstName} ${authData.lastName}`,
        userType: "Client",
        uid: userCredential.user.uid
      });

      setMsg(""); setCurrentView('home'); setDropdownOpen(false);
      alert("SUCCESS! Account created and linked to database.");
    } catch (err) { setMsg(err.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, authData.email, authData.password);
      setMsg(""); setCurrentView('home'); setDropdownOpen(false);
    } catch (err) { setMsg("Invalid credentials."); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false); setCurrentView('home');
  };

  // BOOKING FUNCTION
  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) return setMsg("Please sign in to book.");
    
    setMsg("Checking availability...");
    const q = query(collection(db, "bookings"), where("barber", "==", booking.barber), where("date", "==", booking.date), where("time", "==", booking.time));
    try {
      const snap = await getDocs(q);
      if (!snap.empty) return setMsg(`Slot taken! ${booking.barber} is booked.`);
      
      await addDoc(collection(db, "bookings"), { ...booking, clientEmail: user.email, status: "Pending" });
      setMsg("APPOINTMENT CONFIRMED!");
    } catch (err) { setMsg("System Error."); }
  };

  return (
    <div className="user-site luxury-site" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header className="site-header">
        <div className="logo" style={{cursor: 'pointer'}} onClick={() => setCurrentView('home')}>
          FADEDSTUDIO
        </div>
        
        <div className="header-center">
          <span>✕</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn">
            🛒 <span className="cart-badge">1</span>
          </button>
          
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              👤
            </button>
            
            {/* DYNAMIC DROPDOWN */}
            {dropdownOpen && (
              <div className="profile-dropdown">
                {user && (
                  <p>Signed in as:<br/>
                    <span style={{color: 'white', marginTop: '5px', display: 'block'}}>{user.email}</span>
                  </p>
                )}
                
                {!user ? (
                  <>
                    <button className="dropdown-link" onClick={() => {setCurrentView('login'); setDropdownOpen(false);}}>SIGN IN</button>
                    <button className="dropdown-link" onClick={() => {setCurrentView('register'); setDropdownOpen(false);}}>CREATE ACCOUNT</button>
                  </>
                ) : (
                  <>
                    <button className="dropdown-link" onClick={() => {setCurrentView('book'); setDropdownOpen(false);}}>BOOK APPOINTMENT</button>
                    <button className="dropdown-link" onClick={handleLogout}>SIGN OUT</button>
                  </>
                )}
                <button className="dropdown-link">BOOKINGS</button>
                <button className="dropdown-link">MY ACCOUNT</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HOME PAGE VIEW */}
      {currentView === 'home' && (
        <>
          <section className="hero-section"></section>
          
          <section className="services-banner">
            <h1>Expert Hair Styling Services</h1>
            <p>Transform your look with our skilled barbers today!</p>
            <div className="banner-logo">FS</div>
          </section>

          <section className="middle-section" style={{padding: '50px 20px', textAlign: 'center'}}>
            <p className="section-label" style={{letterSpacing: '2px', color: '#666'}}>ABOUT FADEDSTUDIO</p>
            <div className="philosophy-box" style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px'}}>
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600" alt="Tools" style={{width: '300px', borderRadius: '4px'}}/>
              <div className="philosophy-text" style={{maxWidth: '400px', textAlign: 'left'}}>
                <h3 style={{fontWeight: '300'}}>Our Philosophy</h3>
                <p style={{lineHeight: '1.6', color: '#555'}}>At Fadedstudio, we believe that beautiful hair starts with healthy hair. That's why we use only the best products and techniques to ensure that your hair is healthy, strong, and vibrant.</p>
              </div>
            </div>

            <p className="section-label" style={{marginTop: '80px', letterSpacing: '2px', color: '#666'}}>ONLINE APPOINTMENTS</p>
            <div className="appointment-card" style={{marginTop: '30px', border: '1px solid #eee', padding: '20px', display: 'inline-block'}}>
              <img src="https://images.unsplash.com/photo-1621605815844-8da76af5b796?w=400" alt="Premium Haircut" style={{width: '200px'}}/>
              <div className="card-info" style={{marginTop: '15px'}}>
                <h4>Premium Haircut</h4>
                <p>1 hr | ₱500</p>
                <button style={{padding: '10px 20px', background: '#111', color: 'white', border: 'none', cursor: 'pointer'}} onClick={() => setCurrentView(user ? 'book' : 'login')}>BOOK NOW</button>
              </div>
            </div>
          </section>

          <section className="contact-map-section" style={{display: 'flex', padding: '50px', background: '#f9f9f9'}}>
            <div className="contact-info" style={{flex: 1, paddingRight: '40px', textAlign: 'left'}}>
              <p className="section-label">CONTACT US</p>
              <h4>Fadedstudio</h4>
              <p>East Sabellano Street, Cebu City, Philippines.</p>
              <p>+639622096953</p>
            </div>
            <div className="map-container" style={{flex: 1, height: '300px', background: '#e0e0e0'}}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.3662057319983!2d123.8828945!3d10.312678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDE4JzQ1LjYiTiAxMjPCsDUzJzEwLjQiRQ!5e0!3m2!1sen!2sph!4v1620000000000!5m2!1sen!2sph" width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy"></iframe>
            </div>
          </section>

          {/* RESTORED NEWSLETTER SECTION */}
          <section className="newsletter-section" style={{textAlign: 'center', padding: '60px 20px', background: 'white'}}>
            <p className="section-label" style={{letterSpacing: '2px', color: '#666'}}>SOCIAL</p>
            <div className="ig-icon" style={{margin: '20px 0'}}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" width="30"/>
            </div>
            <h2 className="cutting-edge-text" style={{fontWeight: '300', fontSize: '2rem'}}>Stay on the cutting-edge</h2>
            <p className="newsletter-sub" style={{color: '#666', marginBottom: '30px'}}>Sign up to hear from us about specials, sales, events, and fashion tips.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()} style={{display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap'}}>
              <input type="email" placeholder="Email Address" required style={{padding: '10px', width: '250px', border: '1px solid #ccc'}} />
              <button type="submit" style={{padding: '10px 20px', background: 'white', color: '#111', border: '1px solid #111', cursor: 'pointer'}}>— SIGN UP —</button>
            </form>
          </section>
        </>
      )}

      {/* AUTHENTICATION & BOOKING VIEWS */}
      {currentView === 'register' && (
        <section className="auth-page" style={{paddingTop: '120px', textAlign: 'center', flex: 1}}>
          <div className="auth-container" style={{maxWidth: '400px', margin: '0 auto'}}>
            <h1 style={{fontWeight: '300'}}>CREATE ACCOUNT</h1>
            <form onSubmit={handleRegister} className="minimal-form" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input type="text" placeholder="First name" required onChange={e => setAuthData({...authData, firstName: e.target.value})} style={{padding: '12px'}}/>
              <input type="text" placeholder="Last name" required onChange={e => setAuthData({...authData, lastName: e.target.value})} style={{padding: '12px'}}/>
              <input type="email" placeholder="Email" required onChange={e => setAuthData({...authData, email: e.target.value})} style={{padding: '12px'}}/>
              <input type="password" placeholder="Password" required onChange={e => setAuthData({...authData, password: e.target.value})} style={{padding: '12px'}}/>
              <button type="submit" style={{padding: '15px', background: '#111', color: 'white', border: 'none'}}>— CREATE ACCOUNT —</button>
              {msg && <p style={{color: 'red'}}>{msg}</p>}
            </form>
            <p style={{marginTop: '20px', cursor: 'pointer', color: '#666'}} onClick={() => setCurrentView('login')}>Already have an account? Sign in</p>
          </div>
        </section>
      )}

      {currentView === 'login' && (
        <section className="auth-page" style={{paddingTop: '120px', textAlign: 'center', flex: 1}}>
          <div className="auth-container" style={{maxWidth: '400px', margin: '0 auto'}}>
            <h1 style={{fontWeight: '300'}}>ACCOUNT SIGN IN</h1>
            <form onSubmit={handleLogin} className="minimal-form" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input type="email" placeholder="Email" required onChange={e => setAuthData({...authData, email: e.target.value})} style={{padding: '12px'}}/>
              <input type="password" placeholder="Password" required onChange={e => setAuthData({...authData, password: e.target.value})} style={{padding: '12px'}}/>
              <button type="submit" style={{padding: '15px', background: '#111', color: 'white', border: 'none'}}>— SIGN IN —</button>
              {msg && <p style={{color: 'red'}}>{msg}</p>}
            </form>
            <p style={{marginTop: '20px', cursor: 'pointer', color: '#666'}} onClick={() => setCurrentView('register')}>Not a member? Create account.</p>
          </div>
        </section>
      )}

      {currentView === 'book' && (
        <section className="auth-page" style={{paddingTop: '120px', textAlign: 'center', flex: 1}}>
          <div className="auth-container" style={{maxWidth: '400px', margin: '0 auto'}}>
            <h1 style={{fontWeight: '300'}}>RESERVE YOUR CHAIR</h1>
            <form onSubmit={handleBook} className="minimal-form" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <select onChange={e => setBooking({...booking, barber: e.target.value})} style={{padding: '12px'}}><option>Master Jay</option><option>Admin Ace</option></select>
              <select onChange={e => setBooking({...booking, service: e.target.value})} style={{padding: '12px'}}><option>Premium Haircut</option><option>Signature Fade</option></select>
              <input type="date" required onChange={e => setBooking({...booking, date: e.target.value})} style={{padding: '12px'}}/>
              <select required onChange={e => setBooking({...booking, time: e.target.value})} style={{padding: '12px'}}><option value="">Select Time</option><option>09:00 AM</option><option>01:00 PM</option></select>
              <button type="submit" style={{padding: '15px', background: '#111', color: 'white', border: 'none'}}>— CONFIRM BOOKING —</button>
              {msg && <p style={{color: 'red'}}>{msg}</p>}
            </form>
          </div>
        </section>
      )}

      {/* RESTORED FOOTER */}
      <footer className="luxury-footer" style={{background: '#222', color: '#aaa', textAlign: 'center', padding: '20px', fontSize: '0.8rem', letterSpacing: '1px', marginTop: 'auto'}}>
        <p>COPYRIGHT © 2026 FADEDSTUDIO - ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

export default UserSite;