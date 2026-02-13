
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Lead } from '../data/mockData';

interface QuoteBuilderProps {
    products: Product[];
    activeLead?: Lead;
    onSendWhatsApp: (to: string, message: string, caption?: string, mediaData?: string, mimetype?: string, filename?: string) => Promise<void>;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ products, activeLead, onSendWhatsApp }) => {
    const [form, setForm] = useState({ product: '', area: '' });
    const [quote, setQuote] = useState<{ totalUnits: number, totalCost: number } | null>(null);

    const handleCalculate = () => {
        if (!form.product || !form.area) return;
        const area = parseFloat(form.area);
        if (isNaN(area)) return;
        const product = products.find(p => p.name === form.product);
        const price = product?.sellingRate || 55;
        const unitsPerSqFt = 5; // Standard heuristic
        const totalUnits = Math.ceil(area * unitsPerSqFt);
        const totalCost = totalUnits * price;
        setQuote({ totalUnits, totalCost });
    };

    const handleGeneratePDF = async (action: 'download' | 'whatsapp') => {
        if (!form.product || !quote) return;

        const product = products.find(p => p.name === form.product);
        const doc = new jsPDF();

        // Brand Header
        doc.setFontSize(22);
        doc.setTextColor(200, 75, 49); // Brand Color (Brick Red)
        doc.text('URBAN CLAY', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Premium Clay Products', 20, 26);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 20);

        // Separator
        doc.setDrawColor(200);
        doc.line(20, 30, 190, 30);

        // Client Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Estimate For: ${activeLead?.name || 'Valued Customer'}`, 20, 42);
        if (activeLead?.phone) doc.text(`Contact: ${activeLead.phone}`, 20, 48);

        // Table
        autoTable(doc, {
            startY: 55,
            head: [['Product', 'Rate (INR)', 'Qty', 'Total (INR)']],
            body: [
                [
                    form.product,
                    `INR ${product?.sellingRate || 55}`,
                    `${quote.totalUnits} Units`,
                    `INR ${quote.totalCost.toLocaleString()}`
                ],
            ],
            theme: 'grid',
            headStyles: { fillColor: [200, 75, 49], textColor: 255 },
            styles: { fontSize: 11, cellPadding: 6 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Summary Section
        doc.setFontSize(10);
        doc.text('Subtotal:', 130, finalY);
        doc.text(`INR ${quote.totalCost.toLocaleString()}`, 160, finalY, { align: 'right' });

        doc.text('GST (18%):', 130, finalY + 6);
        const gst = Math.round(quote.totalCost * 0.18);
        doc.text(`INR ${gst.toLocaleString()}`, 160, finalY + 6, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total:', 130, finalY + 16);
        doc.setTextColor(200, 75, 49);
        doc.text(`INR ${(quote.totalCost + gst).toLocaleString()}`, 160, finalY + 16, { align: 'right' });

        // Footer
        doc.setTextColor(100);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Terms: Validity 7 Days. Transport extra as per actuals.', 20, 280);
        doc.text('Thank you for choosing Urban Clay.', 20, 285);

        if (action === 'download') {
            doc.save(`Estimate_${form.product.replace(/\s/g, '_')}.pdf`);
        } else if (action === 'whatsapp') {
            if (!activeLead?.phone) {
                alert('No active lead selected.');
                return;
            }

            // Convert to Base64 (remove data uri prefix)
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            try {
                await onSendWhatsApp(
                    activeLead.phone,
                    `📄 Estimate for ${form.product}`,
                    `Here is the formal estimate for your requirement. Let me know if we should proceed.`, // Caption
                    pdfBase64,
                    'application/pdf',
                    `Estimate_${activeLead.name.replace(/\s/g, '_')}.pdf`
                );
                alert('Quote sent via WhatsApp!');
            } catch (e) {
                console.error(e);
                alert('Failed to send quote.');
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡</span> Quick Quote Generator
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Product</label>
                <select
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                    value={form.product}
                    onChange={(e) => {
                        setForm({ ...form, product: e.target.value });
                        setQuote(null);
                    }}
                >
                    <option value="">Choose Product...</option>
                    {products.filter(p => p.category !== 'project').map((p) => (
                        <option key={p.id} value={p.name}>{p.name} (Now: ₹{p.sellingRate || 55})</option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Area (Sq. Ft)</label>
                <input
                    type="number"
                    placeholder="e.g. 1500"
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                    value={form.area}
                    onChange={(e) => {
                        setForm({ ...form, area: e.target.value });
                        setQuote(null);
                    }}
                />
            </div>

            <button
                className="btn-primary"
                style={{ width: '100%', marginBottom: '1.5rem', padding: '12px', fontSize: '1rem', background: 'linear-gradient(90deg, var(--primary), #4f46e5)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleCalculate}
            >
                Calculate Quote
            </button>

            {quote && (
                <div className="animate-fade-in" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Units Required</span>
                        <span style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>{quote.totalUnits.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Base Cost</span>
                        <span style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>₹{quote.totalCost.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total (inc. 18% GST)</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.4rem' }}>₹{Math.round(quote.totalCost * 1.18).toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            style={{ flex: 1, border: '1px solid var(--success)', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleGeneratePDF('whatsapp')}
                        >
                            <span>📲</span> WhatsApp PDF
                        </button>
                        <button
                            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#334155', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleGeneratePDF('download')}
                        >
                            <span>⬇️</span> Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
