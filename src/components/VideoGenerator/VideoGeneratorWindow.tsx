import React, { useEffect } from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { VideoGeneratorSteps } from './VideoGeneratorSteps';
import { UrlInputStep } from './UrlInputStep';
import { ScriptEditorStep } from './ScriptEditorStep';
import { VoiceSelectStep } from './VoiceSelectStep';
import { StyleSelectStep } from './StyleSelectStep';
import { RenderStep } from './RenderStep';
import '../../styles/design-system.css';
import '../../styles/video-generator.css';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, PlayCircle, SpeakerHigh, FilmSlate, TextAa } from '@phosphor-icons/react';

export const VideoGeneratorWindow: React.FC = () => {
    const { currentStep, script, voiceId, template, videoUrl, renderProgress, renderStatus } = useVideoGeneratorStore();
    const { isDark, toggle } = useTheme();

    useEffect(() => {
        if (isDark) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [isDark]);

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <UrlInputStep />;
            case 2:
                return <ScriptEditorStep />;
            case 3:
                return <VoiceSelectStep />;
            case 4:
                return <StyleSelectStep />;
            case 5:
                return <RenderStep />;
            default:
                return <UrlInputStep />;
        }
    };

    const renderRightPanel = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="vg-preview-panel">
                        <div className="vg-phone-frame">
                            <div className="vg-phone-screen">
                                <div className="vg-phone-placeholder">
                                    <FilmSlate size={40} weight="light" />
                                    <p>Video Preview</p>
                                    <span>Dán URL để bắt đầu</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="vg-preview-panel">
                        <div className="vg-phone-frame">
                            <div className="vg-phone-screen">
                                {script ? (
                                    <div className="vg-mini-preview">
                                        <div className="vg-mini-title">{script.metadata?.title || script.title || 'Video'}</div>
                                        <div className="vg-mini-scenes">
                                            {script.scenes.map((s: any, i: number) => (
                                                <div key={s.id || i} className="vg-mini-scene">
                                                    <span className="vg-mini-scene-num">{i + 1}</span>
                                                    <span className="vg-mini-scene-title">{s.templateData?.template || s.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="vg-mini-stats">
                                            <TextAa size={14} />
                                            <span>{script.scenes.length} scenes</span>
                                            <span className="vg-dot-sep">·</span>
                                            <span>~{Math.round(script.scenes.length * 8)}s</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="vg-phone-placeholder">
                                        <PlayCircle size={40} weight="light" />
                                        <p>Script Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="vg-preview-panel">
                        <div className="vg-phone-frame">
                            <div className="vg-phone-screen">
                                <div className="vg-voice-preview-info">
                                    <SpeakerHigh size={32} weight="duotone" />
                                    <p className="vg-voice-active">{voiceId.split('-').pop()?.replace('Neural', '')}</p>
                                    <span className="vg-voice-id">{voiceId}</span>
                                    <div className="vg-waveform">
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className="vg-wave-bar" style={{ 
                                                height: `${12 + Math.random() * 28}px`,
                                                animationDelay: `${i * 0.05}s` 
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="vg-preview-panel">
                        <div className="vg-phone-frame">
                            <div className={`vg-phone-screen vg-template-preview-${template}`}>
                                <div className="vg-template-demo">
                                    <div className="vg-template-demo-title">
                                        {script?.metadata?.title || script?.title || 'Video Title'}
                                    </div>
                                    <div className="vg-template-demo-body">
                                        {script?.scenes?.[0]?.voiceText?.slice(0, 80) || 'Voice preview...'}
                                    </div>
                                    <div className="vg-template-demo-badge">{template}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="vg-preview-panel">
                        <div className="vg-phone-frame">
                            <div className="vg-phone-screen" style={{ padding: 0 }}>
                                {videoUrl ? (
                                    <video
                                        className="vg-video-player"
                                        src={videoUrl}
                                        controls
                                        autoPlay
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <div className="vg-render-live">
                                        <div className="vg-render-spinner" />
                                        <p>{renderStatus || 'Đang render...'}</p>
                                        <div className="vg-render-bar">
                                            <div className="vg-render-bar-fill" style={{ width: `${renderProgress}%` }} />
                                        </div>
                                        <span>{Math.round(renderProgress)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="vg-layout-wrapper">
            <div className="vg-header" data-tauri-drag-region>
                <h2>knreup Video Generator</h2>
                <span className="vg-header-badge">AI Engine</span>
                <button className="theme-toggle" onClick={toggle} title={isDark ? 'Light Mode' : 'Dark Mode'}>
                    {isDark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
                </button>
            </div>
            
            <div className="vg-hero">
                <h1>Video Generator</h1>
                <p>Tạo video 9:16 motion graphics từ nội dung web bất kỳ</p>
                <div className="vg-status-badge active">
                    <span className="dot"></span>
                    Session Active
                </div>
            </div>

            <VideoGeneratorSteps />
            
            <div className="vg-body">
                <div className="vg-panel">
                    {renderCurrentStep()}
                </div>
                <div className="vg-panel vg-panel-right">
                    {renderRightPanel()}
                </div>
            </div>
        </div>
    );
};

export default VideoGeneratorWindow;
