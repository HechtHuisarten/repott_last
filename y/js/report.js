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

const your_function_url = "https://getpowerbiembedtoken-6mmrfrt2gq-uc.a.run.app";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const logoutButton = document.getElementById('logoutButton');
const userInfo = document.getElementById('userInfo');
const reportContainer = document.getElementById('reportContainer');

logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        // On successful sign-out, redirect to the login page
        window.location.href = 'index.html';
    }).catch((error) => console.error("Sign-out error", error));
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        userInfo.textContent = `Welcome, ${user.displayName}`;

        // Get report details from the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const report = {
            reportId: urlParams.get('reportId'),
            groupId: urlParams.get('groupId'),
            datasetId: urlParams.get('datasetId'),
            name: urlParams.get('name')
        };

        // Check if we have the necessary details to load a report
        if (report.reportId && report.groupId) {
            loadSecureReport(user, report);
        } else {
            // If report details are missing, show an error
            console.error("Report details not found in URL.");
            reportContainer.innerHTML = `<div class="text-center text-danger"><h3>Error</h3><p>Report information is missing. Please select a report from the previous page.</p></div>`;
        }
    } else {
        // No user is signed in. Redirect to login.
        console.log("No user found, redirecting to login page.");
        window.location.href = 'index.html';
    }
});

async function loadSecureReport(user, report) {
    reportContainer.innerHTML = `<div class="loader"></div>`;
    reportContainer.style.alignItems = 'center';

    try {
        const idToken = await user.getIdToken();
        const payload = {
            reportId: report.reportId,
            groupId: report.groupId,
            datasetId: report.datasetId 
        };

        const response = await fetch(your_function_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error from backend: ${await response.text()}`);
        }
        
        const embedData = await response.json();
        
        const embedReportWhenReady = () => {
            if (window.powerbi) {
                const models = window['powerbi-client'].models;
                const embedConfig = {
                    type: 'report',
                    id: embedData.reportId,
                    embedUrl: embedData.embedUrl,
                    accessToken: embedData.accessToken,
                    tokenType: models.TokenType.Embed,
                    settings: { panes: { filters: { expanded: false, visible: true }, navContentPane: { visible: false } } }
                };
                const reportContainerElement = document.getElementById('reportContainer');
                reportContainerElement.style.alignItems = 'stretch';
                powerbi.embed(reportContainerElement, embedConfig);
            } else {
                setTimeout(embedReportWhenReady, 100);
            }
        };
        embedReportWhenReady();
    } catch (error) {
        console.error('Failed to embed report:', error);
        reportContainer.innerHTML = `<div class="text-center text-danger"><h3>Error</h3><p>Could not load the report.</p></div>`;
    }
}
