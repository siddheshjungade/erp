import { Request, Response } from 'express';
import { google } from 'googleapis';
import { GoogleAuthService } from '../services/googleAuth.service';

export class LeadsController {
  /**
   * Helper to ensure Leads sheet exists and has proper headers/styles.
   */
  private static async ensureLeadsSheetExists(sheets: any, spreadsheetId: string) {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetNames = (spreadsheet.data.sheets || []).map((s: any) => s.properties?.title || '');

    if (!sheetNames.includes('Leads')) {
      console.log(`[LeadsController] Leads tab is missing. Dynamic initialization started...`);
      const newSheetId = 1010; // Unique identifier for the sheet

      // 1. Add sheet and style header properties
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  sheetId: newSheetId,
                  title: 'Leads',
                },
              },
            },
            {
              updateSheetProperties: {
                properties: {
                  sheetId: newSheetId,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId: newSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 8,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.9,     // Light Green background (#e2f0d9)
                      green: 0.95,
                      blue: 0.9,
                    },
                    textFormat: {
                      bold: true,
                      fontSize: 11,
                      foregroundColor: {
                        red: 0.05,  // Deep Green / Charcoal text
                        green: 0.3,
                        blue: 0.1,
                      },
                    },
                    horizontalAlignment: 'LEFT',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
              },
            },
          ],
        },
      });

      // 2. Write headers
      const headers = ['lead_id', 'client_name', 'phone', 'email', 'address', 'status', 'notes', 'created_at'];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'Leads'!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
      console.log(`[LeadsController] Dynamic Leads sheet initialized successfully.`);
    }
  }

  /**
   * Endpoint: GET /api/leads
   * Fetches the current active list of prospect leads.
   */
  public static async getLeads(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    try {
      const authClient = GoogleAuthService.getClientWithTokens(user.tokens);
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // Dynamically verify and initialize the sheet if needed
      await LeadsController.ensureLeadsSheetExists(sheets, spreadsheetId);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Leads!A:H',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return res.json({ success: true, data: [] });
      }

      const leads = rows.slice(1).map((row) => ({
        leadId: row[0],
        clientName: row[1],
        phone: row[2],
        email: row[3],
        address: row[4],
        status: row[5],
        notes: row[6],
        createdAt: row[7],
      }));

      return res.json({ success: true, data: leads });
    } catch (error: any) {
      console.error('[LeadsController] Fetching leads failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to read leads.', error: error.message });
    }
  }

  /**
   * Endpoint: POST /api/leads
   * Appends a new prospect lead to the Leads sheet.
   */
  public static async createLead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    const { clientName, phone, email, address, status, notes } = req.body;

    if (!clientName || !phone || !email || !address || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required lead details (clientName, phone, email, address, status).',
      });
    }

    try {
      const authClient = GoogleAuthService.getClientWithTokens(user.tokens);
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // Dynamically verify and initialize the sheet if needed
      await LeadsController.ensureLeadsSheetExists(sheets, spreadsheetId);

      // Fetch row count to append
      const sizeCheck = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Leads!A:A',
      });

      const currentRowsCount = sizeCheck.data.values?.length || 1;
      const nextRow = currentRowsCount + 1;

      const suffix = Date.now().toString().slice(-4);
      const leadId = `LED-${suffix}`;
      const createdAt = new Date().toISOString();

      const leadRow = [
        leadId,
        clientName,
        phone,
        email,
        address,
        status,
        notes || '',
        createdAt,
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Leads!A${nextRow}:H${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [leadRow] },
      });

      return res.status(201).json({
        success: true,
        message: 'Prospect lead created successfully!',
        data: {
          leadId,
          clientName,
          phone,
          email,
          address,
          status,
          notes,
          createdAt,
        },
      });
    } catch (error: any) {
      console.error('[LeadsController] Creating lead failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to write lead to sheet.', error: error.message });
    }
  }
}
