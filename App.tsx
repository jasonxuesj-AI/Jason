import React, { useState } from 'react';
import { useCRMStore } from './services/store';
import { CustomerView } from './components/CustomerView';
import { OpportunityView } from './components/OpportunityView';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('CUSTOMERS');
  const store = useCRMStore();

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-full z-20 shadow-lg md:shadow-none">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            SwiftCRM
          </h1>
        </div>
        <nav className="mt-2 px-4 space-y-2 flex-1 overflow-y-auto">
          <button
            onClick={() => setCurrentView('CUSTOMERS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'CUSTOMERS' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customers
          </button>
          <button
            onClick={() => setCurrentView('OPPORTUNITIES')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'OPPORTUNITIES' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Opportunities
          </button>
        </nav>
        
        <div className="p-4 w-full flex-shrink-0">
          <div className="bg-slate-800 rounded-lg p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200 mb-1">Gemini AI Enabled</p>
            <p>Use "Smart Analysis" in Opportunities to get AI insights on your deals.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            {currentView === 'CUSTOMERS' ? (
              <CustomerView 
                customers={store.customers} 
                onAdd={store.addCustomer}
                onUpdate={store.updateCustomer}
                onDelete={store.deleteCustomer}
              />
            ) : (
              <OpportunityView 
                opportunities={store.opportunities}
                customers={store.customers}
                onAdd={store.addOpportunity}
                onUpdate={store.updateOpportunity}
                onDelete={store.deleteOpportunity}
                onAddVisit={store.addVisitRecord}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}