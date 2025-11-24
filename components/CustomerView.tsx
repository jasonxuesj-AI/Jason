import React, { useState, useEffect } from 'react';
import { Customer, EmailMessage } from '../types';
import { Modal } from './Modal';
import { useCRMStore } from '../services/store'; // Importing directly to use the fetch function

interface CustomerViewProps {
  customers: Customer[];
  onAdd: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

const CUSTOMER_SOURCES = [
  '官网',
  '展会',
  '朋友推荐',
  '广告',
  '电话',
  '其他'
];

export const CustomerView: React.FC<CustomerViewProps> = ({ customers, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedCustomerForEmail, setSelectedCustomerForEmail] = useState<Customer | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const { fetchOutlookEmails } = useCRMStore();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    wechat: '',
    contactPerson: '',
    salesperson: '',
    source: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      email: '',
      wechat: '',
      contactPerson: '',
      salesperson: '',
      source: '',
    });
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      address: customer.address,
      email: customer.email,
      wechat: customer.wechat,
      contactPerson: customer.contactPerson,
      salesperson: customer.salesperson,
      source: customer.source || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEmails = async (customer: Customer) => {
    setSelectedCustomerForEmail(customer);
    setIsEmailModalOpen(true);
    setIsLoadingEmails(true);
    try {
      const result = await fetchOutlookEmails(customer.email);
      setEmails(result);
    } catch (error) {
      console.error("Error fetching emails", error);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.salesperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.source && c.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your client relationships.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name, contact, source or salesperson..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow sm:rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID & Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No customers found. Add one to get started.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-indigo-600">{customer.id}</span>
                        <span className="text-sm font-semibold text-gray-900">{customer.name}</span>
                        <span className="text-xs text-gray-400">{customer.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {customer.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.contactPerson}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 12.5h7m-7 3h7m-7-6h7m6-7H2.5A1.5 1.5 0 001 4v16a1.5 1.5 0 001.5 1.5h19A1.5 1.5 0 0023 20V4a1.5 1.5 0 00-1.5-1.5z"/></svg>
                        {customer.wechat || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.salesperson}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenEmails(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-4 flex-inline items-center gap-1"
                        title="View Emails"
                      >
                         <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         Emails
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(customer)} 
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button onClick={() => onDelete(customer.id)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Person</label>
              <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Source</label>
              <input 
                list="source-options" 
                type="text"
                placeholder="Select or type..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.source}
                onChange={e => setFormData({...formData, source: e.target.value})}
              />
              <datalist id="source-options">
                {CUSTOMER_SOURCES.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WeChat ID</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.wechat} onChange={e => setFormData({...formData, wechat: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Salesperson</label>
              <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.salesperson} onChange={e => setFormData({...formData, salesperson: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              {editingId ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Email Correspondence Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Email Correspondence">
        <div className="min-h-[400px] flex flex-col">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                   <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                   <h3 className="font-semibold text-blue-900">Outlook Integration</h3>
                   <p className="text-sm text-blue-700">Syncing with {selectedCustomerForEmail?.email}</p>
                </div>
             </div>
             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected
             </span>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg bg-white">
            {isLoadingEmails ? (
              <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-500">Fetching emails from Outlook...</p>
              </div>
            ) : emails.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {emails.map(email => (
                  <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                     <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-medium ${email.isRead ? 'text-gray-900' : 'text-indigo-700 font-bold'}`}>
                           {email.subject}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {new Date(email.receivedDateTime).toLocaleDateString()}
                        </span>
                     </div>
                     <p className="text-xs text-gray-500 mb-2">From: {email.sender}</p>
                     <p className="text-sm text-gray-600 line-clamp-2">{email.bodyPreview}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <p>No email history found with this contact.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setIsEmailModalOpen(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};