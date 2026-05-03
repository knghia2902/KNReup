import React from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { SpeakerHigh, Lightning, ArrowsLeftRight, ChartBar, ListBullets, Quotes, Flag } from '@phosphor-icons/react';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
    'hook': Lightning,
    'comparison': ArrowsLeftRight,
    'stat-hero': ChartBar,
    'feature-list': ListBullets,
    'callout': Quotes,
    'outro': Flag,
};

const TEMPLATE_LABELS: Record<string, string> = {
    'hook': 'Hook',
    'comparison': 'Comparison',
    'stat-hero': 'Stat Hero',
    'feature-list': 'Feature List',
    'callout': 'Callout',
    'outro': 'Outro',
};

/** Get a display label from templateData for the scene card header */
function getSceneLabel(scene: any): string {
    const td = scene.templateData;
    if (!td) return scene.type || 'scene';
    const templateName = TEMPLATE_LABELS[td.template] || td.template || scene.type;
    return templateName;
}

/** Get the headline/title from templateData based on its type */
function getSceneHeadline(scene: any): string {
    const td = scene.templateData;
    if (!td) return '';
    switch (td.template) {
        case 'hook': return td.headline || '';
        case 'comparison': return `${td.left?.label || ''} vs ${td.right?.label || ''}`;
        case 'stat-hero': return `${td.value || ''} — ${td.label || ''}`;
        case 'feature-list': return td.title || '';
        case 'callout': return td.statement || '';
        case 'outro': return td.ctaTop || '';
        default: return '';
    }
}

export const ScriptEditorStep: React.FC = () => {
    const { script, updateScript, setStep } = useVideoGeneratorStore();

    if (!script) return null;

    const handleVoiceTextChange = (index: number, value: string) => {
        const newScenes = [...script.scenes];
        newScenes[index] = { ...newScenes[index], voiceText: value };
        updateScript({ ...script, scenes: newScenes });
    };

    return (
        <div className="vg-script-editor">
            <div className="vg-script-header">
                <h3>{script.metadata?.title || script.title || 'Video Script'}</h3>
                <span className="vg-badge">{script.scenes?.length || 0} scenes</span>
            </div>
            
            <div className="vg-scenes-list">
                {(script.scenes || []).map((scene: any, idx: number) => {
                    const templateName = scene.templateData?.template || scene.type;
                    const IconComp = TEMPLATE_ICONS[templateName] || Lightning;
                    const label = getSceneLabel(scene);
                    const headline = getSceneHeadline(scene);
                    
                    return (
                        <div key={scene.id || idx} className="vg-scene-card">
                            <div className="vg-scene-header">
                                <span className="vg-scene-number">
                                    <IconComp size={14} weight="bold" style={{ marginRight: 4 }} />
                                    Scene {idx + 1}
                                </span>
                                <span className="vg-scene-type">{label}</span>
                            </div>
                            
                            <div className="vg-scene-body">
                                {headline && (
                                    <div className="vg-scene-headline">{headline}</div>
                                )}
                                
                                <div className="vg-voice-text-wrapper">
                                    <SpeakerHigh size={16} />
                                    <textarea
                                        className="vg-input vg-textarea"
                                        value={scene.voiceText || ''}
                                        onChange={(e) => handleVoiceTextChange(idx, e.target.value)}
                                        placeholder="Nội dung AI sẽ đọc..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="vg-actions-row">
                <button className="vg-btn-secondary" onClick={() => setStep(1)}>
                    Quay Lại
                </button>
                <button className="vg-btn-primary" onClick={() => setStep(3)}>
                    Tiếp Tục → Chọn Giọng Đọc
                </button>
            </div>
        </div>
    );
};
