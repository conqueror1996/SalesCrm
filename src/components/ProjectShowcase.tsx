
import React from 'react';
import { Product } from '../data/mockData';

interface ProjectShowcaseProps {
    projects: Product[];
    onSendProject: (project: Product) => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ projects, onSendProject }) => {
    return (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 High-Trust Case Studies
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {projects.map(project => (
                    <div
                        key={project.id}
                        onClick={() => onSendProject(project)}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                        }}
                    >
                        <div style={{ height: '80px', overflow: 'hidden' }}>
                            <img src={project.image} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem', marginTop: '2px' }}>Click to Send ↗</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
