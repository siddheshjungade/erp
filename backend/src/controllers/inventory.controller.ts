import { Context } from 'hono';
import { google } from 'googleapis';
import { GoogleAuthService } from '../services/googleAuth.service';

export class InventoryController {
  /**
   * Endpoint: GET /api/inventory
   * Extracts real-time current warehouse stock parameters.
   */
  public static async getInventory(c: Context) {
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

      // 1. Fetch rows with FORMULA option to check for hardcoded inputs
      const checkResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Inventory!A:G',
        valueRenderOption: 'FORMULA',
      });

      const rows = checkResponse.data.values || [];
      let needsUpgrade = false;

      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        const rowNum = idx + 1;
        const qtyAvailableVal = String(row[3] || '');
        const avgLandedCostVal = String(row[5] || '');

        // If qty_available or avg_landed_cost do not contain Excel formula indicators, upgrade them
        if (!qtyAvailableVal.startsWith('=') || !avgLandedCostVal.startsWith('=')) {
          needsUpgrade = true;
          row[3] = `=SUMIF(Purchases!C:C, A${rowNum}, Purchases!E:E) - SUMIF(Material_Usage!C:C, A${rowNum}, Material_Usage!D:D) - SUMIF(Damages!C:C, A${rowNum}, Damages!D:D)`;
          row[4] = `=SUMIF(Damages!C:C, A${rowNum}, Damages!D:D)`;
          row[5] = `=IFERROR(AVERAGEIF(Purchases!C:C, A${rowNum}, Purchases!J:J), 0)`;
        }
      }

      if (needsUpgrade && rows.length > 1) {
        console.log(`[InventoryController] Upgrading ${rows.length - 1} hardcoded inventory rows to dynamic formulas...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Inventory!A2:G${rows.length}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: rows.slice(1),
          },
        });
      }

      // 2. Query normal evaluated cell values to return to the frontend
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Inventory!A:G',
      });

      const finalRows = response.data.values || [];
      if (finalRows.length <= 1) {
        return c.json({ success: true, data: [] });
      }

      const inventory = finalRows.slice(1).map((row) => ({
        materialId: row[0],
        itemName: row[1],
        category: row[2],
        qtyAvailable: Number(row[3] || 0),
        qtyDamaged: Number(row[4] || 0),
        avgLandedCost: Number(row[5] || 0),
        minStockAlert: Number(row[6] || 0),
      }));

      return c.json({ success: true, data: inventory });
    } catch (error: any) {
      console.error('[InventoryController] Fetching inventory failed:', error);
      return c.json({ success: false, message: 'Failed to read inventory.', error: error.message }, 500);
    }
  }

  /**
   * Endpoint: POST /api/inventory
   * Registers a new hardware material in the Inventory catalog.
   */
  public static async createInventoryItem(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { itemName, category, minStockAlert } = body;

    if (!itemName || !category) {
      return c.json({
        success: false,
        message: 'Missing required inventory details (itemName, category).',
      }, 400);
    }

    try {
      const authClient = GoogleAuthService.getClientWithTokens(user.tokens, c);
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // 1. Fetch current row count of Inventory
      const sizeCheck = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Inventory!A:A',
      });

      const currentRowsCount = sizeCheck.data.values?.length || 1;
      const nextRow = currentRowsCount + 1;

      const suffix = Date.now().toString().slice(-4);
      const materialId = `MAT-${suffix}`;

      // 2. Prepare columns: ['material_id', 'item_name', 'category', 'qty_available', 'qty_damaged', 'avg_landed_cost', 'min_stock_alert']
      const itemRow = [
        materialId,
        itemName,
        category,
        `=SUMIF(Purchases!C:C, A${nextRow}, Purchases!E:E) - SUMIF(Material_Usage!C:C, A${nextRow}, Material_Usage!D:D) - SUMIF(Damages!C:C, A${nextRow}, Damages!D:D)`,
        `=SUMIF(Damages!C:C, A${nextRow}, Damages!D:D)`,
        `=IFERROR(AVERAGEIF(Purchases!C:C, A${nextRow}, Purchases!J:J), 0)`,
        Number(minStockAlert || 10),
      ];

      // 3. Write row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Inventory!A${nextRow}:G${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [itemRow] },
      });

      return c.json({
        success: true,
        message: 'Inventory material created successfully!',
        data: {
          materialId,
          itemName,
          category,
          qtyAvailable: 0,
          qtyDamaged: 0,
          avgLandedCost: 0,
          minStockAlert: Number(minStockAlert || 10),
        },
      }, 201);
    } catch (error: any) {
      console.error('[InventoryController] Creating inventory item failed:', error);
      return c.json({ success: false, message: 'Failed to write material item to sheet.', error: error.message }, 500);
    }
  }
}
