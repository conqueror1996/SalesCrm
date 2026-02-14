import React from 'react';
import { Lead } from '../../data/mockData';
import { Phone, MessageCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import styles from './LeadCard.module.css';

interface LeadCardProps {
    lead: Lead;
    isActive: boolean;
    onClick: () => void;
    onCall: (e: React.MouseEvent) => void;
    onWhatsApp: (e: React.MouseEvent) => void;
}

export function LeadCard({ lead, isActive, onClick, onCall, onWhatsApp }: LeadCardProps) {
    // Helpers for styling based on status
    const isHot = lead.guidance?.leadScore === 'HOT 🔥';
    const isGhosting = lead.guidance?.ghostingStatus === 'Risk' || lead.guidance?.ghostingStatus === 'Ghosted';

    return (
        <div
            onClick={onClick}
            className={`${styles.card} ${isActive ? styles.active : ''} ${isHot ? styles.isHot : ''}`}
        >
            {/* Header */}
            <div className={styles.header}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className={styles.name}>{lead.name}</h3>
                    <span className={styles.timestamp}>
                        <Clock size={12} /> {new Date(lead.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Value Badge */}
                {lead.dealValue > 0 && (
                    <span className={styles.valueBadge}>
                        ₹{(lead.dealValue / 100000).toFixed(1)}L
                    </span>
                )}
            </div>

            {/* Body Snippet */}
            <p className={styles.snippet}>
                {lead.lastMessage.content}
            </p>

            {/* Badges / Tags */}
            <div className={styles.tags}>
                {isHot && (
                    <span className={`${styles.tag} ${styles.tagHot}`}>
                        🔥 Hot Lead
                    </span>
                )}
                {isGhosting && (
                    <span className={`${styles.tag} ${styles.tagRisk}`}>
                        <AlertTriangle size={10} /> Ghost Risk
                    </span>
                )}
                {lead.guidance?.isHighValue && (
                    <span className={`${styles.tag} ${styles.tagHighValue}`}>
                        <TrendingUp size={10} /> High Value
                    </span>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.actions}>
                <button onClick={onCall} className={`${styles.actionBtn} ${styles.btnCall}`}>
                    <Phone size={14} /> Call
                </button>
                <button onClick={onWhatsApp} className={`${styles.actionBtn} ${styles.btnWhatsApp}`}>
                    <MessageCircle size={14} /> WhatsApp
                </button>
            </div>
        </div>
    );
}
