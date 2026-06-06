import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  /**
   * Endpoint: POST /api/projects
   * Registers a project.
   */
  public static async createProject(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    const { projectName, clientName, contractValue } = req.body;

    if (!projectName || !clientName || !contractValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required project details (Project Name, Client Name, Contract Value).' 
      });
    }

    try {
      const result = await ProjectService.createProject(user.tokens, spreadsheetId, {
        projectName,
        clientName,
        contractValue: Number(contractValue),
      });

      return res.json({
        success: true,
        message: 'Project created successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectController] Project creation failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write project to Google Sheets.', 
        error: error.message 
      });
    }
  }

  /**
   * Endpoint: GET /api/projects
   * Lists all projects from the spreadsheet.
   */
  public static async getProjects(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    try {
      const projects = await ProjectService.listProjects(user.tokens, spreadsheetId);
      return res.json({ success: true, data: projects });
    } catch (error: any) {
      console.error('[ProjectController] Fetching projects failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to read projects.', error: error.message });
    }
  }

  /**
   * Endpoint: GET /api/projects/dispatches
   * Lists all material usage/outbound dispatch records.
   */
  public static async getDispatches(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    try {
      const dispatches = await ProjectService.listDispatches(user.tokens, spreadsheetId);
      return res.json({ success: true, data: dispatches });
    } catch (error: any) {
      console.error('[ProjectController] Fetching dispatches failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to read dispatches.', error: error.message });
    }
  }

  /**
   * Endpoint: POST /api/projects/dispatch
   * Dynamic Stock Headroom check, landed cost calculation, and Material_Usage write.
   */
  public static async dispatchMaterial(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const user = req.user as any;
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet database linked.' });
    }

    const { projectId, materialId, quantityUsed, dispatchDate } = req.body;

    if (!projectId || !materialId || quantityUsed === undefined || !dispatchDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing dispatch variables (Project, Material, Quantity, Date).' 
      });
    }

    const parsedQty = Number(quantityUsed);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Dispatch Quantity (Units) must be greater than 0.'
      });
    }

    try {
      const result = await ProjectService.dispatchMaterial(user.tokens, spreadsheetId, {
        projectId,
        materialId,
        quantityUsed: parsedQty,
        dispatchDate,
      });

      return res.json({
        success: true,
        message: 'Material dispatch recorded successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectController] Material dispatch failed:', error);
      
      // Specialize bad request for headroom limit bounds
      if (error.message.includes('headroom exceeded') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write material usage to Google Sheets.', 
        error: error.message 
      });
    }
  }

  /**
   * Endpoint: POST /api/projects/allocate (Phase 4 Specification)
   * Adapter matching snake_case layout requirements.
   */
  public static async allocateMaterial(req: Request, res: Response) {
    req.body.projectId = req.body.project_id;
    req.body.materialId = req.body.material_id;
    req.body.quantityUsed = req.body.quantity_used;
    req.body.dispatchDate = req.body.dispatch_date || new Date().toISOString().slice(0, 10);
    
    return ProjectController.dispatchMaterial(req, res);
  }
}
