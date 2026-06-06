import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.service';

export interface ProjectPayload {
  projectName: string;
  clientName: string;
  contractValue: number;
}

export interface DispatchPayload {
  projectId: string;
  materialId: string;
  quantityUsed: number;
  dispatchDate: string;
}

export class ProjectService {
  /**
   * Spawns a new project row in the Projects sheet with relational formulas
   */
  public static async createProject(
    tokens: any,
    spreadsheetId: string,
    payload: ProjectPayload
  ) {
    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Fetch current row count in Projects to determine row offset
    const sizeCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Projects!A:A',
    });

    const currentRowsCount = sizeCheck.data.values?.length || 1;
    const nextRow = currentRowsCount + 1;

    const projectId = `PRJ-${Date.now().toString().slice(-4)}`;

    // 2. Prepare columns including SUMIF and arithmetic formulas
    const projectRow = [
      projectId,
      payload.projectName,
      payload.clientName,
      payload.contractValue,
      `=SUMIF(Material_Usage!B:B, A${nextRow}, Material_Usage!F:F)`, // material_cost_allocated
      `=SUMIF(Labor_Costs!C:C, A${nextRow}, Labor_Costs!G:G)`,       // labor_cost_allocated
      'Pipeline', // Default status
      `=D${nextRow} - (E${nextRow} + F${nextRow})`,                  // net_profitability
    ];

    // 3. Write to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Projects!A${nextRow}:H${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [projectRow] },
    });

    return {
      projectId,
      projectName: payload.projectName,
      nextRow,
    };
  }

  /**
   * Retrieves all active project entries
   */
  public static async listProjects(tokens: any, spreadsheetId: string) {
    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Projects!A:H',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => ({
      projectId: row[0],
      projectName: row[1],
      clientName: row[2],
      contractValue: Number(row[3] || 0),
      materialCostAllocated: Number(row[4] || 0),
      laborCostAllocated: Number(row[5] || 0),
      projectStatus: row[6],
      netProfitability: Number(row[7] || 0),
    }));
  }

  /**
   * Retrieves all material usage (outbound dispatch) entries
   */
  public static async listDispatches(tokens: any, spreadsheetId: string) {
    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Material_Usage!A:G',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row) => ({
      usageId: row[0] || '',
      projectId: row[1] || '',
      materialId: row[2] || '',
      quantityUsed: Number(row[3] || 0),
      unitLandedCost: Number(row[4] || 0),
      totalCostAllocated: Number(row[5] || 0),
      dispatchDate: row[6] || '',
    }));
  }

  /**
   * Dynamic Stock Headroom Verification, weighted average landed cost isolation, and Material Usage fulfillment
   */
  public static async dispatchMaterial(
    tokens: any,
    spreadsheetId: string,
    payload: DispatchPayload
  ) {
    if (payload.quantityUsed <= 0) {
      throw new Error('Dispatch quantity must be greater than 0.');
    }

    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log(`[ProjectService] Verifying stock headroom for: ${payload.materialId}...`);

    // 1. Fetch entire Inventory catalog to check stock headroom & get row index
    const inventoryCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Inventory!A:G',
    });

    const inventoryRows = inventoryCheck.data.values || [];
    if (inventoryRows.length <= 1) {
      throw new Error('Inventory catalog is empty. Setup inventory catalog first.');
    }

    let materialRowIndex = -1; // 1-indexed for sheets updates
    let qtyAvailable = 0;
    let fallbackLandedCost = 0;

    for (let i = 1; i < inventoryRows.length; i++) {
      if (inventoryRows[i][0] === payload.materialId) {
        materialRowIndex = i + 1; // Row numbers are 1-indexed, and we skip headers (index 0 is row 1)
        qtyAvailable = Number(inventoryRows[i][3] || 0); // Column D: qty_available
        fallbackLandedCost = Number(inventoryRows[i][5] || 0); // Column F: avg_landed_cost
        break;
      }
    }

    if (materialRowIndex === -1) {
      throw new Error(`Material "${payload.materialId}" not found in inventory catalog.`);
    }

    console.log(`[ProjectService] Stock status: Available = ${qtyAvailable}, Required = ${payload.quantityUsed}`);

    // HEADROOM CHECK: Delta_Stock = Qty_Available - Qty_Required >= 0
    if (qtyAvailable < payload.quantityUsed) {
      throw new Error(`Stock headroom exceeded. Requested: ${payload.quantityUsed}, Available: ${qtyAvailable}`);
    }

    // 2. ISOLATION: Calculate Weighted Average Landed Cost from Purchases Sheet
    console.log('[ProjectService] Fetching historical purchases to isolate weighted average landed cost...');
    const purchasesCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Purchases!A:L',
    });

    const purchaseRows = purchasesCheck.data.values || [];
    let weightedLandedCost = fallbackLandedCost;

    if (purchaseRows.length > 1) {
      let accumulatedCost = 0;
      let accumulatedQuantity = 0;

      // Skip header row
      for (let i = 1; i < purchaseRows.length; i++) {
        const row = purchaseRows[i];
        // Purchases Column C: material_id, Column E: quantity, Column J: landed_cost_per_unit
        if (row[2] === payload.materialId) {
          const qty = Number(row[4] || 0);
          const landedUnitCost = Number(row[9] || 0);

          accumulatedCost += landedUnitCost * qty;
          accumulatedQuantity += qty;
        }
      }

      if (accumulatedQuantity > 0) {
        weightedLandedCost = accumulatedCost / accumulatedQuantity;
        console.log(`[ProjectService] Calculated weighted landed cost: $${weightedLandedCost.toFixed(2)} (Qty: ${accumulatedQuantity})`);
      } else {
        console.log(`[ProjectService] No historical purchases found for ${payload.materialId}. Falling back to default: $${fallbackLandedCost}`);
      }
    }

    // 3. EXECUTE FULFILLMENT: Append dispatch transaction line directly to Material_Usage
    const usageCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Material_Usage!A:A',
    });

    const nextUsageRow = (usageCheck.data.values?.length || 1) + 1;
    const usageId = `USG-${Date.now().toString().slice(-4)}`;

    // Columns: ['usage_id', 'project_id', 'material_id', 'quantity_used', 'unit_landed_cost', 'total_cost_allocated', 'dispatch_date']
    const usageRow = [
      usageId,
      payload.projectId,
      payload.materialId,
      payload.quantityUsed,
      weightedLandedCost,
      `=D${nextUsageRow} * E${nextUsageRow}`, // total_cost_allocated
      payload.dispatchDate,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Material_Usage!A${nextUsageRow}:G${nextUsageRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [usageRow] },
    });

    // 4. SYNC BACK INTEGRITY: Update the avg_landed_cost inside Inventory sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Inventory!F${materialRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[weightedLandedCost]] },
    });

    return {
      success: true,
      usageId,
      unitLandedCost: weightedLandedCost,
      totalCostAllocated: payload.quantityUsed * weightedLandedCost,
    };
  }
}
