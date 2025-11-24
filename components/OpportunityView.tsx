import React, { useState } from 'react';
import { Customer, Opportunity, OpportunityStatus, VisitRecord } from '../types';
import { Modal } from './Modal';
import { analyzeOpportunity } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface OpportunityViewProps {
  opportunities: Opportunity[];
  customers: Customer[];
  onAdd: (o: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'visitRecords'>) => void;
  onUpdate: (id: string, updates: Partial<Opportunity>) => void;
  onDelete: (id: string) => void;
  onAddVisit: (oppId: string, record: Omit<VisitRecord, 'id' | 'createdAt'>) => void;
}

export const OpportunityView: React.FC<OpportunityViewProps> = ({ 
  opportunities, customers, onAdd, onUpdate, onDelete, onAddVisit 
}) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('KANBAN');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  
  // Filter State
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<OpportunityStatus | 'ALL'>('ALL');

  // New Opp Form State
  const [newOppData, setNewOppData] = useState({
    customerId: '',
    salesperson: '',
    status: OpportunityStatus.INITIAL,
  });

  // New Visit Form State
  const [newVisitData, setNewVisitData] = useState({ date: '', content: '' });

  // Filtering Logic
  const filteredOpportunities = opportunities.filter(opp => {
    const text = filterText.toLowerCase();
    const matchesText = 
      opp.customerName.toLowerCase().includes(text) ||
      opp.salesperson.toLowerCase().includes(text) ||
      opp.id.toLowerCase().includes(text);
    
    const matchesStatus = filterStatus === 'ALL' || opp.status === filterStatus;

    return matchesText && matchesStatus;
  });

  const clearFilters = () => {
    setFilterText('');
    setFilterStatus('ALL');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newOppData.customerId);
    if (!customer) return;

    onAdd({
      customerId: customer.id,
      customerName: customer.name,
      salesperson: newOppData.salesperson || customer.salesperson, // Default to customer salesperson if empty
      status: newOppData.status,
    });
    setNewOppData({ customerId: '', salesperson: '', status: OpportunityStatus.INITIAL });
    setIsAddModalOpen(false);
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;
    onAddVisit(selectedOpp.id, newVisitData);
    setNewVisitData({ date: '', content: '' });
  };

  const openDetail = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setAiAnalysis(null);
    setIsDetailModalOpen(true);
  };

  const runAnalysis = async () => {
    if (!selectedOpp) return;
    setIsAiLoading(true);
    const result = await analyzeOpportunity(selectedOpp);
    setAiAnalysis(result);
    setIsAiLoading(false);
  };

  // Drag and Drop Logic for Kanban
  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("oppId", oppId);
    // Add a ghost effect if needed, but default browser behavior is usually fine
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, status: OpportunityStatus) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("oppId");
    if (oppId) {
      onUpdate(oppId, { status });
    }
  };

  const statusColors = {
    [OpportunityStatus.INITIAL]: 'bg-blue-100 text-blue-800 border-blue-200',
    [OpportunityStatus.NEED_ANALYSIS]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    [OpportunityStatus.PROPOSAL]: 'bg-purple-100 text-purple-800 border-purple-200',
    [OpportunityStatus.NEGOTIATION]: 'bg-orange-100 text-orange-800 border-orange-200',
    [OpportunityStatus.CONTRACT]: 'bg-teal-100 text-teal-800 border-teal-200',
    [OpportunityStatus.WON]: 'bg-green-100 text-green-800 border-green-200',
    [OpportunityStatus.LOST]: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const kanbanColumns = Object.values(OpportunityStatus);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 text-sm mt-1">Track deals, visits, and close rates.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-lg border shadow-sm flex">
            <button 
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'LIST' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'KANBAN' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Kanban
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New Opportunity
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg border shadow-sm flex flex-col sm:flex-row gap-3 flex-shrink-0 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Filter by Customer, Salesperson, or ID..."
            className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <select
          className="block w-full sm:w-48 pl-3 pr-10 py-1.5 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OpportunityStatus | 'ALL')}
        >
          <option value="ALL">All Statuses</option>
          {Object.values(OpportunityStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        {(filterText || filterStatus !== 'ALL') && (
           <button 
             onClick={clearFilters}
             className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
           >
             Clear
           </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {viewMode === 'LIST' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg flex-1 flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opp ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOpportunities.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">No opportunities found matching your filters.</td></tr>
                  ) : (
                    filteredOpportunities.map(opp => (
                      <tr key={opp.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(opp)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{opp.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{opp.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColors[opp.status]}`}>
                            {opp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opp.salesperson}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opp.visitRecords.length} record(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(opp.id); }}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
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
        ) : (
          /* Kanban Board */
          <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 h-full min-w-max px-1">
              {kanbanColumns.map(status => {
                // Filter the opportunities for this column using the filtered list
                const columnOpps = filteredOpportunities.filter(o => o.status === status);
                return (
                  <div 
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="w-80 flex flex-col bg-gray-100 rounded-lg shadow-sm border border-gray-200 max-h-full"
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg sticky top-0 z-10">
                      <span className="font-semibold text-gray-700 text-sm truncate" title={status}>{status}</span>
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{columnOpps.length}</span>
                    </div>
                    
                    {/* Cards Container */}
                    <div className="p-2 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                      {columnOpps.map(opp => (
                        <div
                          key={opp.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          onClick={() => openDetail(opp)}
                          className="bg-white p-3 rounded shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-shadow active:cursor-grabbing group"
                        >
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold text-gray-400">{opp.id}</span>
                             <span className="text-xs text-indigo-500">{opp.salesperson}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{opp.customerName}</h4>
                          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>{opp.visitRecords.length} visits</span>
                            <span className="text-gray-400">{new Date(opp.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {columnOpps.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-center text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded m-1">
                           {filterText || filterStatus !== 'ALL' ? 'No match' : 'No Deals'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Opportunity Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Opportunity">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              value={newOppData.customerId}
              onChange={e => setNewOppData({...newOppData, customerId: e.target.value})}
            >
              <option value="">Select a Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.contactPerson})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Salesperson</label>
            <input 
              type="text" 
              placeholder="Leave blank to use customer's salesperson"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              value={newOppData.salesperson}
              onChange={e => setNewOppData({...newOppData, salesperson: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Initial Status</label>
            <select 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              value={newOppData.status}
              onChange={e => setNewOppData({...newOppData, status: e.target.value as OpportunityStatus})}
            >
              {Object.values(OpportunityStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Create</button>
          </div>
        </form>
      </Modal>

      {/* Detail / Edit Modal */}
      {selectedOpp && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Opportunity: ${selectedOpp.id}`}>
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">{selectedOpp.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salesperson</p>
                <p className="font-semibold text-gray-900">{selectedOpp.salesperson}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Current Status</p>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 text-sm p-2 border"
                  value={selectedOpp.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as OpportunityStatus;
                    onUpdate(selectedOpp.id, { status: newStatus });
                    setSelectedOpp({ ...selectedOpp, status: newStatus });
                  }}
                >
                  {Object.values(OpportunityStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Visit Records */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Visit Records</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {selectedOpp.visitRecords.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No visits recorded yet.</p>
                ) : (
                  selectedOpp.visitRecords.map(visit => (
                    <div key={visit.id} className="border-l-4 border-indigo-200 bg-indigo-50 p-3 rounded-r-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-800">{visit.date}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{visit.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Visit Form */}
              <form onSubmit={handleAddVisit} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Log New Visit</p>
                <div className="flex gap-2 mb-2">
                  <input 
                    required 
                    type="date" 
                    className="border rounded p-1 text-sm"
                    value={newVisitData.date}
                    onChange={e => setNewVisitData({...newVisitData, date: e.target.value})}
                  />
                </div>
                <textarea 
                  required
                  placeholder="What happened during the visit?"
                  className="w-full border rounded p-2 text-sm h-20 mb-2"
                  value={newVisitData.content}
                  onChange={e => setNewVisitData({...newVisitData, content: e.target.value})}
                />
                <div className="text-right">
                  <button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">Add Record</button>
                </div>
              </form>
            </div>

            {/* AI Analysis Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <span className="text-purple-600">✨</span> AI Smart Analysis
                </h3>
                <button 
                  onClick={runAnalysis} 
                  disabled={isAiLoading}
                  className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isAiLoading ? 'Analyzing...' : 'Analyze Opportunity'}
                </button>
              </div>
              
              {aiAnalysis && (
                 <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg prose prose-sm prose-purple max-w-none">
                   {/* We need ReactMarkdown to render the Gemini response properly */}
                   <style>{`
                     .prose ul { margin-top: 0.5em; margin-bottom: 0.5em; list-style-type: disc; padding-left: 1.5em; }
                     .prose li { margin-top: 0.25em; margin-bottom: 0.25em; }
                     .prose strong { color: #4c1d95; }
                   `}</style>
                   <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                 </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};