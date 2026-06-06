import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.service';

export interface ProcurementPayload {
  supplierId: string;
  materialId: string;
  invoiceNumber: string;
  quantity: number;
  unitRate: number;
  purchaseDate: string;
  
  // Payment Types
  purchasePaymentType: string;
  transportPaymentType: string;
  laborPaymentType: string;
  
  // Transport details
  vehicleNumber: string;
  driverName: string;
  truckCost: number;
  fuelCost: number;
  tollsAllowance: number;
  
  // Labor details
  laborHeadcount: number;
  laborHoursWorked: number;
  laborCost: number;

  // Damage details
  damageQuantity?: number;
  reportedBy?: string;
}

export interface ProcurementResult {
  success: boolean;
  purchaseId: string;
  transportId?: string;
  laborId?: string;
  damageId?: string;
}

export class ProcurementService {
  /**
   * Executes atomic batch write inserts into Purchases, Transport_Costs, Labor_Costs, and optionally Damages sheets
   */
  public static async executePurchaseTransaction(
    tokens: any,
    spreadsheetId: string,
    payload: ProcurementPayload
  ): Promise<ProcurementResult> {
    const authClient = GoogleAuthService.getClientWithTokens(tokens);
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('[ProcurementService] Fetching active sheet row sizes to calculate dynamic offsets...');

    // 1. Fetch current A column values for Purchases, Transport_Costs, Labor_Costs, and Damages to identify row counts
    const sizeCheckResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['Purchases!A:A', 'Transport_Costs!A:A', 'Labor_Costs!A:A', 'Damages!A:A'],
    });

    const valueRanges = sizeCheckResponse.data.valueRanges || [];
    
    // Fallback if sheet is completely empty, headers are at Row 1, data starts at Row 2
    const currentPurchasesCount = valueRanges[0]?.values?.length || 1;
    const currentTransportCount = valueRanges[1]?.values?.length || 1;
    const currentLaborCount = valueRanges[2]?.values?.length || 1;
    const currentDamagesCount = valueRanges[3]?.values?.length || 1;

    const nextPurchaseRow = currentPurchasesCount + 1;
    const nextTransportRow = currentTransportCount + 1;
    const nextLaborRow = currentLaborCount + 1;
    const nextDamageRow = currentDamagesCount + 1;

    // Check if transport and labor sections have active entries
    const hasTransport = (payload.vehicleNumber && payload.vehicleNumber !== 'N/A' && payload.vehicleNumber.trim() !== '') || 
                         (payload.driverName && payload.driverName !== 'N/A' && payload.driverName.trim() !== '') ||
                         payload.truckCost > 0 || 
                         payload.fuelCost > 0 || 
                         payload.tollsAllowance > 0;

    const hasLabor = payload.laborHeadcount > 0 || 
                     payload.laborHoursWorked > 0 || 
                     payload.laborCost > 0;

    // 2. Generate custom structural ID sequences
    const trackingSuffix = Date.now().toString().slice(-4);
    const purchaseId = `PO-2026-${trackingSuffix}`;
    const transportId = hasTransport ? `TRP-${trackingSuffix}` : undefined;
    const laborId = hasLabor ? `LAB-${trackingSuffix}` : undefined;
    const damageId = payload.damageQuantity && payload.damageQuantity > 0 ? `DMG-${trackingSuffix}` : undefined;

    console.log(`[ProcurementService] Generated IDs: ${purchaseId}, Transport: ${transportId || 'None'}, Labor: ${laborId || 'None'}, Damage ID: ${damageId || 'None'}`);

    // Total transport cost for this transaction, allocated to Purchases sheet
    const transportCost = payload.truckCost + payload.fuelCost + payload.tollsAllowance;
    const laborCost = payload.laborCost;

    // 3. Formulate raw sheet arrays incorporating active Excel mapping formulas
    const purchaseRowValues = [
      purchaseId,
      payload.supplierId,
      payload.materialId,
      payload.invoiceNumber,
      payload.quantity,
      payload.unitRate,
      `=E${nextPurchaseRow} * F${nextPurchaseRow}`, // material_cost
      transportCost,                                // allocated_transport
      laborCost,                                    // allocated_labor
      `=(G${nextPurchaseRow} + H${nextPurchaseRow} + I${nextPurchaseRow}) / E${nextPurchaseRow}`, // landed_cost_per_unit
      payload.purchaseDate,
      payload.purchasePaymentType,                  // payment_type
    ];

    console.log('[ProcurementService] Composing atomic batchUpdate payload...');

    // 4. Perform atomic batch update across target sheets
    const dataToWrite = [
      {
        range: `Purchases!A${nextPurchaseRow}:L${nextPurchaseRow}`,
        values: [purchaseRowValues],
      },
    ];

    if (hasTransport && transportId) {
      const transportRowValues = [
        transportId,
        purchaseId,
        payload.vehicleNumber,
        payload.driverName,
        payload.truckCost,
        payload.fuelCost,
        payload.tollsAllowance,
        `=E${nextTransportRow} + F${nextTransportRow} + G${nextTransportRow}`, // total_transport_cost
        payload.transportPaymentType,                  // payment_type
      ];
      dataToWrite.push({
        range: `Transport_Costs!A${nextTransportRow}:I${nextTransportRow}`,
        values: [transportRowValues],
      });
    }

    if (hasLabor && laborId) {
      const laborRowValues = [
        laborId,
        purchaseId,
        '', // project_id (left blank for warehouse intake)
        'Unloading', // labor type
        payload.laborHeadcount,
        payload.laborHoursWorked,
        payload.laborCost, // total_labor_cost
        payload.laborPaymentType,                      // payment_type
      ];
      dataToWrite.push({
        range: `Labor_Costs!A${nextLaborRow}:H${nextLaborRow}`,
        values: [laborRowValues],
      });
    }

    // If damage items present, atomically write to Damages sheet
    if (damageId && payload.damageQuantity) {
      // Columns: ['damage_id', 'purchase_id', 'material_id', 'quantity_damaged', 'reported_by', 'status']
      const damageRowValues = [
        damageId,
        purchaseId,
        payload.materialId,
        payload.damageQuantity,
        payload.reportedBy || 'System',
        'Reported',
      ];
      
      dataToWrite.push({
        range: `Damages!A${nextDamageRow}:F${nextDamageRow}`,
        values: [damageRowValues],
      });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED', // CRITICAL: user_entered so formulas are recognized and executed!
        data: dataToWrite,
      },
    });

    console.log('[ProcurementService] Atomic batch write executed successfully!');

    return {
      success: true,
      purchaseId,
      transportId,
      laborId,
      damageId,
    };
  }
}
