import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.service';

export interface SheetInitResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  isNew: boolean;
  sheets: string[];
}

export class GoogleSheetsService {
  public static SHEETS_TO_CREATE = [
    {
      name: 'Dashboard',
      headers: ['Metric Name', 'Current Value', 'Last Updated', 'Target Threshold'],
    },
    {
      name: 'Inventory',
      headers: ['material_id', 'item_name', 'category', 'qty_available', 'qty_damaged', 'avg_landed_cost', 'min_stock_alert'],
    },
    {
      name: 'Suppliers',
      headers: ['supplier_id', 'company_name', 'gst_number', 'contact_person', 'phone', 'payment_terms', 'total_purchased', 'total_paid', 'balance_due'],
    },
    {
      name: 'Purchases',
      headers: ['purchase_id', 'supplier_id', 'material_id', 'invoice_number', 'quantity', 'unit_rate', 'material_cost', 'allocated_transport', 'allocated_labor', 'landed_cost_per_unit', 'purchase_date', 'payment_type'],
    },
    {
      name: 'Transport_Costs',
      headers: ['transport_id', 'purchase_id', 'vehicle_number', 'driver_name', 'truck_cost', 'fuel_cost', 'tolls_allowance', 'total_transport_cost', 'payment_type'],
    },
    {
      name: 'Labor_Costs',
      headers: ['labor_id', 'purchase_id', 'project_id', 'type', 'headcount', 'hours_worked', 'total_labor_cost', 'payment_type'],
    },
    {
      name: 'Projects',
      headers: ['project_id', 'project_name', 'client_name', 'contract_value', 'material_cost_allocated', 'labor_cost_allocated', 'project_status', 'net_profitability'],
    },
    {
      name: 'Material_Usage',
      headers: ['usage_id', 'project_id', 'material_id', 'quantity_used', 'unit_landed_cost', 'total_cost_allocated', 'dispatch_date'],
    },
    {
      name: 'Payments',
      headers: ['payment_id', 'supplier_id', 'payment_date', 'amount_paid', 'payment_mode', 'reference_number'],
    },
    {
      name: 'Damages',
      headers: ['damage_id', 'purchase_id', 'material_id', 'quantity_damaged', 'reported_by', 'status'],
    },
    {
      name: 'Leads',
      headers: ['lead_id', 'client_name', 'phone', 'email', 'address', 'status', 'notes', 'created_at'],
    },
  ];

  /**
   * Initializes or gets existing Solar ERP Database spreadsheet
   */
  public static async initializeDatabase(tokens: any, userName: string = 'Client'): Promise<SheetInitResult> {
    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const dbName = `Solar ERP - ${userName}`;
    console.log(`[GoogleSheetsService] Searching for existing database: "${dbName}"...`);
    
    // 1. Search for "Solar ERP - {UserName}" in user's Drive (excluding deleted files)
    const searchResponse = await drive.files.list({
      q: `name = '${dbName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
      spaces: 'drive',
      fields: 'files(id, name, webViewLink)',
    });

    const existingFiles = searchResponse.data.files;
    
    if (existingFiles && existingFiles.length > 0) {
      const dbFile = existingFiles[0];
      console.log(`[GoogleSheetsService] Found existing database: ${dbFile.id}`);
      const spreadsheetId = dbFile.id!;
      
      // Get tabs of existing spreadsheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title || '');
      
      // Check and verify headers for each schema to ensure backward compatibility
      try {
        console.log('[GoogleSheetsService] Verifying existing sheets columns integrity...');
        const ranges = this.SHEETS_TO_CREATE.map(s => `'${s.name}'!A1:Z1`);
        const headerCheck = await sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges,
        });
        const valueRanges = headerCheck.data.valueRanges || [];
        
        const updateRequests: any[] = [];
        for (let i = 0; i < this.SHEETS_TO_CREATE.length; i++) {
          const sheetDef = this.SHEETS_TO_CREATE[i];
          if (!sheetNames.includes(sheetDef.name)) continue;
          
          const existingHeaders = valueRanges[i]?.values?.[0] || [];
          const missingHeaders = sheetDef.headers.filter(h => !existingHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
            console.log(`[GoogleSheetsService] Sheet "${sheetDef.name}" is missing headers:`, missingHeaders);
            const updatedHeaders = [...existingHeaders];
            for (const missing of missingHeaders) {
              updatedHeaders.push(missing);
            }
            const colChar = String.fromCharCode(65 + updatedHeaders.length - 1);
            updateRequests.push({
              range: `'${sheetDef.name}'!A1:${colChar}1`,
              values: [updatedHeaders],
            });
          }
        }
        
        if (updateRequests.length > 0) {
          console.log('[GoogleSheetsService] Writing updated sheet headers to restore integrity...');
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: updateRequests,
            },
          });
        }
      } catch (err: any) {
        console.error('[GoogleSheetsService] Warning: Failed to run column integrity sync:', err.message);
      }

      return {
        spreadsheetId,
        spreadsheetUrl: dbFile.webViewLink!,
        isNew: false,
        sheets: sheetNames,
      };
    }

    console.log(`[GoogleSheetsService] Creating a new spreadsheet: "${dbName}"...`);

    // 2. Create a new Spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: dbName,
        },
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;
    
    if (!spreadsheetId || !spreadsheetUrl) {
      throw new Error('Failed to create Google Sheet database.');
    }

    // 3. Add tabs and populate headers
    // Google creates the sheet with 'Sheet1' by default. We rename 'Sheet1' to 'Dashboard'.
    const spreadsheetDetails = await sheets.spreadsheets.get({ spreadsheetId });
    const defaultSheetId = spreadsheetDetails.data.sheets?.[0]?.properties?.sheetId;

    const requests: any[] = [];

    // Setup Dashboard (rename the default sheet)
    if (defaultSheetId !== undefined && defaultSheetId !== null) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: defaultSheetId,
            title: 'Dashboard',
          },
          fields: 'title',
        },
      });
    }

    // Create the rest of the sheets
    const createdSheetIds: { [name: string]: number } = {};
    if (defaultSheetId !== undefined && defaultSheetId !== null) {
      createdSheetIds['Dashboard'] = defaultSheetId;
    } else {
      createdSheetIds['Dashboard'] = 0;
    }

    let sheetIndex = 1;
    for (const sheetDef of this.SHEETS_TO_CREATE) {
      if (sheetDef.name === 'Dashboard') continue; // Handled by renaming default sheet

      const newSheetId = 1000 + sheetIndex++;
      requests.push({
        addSheet: {
          properties: {
            sheetId: newSheetId,
            title: sheetDef.name,
          },
        },
      });
      createdSheetIds[sheetDef.name] = newSheetId;
    }

    // Run sheet creation first
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    console.log('[GoogleSheetsService] 10 Sheets created. Initializing header columns and styles...');

    // 4. Fill headers and format them (Bold + Freeze top row)
    const valueRanges: any[] = [];
    const formatRequests: any[] = [];

    for (const sheetDef of this.SHEETS_TO_CREATE) {
      const sheetId = createdSheetIds[sheetDef.name];
      
      // Value range for headers
      valueRanges.push({
        range: `'${sheetDef.name}'!A1:${String.fromCharCode(65 + sheetDef.headers.length - 1)}1`,
        values: [sheetDef.headers],
      });

      // Format request: Bold text and freeze top row
      formatRequests.push(
        // Freeze Row 1
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        // Format A1:Z1 (bold, font size 11, light green background, deep forest text)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: sheetDef.headers.length,
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
        }
      );
    }

    // Write header values
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: valueRanges,
      },
    });

    // Apply formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });

    // 5. Initialize Dashboard formulas
    const dashboardValues = [
      ['Total Portfolio Inventory Valuation', '=SUMPRODUCT(Inventory!D2:D, Inventory!F2:F)', new Date().toISOString(), 100000],
      ['Total Active Supplier Accounts Payable Liability', '=SUM(Suppliers!I2:I)', new Date().toISOString(), 50000],
      ['Completed Project Gross Performance Margin', '=SUM(Projects!H2:H)', new Date().toISOString(), 200000],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'Dashboard'!A2:D4`,
      valueInputOption: 'USER_ENTERED', // Critical so formulas compile in Google Sheets!
      requestBody: {
        values: dashboardValues,
      },
    });

    // 6. Write Mock Default Suppliers and Inventory Items so the frontend form has initial values
    const mockInventory = [
      ['MAT-0001', 'Mono PERC Panel 550W', 'Panels', '=SUMIF(Purchases!C:C, A2, Purchases!E:E) - SUMIF(Material_Usage!C:C, A2, Material_Usage!D:D) - SUMIF(Damages!C:C, A2, Damages!D:D)', '=SUMIF(Damages!C:C, A2, Damages!D:D)', '=IFERROR(AVERAGEIF(Purchases!C:C, A2, Purchases!J:J), 0)', 10],
      ['MAT-0002', 'String Inverter 10kW', 'Inverters', '=SUMIF(Purchases!C:C, A3, Purchases!E:E) - SUMIF(Material_Usage!C:C, A3, Material_Usage!D:D) - SUMIF(Damages!C:C, A3, Damages!D:D)', '=SUMIF(Damages!C:C, A3, Damages!D:D)', '=IFERROR(AVERAGEIF(Purchases!C:C, A3, Purchases!J:J), 0)', 5],
      ['MAT-0003', 'Aluminum Solar Rail 4m', 'Mounting', '=SUMIF(Purchases!C:C, A4, Purchases!E:E) - SUMIF(Material_Usage!C:C, A4, Material_Usage!D:D) - SUMIF(Damages!C:C, A4, Damages!D:D)', '=SUMIF(Damages!C:C, A4, Damages!D:D)', '=IFERROR(AVERAGEIF(Purchases!C:C, A4, Purchases!J:J), 0)', 50],
    ];

    const mockSuppliers = [
      ['SPL-0001', 'Tata Power Solar', 'GST-TATA1234', 'Satish Singh', '+91 98765 43210', 'Net 30', 0, 0, 0],
      ['SPL-0002', 'Sungrow Renewables', 'GST-SUNG9988', 'Diana Chen', '+86 551 6532', '50-50 Split', 0, 0, 0],
      ['SPL-0003', 'Waaree Energies', 'GST-WAAR7766', 'Amit Patel', '+91 22 6644', 'Net 15', 0, 0, 0],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'Inventory'!A2:G4`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: mockInventory },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'Suppliers'!A2:I4`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: mockSuppliers },
    });

    console.log(`[GoogleSheetsService] Upgraded Database setup completed successfully: ${spreadsheetId}`);

    return {
      spreadsheetId,
      spreadsheetUrl,
      isNew: true,
      sheets: this.SHEETS_TO_CREATE.map(s => s.name),
    };
  }
}
