import { SmartTemplate } from '../templateData';

export interface TemplateSet {
    id: string;
    name: string;
    description: string;
    templates: SmartTemplate[];
}

// Import all sets
import { DEFAULT_SET } from './defaultSet';
import { CINEMATIC_SET } from './cinematicSet';
import { NEWS_BROADCAST_SET } from './newsBroadcastSet';
import { SOCIAL_MEDIA_SET } from './socialMediaSet';
import { V2_NEWS_SET } from './v2NewsSet';


// Registry
export const TEMPLATE_SETS: Record<string, TemplateSet> = {
    'default': DEFAULT_SET,
    'cinematic': CINEMATIC_SET,
    'news-broadcast': NEWS_BROADCAST_SET,
    'social-media': SOCIAL_MEDIA_SET,
    'v2-news': V2_NEWS_SET,
};

// Available set IDs (cho UI dropdown)
export const TEMPLATE_SET_LIST = Object.values(TEMPLATE_SETS).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
}));

// Lookup helpers
export function getTemplateSet(setId: string): TemplateSet {
    return TEMPLATE_SETS[setId] || TEMPLATE_SETS['default'];
}

export function getTemplate(setId: string, templateId: string): SmartTemplate {
    const set = getTemplateSet(setId);
    return set.templates.find(t => t.id === templateId) || set.templates[0];
}
