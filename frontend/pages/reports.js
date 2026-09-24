import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import {
 FileText,
 Plus,
 Play,
 Trash2,
 Edit,
 Settings,
 ChevronDown,
 Check,
 Download,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Reports() {
 const [reports, setReports] = useState([]);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [showRunModal, setShowRunModal] = useState(false);
 const [selectedReport, setSelectedReport] = useState(null);
 const [reportData, setReportData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [running, setRunning] = useState(false);
 const [availableColumns, setAvailableColumns] = useState([]);

 const [newReport, setNewReport] = useState({
 name: '',
 description: '',
 type: 'sales',
 columns: [],
 groupBy: '',
 sortBy: '',
 sortOrder: 'ASC',
 });

 useEffect(() => {
 loadReports();
 }, []);

 const loadReports = async () => {
 try {
 const data = await apiGet('/reports/list');
 setReports(data.reports || []);
 } catch (error) {
 console.error('Failed to load reports', error);
 } finally {
 setLoading(false);
 }
 };

 const loadAvailableColumns = async (type) => {
 try {
 const data = await apiGet(`/reports/columns/${type}`);
 setAvailableColumns(data.columns || []);
 } catch (error) {
 console.error('Failed to load columns', error);
 }
 };

 const handleTypeChange = (type) => {
 setNewReport(prev => ({ ...prev, type, columns: [] }));
 loadAvailableColumns(type);
 };

 const toggleColumn = (column) => {
 setNewReport(prev => ({
 ...prev,
 columns: prev.columns.includes(column)
 ? prev.columns.filter(c => c !== column)
 : [...prev.columns, column],
 }));
 };

 const createReport = async () => {
 if (!newReport.name || newReport.columns.length === 0) {
 toast.error('Please fill in required fields');
 return;
 }

 try {
 await apiPost('/reports/create', newReport);
 toast.success('Report created successfully');
 setShowCreateModal(false);
 setNewReport({
 name: '',
 description: '',
 type: 'sales',
 columns: [],
 groupBy: '',
 sortBy: '',
 sortOrder: 'ASC',
 });
 loadReports();
 } catch (error) {
 toast.error('Failed to create report');
 }
 };

 const runReport = async (reportId) => {
 setRunning(true);
 try {
 const data = await apiPost(`/reports/${reportId}/run`);
 setReportData(data);
 setShowRunModal(true);
 toast.success('Report generated');
 } catch (error) {
 toast.error('Failed to run report');
 } finally {
 setRunning(false);
 }
 };

 const deleteReport = async (reportId) => {
 if (!confirm('Are you sure you want to delete this report?')) {
 return;
 }

 try {
 await apiDelete(`/reports/${reportId}`);
 toast.success('Report deleted');
 setReports(reports.filter(r => r.id !== reportId));
 } catch (error) {
 toast.error('Failed to delete report');
 }
 };

 if (loading) {
 return (
 <Layout title="Custom Reports">
 <div className="bg-surface border hairline rounded-xs text-center py-16 portal-text">
 Loading...
 </div>
 </Layout>
 );
 }

 return (
 <Layout title="Custom Reports">
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xs bg-ember-500/15 flex items-center justify-center">
 <FileText className="w-5 h-5 text-ember-500" />
 </div>
 <div>
 <h3 className="portal-heading text-lg">Custom Reports</h3>
 <p className="portal-label text-ink-3">{reports.length} report(s)</p>
 </div>
 </div>
  <button
  onClick={() => {
  setShowCreateModal(true);
  loadAvailableColumns('sales');
  }}
  className="px-4 py-2 bg-ember-500 text-white rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased hover:bg-ember-600 flex items-center gap-2"
  >
  <Plus size={18} className="text-white" />
  Create Report
  </button>
  </div>

 {/* Reports List */}
 {reports.length === 0 ? (
 <div className="bg-surface border hairline rounded-xs p-8 text-center">
 <FileText className="w-12 h-12 text-ink-3 mx-auto mb-4" />
 <p className="portal-label text-ink-3 mb-4">No custom reports yet</p>
  <button
  onClick={() => {
  setShowCreateModal(true);
  loadAvailableColumns('sales');
  }}
  className="px-4 py-2 bg-ember-500 text-white rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased hover:bg-ember-600"
  >
  Create Your First Report
  </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {reports.map((report) => (
 <div key={report.id} className="bg-surface border hairline rounded-xs p-5 hover:border-ember-500/30 transition-colors">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h4 className="portal-heading font-semibold">{report.name}</h4>
 <p className="portal-label text-ink-3 text-sm mt-1">{report.description || 'No description'}</p>
 </div>
 <span className="px-2 py-1 bg-ember-500/15 text-ember-500 rounded text-xs portal-label">
 {report.type}
 </span>
 </div>
 <div className="flex gap-2 mt-4">
 <button
 onClick={() => runReport(report.id)}
 disabled={running}
 className="flex-1 px-3 py-2 bg-olive/20 text-olive rounded-xs portal-label font-semibold hover:bg-olive/30 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 <Play size={16} />
 Run
 </button>
 <button
 onClick={() => deleteReport(report.id)}
 className="p-2 text-clay hover:bg-clay/10 rounded-xs"
 >
 <Trash2 size={18} />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Create Report Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface border hairline rounded-xs p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <h3 className="portal-heading text-lg">Create Custom Report</h3>
 <button
 onClick={() => setShowCreateModal(false)}
 className="p-2 hover:bg-canvas rounded-xs"
 >
 ×
 </button>
 </div>

 <div className="space-y-4">
 <div>
 <label className="portal-label block mb-2">Report Name *</label>
 <input
 type="text"
 value={newReport.name}
 onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-text focus:outline-none focus:border-ember-500"
 />
 </div>

 <div>
 <label className="portal-label block mb-2">Description</label>
 <textarea
 value={newReport.description}
 onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-text focus:outline-none focus:border-ember-500 resize-none"
 rows={2}
 />
 </div>

 <div>
 <label className="portal-label block mb-2">Report Type *</label>
 <select
 value={newReport.type}
 onChange={(e) => handleTypeChange(e.target.value)}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-text focus:outline-none focus:border-ember-500"
 >
 <option value="sales">Sales</option>
 <option value="products">Products</option>
 <option value="customers">Customers</option>
 <option value="inventory">Inventory</option>
 </select>
 </div>

 <div>
 <label className="portal-label block mb-2">Select Columns *</label>
 <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-canvas p-3 rounded-xs border hairline">
 {availableColumns.map((column) => (
 <button
 key={column}
 onClick={() => toggleColumn(column)}
 className={`flex items-center gap-2 p-2 rounded-xs text-left portal-label transition-colors ${
 newReport.columns.includes(column)
 ? 'bg-ember-500/20 text-ember-500'
 : 'hover:bg-canvas/50'
 }`}
 >
 {newReport.columns.includes(column) && <Check size={14} />}
 {column}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="portal-label block mb-2">Group By</label>
 <select
 value={newReport.groupBy}
 onChange={(e) => setNewReport(prev => ({ ...prev, groupBy: e.target.value }))}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-text focus:outline-none focus:border-ember-500"
 >
 <option value="">None</option>
 {newReport.columns.map((col) => (
 <option key={col} value={col}>{col}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="portal-label block mb-2">Sort By</label>
 <select
 value={newReport.sortBy}
 onChange={(e) => setNewReport(prev => ({ ...prev, sortBy: e.target.value }))}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-text focus:outline-none focus:border-ember-500"
 >
 <option value="">None</option>
 {newReport.columns.map((col) => (
 <option key={col} value={col}>{col}</option>
 ))}
 </select>
 </div>
 </div>

 <div>
 <label className="portal-label block mb-2">Sort Order</label>
 <div className="flex gap-3">
  <button
  onClick={() => setNewReport(prev => ({ ...prev, sortOrder: 'ASC' }))}
  className={`flex-1 px-4 py-2 rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased ${
  newReport.sortOrder === 'ASC' ? 'bg-ember-500 text-white' : 'bg-canvas border hairline text-ink-2'
  }`}
  >
  Ascending
  </button>
  <button
  onClick={() => setNewReport(prev => ({ ...prev, sortOrder: 'DESC' }))}
  className={`flex-1 px-4 py-2 rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased ${
  newReport.sortOrder === 'DESC' ? 'bg-ember-500 text-white' : 'bg-canvas border hairline text-ink-2'
  }`}
  >
  Descending
  </button>
 </div>
 </div>

  <div className="flex gap-3 pt-4">
  <button
  onClick={createReport}
  className="flex-1 px-4 py-2 bg-ember-500 text-white rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased hover:bg-ember-600"
  >
  Create Report
  </button>
  <button
  onClick={() => setShowCreateModal(false)}
  className="px-4 py-2 bg-canvas border hairline rounded-xs font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] antialiased text-ink-2 hover:text-ink hover:bg-surface transition-colors"
  >
  Cancel
  </button>
  </div>
 </div>
 </div>
 </div>
 )}

 {/* Report Results Modal */}
 {showRunModal && reportData && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface border hairline rounded-xs p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
  <div className="flex items-center justify-between mb-6">
  <div>
  <h3 className="portal-heading text-lg">{reportData.reportName}</h3>
  <p className="portal-label text-ink-3">{reportData.rowCount} rows</p>
  </div>
  <div className="flex items-center gap-2">
  <button
  onClick={async () => {
  try {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = (await import('js-cookie')).default.get('sba_token');
  const res = await fetch(`${base}/reports/${reportData.reportId}/export/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    let msg = 'Export failed';
    try { const j = await res.json(); msg = j.detail || j.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportData.reportName.replace(/[^a-z0-9_-]/gi,'_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success('PDF downloaded');
  } catch (e) { toast.error(e.message || 'Failed to export PDF'); }
  }}
  className="flex items-center gap-2 px-3 py-2 bg-ember-500 text-white rounded-xs font-mono text-[12.5px] font-bold uppercase tracking-[0.12em] antialiased hover:bg-ember-600"
  >
  <Download size={14} className="text-white" /> Export PDF
  </button>
  <button
  onClick={() => setShowRunModal(false)}
  className="p-2 hover:bg-canvas rounded-xs text-ink-2 hover:text-ink"
  >
  ×
  </button>
  </div>
  </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-hairline">
 {reportData.columns.map((col) => (
 <th key={col} className="portal-label font-semibold text-left p-3">
 {col}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {reportData.data.map((row, i) => (
 <tr key={i} className="border-b border-hairline/50">
 {reportData.columns.map((col) => (
 <td key={col} className="portal-label p-3">
 {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>
 </Layout>
 );
}
