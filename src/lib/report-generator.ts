import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lead } from '../data/mockData';
import { AIGuidance } from './intelligence';

interface ScoredLead extends Lead {
    guidance?: AIGuidance;
    aiScore?: number;
}

export const generateBossReport = (leads: ScoredLead[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(200, 60, 60); // Urban Clay Red
    doc.text('URBAN CLAY - BOSS DAILY REPORT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.line(14, 32, 196, 32);

    // 2. Executive Summary
    const newLeads = leads.filter(l => l.status === 'new').length;
    const hotLeads = leads.filter(l => l.guidance?.leadScore === 'HOT 🔥').length;
    const pipelineValue = leads.reduce((acc, l) => acc + (l.guidance?.numericValue || 0), 0);

    const activeNegotiations = leads.filter(l => l.guidance?.pipelineStage === 'Negotiation').length;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Executive Summary', 14, 42);

    const summaryData = [
        ['New Leads (Today)', `${newLeads}`, 'Pipeline Value', `₹${(pipelineValue / 100000).toFixed(2)} Lakhs`],
        ['Hot Prospects', `${hotLeads} 🔥`, 'Active Negotiations', `${activeNegotiations}`]
    ];

    autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Value', 'Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 11, cellPadding: 6 }
    });

    // 3. Hot Prospects & Action Plan
    doc.text('🔥 Hot Prospects & Action Plan', 14, (doc as any).lastAutoTable.finalY + 15);

    const hotLeadsList = leads
        .filter(l => l.guidance?.leadScore === 'HOT 🔥' || l.guidance?.leadScore === 'WARM 🟡')
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 15); // Top 15

    const rows = hotLeadsList.map(l => {
        const g = l.guidance || {} as AIGuidance;
        const painPoint = g.objectionDetected ? `⚠️ ${g.objectionDetected}` : (g.ghostingStatus === 'Risk' ? '👻 Ghosting Risk' : 'None');
        const interest = g.intent;

        return [
            l.name.substring(0, 15),
            (l.phone || '').slice(-5).padStart(10, '*'), // Mask phone for report safety or full? Boss needs full.
            `₹${(g.numericValue || 0).toLocaleString()}`,
            interest || '-',
            painPoint,
            g.nextStep || 'Review Chat'
        ];
    });

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Name', 'Phone', 'Est. Value', 'Interest', 'Pain Point / Risk', 'Recommended Action']],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 50, 50] }, // Red
        columnStyles: {
            0: { fontStyle: 'bold' },
            5: { fontStyle: 'italic', textColor: [0, 100, 0] }
        }
    });

    // 4. Client Requirement Analysis
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    if (yPos < 250) {
        doc.text('🧠 AI Intelligence Insights', 14, yPos);

        // Add some textual insights
        const ghostingCount = leads.filter(l => l.guidance?.ghostingStatus === 'Risk' || l.guidance?.ghostingStatus === 'Ghosted').length;
        const negotiationCount = leads.filter(l => l.guidance?.pipelineStage === 'Negotiation').length;

        doc.setFontSize(10);
        doc.text(`• ${ghostingCount} clients are at risk of ghosting. Consider sending the "Stock Release Warning" (see Intelligence Panel).`, 14, yPos + 8);
        doc.text(`• ${negotiationCount} clients are in active negotiation. Focus on value selling (1200°C firing USP) rather than discounts.`, 14, yPos + 14);
    }

    // Save
    doc.save(`UrbanClay_Boss_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
