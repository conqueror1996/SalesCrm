'use client';

import { useState, useEffect } from 'react';

type Lead = {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    product?: string;
    quantity?: string;
    city?: string;
    message?: string;
    status: string;
    receivedAt: string;
    source: string;
};

export default function LeadsDashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads');
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
        const interval = setInterval(fetchLeads, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lead Capture Engine</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Real-time IndiaMART Integration • <span className="text-green-600 font-medium">Live</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{leads.length}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Leads</div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500">New Today</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {leads.filter(l => new Date(l.receivedAt).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500">Pending Action</h3>
                        <p className="text-2xl font-bold text-orange-600 mt-2">
                            {leads.filter(l => l.status === 'NEW').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500">System Status</h3>
                        <div className="flex items-center mt-2 space-x-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-sm font-medium text-gray-700">Listener Active</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Last sync: {lastUpdated?.toLocaleTimeString()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
                        <span className="text-xs bg-blue-50 text-blue-700 py-1 px-2 rounded-full font-medium">Auto-refreshing</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Buyer Details</th>
                                    <th className="px-6 py-4 font-medium">Requirement</th>
                                    <th className="px-6 py-4 font-medium">Location</th>
                                    <th className="px-6 py-4 font-medium">Received</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            No leads captured yet. Waiting for incoming emails...
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                        lead.status === 'follow_up' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{lead.name}</div>
                                                <div className="text-gray-500">{lead.phone}</div>
                                                <div className="text-gray-400 text-xs">{lead.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{lead.product}</div>
                                                <div className="text-gray-500">Qty: {lead.quantity || 'N/A'}</div>
                                                {lead.message && (
                                                    <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded max-w-xs truncate">
                                                        "{lead.message}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {lead.city || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(lead.receivedAt).toLocaleString()}
                                                <div className="text-xs text-gray-400 mt-1">{lead.source}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
