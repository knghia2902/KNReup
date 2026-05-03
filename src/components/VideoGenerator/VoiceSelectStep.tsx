import React, { useEffect, useRef } from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { SpeakerHigh, Play, Pause, Check } from '@phosphor-icons/react';

const VOICES = [
    { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My', lang: 'Vietnamese', gender: 'Nữ', accent: 'Miền Bắc' },
    { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh', lang: 'Vietnamese', gender: 'Nam', accent: 'Miền Bắc' },
    { id: 'en-US-JennyNeural', name: 'Jenny', lang: 'English', gender: 'Female', accent: 'US' },
    { id: 'en-US-GuyNeural', name: 'Guy', lang: 'English', gender: 'Male', accent: 'US' },
    { id: 'ja-JP-NanamiNeural', name: 'Nanami', lang: 'Japanese', gender: 'Female', accent: 'JP' },
    { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi', lang: 'Korean', gender: 'Female', accent: 'KR' },
];

export const VoiceSelectStep: React.FC = () => {
    const { voiceId, setVoiceId, setStep, script, previewVoice, previewAudioUrl, isPreviewPlaying } = useVideoGeneratorStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sampleText = script?.scenes?.[0]?.voiceText || 'Xin chào, đây là giọng đọc mẫu cho video của bạn.';

    useEffect(() => {
        if (previewAudioUrl && audioRef.current) {
            audioRef.current.src = previewAudioUrl;
            audioRef.current.play().catch(() => {});
        }
    }, [previewAudioUrl]);

    return (
        <div className="vg-step-content">
            <div className="vg-step-title-row">
                <SpeakerHigh size={20} weight="bold" />
                <h3>Chọn Giọng Đọc</h3>
            </div>
            <p className="vg-step-desc">Chọn giọng AI sẽ đọc nội dung video. Bấm nút play để nghe thử.</p>

            <div className="vg-voice-grid">
                {VOICES.map((v) => (
                    <div
                        key={v.id}
                        className={`vg-voice-card ${voiceId === v.id ? 'selected' : ''}`}
                        onClick={() => setVoiceId(v.id)}
                    >
                        <div className="vg-voice-card-top">
                            <span className="vg-voice-name">{v.name}</span>
                            {voiceId === v.id && <Check size={14} weight="bold" className="vg-check-icon" />}
                        </div>
                        <div className="vg-voice-meta">
                            <span>{v.gender}</span>
                            <span className="vg-dot-sep">·</span>
                            <span>{v.accent}</span>
                        </div>
                        <span className="vg-voice-lang">{v.lang}</span>

                        <button
                            className="vg-voice-play-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setVoiceId(v.id);
                                previewVoice(sampleText);
                            }}
                            disabled={isPreviewPlaying}
                        >
                            {isPreviewPlaying && voiceId === v.id ? <Pause size={14} /> : <Play size={14} weight="fill" />}
                        </button>
                    </div>
                ))}
            </div>

            <audio ref={audioRef} style={{ display: 'none' }} />

            <div className="vg-actions-row">
                <button className="vg-btn-secondary" onClick={() => setStep(2)}>
                    Quay Lại
                </button>
                <button className="vg-btn-primary" onClick={() => setStep(4)}>
                    Tiếp Tục → Chọn Style
                </button>
            </div>
        </div>
    );
};
