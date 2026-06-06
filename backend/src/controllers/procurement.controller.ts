import { Request, Response } from 'express';
import { ProcurementService, ProcurementPayload } from '../services/procurement.service';

export class ProcurementController {
  /**
   * Endpoint: POST /api/procurement/purchase
   * Compatibility endpoint for dashboard client PO.
   */
  public static async registerPurchase(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Google Sheet database linked. Please reinitialize your database.' 
      });
    }

    const {
      supplierId,
      materialId,
      invoiceNumber,
      quantity,
      unitRate,
      purchaseDate,
      
      purchasePaymentType,
      transportPaymentType,
      laborPaymentType,
      
      vehicleNumber,
      driverName,
      truckCost,
      fuelCost,
      tollsAllowance,
      
      laborHeadcount,
      laborHoursWorked,
      laborCost,
    } = req.body;

    if (!supplierId || !materialId || !invoiceNumber || !quantity || !unitRate || !purchaseDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing critical procurement fields (Supplier, Material, Invoice, Quantity, Rate, Date).' 
      });
    }

    try {
      const payload: ProcurementPayload = {
        supplierId,
        materialId,
        invoiceNumber,
        quantity: Number(quantity),
        unitRate: Number(unitRate),
        purchaseDate,
        
        purchasePaymentType: purchasePaymentType || 'Credit',
        transportPaymentType: transportPaymentType || 'Cash',
        laborPaymentType: laborPaymentType || 'Cash',
        
        vehicleNumber: vehicleNumber || 'N/A',
        driverName: driverName || 'N/A',
        truckCost: Number(truckCost || 0),
        fuelCost: Number(fuelCost || 0),
        tollsAllowance: Number(tollsAllowance || 0),
        
        laborHeadcount: Number(laborHeadcount || 0),
        laborHoursWorked: Number(laborHoursWorked || 0),
        laborCost: Number(laborCost || 0),
      };

      const result = await ProcurementService.executePurchaseTransaction(
        user.tokens,
        spreadsheetId,
        payload
      );

      return res.json({
        success: true,
        message: 'Procurement purchase transaction recorded successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProcurementController] Atomic purchase registration failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to record procurement transaction.', 
        error: error.message 
      });
    }
  }

  /**
   * Endpoint: POST /api/purchases (Phase 4 Specification)
   * Registers a purchase PO nested transaction, supporting optional damage logging.
   * Returns 201 Created on success.
   */
  public static async registerPurchaseOrder(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Google Sheet database linked. Please reinitialize your database.' 
      });
    }

    const {
      supplier_id,
      material_id,
      invoice_number,
      quantity,
      unit_rate,
      purchase_date,
      
      purchase_payment_type,
      transport_payment_type,
      labor_payment_type,
      
      transport,
      labor,
      damage_quantity,
    } = req.body;

    if (!supplier_id || !material_id || !invoice_number || !quantity || !unit_rate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing critical PO fields (supplier_id, material_id, invoice_number, quantity, unit_rate).' 
      });
    }

    try {
      const payload: ProcurementPayload = {
        supplierId: supplier_id,
        materialId: material_id,
        invoiceNumber: invoice_number,
        quantity: Number(quantity),
        unitRate: Number(unit_rate),
        purchaseDate: purchase_date || new Date().toISOString().slice(0, 10),
        
        purchasePaymentType: purchase_payment_type || transport?.payment_type || 'Credit',
        transportPaymentType: transport_payment_type || transport?.payment_type || 'Cash',
        laborPaymentType: labor_payment_type || labor?.payment_type || 'Cash',
        
        vehicleNumber: transport?.vehicle_number || 'N/A',
        driverName: transport?.driver_name || 'N/A',
        truckCost: Number(transport?.truck_cost || 0),
        fuelCost: Number(transport?.fuel_cost || 0),
        tollsAllowance: Number(transport?.tolls_allowance || 0),
        
        laborHeadcount: Number(labor?.headcount || 0),
        laborHoursWorked: Number(labor?.hours_worked || 0),
        laborCost: Number(labor?.total_labor_cost || 0),

        damageQuantity: Number(damage_quantity || 0),
        reportedBy: user.email,
      };

      console.log(`[ProcurementController] Executing Phase 4 atomic PO dispatch for: ${user.email}`);

      const result = await ProcurementService.executePurchaseTransaction(
        user.tokens,
        spreadsheetId,
        payload
      );

      return res.status(201).json({
        success: true,
        message: 'Procurement transaction recorded successfully under Phase 4!',
        data: {
          purchase_id: result.purchaseId,
          transport_id: result.transportId,
          labor_id: result.laborId,
          damage_id: result.damageId,
          landed_cost_allocation: (payload.quantity * payload.unitRate + 
            (payload.truckCost + payload.fuelCost + payload.tollsAllowance) + 
            payload.laborCost) / payload.quantity,
        },
      });
    } catch (error: any) {
      console.error('[ProcurementController] Phase 4 PO registration failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write purchases transaction.', 
        error: error.message 
      });
    }
  }
}
