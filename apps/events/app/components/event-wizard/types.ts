import type { EventType } from '@dt65/shared';

export interface EventFormData {
  eventType: EventType | null;
  title: string;
  dateStart: string;
  timeStart: string | null;
  location: string;
  subtitle: string;
  description: string;
  race: boolean;
}

export const initialFormData: EventFormData = {
  eventType: null,
  title: '',
  dateStart: '',
  timeStart: null,
  location: '',
  subtitle: '',
  description: '',
  race: false,
};

export type WizardAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string | null }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_SUBTITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_RACE'; payload: boolean }
  | { type: 'RESET' };

export function wizardReducer(state: EventFormData, action: WizardAction): EventFormData {
  switch (action.type) {
    case 'SET_EVENT_TYPE':
      return { ...state, eventType: action.payload };
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DATE':
      return { ...state, dateStart: action.payload };
    case 'SET_TIME':
      return { ...state, timeStart: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_SUBTITLE':
      return { ...state, subtitle: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_RACE':
      return { ...state, race: action.payload };
    case 'RESET':
      return initialFormData;
  }
}
