const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const msal = require("@azure/msal-node");
const {defineString, defineSecret} = require("firebase-functions/params");

admin.initializeApp();

// Define configuration parameters. The values will be loaded from the environment.
const POWERBI_CLIENT_ID = defineString("POWERBI_CLIENT_ID");
const POWERBI_TENANT_ID = defineString("POWERBI_TENANT_ID");
const POWERBI_CLIENT_SECRET = defineSecret("POWERBI_CLIENT_SECRET");

// Export the function and explicitly grant it access to the defined secrets.
exports.getPowerBiEmbedToken = functions.https.onRequest(
  { secrets: [POWERBI_CLIENT_SECRET] },
  async (req, res) => {
    // Set CORS headers to allow requests from your web app
    res.set("Access-Control-Allow-Origin", "https://hecht.app");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // --- SECURE: Credentials are now loaded via parameters ---
    const config = {
      auth: {
        clientId: POWERBI_CLIENT_ID.value(),
        authority: `https://login.microsoftonline.com/${POWERBI_TENANT_ID.value()}`,
        clientSecret: POWERBI_CLIENT_SECRET.value(),
      },
    };
    
    const cca = new msal.ConfidentialClientApplication(config);

    // --- SECURE: Verify the user is authenticated with Firebase ---
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        console.error('No Firebase ID token was passed.');
        res.status(403).send('Unauthorized');
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
        return;
    }

    const {reportId, groupId, datasetId} = req.body;
    if (!reportId || !groupId || !datasetId) {
      res.status(400).send("Missing reportId, groupId, or datasetId in request body.");
      return;
    }

    try {
      const authResponse = await cca.acquireTokenByClientCredential({
        scopes: ["https://analysis.windows.net/powerbi/api/.default"],
      });

      if (!authResponse.accessToken) {
        throw new Error("Failed to acquire Power BI API access token.");
      }

      const apiUrl = `https://api.powerbi.com/v1.0/myorg/GenerateToken`;
      const embedTokenResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authResponse.accessToken}`,
        },
        body: JSON.stringify({
          datasets: [{ id: datasetId }],
          reports: [{ id: reportId }],
          targetWorkspaces: [{ id: groupId }]
        }),
      });

      if (!embedTokenResponse.ok) {
        const errorText = await embedTokenResponse.text();
        throw new Error(`Power BI API error: ${errorText}`);
      }

      const embedTokenData = await embedTokenResponse.json();
      const embedUrl = `https://app.fabric.microsoft.com/reportEmbed?reportId=${reportId}&groupId=${groupId}`;
      
      res.status(200).send({
        accessToken: embedTokenData.token,
        embedUrl: embedUrl,
        reportId: reportId,
      });
    } catch (error) {
      console.error("Error generating Power BI embed token:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
