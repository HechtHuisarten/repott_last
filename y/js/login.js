// ✅ Use the full CDN URLs for Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNuTT8cUd720SY6SrCvtlkBusnFmhqwLg",
    authDomain: "hecht-business-intelligence.firebaseapp.com",
    projectId: "hecht-business-intelligence",
    storageBucket: "hecht-business-intelligence.appspot.com",
    messagingSenderId: "102597066653",
    appId: "1:102597066653:web:c8008536c93e4241dfb974",
    measurementId: "G-KJV4MTT715"
};

// Initialize Firebase and get the Authentication service
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set up the Microsoft/Outlook authentication provider
const provider = new OAuthProvider('microsoft.com');

// Get references to the HTML elements
const loginButton = document.getElementById('loginButton');
const loader = document.getElementById('loader');

// Add an event listener to the login button
loginButton.addEventListener('click', () => {
    loginButton.classList.add('hidden');
    loader.classList.remove('hidden');

    // Start the sign-in process when the button is clicked
    signInWithPopup(auth, provider)
        .then((result) => {
            // Successful sign-in will trigger the redirect in onAuthStateChanged
            console.log("Sign-in successful for:", result.user.displayName);
        })
        .catch((error) => {
            // Handle any errors during sign-in
            console.error("Authentication Error:", error);
            alert(`Sign-in failed: ${error.message}`);
            
            // Show the login button again if sign-in fails
            loginButton.classList.remove('hidden');
            loader.classList.add('hidden');
        });
});

// Listen for changes in the user's sign-in state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // If a user is logged in, redirect them to the selection page.
        // The selection page will handle fetching their name and reports.
        window.location.href = 'select-report.html';
    } else {
        // If no user is logged in, make sure the login UI is visible
        console.log("No user is logged in.");
        loginButton.classList.remove('hidden');
        loader.classList.add('hidden');
    }
});
