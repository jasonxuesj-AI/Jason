import { useState, useEffect, useCallback } from 'react';
import { Customer, Opportunity, VisitRecord, OpportunityStatus, EmailMessage } from '../types';

const STORAGE_KEY_CUSTOMERS = 'crm_customers_v3'; // Bumped version
const STORAGE_KEY_OPPORTUNITIES = 'crm_opportunities_v3'; // Bumped version

// Seed data to make the app look good initially
const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'TechFlow Solutions',
    address: '123 Innovation Blvd, Shenzhen',
    email: 'contact@techflow.example.com',
    wechat: 'techflow_master',
    contactPerson: 'Alice Chen',
    salesperson: 'John Doe',
    source: '官网',
    createdAt: Date.now(),
  },
  {
    id: 'CUST-002',
    name: 'Global Logistics Corp',
    address: '456 Harbor Rd, Shanghai',
    email: 'ops@globallog.example.com',
    wechat: 'gl_ops_team',
    contactPerson: 'Bob Wang',
    salesperson: 'Sarah Lee',
    source: '展会',
    createdAt: Date.now(),
  }
];

const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'OPP-001',
    customerId: 'CUST-001',
    customerName: 'TechFlow Solutions',
    salesperson: 'John Doe',
    status: OpportunityStatus.PROPOSAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    visitRecords: [
      { id: 'v1', date: '2023-10-01', content: 'Initial meeting to discuss ERP needs.', createdAt: Date.now() },
      { id: 'v2', date: '2023-10-15', content: 'Demo presentation. Client seemed interested in the reporting module.', createdAt: Date.now() }
    ]
  },
  {
    id: 'OPP-002',
    customerId: 'CUST-002',
    customerName: 'Global Logistics Corp',
    salesperson: 'Sarah Lee',
    status: OpportunityStatus.INITIAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    visitRecords: []
  }
];

export const useCRMStore = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = () => {
      try {
        const storedCust = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
        const storedOpp = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES);

        if (storedCust) {
          setCustomers(JSON.parse(storedCust));
        } else {
          setCustomers(SEED_CUSTOMERS);
          localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
        }

        if (storedOpp) {
          setOpportunities(JSON.parse(storedOpp));
        } else {
          setOpportunities(SEED_OPPORTUNITIES);
          localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(SEED_OPPORTUNITIES));
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save Helpers
  const saveCustomers = (data: Customer[]) => {
    setCustomers(data);
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(data));
  };

  const saveOpportunities = (data: Opportunity[]) => {
    setOpportunities(data);
    localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(data));
  };

  // Actions
  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `CUST-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
    };
    saveCustomers([newCustomer, ...customers]);
  }, [customers]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCustomers(updated);
    
    // Also update denormalized names in opportunities if name changed
    if (updates.name) {
      const updatedOpps = opportunities.map(o => o.customerId === id ? { ...o, customerName: updates.name! } : o);
      saveOpportunities(updatedOpps);
    }
  }, [customers, opportunities]);

  const deleteCustomer = useCallback((id: string) => {
    saveCustomers(customers.filter(c => c.id !== id));
  }, [customers]);

  const addOpportunity = useCallback((opp: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'visitRecords'>) => {
    const newOpp: Opportunity = {
      ...opp,
      id: `OPP-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visitRecords: [],
    };
    saveOpportunities([newOpp, ...opportunities]);
  }, [opportunities]);

  const updateOpportunity = useCallback((id: string, updates: Partial<Opportunity>) => {
    const updated = opportunities.map(o => o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o);
    saveOpportunities(updated);
  }, [opportunities]);

  const addVisitRecord = useCallback((oppId: string, record: Omit<VisitRecord, 'id' | 'createdAt'>) => {
    const newRecord: VisitRecord = {
      ...record,
      id: `VISIT-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
    };
    const updated = opportunities.map(o => {
      if (o.id === oppId) {
        return { ...o, visitRecords: [newRecord, ...o.visitRecords], updatedAt: Date.now() };
      }
      return o;
    });
    saveOpportunities(updated);
  }, [opportunities]);

  const deleteOpportunity = useCallback((id: string) => {
    saveOpportunities(opportunities.filter(o => o.id !== id));
  }, [opportunities]);

  // SIMULATED Outlook Integration
  // In a real app, this would call Microsoft Graph API
  const fetchOutlookEmails = async (customerEmail: string): Promise<EmailMessage[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!customerEmail || !customerEmail.includes('@')) {
      return [];
    }

    // Return fake data for demo
    return [
      {
        id: 'msg_1',
        subject: 'Re: Quotation for Q4 Project',
        sender: customerEmail,
        receivedDateTime: new Date().toISOString(),
        bodyPreview: 'Hi John, thanks for the quotation. We are reviewing the pricing...',
        isRead: true
      },
      {
        id: 'msg_2',
        subject: 'Meeting Confirmation',
        sender: customerEmail,
        receivedDateTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        bodyPreview: 'Confirmed. See you at our office on Tuesday at 2 PM.',
        isRead: true
      },
      {
        id: 'msg_3',
        subject: 'Inquiry about API specs',
        sender: customerEmail,
        receivedDateTime: new Date(Date.now() - 86400000 * 5).toISOString(),
        bodyPreview: 'Can you send over the updated API documentation?',
        isRead: false
      }
    ];
  };

  return {
    customers,
    opportunities,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    addVisitRecord,
    fetchOutlookEmails
  };
};