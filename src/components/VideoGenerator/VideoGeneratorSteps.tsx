import React from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';

const STEPS = [
    { id: 1, label: 'URL' },
    { id: 2, label: 'Script' },
    { id: 3, label: 'Voice' },
    { id: 4, label: 'Style' },
    { id: 5, label: 'Render' }
];

export const VideoGeneratorSteps: React.FC = () => {
    const { currentStep } = useVideoGeneratorStore();

    return (
        <div className="vg-stepper">
            {STEPS.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const stateClass = isActive ? 'active' : isCompleted ? 'completed' : 'pending';
                
                return (
                    <React.Fragment key={step.id}>
                        <div className={`vg-step ${stateClass}`}>
                            <div className="vg-step-indicator">
                                <div className="vg-step-circle">
                                    {isCompleted ? '✓' : step.id}
                                </div>
                                <div className="vg-step-label">{step.label}</div>
                            </div>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={`vg-step-line ${isCompleted ? 'done' : 'pending'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
