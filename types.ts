export interface Customer {
  id: string;
  name: string;
  address: string;
  email: string;
  wechat: string;
  contactPerson: string;
  salesperson: string;
  source: string; // New field
  createdAt: number;
}

export enum OpportunityStatus {
  INITIAL = '初步接触',
  NEED_ANALYSIS = '需求分析',
  PROPOSAL = '方案提供',
  NEGOTIATION = '商务谈判',
  CONTRACT = '合同签订',
  WON = '赢单',
  LOST = '输单',
}

export interface VisitRecord {
  id: string;
  date: string;
  content: string;
  createdAt: number;
}

export interface Opportunity {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  salesperson: string;
  status: OpportunityStatus;
  visitRecords: VisitRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  isRead: boolean;
}

export type ViewState = 'CUSTOMERS' | 'OPPORTUNITIES';