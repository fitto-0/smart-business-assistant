/**
 * Google Sheets Integration Service
 * Handles Google Sheets API connections, data export, and sync
 */

const { google } = require('googleapis');

let oauth2Client = null;

/**
 * Initialize Google OAuth2 client
 */
const initOAuth2 = () => {
  if (oauth2Client) {
    return oauth2Client;
  }

  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
};

/**
 * Get authorization URL for Google OAuth
 */
const getAuthUrl = () => {
  const client = initOAuth2();
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return url;
};

/**
 * Exchange authorization code for tokens
 */
const getTokens = async (code) => {
  try {
    const client = initOAuth2();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    return { success: true, tokens };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Set credentials from stored tokens
 */
const setCredentials = (tokens) => {
  const client = initOAuth2();
  client.setCredentials(tokens);
  return client;
};

/**
 * Create a new Google Sheet
 */
const createSheet = async (title, tokens) => {
  try {
    const client = setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    return { success: true, spreadsheetId: response.data.spreadsheetId, url: response.data.spreadsheetUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Append data to a sheet
 */
const appendData = async (spreadsheetId, range, data, tokens) => {
  try {
    const client = setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: data,
      },
    });

    return { success: true, updatedRows: response.data.updates.updatedRows };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update data in a sheet
 */
const updateData = async (spreadsheetId, range, data, tokens) => {
  try {
    const client = setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: data,
      },
    });

    return { success: true, updatedRows: response.data.updatedRows };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Read data from a sheet
 */
const readData = async (spreadsheetId, range, tokens) => {
  try {
    const client = setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return { success: true, data: response.data.values };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a sheet with headers
 */
const createSheetWithHeaders = async (spreadsheetId, sheetName, headers, tokens) => {
  try {
    const client = setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Add new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Format data for Google Sheets (array of objects to array of arrays)
 */
const formatDataForSheet = (data, headers) => {
  return data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Handle objects
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  });
};

/**
 * Export products to Google Sheet
 */
const exportProducts = async (spreadsheetId, sheetName, products, tokens) => {
  try {
    const headers = ['ID', 'Name', 'Description', 'Price', 'Stock', 'Category', 'Created At'];
    const data = formatDataForSheet(products, headers);

    // Create sheet with headers
    const sheetResult = await createSheetWithHeaders(spreadsheetId, sheetName, headers, tokens);
    if (!sheetResult.success) {
      return sheetResult;
    }

    // Append data
    const appendResult = await appendData(spreadsheetId, `${sheetName}!A2`, data, tokens);
    
    return { success: true, rowsExported: data.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Export sales to Google Sheet
 */
const exportSales = async (spreadsheetId, sheetName, sales, tokens) => {
  try {
    const headers = ['ID', 'Quantity', 'Total Amount', 'Sale Date', 'Customer Email', 'Customer Name', 'Created At'];
    const data = formatDataForSheet(sales, headers);

    // Create sheet with headers
    const sheetResult = await createSheetWithHeaders(spreadsheetId, sheetName, headers, tokens);
    if (!sheetResult.success) {
      return sheetResult;
    }

    // Append data
    const appendResult = await appendData(spreadsheetId, `${sheetName}!A2`, data, tokens);
    
    return { success: true, rowsExported: data.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Share sheet with user
 */
const shareSheet = async (spreadsheetId, email, role = 'writer', tokens) => {
  try {
    const client = setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: email,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const client = initOAuth2();
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return { success: true, credentials };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  initOAuth2,
  getAuthUrl,
  getTokens,
  setCredentials,
  createSheet,
  appendData,
  updateData,
  readData,
  createSheetWithHeaders,
  formatDataForSheet,
  exportProducts,
  exportSales,
  shareSheet,
  refreshAccessToken,
};
