import { Context } from 'hono';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  /**
   * Endpoint: POST /api/projects
   * Registers a project.
   */
  public static async createProject(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { projectName, clientName, contractValue } = body;

    if (!projectName || !clientName || !contractValue) {
      return c.json({ 
        success: false, 
        message: 'Missing required project details (Project Name, Client Name, Contract Value).' 
      }, 400);
    }

    try {
      const result = await ProjectService.createProject(user.tokens, spreadsheetId, {
        projectName,
        clientName,
        contractValue: Number(contractValue),
      });

      return c.json({
        success: true,
        message: 'Project created successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectController] Project creation failed:', error);
      return c.json({ 
        success: false, 
        message: 'Failed to write project to Google Sheets.', 
        error: error.message 
      }, 500);
    }
  }

  /**
   * Endpoint: GET /api/projects
   * Lists all projects from the spreadsheet.
   */
  public static async getProjects(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    try {
      const projects = await ProjectService.listProjects(user.tokens, spreadsheetId);
      return c.json({ success: true, data: projects });
    } catch (error: any) {
      console.error('[ProjectController] Fetching projects failed:', error);
      return c.json({ success: false, message: 'Failed to read projects.', error: error.message }, 500);
    }
  }

  /**
   * Endpoint: GET /api/projects/dispatches
   * Lists all material usage/outbound dispatch records.
   */
  public static async getDispatches(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    try {
      const dispatches = await ProjectService.listDispatches(user.tokens, spreadsheetId);
      return c.json({ success: true, data: dispatches });
    } catch (error: any) {
      console.error('[ProjectController] Fetching dispatches failed:', error);
      return c.json({ success: false, message: 'Failed to read dispatches.', error: error.message }, 500);
    }
  }

  /**
   * Endpoint: POST /api/projects/dispatch
   * Dynamic Stock Headroom check, landed cost calculation, and Material_Usage write.
   */
  public static async dispatchMaterial(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const { projectId, materialId, quantityUsed, dispatchDate } = body;

    if (!projectId || !materialId || quantityUsed === undefined || !dispatchDate) {
      return c.json({ 
        success: false, 
        message: 'Missing dispatch variables (Project, Material, Quantity, Date).' 
      }, 400);
    }

    const parsedQty = Number(quantityUsed);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return c.json({
        success: false,
        message: 'Dispatch Quantity (Units) must be greater than 0.'
      }, 400);
    }

    try {
      const result = await ProjectService.dispatchMaterial(user.tokens, spreadsheetId, {
        projectId,
        materialId,
        quantityUsed: parsedQty,
        dispatchDate,
      });

      return c.json({
        success: true,
        message: 'Material dispatch recorded successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectController] Material dispatch failed:', error);
      
      // Specialize bad request for headroom limit bounds
      if (error.message.includes('headroom exceeded') || error.message.includes('not found')) {
        return c.json({ success: false, message: error.message }, 400);
      }

      return c.json({ 
        success: false, 
        message: 'Failed to write material usage to Google Sheets.', 
        error: error.message 
      }, 500);
    }
  }

  /**
   * Endpoint: POST /api/projects/allocate (Phase 4 Specification)
   * Adapter matching snake_case layout requirements.
   */
  public static async allocateMaterial(c: Context) {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized session.' }, 401);
    }

    const spreadsheetId = user.spreadsheetId;
    if (!spreadsheetId) {
      return c.json({ success: false, message: 'No Google Sheet database linked.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const projectId = body.project_id || body.projectId;
    const materialId = body.material_id || body.materialId;
    const quantityUsed = body.quantity_used || body.quantityUsed;
    const dispatchDate = body.dispatch_date || body.dispatchDate || new Date().toISOString().slice(0, 10);

    if (!projectId || !materialId || quantityUsed === undefined) {
      return c.json({
        success: false,
        message: 'Missing dispatch variables (project_id, material_id, quantity_used).'
      }, 400);
    }

    const parsedQty = Number(quantityUsed);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return c.json({
        success: false,
        message: 'Dispatch Quantity (Units) must be greater than 0.'
      }, 400);
    }

    try {
      const result = await ProjectService.dispatchMaterial(user.tokens, spreadsheetId, {
        projectId,
        materialId,
        quantityUsed: parsedQty,
        dispatchDate,
      });

      return c.json({
        success: true,
        message: 'Material dispatch recorded successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectController] Material allocation failed:', error);
      if (error.message.includes('headroom exceeded') || error.message.includes('not found')) {
        return c.json({ success: false, message: error.message }, 400);
      }
      return c.json({ 
        success: false, 
        message: 'Failed to write material usage to Google Sheets.', 
        error: error.message 
      }, 500);
    }
  }
}
