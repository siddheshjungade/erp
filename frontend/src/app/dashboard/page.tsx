"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Database,
  ExternalLink,
  RefreshCw,
  LogOut,
  User,
  Layers,
  Check,
  FileSpreadsheet,
  FileText,
  Package,
  DollarSign,
  Activity,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Calculator,
  Loader2,
  AlertCircle,
  Briefcase,
  AlertTriangle,
  Coins
} from 'lucide-react';

interface Project {
  projectId: string;
  projectName: string;
  clientName: string;
  contractValue: number;
  materialCostAllocated: number;
  laborCostAllocated: number;
  projectStatus: string;
  netProfitability: number;
}

interface InventoryItem {
  materialId: string;
  itemName: string;
  category: string;
  qtyAvailable: number;
  qtyDamaged: number;
  avgLandedCost: number;
  minStockAlert: number;
}

interface Lead {
  leadId: string;
  clientName: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface Supplier {
  supplierId: string;
  companyName: string;
  gstNumber: string;
  contactPerson: string;
  phone: string;
  paymentTerms: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
}

export default function Dashboard() {
  const { user, spreadsheet, loading, logout, forceSync, checkAuth } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'procurement' | 'projects' | 'leads' | 'inventory' | 'financials'>('dashboard');

  // Procurement Form state
  const [supplierId, setSupplierId] = useState('SPL-0001');
  const [procurementMaterialId, setProcurementMaterialId] = useState('MAT-0001');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [procurementQuantity, setProcurementQuantity] = useState(100);
  const [unitRate, setUnitRate] = useState(150);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchasePaymentType, setPurchasePaymentType] = useState('Credit');
  const [transportPaymentType, setTransportPaymentType] = useState('');
  const [laborPaymentType, setLaborPaymentType] = useState('');

  // Selected project details and outbound material dispatch modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Transport details
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [truckCost, setTruckCost] = useState<number | ''>('');
  const [fuelCost, setFuelCost] = useState<number | ''>('');
  const [tollsAllowance, setTollsAllowance] = useState<number | ''>('');

  // Labor details
  const [laborHeadcount, setLaborHeadcount] = useState<number | ''>('');
  const [laborHoursWorked, setLaborHoursWorked] = useState<number | ''>('');
  const [laborCost, setLaborCost] = useState<number | ''>('');

  // Atomic batch write transaction status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [createdIds, setCreatedIds] = useState<{ purchaseId?: string; transportId?: string; laborId?: string } | null>(null);

  // Math variables for Landed Cost Preview
  const rawInvoiceCost = procurementQuantity * unitRate;
  const totalTransportAllocated = (Number(truckCost) || 0) + (Number(fuelCost) || 0) + (Number(tollsAllowance) || 0);
  const totalLaborAllocated = Number(laborCost) || 0;
  const combinedTotalLanded = rawInvoiceCost + totalTransportAllocated + totalLaborAllocated;
  const landedCostPerUnit = procurementQuantity > 0 ? combinedTotalLanded / procurementQuantity : 0;
  const markupPercentage = unitRate > 0 ? ((landedCostPerUnit - unitRate) / unitRate) * 100 : 0;

  // Inventory Stock states
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Suppliers states
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  // Add Supplier Form states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierGst, setNewSupplierGst] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierTerms, setNewSupplierTerms] = useState('Net 30');
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);

  // Add Material Item Form states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Panels');
  const [newItemMinStock, setNewItemMinStock] = useState(10);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Leads states
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Leads Form states
  const [leadClientName, setLeadClientName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadAddress, setLeadAddress] = useState('');
  const [leadStatus, setLeadStatus] = useState('New');
  const [leadNotes, setLeadNotes] = useState('');
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState<string | null>(null);
  const [leadErrorMsg, setLeadErrorMsg] = useState<string | null>(null);

  // Phase 3 States: Projects & Dispatches
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Project Form
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractValue, setContractValue] = useState(250000);
  const [projectSuccessMsg, setProjectSuccessMsg] = useState<string | null>(null);
  const [projectErrorMsg, setProjectErrorMsg] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Dispatch Form
  const [dispatchProjectId, setDispatchProjectId] = useState('');
  const [dispatchMaterialId, setDispatchMaterialId] = useState('MAT-0001');
  const [quantityUsed, setQuantityUsed] = useState(10);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [dispatchErrorMsg, setDispatchErrorMsg] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Dispatches listing state
  const [dispatchesList, setDispatchesList] = useState<any[]>([]);
  const [dispatchesLoading, setDispatchesLoading] = useState(false);

  // Create Project modal state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Inventory available quantity check for dispatches
  const [inventoryStockMap, setInventoryStockMap] = useState<{ [matId: string]: { qty: number; name: string; minStock: number } }>({
    'MAT-0001': { qty: 0, name: 'Mono PERC Panel 550W', minStock: 20 },
    'MAT-0002': { qty: 0, name: 'String Inverter 10kW', minStock: 10 },
    'MAT-0003': { qty: 0, name: 'Aluminum Solar Rail 4m', minStock: 50 },
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch projects list
  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setProjectsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setProjectsList(list);
        if (list.length > 0 && !dispatchProjectId) {
          setDispatchProjectId(list[0].projectId);
        }
        // Sync selectedProject cost totals from the fetched list
        setSelectedProject((current) => {
          if (!current) return null;
          const found = list.find((p: Project) => p.projectId === current.projectId);
          return found || current;
        });
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch outbound dispatches
  const fetchDispatches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setDispatchesLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/projects/dispatches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchesList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch dispatches:', err);
    } finally {
      setDispatchesLoading(false);
    }
  };

  // Fetch active inventory levels
  const fetchInventory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setInventoryLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        setInventoryList(items);

        if (items.length > 0) {
          setProcurementMaterialId(prev => {
            if (items.some((i: InventoryItem) => i.materialId === prev)) return prev;
            return items[0].materialId;
          });
          setDispatchMaterialId(prev => {
            if (items.some((i: InventoryItem) => i.materialId === prev)) return prev;
            return items[0].materialId;
          });
        }

        // Sync the stock preview mapping for live headroom dispatch checks
        const newStockMap: { [matId: string]: { qty: number; name: string; minStock: number } } = {};
        items.forEach((item: InventoryItem) => {
          newStockMap[item.materialId] = {
            qty: item.qtyAvailable,
            name: item.itemName,
            minStock: item.minStockAlert,
          };
        });
        if (Object.keys(newStockMap).length > 0) {
          setInventoryStockMap(newStockMap);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch active supplier accounts
  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSuppliersLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setSuppliersList(list);

        if (list.length > 0) {
          setSupplierId(prev => {
            if (list.some((s: Supplier) => s.supplierId === prev)) return prev;
            return list[0].supplierId;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Create new Supplier Account via UI
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName || !newSupplierGst || !newSupplierContact || !newSupplierPhone || !newSupplierTerms) {
      alert('Please fill in all supplier fields.');
      return;
    }

    setIsSubmittingSupplier(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: newSupplierName,
          gst_number: newSupplierGst,
          contact_person: newSupplierContact,
          phone: newSupplierPhone,
          payment_terms: newSupplierTerms,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to create supplier.');
      }

      // Close modal and clear form
      setShowAddSupplierModal(false);
      setNewSupplierName('');
      setNewSupplierGst('');
      setNewSupplierContact('');
      setNewSupplierPhone('');
      setNewSupplierTerms('Net 30');

      // Refresh list, sync context, and automatically set select value
      await fetchSuppliers();
      setSupplierId(resData.data.supplierId);
      checkAuth();
    } catch (err: any) {
      alert(err.message || 'Error submitting supplier form.');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // Create new Material Item in Inventory via UI
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCategory) {
      alert('Please fill in item name and category.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemName: newItemName,
          category: newItemCategory,
          minStockAlert: newItemMinStock,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to create material item.');
      }

      // Close modal and clear form
      setShowAddItemModal(false);
      setNewItemName('');
      setNewItemCategory('Panels');
      setNewItemMinStock(10);

      // Refresh list, sync context, and automatically set select value
      await fetchInventory();
      setProcurementMaterialId(resData.data.materialId);
      checkAuth();
    } catch (err: any) {
      alert(err.message || 'Error submitting material item.');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Fetch prospect leads
  const fetchLeads = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLeadsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLeadsList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  // Create new Prospect Lead
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadClientName || !leadPhone || !leadEmail || !leadAddress || !leadStatus) {
      setLeadErrorMsg('Please fill in all required lead details.');
      return;
    }

    setIsCreatingLead(true);
    setLeadSuccessMsg(null);
    setLeadErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName: leadClientName,
          phone: leadPhone,
          email: leadEmail,
          address: leadAddress,
          status: leadStatus,
          notes: leadNotes,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Lead creation failed.');
      }

      setLeadSuccessMsg(`Lead registered successfully! Generated ID: ${resData.data.leadId}`);
      setLeadClientName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadAddress('');
      setLeadStatus('New');
      setLeadNotes('');

      fetchLeads();
      checkAuth();
    } catch (err: any) {
      setLeadErrorMsg(err.message || 'Server error creating lead.');
    } finally {
      setIsCreatingLead(false);
    }
  };

  // Fetch Inventory Available quantities to show dynamic stock warnings in Frontend
  const fetchInventoryStock = async () => {
    const token = localStorage.getItem('token');
    if (!token || !spreadsheet?.id) return;

    try {
      // We can check user session spreadsheets to get metadata, or query backend status.
      // For absolute dynamic preview, we fetch user session details again which includes sheets summary
      const res = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Since backend does not explicitly return inventory values list in auth/me,
        // we can retrieve it by hitting an endpoint, or we query it.
        // Let's call our projects list endpoint which refreshes spreadsheet numbers,
        // and fetch Google Sheets inventory count directly!
        // To keep it light, let's query the spreadsheet.
        // We will make a direct spreadsheets retrieve inside backend/src/services/project.service.ts
        // But for our UI indicator, we can default to querying the sheet.
        // Let's fetch local spreadsheet numbers from a quick backend request or fallback
        // to a local mock counter updated after successful dispatches and procurements.
      }
    } catch (err) {
      console.error('Failed to fetch inventory stock:', err);
    }
  };

  // Sync inventory stock values on mount/refresh
  const syncInventoryStockValues = async () => {
    // Let's fetch mock updated counts from Google Sheet or fallback
    // We will do a local stock tracking based on mock initialization + user dispatches
    // In our expanded UI, we will render a beautifully evaluated status banner!
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'projects') {
        fetchProjects();
        fetchDispatches();
        fetchInventory();
      } else if (activeTab === 'inventory') {
        fetchInventory();
      } else if (activeTab === 'leads') {
        fetchLeads();
      } else if (activeTab === 'procurement') {
        fetchSuppliers();
        fetchInventory();
      }
    }
  }, [activeTab, user]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    const success = await forceSync();
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsSyncing(false);
    if (success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
      checkAuth();
      if (activeTab === 'projects') {
        fetchProjects();
        fetchDispatches();
        fetchInventory();
      } else if (activeTab === 'inventory') {
        fetchInventory();
      } else if (activeTab === 'leads') {
        fetchLeads();
      } else if (activeTab === 'procurement') {
        fetchSuppliers();
        fetchInventory();
      }
    }
  };

  const handleProcurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber) {
      setSubmitError('Invoice number is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStep(1);
    setSubmitError(null);
    setTransactionSuccess(false);

    try {
      const token = localStorage.getItem('token');

      await new Promise((r) => setTimeout(r, 600));
      setSubmitStep(2);

      const res = await fetch(`${backendUrl}/api/procurement/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId,
          materialId: procurementMaterialId,
          invoiceNumber,
          quantity: procurementQuantity,
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
        }),
      });

      await new Promise((r) => setTimeout(r, 600));
      setSubmitStep(3);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit procurement transaction.');
      }

      const resData = await res.json();

      await new Promise((r) => setTimeout(r, 600));
      setSubmitStep(4);
      await new Promise((r) => setTimeout(r, 400));

      setCreatedIds(resData.data);
      setTransactionSuccess(true);
      setInvoiceNumber('');
      setVehicleNumber('');
      setDriverName('');
      setTruckCost('');
      setFuelCost('');
      setTollsAllowance('');
      setLaborHeadcount('');
      setLaborHoursWorked('');
      setLaborCost('');
      setTransportPaymentType('');
      setLaborPaymentType('');

      // Update inventory stock preview numbers locally
      setInventoryStockMap(prev => ({
        ...prev,
        [procurementMaterialId]: {
          ...prev[procurementMaterialId],
          qty: prev[procurementMaterialId].qty + procurementQuantity
        }
      }));

      checkAuth();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Project Creation
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !clientName || !contractValue) {
      setProjectErrorMsg('Please fill in all project fields.');
      return;
    }

    setIsCreatingProject(true);
    setProjectSuccessMsg(null);
    setProjectErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName,
          clientName,
          contractValue,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Project creation failed.');
      }

      setProjectSuccessMsg(`Project "${projectName}" created successfully! Generated ID: ${resData.data.projectId}`);
      setProjectName('');
      setClientName('');

      // Refresh list and sync
      fetchProjects();
      checkAuth();

      // Auto close project creation modal after 1.5 seconds so user sees success confirmation
      setTimeout(() => {
        setShowCreateProjectModal(false);
        setProjectSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setProjectErrorMsg(err.message || 'Server error creating project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Submit Material Usage Dispatch
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchProjectId || !dispatchMaterialId || !quantityUsed || !dispatchDate) {
      setDispatchErrorMsg('Please fill in all dispatch fields.');
      return;
    }

    if (quantityUsed <= 0) {
      setDispatchErrorMsg('Dispatch Quantity (Units) must be greater than 0.');
      return;
    }

    setIsDispatching(true);
    setDispatchSuccessMsg(null);
    setDispatchErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/projects/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: dispatchProjectId,
          materialId: dispatchMaterialId,
          quantityUsed,
          dispatchDate,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Material dispatch failed.');
      }

      setDispatchSuccessMsg(`Material Usage recorded! Allocated ₹${resData.data.totalCostAllocated.toFixed(2)} cost to project.`);
      setQuantityUsed(10);

      // Update inventory stock preview numbers locally
      setInventoryStockMap(prev => ({
        ...prev,
        [dispatchMaterialId]: {
          ...prev[dispatchMaterialId],
          qty: Math.max(0, prev[dispatchMaterialId].qty - quantityUsed)
        }
      }));

      // Refresh list and sync
      fetchProjects();
      fetchDispatches();
      fetchInventory();
      checkAuth();

      // Auto close dispatch modal after 1.5 seconds so user sees success confirmation
      setTimeout(() => {
        setShowDispatchModal(false);
        setDispatchSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setDispatchErrorMsg(err.message || 'Server error dispatching materials.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Helper to pre-populate local stock mock values for preview if spreadsheet is freshly created
  useEffect(() => {
    if (spreadsheet) {
      // Set some initial stock values mapping the mock purchases we set
      setInventoryStockMap({
        'MAT-0001': { qty: 250, name: 'Mono PERC Panel 550W', minStock: 20 }, // Assume we had initial purchases loaded
        'MAT-0002': { qty: 80, name: 'String Inverter 10kW', minStock: 10 },
        'MAT-0003': { qty: 500, name: 'Aluminum Solar Rail 4m', minStock: 50 },
      });
    }
  }, [spreadsheet]);

  // Selected material stock for dispatch warnings
  const selectedMaterialStock = inventoryStockMap[dispatchMaterialId]?.qty || 0;
  const selectedMaterialMinStock = inventoryStockMap[dispatchMaterialId]?.minStock || 10;
  const isQuantityInvalid = quantityUsed <= 0 || isNaN(quantityUsed);
  const isStockExceeded = !isQuantityInvalid && quantityUsed > selectedMaterialStock;
  const isStockLowAfterDispatch = !isQuantityInvalid && !isStockExceeded && (selectedMaterialStock - quantityUsed <= selectedMaterialMinStock);

  // Unique list of existing client names across projects and leads
  const existingClientNames = Array.from(
    new Set([
      ...projectsList.map((p) => p.clientName),
      ...leadsList.map((l) => l.clientName),
    ])
  ).filter(Boolean);

  if (!mounted || loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#fbfdfb]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-emerald-950/60">Fetching secure session profile...</p>
        </div>
      </div>
    );
  }

  // Active DB Schemas definition
  const schemas = [
    { name: 'Dashboard', icon: Activity, desc: 'Excel calculations mapping global operational KPIs', columns: ['Metric Name', 'Current Value', 'Last Updated', 'Target Threshold'], rowsCount: 3 },
    { name: 'Inventory', icon: Cpu, desc: 'Hardware catalog, stock counts and math allocations', columns: ['material_id', 'item_name', 'category', 'qty_available', 'qty_damaged', 'avg_landed_cost', 'min_stock_alert'], rowsCount: 3 },
    { name: 'Suppliers', icon: User, desc: 'Business contacts, payment terms and current balances due', columns: ['supplier_id', 'company_name', 'gst_number', 'contact_person', 'phone', 'payment_terms', 'total_purchased', 'total_paid', 'balance_due'], rowsCount: 3 },
    { name: 'Purchases', icon: FileSpreadsheet, desc: 'Procurement invoice rows utilizing landed cost formulas', columns: ['purchase_id', 'supplier_id', 'material_id', 'invoice_number', 'quantity', 'unit_rate', 'material_cost', 'allocated_transport', 'allocated_labor', 'landed_cost_per_unit', 'purchase_date', 'payment_type'], rowsCount: 0 },
    { name: 'Transport_Costs', icon: FileSpreadsheet, desc: 'Logistical travel ledger mapping vehicles and driver payouts', columns: ['transport_id', 'purchase_id', 'vehicle_number', 'driver_name', 'truck_cost', 'fuel_cost', 'tolls_allowance', 'total_transport_cost', 'payment_type'], rowsCount: 0 },
    { name: 'Labor_Costs', icon: User, desc: 'Field hours, installer rates and unloading labor expenses', columns: ['labor_id', 'purchase_id', 'project_id', 'type', 'headcount', 'hours_worked', 'total_labor_cost', 'payment_type'], rowsCount: 0 },
    { name: 'Projects', icon: Layers, desc: 'Active solar deployments and profitability metrics', columns: ['project_id', 'project_name', 'client_name', 'contract_value', 'material_cost_allocated', 'labor_cost_allocated', 'project_status', 'net_profitability'], rowsCount: 0 },
    { name: 'Material_Usage', icon: Package, desc: 'Dispatch registers logging pane units sent to site grids', columns: ['usage_id', 'project_id', 'material_id', 'quantity_used', 'unit_landed_cost', 'total_cost_allocated', 'dispatch_date'], rowsCount: 0 },
    { name: 'Payments', icon: DollarSign, desc: 'Supplier outbound banking payments ledger', columns: ['payment_id', 'supplier_id', 'payment_date', 'amount_paid', 'payment_mode', 'reference_number'], rowsCount: 0 },
    { name: 'Damages', icon: FileText, desc: 'Loss tracking logs reporting damaged hardware units', columns: ['damage_id', 'purchase_id', 'material_id', 'quantity_damaged', 'reported_by', 'status'], rowsCount: 0 },
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-[#fbfdfb]">

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-emerald-100/50 bg-white flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-8">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center shadow-md shadow-emerald-100">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-emerald-950">Solar<span className="text-[#10b981]">ERP</span></span>
              <span className="block text-[9px] text-emerald-700/60 font-semibold tracking-wider uppercase -mt-0.5">Vertical SaaS</span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="space-y-1.5">
            <span className="block text-[9px] font-bold text-emerald-900/40 uppercase tracking-widest pl-2 mb-2">Core Services</span>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                  : 'text-emerald-950/70 hover:bg-emerald-50/30 hover:text-emerald-950'
                }`}
            >
              <Activity className="w-4 h-4" />
              Database Dashboard
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'procurement'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                  : 'text-emerald-950/70 hover:bg-emerald-50/30 hover:text-emerald-950'
                }`}
            >
              <span className="flex items-center gap-3">
                <Calculator className="w-4 h-4" />
                Procurement PO
              </span>
              <span className="text-[9px] bg-emerald-100/40 text-emerald-800 border border-emerald-200/50 px-1.5 py-0.5 rounded font-bold">Landed</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'projects'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                  : 'text-emerald-950/70 hover:bg-emerald-50/30 hover:text-emerald-950'
                }`}
            >
              <span className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                Projects & Consumptions
              </span>
            </button>

            <span className="block text-[9px] font-bold text-emerald-900/40 uppercase tracking-widest pl-2 mt-4 mb-2">Sheets Tables</span>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'inventory'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                  : 'text-emerald-950/70 hover:bg-emerald-50/30 hover:text-emerald-950'
                }`}
            >
              <span className="flex items-center gap-3">
                <Cpu className="w-4 h-4" />
                Inventory stock
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'leads'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                  : 'text-emerald-950/70 hover:bg-emerald-50/30 hover:text-emerald-950'
                }`}
            >
              <span className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                Prospect Leads
              </span>
            </button>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-gray-100 bg-emerald-50/10">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-emerald-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <User className="w-4.5 h-4.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-emerald-950 truncate">{user.name}</span>
              <span className="block text-[10px] text-emerald-950/60 truncate">{user.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-emerald-950/50 hover:text-red-500 transition-colors p-1 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Step-by-Step submission progress loader overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl border border-emerald-100 shadow-2xl p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-100">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-950">Executing Atomic Write Chain</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Multi-Row Sheet Syncing</p>
              </div>

              {/* Steps visual tick off */}
              <div className="space-y-2 bg-[#f7faf8] rounded-2xl p-4 border border-emerald-100/50 text-left">
                <div className={`flex items-center gap-3 text-xs font-semibold ${submitStep >= 1 ? 'text-emerald-950' : 'text-gray-400'}`}>
                  {submitStep > 1 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  )}
                  Calculating landed costs & mapping formulas
                </div>
                <div className={`flex items-center gap-3 text-xs font-semibold ${submitStep >= 2 ? 'text-emerald-950' : 'text-gray-400'}`}>
                  {submitStep > 2 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                  ) : submitStep === 2 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[9px] font-bold">•</span>
                  )}
                  Querying sheet row sizes to evaluate offsets
                </div>
                <div className={`flex items-center gap-3 text-xs font-semibold ${submitStep >= 3 ? 'text-emerald-950' : 'text-gray-400'}`}>
                  {submitStep > 3 ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                  ) : submitStep === 3 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[9px] font-bold">•</span>
                  )}
                  Executing atomic sheets.values.batchUpdate
                </div>
                <div className={`flex items-center gap-3 text-xs font-semibold ${submitStep >= 4 ? 'text-emerald-950' : 'text-gray-400'}`}>
                  {submitStep === 4 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[9px] font-bold">•</span>
                  )}
                  Updating Dashboard Excel Formulas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <header className="h-16 border-b border-emerald-100/50 bg-white flex items-center justify-between px-6">
          <h1 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
            {activeTab === 'dashboard' ? 'Database Blueprint Status' : `${activeTab.toUpperCase()} Module`}
          </h1>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[10px]">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              10-Sheet Matrix Linked
            </div>
          </div>
        </header>

        {/* Main Panels Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">

          {/* 1. Main Dashboard view */}
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-white rounded-3xl border border-emerald-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h2 className="text-lg font-extrabold text-emerald-950">Solar ERP 10-Sheet Database Schema Active</h2>
                  </div>
                  <p className="text-xs font-medium text-emerald-900/60 leading-relaxed max-w-2xl">
                    Welcome to Phase 2 & 3. We have upgraded your workbook to a **10-sheet database model** in Google Drive. You can now log purchase orders atomically, and manage operational project initiation dispatches with stock headroom verification!
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100/50 shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Database'}
                  </button>

                  <a
                    href={spreadsheet?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    Open Google Sheet
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Status Message Overlay on success */}
              {syncSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4" />
                  Google Sheet schemas successfully synchronized with the backend.
                </div>
              )}

              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm hover-card-premium">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-wider">Cloud Host</span>
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse-green" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-emerald-950/50">Google Sheets Connection</h3>
                    <p className="text-base font-extrabold text-emerald-950">Active Database Server</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 space-y-1">
                    <span className="block text-[9px] font-bold text-emerald-900/40 uppercase">User Email</span>
                    <span className="block text-xs font-bold text-emerald-950 truncate">{user.email}</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm hover-card-premium">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-wider">Google Sheets File</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-emerald-950/50">Dynamic File Name</h3>
                    <p className="text-base font-extrabold text-emerald-950">Solar ERP - {user.name}</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 space-y-1">
                    <span className="block text-[9px] font-bold text-emerald-900/40 uppercase">Spreadsheet ID</span>
                    <span className="block text-xs font-bold text-emerald-950 font-mono truncate">{spreadsheet?.id}</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm hover-card-premium">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-wider">Database Columns</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-emerald-950/50">Relational Database</h3>
                    <p className="text-base font-extrabold text-emerald-950">{spreadsheet?.sheets.length} Active Tables</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 space-y-1">
                    <span className="block text-[9px] font-bold text-emerald-900/40 uppercase">Initial Config Rows</span>
                    <span className="block text-xs font-bold text-emerald-950 truncate">
                      Default suppliers & inventory loaded
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Relational Schema Blueprint (Schema Explorer) */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-emerald-950">10-Sheet Relational Schema Blueprint</h3>
                    <p className="text-xs font-medium text-emerald-900/50">
                      Visualizing active sheets, default Excel formulas, and structured row dimensions.
                    </p>
                  </div>
                </div>

                {/* Schemas List */}
                <div className="space-y-4">
                  {schemas.map((schema, index) => {
                    const IconComponent = schema.icon;
                    const exists = spreadsheet?.sheets.includes(schema.name);

                    return (
                      <div key={index} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#fbfdfb] border border-emerald-100/30 hover:border-emerald-100 transition-colors">
                        <div className="flex items-start gap-4 lg:w-72">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-emerald-950 text-sm truncate">{schema.name}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${exists
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50'
                                  : 'bg-red-50 text-red-800 border border-red-100/50'
                                }`}>
                                {exists ? 'Active' : 'Missing'}
                              </span>
                            </div>
                            <p className="text-[10px] font-semibold text-emerald-900/55 leading-tight truncate">{schema.desc}</p>
                          </div>
                        </div>

                        {/* Column visualization pills */}
                        <div className="space-y-1.5 lg:max-w-2xl w-full lg:w-auto flex-1">
                          <span className="block text-[8px] font-bold text-emerald-900/40 uppercase tracking-widest pl-1">Columns / Fields</span>
                          <div className="flex flex-wrap gap-1">
                            {schema.columns.map((col, cIdx) => (
                              <span key={cIdx} className="text-[9px] font-bold bg-white text-emerald-950 border border-gray-100 px-2 py-0.5 rounded">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Rows counter */}
                        <div className="lg:w-24 text-left lg:text-right flex-shrink-0">
                          <span className="block text-[8px] font-bold text-emerald-900/40 uppercase tracking-widest pl-1 lg:pl-0">DB Status</span>
                          <span className="block text-xs font-bold text-emerald-950">
                            {schema.rowsCount > 0 ? `${schema.rowsCount} Mock Rows` : '0 Rows'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 2. Procurement Tab (POs) */}
          {activeTab === 'procurement' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Form: PO Submission Form */}
              <form onSubmit={handleProcurementSubmit} className="lg:col-span-7 bg-white rounded-3xl border border-emerald-100 p-6 space-y-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-base font-extrabold text-emerald-950">Inbound Procurement Order Registry</h2>
                  <p className="text-xs font-semibold text-emerald-900/50">Register a PO, transport surcharges, and labor costs atomically.</p>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </div>
                )}

                {transactionSuccess && createdIds && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-2xl text-xs font-bold space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold">✓</span>
                      Atomic Transaction Completed Successfully!
                    </div>
                    <div className="pl-7 font-mono text-[10px] text-emerald-900/70 space-y-0.5">
                      <div>• Purchase Registry ID: {createdIds.purchaseId}</div>
                      {createdIds.transportId && <div>• Logistical Transport ID: {createdIds.transportId}</div>}
                      {createdIds.laborId && <div>• Handlers Labor ID: {createdIds.laborId}</div>}
                    </div>
                  </div>
                )}

                {/* Section A: Material & Vendor */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Section A: Core Invoice Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5 pl-1">
                        <label className="block text-[10px] font-bold text-emerald-950 uppercase">Supplier</label>
                        <button
                          type="button"
                          onClick={() => setShowAddSupplierModal(true)}
                          className="text-[9px] font-bold text-emerald-600 hover:text-emerald-850 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                        >
                          + New Supplier
                        </button>
                      </div>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                      >
                        {suppliersList.length === 0 ? (
                          <option value="">-- No Suppliers Registered --</option>
                        ) : (
                          suppliersList.map(s => (
                            <option key={s.supplierId} value={s.supplierId}>{s.companyName} ({s.supplierId})</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5 pl-1">
                        <label className="block text-[10px] font-bold text-emerald-950 uppercase">Material Item</label>
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(true)}
                          className="text-[9px] font-bold text-emerald-600 hover:text-emerald-850 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                        >
                          + New Material Item
                        </button>
                      </div>
                      <select
                        value={procurementMaterialId}
                        onChange={(e) => setProcurementMaterialId(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                      >
                        {inventoryList.length === 0 ? (
                          <option value="">-- No Materials Registered --</option>
                        ) : (
                          inventoryList.map(item => (
                            <option key={item.materialId} value={item.materialId}>{item.itemName} ({item.materialId})</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Invoice Number</label>
                      <input
                        type="text"
                        required
                        placeholder="INV-9982"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Quantity (Units)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={procurementQuantity}
                        onChange={(e) => setProcurementQuantity(Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Unit Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={unitRate}
                        onChange={(e) => setUnitRate(Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Purchase Date</label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Payment Type</label>
                      <select
                        value={purchasePaymentType}
                        onChange={(e) => setPurchasePaymentType(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section B: Logistical Transport Costs */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Section B: Logistical Transport Expenses</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Vehicle Plate Number</label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Driver Name</label>
                      <input
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Truck Base Cost (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={truckCost}
                        onChange={(e) => setTruckCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Fuel Expenses (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={fuelCost}
                        onChange={(e) => setFuelCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Toll Allowances (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={tollsAllowance}
                        onChange={(e) => setTollsAllowance(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Payment Type</label>
                      <select
                        value={transportPaymentType}
                        onChange={(e) => setTransportPaymentType(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">-- Select Payment --</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section C: Unloading Labor */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Section C: Unloading Labor Allocations</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Headcount (Workers)</label>
                      <input
                        type="number"
                        min="0"
                        value={laborHeadcount}
                        onChange={(e) => setLaborHeadcount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Hours Worked</label>
                      <input
                        type="number"
                        min="0"
                        value={laborHoursWorked}
                        onChange={(e) => setLaborHoursWorked(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Total Labor Payout (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Payment Type</label>
                      <select
                        value={laborPaymentType}
                        onChange={(e) => setLaborPaymentType(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">-- Select Payment --</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Button Submit */}
                <button
                  type="submit"
                  className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  Submit Inbound Purchase Transaction
                  <Check className="w-4 h-4" />
                </button>
              </form>

              {/* Right Panel: Mathematical True Landed Cost Calculator Preview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-emerald-950">True Landed Cost Math Preview</h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* Raw Cost */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-950/60">Base Invoice Rate ({procurementQuantity} × ₹{unitRate})</span>
                      <span className="text-emerald-950">₹{rawInvoiceCost.toLocaleString()}</span>
                    </div>

                    {/* Transport allocated */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-950/60">Logistical Transport Costs</span>
                      <span className="text-emerald-950">+ ₹{totalTransportAllocated.toLocaleString()}</span>
                    </div>

                    {/* Labor allocated */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-950/60">Unloading Labor Allocations</span>
                      <span className="text-emerald-950">+ ₹{totalLaborAllocated.toLocaleString()}</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-200 pt-3.5" />

                    {/* Total cost */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-950">Combined Landed Cost Value</span>
                      <span className="text-emerald-950">₹{combinedTotalLanded.toLocaleString()}</span>
                    </div>

                    {/* Landed Cost unit result */}
                    <div className="bg-[#f7faf8] rounded-2xl p-4 border border-emerald-100/50 space-y-2 mt-4">
                      <span className="block text-[9px] font-bold text-emerald-900/50 uppercase tracking-widest">Landed cost per unit</span>

                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-emerald-950">₹{landedCostPerUnit.toFixed(2)}</span>
                        {markupPercentage > 0 && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                            +{markupPercentage.toFixed(2)}% overhead inflation
                          </span>
                        )}
                      </div>

                      <span className="block text-[8px] font-bold text-emerald-900/40 uppercase pt-2">Formula:</span>
                      <code className="block text-[10px] font-semibold text-emerald-800/80 font-mono leading-tight">
                        (Raw Cost + Logistics + Labor) / Qty
                      </code>
                    </div>
                  </div>
                </div>

                {/* Relational Write Visualizer Card */}
                <div className="bg-emerald-50/20 rounded-3xl border border-emerald-100 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">Google Sheets Atomic Blueprint</span>
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-950/60 leading-relaxed">
                    This write executes an atomic batch update utilizing Google API v4, ensuring that if any sheet (Purchases, Transport, or Labor) fails to write, the entire sequence is rejected to avoid databases mismatch states.
                  </p>

                  <div className="bg-white rounded-2xl p-3 border border-emerald-100/50 text-[10px] font-mono leading-tight space-y-1 text-emerald-900/80 max-h-48 overflow-y-auto">
                    <div className="font-bold text-emerald-950">Write Payload Blueprint:</div>
                    <div>1. Purchases!A:K ➡ [PO, Supplier, Material, Qty, Rate, "=E*F", Logistics, Labor, landed_cost, Date]</div>
                    <div>2. Transport!A:H ➡ [TRP, PO, Plate, Driver, Truck, Fuel, Tolls, "=E+F+G"]</div>
                    <div>3. Labor!A:G ➡ [LAB, PO, "", "Unloading", Workers, Hours, Cost]</div>
                  </div>
                </div>
              </div>
            </div>
          )}

                {/* 3. Projects & Dispatches Tab (Phase 3) */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    {!selectedProject ? (
                      <>


                        {/* Dynamic Projects Grid Relational Ledger */}
                        <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                            <div>
                              <h3 className="text-base font-extrabold text-emerald-950">Active Projects Relational Ledger</h3>
                              <p className="text-xs font-semibold text-emerald-900/50">
                                Real-time calculations fetched from Google Sheets. Material allocations populate via `=SUMIF(Material_Usage!B:B, ...)` formulas.
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setProjectSuccessMsg(null);
                                  setProjectErrorMsg(null);
                                  setShowCreateProjectModal(true);
                                }}
                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                Initiate New Project
                              </button>

                              <button
                                onClick={fetchProjects}
                                className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center gap-2 cursor-pointer"
                              >
                                <RefreshCw className={`w-3 h-3 ${projectsLoading ? 'animate-spin' : ''}`} />
                                Refresh Table
                              </button>
                            </div>
                          </div>

                          {projectsLoading && projectsList.length === 0 ? (
                            <div className="py-12 text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-emerald-950/60">Reading Projects from Google Sheet database...</p>
                            </div>
                          ) : projectsList.length === 0 ? (
                            <div className="py-12 text-center text-xs font-semibold text-emerald-950/50">
                              No active projects found. Use the form above to initiate a project!
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-left">
                                <thead>
                                  <tr className="border-b border-emerald-100 text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">
                                    <th className="py-3 px-4">Project ID</th>
                                    <th className="py-3 px-4">Project Name</th>
                                    <th className="py-3 px-4">Client Corp</th>
                                    <th className="py-3 px-4 text-right">Contract Rev</th>
                                    <th className="py-3 px-4 text-right text-emerald-600">Material Cost</th>
                                    <th className="py-3 px-4 text-right text-emerald-600">Labor Cost</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Net Profit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                                  {projectsList.map((project, idx) => (
                                    <tr 
                                      key={idx} 
                                      onClick={() => setSelectedProject(project)}
                                      className="hover:bg-emerald-50/40 transition-all cursor-pointer border-b border-gray-100 hover:scale-[1.002] active:scale-[0.998]"
                                    >
                                      <td className="py-3.5 px-4 font-mono text-emerald-900/60">{project.projectId}</td>
                                      <td className="py-3.5 px-4 text-emerald-950">{project.projectName}</td>
                                      <td className="py-3.5 px-4 text-emerald-950/70">{project.clientName}</td>
                                      <td className="py-3.5 px-4 text-right">₹{project.contractValue.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 text-right text-emerald-700 bg-emerald-50/20">₹{project.materialCostAllocated.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 text-right text-emerald-700 bg-emerald-50/20">₹{project.laborCostAllocated.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 text-center">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100/50">
                                          {project.projectStatus}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right text-emerald-950 font-black">
                                        <span className={project.netProfitability >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                          {project.netProfitability >= 0 ? '+' : ''}₹{project.netProfitability.toLocaleString()}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Project Details cost scorecard - FULL WINDOW VIEW */
                      <div className="bg-white rounded-3xl border border-emerald-100 p-8 space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom duration-300 relative w-full">
                        {/* Top controls & Project info */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                              {selectedProject.projectId}
                            </span>
                            <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mt-3">
                              {selectedProject.projectName}
                            </h2>
                            <p className="text-xs font-semibold text-emerald-950/60 mt-1">
                              Client Name: {selectedProject.clientName}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => setSelectedProject(null)}
                            title="Back to List"
                            className="w-9 h-9 rounded-full bg-emerald-50/50 hover:bg-emerald-100 flex items-center justify-center text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer border border-emerald-100"
                          >
                            <span className="text-sm font-bold">✕</span>
                          </button>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Financial Scorecard section */}
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest pl-1">
                            Financial Scorecard
                          </h3>

                          {/* 1x5 Grid of cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Contract Revenue */}
                            <div className="bg-[#fbfdfb] border border-emerald-100/30 rounded-2xl p-4 space-y-1">
                              <span className="block text-[9px] font-extrabold text-emerald-990/40 uppercase tracking-wider">
                                Contract Revenue
                              </span>
                              <span className="block text-lg font-extrabold text-emerald-950">
                                ₹{selectedProject.contractValue.toLocaleString()}
                              </span>
                            </div>

                            {/* Project Status */}
                            <div className="bg-[#fbfdfb] border border-emerald-100/30 rounded-2xl p-4 space-y-1">
                              <span className="block text-[9px] font-extrabold text-emerald-990/40 uppercase tracking-wider">
                                Project Status
                              </span>
                              <div className="pt-0.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-100/50 uppercase tracking-wider inline-block">
                                  {selectedProject.projectStatus}
                                </span>
                              </div>
                            </div>

                            {/* Allocated Materials */}
                            <div className="bg-[#fbfdfb] border border-emerald-100/30 rounded-2xl p-4 space-y-1">
                              <span className="block text-[9px] font-extrabold text-[#c07f7f] uppercase tracking-wider">
                                Allocated Materials
                              </span>
                              <span className="block text-lg font-extrabold text-red-600">
                                ₹{selectedProject.materialCostAllocated.toLocaleString()}
                              </span>
                            </div>

                            {/* Allocated Labor */}
                            <div className="bg-[#fbfdfb] border border-emerald-100/30 rounded-2xl p-4 space-y-1">
                              <span className="block text-[9px] font-extrabold text-[#c07f7f] uppercase tracking-wider">
                                Allocated Labor
                              </span>
                              <span className="block text-lg font-extrabold text-red-600">
                                ₹{selectedProject.laborCostAllocated.toLocaleString()}
                              </span>
                            </div>

                            {/* Net Profitability Card */}
                            <div className="bg-[#f2faf5] border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="block text-[9px] font-extrabold text-emerald-800/60 uppercase tracking-wider">
                                  Net Profitability
                                </span>
                                <span className="block text-lg font-black text-emerald-850">
                                  {selectedProject.netProfitability >= 0 ? '+' : ''}₹{selectedProject.netProfitability.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-850 font-bold flex-shrink-0">
                                ✓
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Outbound Material Logs Section */}
                        {(() => {
                          const projectDispatches = dispatchesList.filter(
                            (d) => d.projectId === selectedProject.projectId
                          );
                          const getMaterialName = (matId: string) => {
                            return inventoryStockMap[matId]?.name || matId;
                          };

                          return (
                            <div className="space-y-4 pt-6 border-t border-gray-150">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                    Outbound Material Logs
                                  </h3>
                                  <p className="text-[10px] font-semibold text-emerald-900/50">
                                    Existing outbound hardware items dispatched for this project grid.
                                  </p>
                                </div>
                                
                                <button
                                  onClick={() => {
                                    setDispatchProjectId(selectedProject.projectId);
                                    setDispatchSuccessMsg(null);
                                    setDispatchErrorMsg(null);
                                    setShowDispatchModal(true);
                                  }}
                                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  Dispatch Outbound Material
                                </button>
                              </div>

                              {dispatchesLoading ? (
                                <div className="py-8 text-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto mb-2" />
                                  <p className="text-[10px] font-semibold text-emerald-950/60">Fetching outbound logs...</p>
                                </div>
                              ) : projectDispatches.length === 0 ? (
                                <div className="py-8 text-center text-xs font-semibold text-emerald-950/50 bg-[#fbfdfb] border border-emerald-100/30 rounded-2xl">
                                  No outbound material dispatches logged for this project.
                                </div>
                              ) : (
                                <div className="overflow-x-auto border border-emerald-100/30 rounded-2xl bg-[#fbfdfb]">
                                  <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-emerald-100/50 text-[9px] font-bold text-emerald-900/40 uppercase tracking-widest bg-emerald-50/20">
                                        <th className="py-2.5 px-4">Usage ID</th>
                                        <th className="py-2.5 px-4">Date</th>
                                        <th className="py-2.5 px-4">Material Hardware</th>
                                        <th className="py-2.5 px-4 text-right">Quantity</th>
                                        <th className="py-2.5 px-4 text-right">Landed Cost/Unit</th>
                                        <th className="py-2.5 px-4 text-right">Total Cost</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[11px] font-bold">
                                      {projectDispatches.map((dispatch: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-emerald-50/10 transition-colors">
                                          <td className="py-2.5 px-4 font-mono text-emerald-900/60">{dispatch.usageId}</td>
                                          <td className="py-2.5 px-4 text-emerald-950/70">{dispatch.dispatchDate}</td>
                                          <td className="py-2.5 px-4 text-emerald-950">{getMaterialName(dispatch.materialId)}</td>
                                          <td className="py-2.5 px-4 text-right text-emerald-950">{dispatch.quantityUsed.toLocaleString()} units</td>
                                          <td className="py-2.5 px-4 text-right text-emerald-950/70">₹{dispatch.unitLandedCost.toLocaleString()}</td>
                                          <td className="py-2.5 px-4 text-right text-emerald-700 font-extrabold">₹{dispatch.totalCostAllocated.toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

          {/* 4. Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">Warehouse Inventory Stocks</h3>
                  <p className="text-xs font-semibold text-emerald-900/50">
                    Real-time available counts, damages log, and average landed costs fetched from Google Sheets.
                  </p>
                </div>
                
                <button
                  onClick={fetchInventory}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${inventoryLoading ? 'animate-spin' : ''}`} />
                  Refresh Table
                </button>
              </div>

              {inventoryLoading && inventoryList.length === 0 ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-emerald-950/60">Reading Inventory from Google Sheet...</p>
                </div>
              ) : inventoryList.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-emerald-950/50">
                  No inventory items found. Add purchases through the Procurement tab!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-emerald-100 text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">
                        <th className="py-3 px-4">Material ID</th>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Available Qty</th>
                        <th className="py-3 px-4 text-right">Damaged Qty</th>
                        <th className="py-3 px-4 text-right">Avg Landed Cost</th>
                        <th className="py-3 px-4 text-center">Alert Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-bold">
                      {inventoryList.map((item, idx) => {
                        const isLowStock = item.qtyAvailable <= item.minStockAlert;
                        return (
                          <tr key={idx} className="hover:bg-emerald-50/10 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-emerald-900/60">{item.materialId}</td>
                            <td className="py-3.5 px-4 text-emerald-950">{item.itemName}</td>
                            <td className="py-3.5 px-4 text-emerald-950/70">{item.category}</td>
                            <td className="py-3.5 px-4 text-right text-emerald-700 font-extrabold">
                              {item.qtyAvailable.toLocaleString()} units
                            </td>
                            <td className={`py-3.5 px-4 text-right ${item.qtyDamaged > 0 ? 'text-red-600' : 'text-emerald-950/50'}`}>
                              {item.qtyDamaged.toLocaleString()} units
                            </td>
                            <td className="py-3.5 px-4 text-right text-emerald-950 font-black">
                              ₹{item.avgLandedCost.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isLowStock ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-50 text-amber-800 border border-amber-200/50">
                                  Low Stock (Min: {item.minStockAlert})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100/50">
                                  Optimal Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. Leads Tab */}
          {activeTab === 'leads' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Register Lead Form */}
              <form onSubmit={handleLeadSubmit} className="lg:col-span-4 bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-950">Add Prospect Lead</h3>
                    <p className="text-[10px] font-semibold text-emerald-900/50">Register contact details for new solar installations.</p>
                  </div>
                </div>

                {leadSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {leadSuccessMsg}
                  </div>
                )}

                {leadErrorMsg && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    {leadErrorMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Client Name / Corp</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Reliance Solar Power Corp"
                      value={leadClientName}
                      onChange={(e) => setLeadClientName(e.target.value)}
                      list="existing-clients"
                      className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Phone Number</label>
                      <input 
                        type="text" 
                        required
                        placeholder="+91 99887 76655"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="contact@clientcorp.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Site Address</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sector-12, Noida Industrial Hub"
                      value={leadAddress}
                      onChange={(e) => setLeadAddress(e.target.value)}
                      className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Prospect Status</label>
                    <select 
                      value={leadStatus} 
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                    >
                      <option value="New">New Lead (Initial Capture)</option>
                      <option value="Contacted">Contacted / Callback Scheduled</option>
                      <option value="Proposal">Proposal Submitted</option>
                      <option value="Won">Contract Won (Closed-Won)</option>
                      <option value="Lost">Contract Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1 pl-1">Internal Notes</label>
                    <textarea 
                      placeholder="Add specific installer requirements, budget limits, or panel specs..."
                      value={leadNotes}
                      onChange={(e) => setLeadNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingLead}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isCreatingLead ? 'Recording Lead...' : 'Register Lead'}
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Right Column: Active Leads Table */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">Active Prospect Leads Ledger</h3>
                    <p className="text-xs font-semibold text-emerald-900/50">
                      Real-time tracker displaying qualified pipelines from the Leads sheet.
                    </p>
                  </div>
                  
                  <button
                    onClick={fetchLeads}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${leadsLoading ? 'animate-spin' : ''}`} />
                    Refresh Table
                  </button>
                </div>

                {leadsLoading && leadsList.length === 0 ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-emerald-950/60">Reading leads from database...</p>
                  </div>
                ) : leadsList.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-emerald-950/50">
                    No active prospect leads found. Register one using the form on the left!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-emerald-100 text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">
                          <th className="py-3 px-4">Lead ID</th>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4">Contact Detail</th>
                          <th className="py-3 px-4">Site Address</th>
                          <th className="py-3 px-4 text-center">Pipeline Status</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-bold">
                        {leadsList.map((lead, idx) => {
                          let badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-100/50";
                          if (lead.status === 'New') {
                            badgeStyle = "bg-blue-50 text-blue-800 border-blue-100/50";
                          } else if (lead.status === 'Contacted') {
                            badgeStyle = "bg-purple-50 text-purple-800 border-purple-100/50";
                          } else if (lead.status === 'Proposal') {
                            badgeStyle = "bg-amber-50 text-amber-800 border-amber-200/50";
                          } else if (lead.status === 'Won') {
                            badgeStyle = "bg-emerald-500 text-white border-transparent shadow-sm";
                          } else if (lead.status === 'Lost') {
                            badgeStyle = "bg-red-50 text-red-800 border-red-100/50";
                          }

                          return (
                            <tr key={idx} className="hover:bg-emerald-50/10 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-emerald-900/60">{lead.leadId}</td>
                              <td className="py-3.5 px-4 text-emerald-950">{lead.clientName}</td>
                              <td className="py-3.5 px-4 text-emerald-950/80 font-medium">
                                <div className="font-bold">{lead.phone}</div>
                                <div className="text-[10px] text-emerald-900/50 font-mono truncate max-w-44">{lead.email}</div>
                              </td>
                              <td className="py-3.5 px-4 text-emerald-950/70">{lead.address}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] border font-extrabold inline-block ${badgeStyle}`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-emerald-950/60 font-semibold max-w-xs truncate" title={lead.notes}>
                                {lead.notes || <span className="italic text-gray-300">No notes</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholders for financials */}
          {activeTab === 'financials' && (
            <div className="bg-white rounded-3xl border border-emerald-100 p-8 text-center space-y-6 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-emerald-950">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Table Structure</h2>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tab Schema verified</p>
              </div>

              <div className="bg-[#f7faf8] rounded-2xl p-4 border border-emerald-100/50 text-left space-y-3">
                <span className="block text-[9px] font-bold text-emerald-900/40 uppercase tracking-widest pl-1">Relational Fields:</span>
                <div className="flex flex-wrap gap-2">
                  {schemas.find(s => s.name.toLowerCase() === activeTab)?.columns.map((col, idx) => (
                    <span key={idx} className="text-xs font-bold bg-white text-emerald-950 border border-gray-100 px-3 py-1.5 rounded-xl">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs font-semibold text-emerald-900/60 leading-relaxed mt-4">
                This table is fully initialized in your workbook and formatted. Submitting purchase orders through the **Procurement PO** form will automatically feed items, quantities, vehicle details, driver names, and hours worked directly into their respective rows!
              </p>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3 bg-emerald-500 hover:bg-[#059669] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer mt-4"
              >
                Back to Dashboard
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Dynamic Overlay Modals */}
      {/* 1. Add Supplier Account Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-[#062419]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-emerald-100/30 pb-3">
              <h3 className="font-extrabold text-emerald-950 text-sm">Register Supplier Account</h3>
              <button 
                type="button" 
                onClick={() => setShowAddSupplierModal(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Adani Solar Labs"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">GST Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="27AAAAA0000A1Z5"
                    value={newSupplierGst}
                    onChange={(e) => setNewSupplierGst(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Contact Person</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+91 99887 76655"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Payment Terms</label>
                  <select 
                    value={newSupplierTerms}
                    onChange={(e) => setNewSupplierTerms(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="50-50 Split">50-50 Advanced Split</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSupplier}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
              >
                {isSubmittingSupplier ? 'Creating in Google Sheets...' : 'Register Supplier Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Inventory Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-[#062419]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between border-b border-emerald-100/30 pb-3">
              <h3 className="font-extrabold text-emerald-950 text-sm">Add Material Item</h3>
              <button 
                type="button" 
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Item Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bifacial Panels 600W"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Category</label>
                  <select 
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Mounting">Mounting Structure</option>
                    <option value="Cables">Cables & Connectors</option>
                    <option value="Electricals">Electrical BOS</option>
                    <option value="Batteries">Battery Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1">Min Stock Alert</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingItem}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
              >
                {isSubmittingItem ? 'Creating in Google Sheets...' : 'Add Material Catalog Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Outbound Material Dispatch Modal */}
      {showDispatchModal && selectedProject && (
        <div className="fixed inset-0 bg-[#062419]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-100 w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-emerald-950">Outbound Material Dispatch</h3>
              </div>
              <button 
                onClick={() => {
                  setShowDispatchModal(false);
                  setDispatchSuccessMsg(null);
                  setDispatchErrorMsg(null);
                }}
                className="text-emerald-950/40 hover:text-emerald-950 transition-colors text-sm font-bold bg-emerald-50 hover:bg-emerald-100/50 p-1.5 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] font-semibold text-emerald-950/60 -mt-1 leading-relaxed">
              Verify stock headroom and dispatch panels directly onto **{selectedProject.projectName}**.
            </p>

            {dispatchSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {dispatchSuccessMsg}
              </div>
            )}

            {dispatchErrorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {dispatchErrorMsg}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Target Project</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedProject.projectName} (${selectedProject.projectId})`}
                  className="w-full bg-[#f4f7f5] border border-gray-150 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950/70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Material Hardware</label>
                <select
                  value={dispatchMaterialId}
                  onChange={(e) => setDispatchMaterialId(e.target.value)}
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                >
                  {inventoryList.length === 0 ? (
                    Object.keys(inventoryStockMap).map((matId) => (
                      <option key={matId} value={matId}>
                        {inventoryStockMap[matId].name} ({matId})
                      </option>
                    ))
                  ) : (
                    inventoryList.map((item) => (
                      <option key={item.materialId} value={item.materialId}>
                        {item.itemName} ({item.materialId})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Dispatch Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityUsed}
                    onChange={(e) => setQuantityUsed(Number(e.target.value))}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950"
                  />
                </div>
              </div>

              {/* Stock verification alert indicator */}
              <div className={`p-3 rounded-2xl border text-[11px] font-semibold flex items-start gap-2.5 ${(isStockExceeded || isQuantityInvalid)
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : isStockLowAfterDispatch
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50/50 border-emerald-100/50 text-emerald-800'
                }`}>
                {isQuantityInvalid ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase block text-[9px] text-red-700 mb-0.5">Invalid Dispatch Quantity</span>
                      Dispatch quantity must be a positive number greater than 0.
                    </div>
                  </>
                ) : isStockExceeded ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase block text-[9px] text-red-700 mb-0.5">Warehouse Headroom Overlimit</span>
                      Requested ({quantityUsed}) exceeds active balance ({selectedMaterialStock} units). Sheets will reject write!
                    </div>
                  </>
                ) : isStockLowAfterDispatch ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase block text-[9px] text-amber-750 mb-0.5">Low Stock Warning</span>
                      Available stock ({selectedMaterialStock} units) is sufficient, but remaining stock ({selectedMaterialStock - quantityUsed} units) will fall below safety threshold ({selectedMaterialMinStock} units).
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase block text-[9px] text-emerald-650 mb-0.5">Stock Headroom Verified</span>
                      We have {selectedMaterialStock} units available. Headroom: Safe to dispatch outbound (remaining: {selectedMaterialStock - quantityUsed} units).
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isDispatching || isStockExceeded || isQuantityInvalid}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDispatching ? 'Logging usage...' : 'Log Outbound Dispatch'}
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Operational Grid Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-[#062419]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-100 w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-emerald-950">Create Operational Grid Project</h3>
              </div>
              <button 
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setProjectSuccessMsg(null);
                  setProjectErrorMsg(null);
                }}
                className="text-emerald-950/40 hover:text-emerald-950 transition-colors text-sm font-bold bg-emerald-50 hover:bg-emerald-100/50 p-1.5 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] font-semibold text-emerald-950/60 -mt-1 leading-relaxed">
              Register target installation scope and revenue milestones.
            </p>

            {projectSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {projectSuccessMsg}
              </div>
            )}

            {projectErrorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {projectErrorMsg}
              </div>
            )}

            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Project Target Name</label>
                <input
                  type="text"
                  required
                  placeholder="Solar Array Grid - Mumbai Airport"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Client Corp Name</label>
                <input
                  type="text"
                  required
                  placeholder="Adani Infrastructure Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  list="existing-clients"
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-950 uppercase mb-1.5 pl-1">Contract Revenue Milestones (₹)</label>
                <input
                  type="number"
                  required
                  value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingProject}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isCreatingProject ? 'Writing sheet...' : 'Initiate Operational Project'}
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <datalist id="existing-clients">
        {existingClientNames.map((name, idx) => (
          <option key={idx} value={name} />
        ))}
      </datalist>
    </div>
  );
}


