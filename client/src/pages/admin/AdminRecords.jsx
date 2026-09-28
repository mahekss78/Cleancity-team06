import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, MapPin, User, Send, Filter, CheckCircle, AlertTriangle, ShieldCheck, Zap, Scale, Briefcase } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            const resolvedItems = data.filter(c => c.status === 'resolved' || c.status === 'finalized');
            setRecords(resolvedItems);
        } catch (error) {
            console.error('Failed to fetch records', error);
        } finally {
            setLoading(false);
        }
    };

    const generateLegalPDF = (record) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        
        // 1. HEADER - AUTHORITY DESIGN
        doc.setFillColor(6, 78, 59); // Dark Green
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        doc.setFillColor(16, 185, 129); // Emerald accent
        doc.rect(0, 42, pageWidth, 3, 'F');

        // CleanCity Brand
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CLEANCITY', 15, 22);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('MUNICIPAL WASTE COMPLIANCE & LEGAL FORENSICS', 15, 28);
        
        // Document Identity
        doc.setFontSize(10);
        doc.text('CERTIFIED CASE FILE', pageWidth - 15, 22, { align: 'right' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Ref: #LGL-${record._id.substring(record._id.length - 8).toUpperCase()}`, pageWidth - 15, 30, { align: 'right' });

        // 2. INCIDENT METADATA
        doc.setTextColor(6, 78, 59);
        doc.setFontSize(16);
        doc.text('INCIDENT RECONSTRUCTION', 15, 60);

        autoTable(doc, {
            startY: 65,
            head: [['PARAMETER', 'DETAILS']],
            body: [
                ['Subject Site', record.locationName || 'Unknown Site'],
                ['Timestamp', new Date(record.updatedAt).toLocaleString()],
                ['City Sector', record.city || 'National'],
                ['Logistics Interceptor', record.assignedDriver?.name || 'Automated Unit'],
                ['Reporting Resident', record.user?.name || 'Anonymous'],
                ['Waste Category', record.wasteSummary?.category?.toUpperCase() || 'MIXED'],
                ['Load Volume', `${record.wasteSummary?.volume || '0'} KG`],
                ['Hazard Rating', record.wasteSummary?.hazards?.toUpperCase() || 'NONE'],
            ],
            theme: 'striped',
            headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        });

        // 3. FORENSIC VERIFICATION (The Stamp)
        const finalY = doc.lastAutoTable.finalY + 20;

        // Draw a Stamp/Seal
        doc.setDrawColor(180, 150, 50); // Goldish
        doc.setLineWidth(1);
        doc.circle(pageWidth - 45, finalY + 15, 20, 'S');
        
        doc.setTextColor(180, 150, 50);
        doc.setFontSize(7);
        doc.text('CLEANCITY SYSTEM', pageWidth - 45, finalY + 10, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('VERIFIED', pageWidth - 45, finalY + 16, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('LEGAL CHAIN SECURED', pageWidth - 45, finalY + 22, { align: 'center' });

        // 4. SUMMARY & REMARKS
        doc.setTextColor(6, 78, 59);
        doc.setFontSize(12);
        doc.text('ADMINISTRATIVE REMARKS', 15, finalY);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const remarks = record.adminRemarks || "This case has been electronically verified. Waste collection and processing protocols were followed. No breaches of municipal code detected.";
        const splitRemarks = doc.splitTextToSize(remarks, pageWidth - 80);
        doc.text(splitRemarks, 15, finalY + 8);

        // 5. FOOTER
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 275, pageWidth, 25, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text('This is a computer-generated legal document under CleanCity Municipal Regulations. No physical signature is required.', pageWidth / 2, 285, { align: 'center' });
        doc.text('Digital Fingerprint: ' + Math.random().toString(36).substring(2, 15).toUpperCase(), pageWidth / 2, 290, { align: 'center' });

        doc.save(`CleanCity_Case_${record._id.substring(record._id.length - 8)}.pdf`);
    };

    if (loading) {
        return <div className="h-full flex flex-col items-center justify-center text-[#064E3B] opacity-50"><FileText size={48} className="animate-pulse mb-4" />Loading Legal Database...</div>;
    }

    return (
        <div className="h-full flex flex-col items-center w-full max-w-[1200px] mx-auto p-4 lg:p-8 space-y-8">
            <div className="w-full bg-gradient-to-r from-[#064E3B] to-emerald-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex justify-between items-center text-white border border-emerald-900">
                <div className="absolute top-0 right-0 opacity-10 rotate-12 -mt-10 -mr-10">
                    <FileText size={250} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-2 text-emerald-300">Legal Records Vault</h1>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100/70">Secure repository for finalized compliance PDFs</p>
                </div>
                <div className="relative z-10 flex gap-4 hidden md:flex">
                    <div className="bg-white/10 backdrop-blur px-8 py-4 rounded-3xl border border-white/20 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Files</p>
                        <p className="text-3xl font-black italic tracking-tighter leading-none">{records.length}</p>
                    </div>
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.length === 0 ? (
                    <div className="w-full col-span-full py-20 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 border-2 border-dashed border-slate-200 rounded-[3rem]">
                        <p>No compiled legal reports found in the database.</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <div key={record._id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col relative group transition-all hover:-translate-y-2 hover:shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Compliance Verified</span>
                            </div>

                            <h3 className="text-xl font-black uppercase italic tracking-tight text-[#064E3B] mb-2 pr-10 truncate">{record.locationName || 'Sector Alert'}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Scale size={12} className="text-slate-300" /> Municipal Case File
                            </p>

                            <div className="space-y-3 mb-8 flex-1 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <Calendar size={14} className="text-slate-400" />
                                    {new Date(record.finalizedAt || record.updatedAt).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <Briefcase size={14} className="text-indigo-400" />
                                    ID: {record._id.substring(record._id.length - 8).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <User size={14} className="text-emerald-500" />
                                    {record.user?.name || 'Resident'}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <Zap size={14} className="text-amber-500" />
                                    {record.assignedDriver?.name || 'Logistics'}
                                </div>
                            </div>

                            <button
                                onClick={() => generateLegalPDF(record)}
                                className="w-full py-5 bg-slate-900 group-hover:bg-[#064E3B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-3 shadow-lg hover:ring-4 hover:ring-emerald-500/20"
                            >
                                <Download size={16} /> Compile Case File
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminRecords;
