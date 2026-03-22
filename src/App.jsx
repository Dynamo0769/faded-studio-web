import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserSite from './pages/UserSite';
import AdminSite from './pages/AdminSite';
// We fixed this line right here! It now looks in the same folder instead of /pages
import SignUp from './SignUp'; 
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Client Side */}
        <Route path="/" element={<UserSite />} />
        
        {/* Sign Up Page */}
        <Route path="/signup" element={<SignUp />} />
        
        {/* System Admin Side */}
        <Route path="/admin" element={<AdminSite />} />
      </Routes>
    </Router>
  );
}

export default App;