import { Context } from 'hono';
import { google } from 'googleapis';
import { GoogleAuthService } from '../services/googleAuth.service';

export class SupplierController {
  /**
   * Endpoint: GET /api/suppliers
   * Parses rows from target workbook Suppliers sheet layout maps.
   */
  public static async getSuppliers(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    try {
      const authClient = GoogleAuthService.getClientWithTokens(user.tokens, c);
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Suppliers!A:I',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return c.json({ success: true, data: [] });
      }

      const suppliers = rows.slice(1).map((row) => ({
        supplierId: row[0],
        companyName: row[1],
        gstNumber: row[2],
        contactPerson: row[3],
        phone: row[4],
        paymentTerms: row[5],
        totalPurchased: Number(row[6] || 0),
        totalPaid: Number(row[7] || 0),
        balanceDue: Number(row[8] || 0),
      }));

      return c.json({ success: true, data: suppliers });
    } catch (error: any) {
      console.error('[SupplierController] Fetching suppliers failed:', error);
      return c.json({ success: false, message: 'Failed to read suppliers directory.', error: error.message }, 500);
    }
  }

  /**
   * Endpoint: POST /api/suppliers
   * Appends a new supplier row with relational tracking formulas.
   */
  public static async createSupplier(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { company_name, gst_number, contact_person, phone, payment_terms } = body;

    if (!company_name || !gst_number || !contact_person || !phone || !payment_terms) {
      return c.json({
        success: false,
        message: 'Missing required supplier fields (company_name, gst_number, contact_person, phone, payment_terms).',
      }, 400);
    }

    try {
      const authClient = GoogleAuthService.getClientWithTokens(user.tokens, c);
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // 1. Fetch current row count of Suppliers
      const sizeCheck = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Suppliers!A:A',
      });

      const currentRowsCount = sizeCheck.data.values?.length || 1;
      const nextRow = currentRowsCount + 1;

      const suffix = Date.now().toString().slice(-4);
      const supplierId = `SPL-${suffix}`;

      // 2. Prepare columns including SUMIF and arithmetic formulas
      const supplierRow = [
        supplierId,
        company_name,
        gst_number,
        contact_person,
        phone,
        payment_terms,
        `=SUMIF(Purchases!B:B, A${nextRow}, Purchases!G:G)`, // total_purchased
        `=SUMIF(Payments!B:B, A${nextRow}, Payments!D:D)`,  // total_paid
        `=G${nextRow} - H${nextRow}`,                       // balance_due
      ];

      // 3. Write row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Suppliers!A${nextRow}:I${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [supplierRow] },
      });

      return c.json({
        success: true,
        message: 'Supplier created successfully!',
        data: {
          supplierId,
          companyName: company_name,
          gstNumber: gst_number,
          contactPerson: contact_person,
          phone,
          paymentTerms: payment_terms,
        },
      }, 201);
    } catch (error: any) {
      console.error('[SupplierController] Creating supplier failed:', error);
      return c.json({ success: false, message: 'Failed to write supplier to sheet.', error: error.message }, 500);
    }
  }
}
