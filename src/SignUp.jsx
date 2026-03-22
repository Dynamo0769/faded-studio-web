import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth success for:", user.uid);

      // 2. SAVE TO FIRESTORE (Using your specific field names)
      await setDoc(doc(db, "Users", user.uid), {
        email: email,
        firstName: `${firstName} ${lastName}`,
        userType: "Client",
        uid: user.uid
      });

      alert('SUCCESS! You are now in the Auth AND Database list!');
      
    } catch (err) {
      console.error("Error Detail:", err);
      alert('FAILED: ' + err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>CREATE ACCOUNT</h1>
        <form className="minimal-form" onSubmit={handleSignUp}>
          <input type="text" placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} required />
          <input type="text" placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} required />
          <input type="email" placeholder="New Email (Not used yet)" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="black-btn">— CREATE ACCOUNT —</button>
        </form>
      </div>
    </div>
  );
}