import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// --- THIS IS THE CORRECT STRUCTURE ---
// 1. Define all your available reports in one place.
const allReports = [
    { 
        name: 'Huisartsenpraktijk De Louwesweg', 
        description: 'Toegang: Eigenaar', 
        groupId: '7d4bf04a-9199-4165-b961-9a0d56d1fede', 
        reportId: 'e8bfdadf-b503-4658-a90d-722d9d66a216', 
        datasetId: 'd92e1d9c-299f-415b-8d89-d6cc443dbbb7' 
    },
    { 
        name: 'Huisartsenpraktijk De Westertoren', 
        description: 'Toegang: Eigenaar', 
        groupId: '978fe105-1e01-4c29-826f-8122d2c0556d',
        reportId: 'eb0d7372-63b8-4896-ab76-abe57abf1803',
        datasetId: '66455fa6-5d4a-4fe9-9ae4-00c0cf469a8a' // <-- Updated
    },
    { 
        name: 'Huisartsenpraktijk De Zwaansvliet', 
        description: 'Toegang: Gast', 
        groupId: 'GROUP_ID_3', // Replace with actual Group ID
        reportId: 'REPORT_ID_3', // Replace with actual Report ID
        datasetId: 'DATASET_ID_3' // Replace with actual Dataset ID
    }
];

// 2. Assign the list of reports to each user.
const userReportMap = {
    'rflores@hechtcare.nl': allReports,
    'eldewaard@hechtcare.nl': allReports,
    'gmackay@hechtcare.nl': allReports,
    'bi@hechtcare.nl': allReports
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Logout Button Functionality ---
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth).catch(error => console.error("Sign out error:", error));
        // The onAuthStateChanged listener below will handle redirecting the user.
    });
}

onAuthStateChanged(auth, (user) => {
    const usernameSpan = document.getElementById('username');
    const reportListContainer = document.querySelector('.report-list-container');

    if (user) {
        if (user.displayName) {
            const firstName = user.displayName.split(' ')[0];
            usernameSpan.textContent = firstName;
        } else {
            usernameSpan.textContent = 'User';
        }

        const userReports = userReportMap[user.email.toLowerCase()];

        if (userReports && userReports.length > 0) {
            showReportSelection(userReports);
        } else {
            showAccessDenied(user, reportListContainer);
        }
    } else {
        // If user is not logged in (or has just logged out), redirect to login page.
        window.location.href = 'index.html';
    }
});

function showReportSelection(reports) {
    const reportListContainer = document.querySelector('.report-list-container');
    reportListContainer.innerHTML = ''; // This line erases the hardcoded HTML

    reports.forEach(report => {
        const reportUrl = `report.html?reportId=${report.reportId}&groupId=${report.groupId}&datasetId=${report.datasetId}&name=${encodeURIComponent(report.name)}`;
        const card = document.createElement('a');
        card.href = reportUrl;
        card.className = 'report-card';
        card.innerHTML = `
            <div class="report-card-text">
                <h2 class="report-card-title">${report.name}</h2>
                <p class="report-card-description">${report.description || 'Click to view the report.'}</p>
            </div>
        `;
        reportListContainer.appendChild(card);
    });
}

function showAccessDenied(user, container) {
    console.warn(`Access denied for user: ${user.email}`);
    container.innerHTML = `
        <div style="text-align: center; color: #5f6368; background-color: #fff; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color);">
            <h3>Access Denied</h3>
            <p>Your email address (<strong>${user.email}</strong>) is not authorized to view any reports.</p>
        </div>
    `;
}
