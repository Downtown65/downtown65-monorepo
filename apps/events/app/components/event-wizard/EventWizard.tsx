import type { EventType } from '@dt65/shared';
import { Button, Group, Stepper } from '@mantine/core';
import { useReducer, useState } from 'react';
import { StepDate } from './StepDate';
import { StepDescription } from './StepDescription';
import { StepEventType } from './StepEventType';
import { StepPreview } from './StepPreview';
import { StepTime } from './StepTime';
import { StepTitle } from './StepTitle';
import { type EventFormData, initialFormData, wizardReducer } from './types';

interface EventWizardProps {
  initialData?: EventFormData | undefined;
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
  submitLabel?: string | undefined;
}

export function EventWizard({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = 'Luo tapahtuma',
}: EventWizardProps) {
  const [active, setActive] = useState(0);
  const [state, dispatch] = useReducer(wizardReducer, initialData ?? initialFormData);

  function canAdvance(): boolean {
    switch (active) {
      case 0:
        return state.eventType !== null;
      case 1:
        return state.title.trim().length > 0;
      case 2:
        return state.dateStart.length > 0;
      case 3:
        return true; // time is optional
      case 4:
        return true; // description is optional
      default:
        return true;
    }
  }

  function handleNext() {
    if (active < 5) setActive(active + 1);
  }

  function handleBack() {
    if (active > 0) setActive(active - 1);
  }

  function handleSubmit() {
    onSubmit(state);
  }

  return (
    <>
      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} mb="xl">
        <Stepper.Step label="Laji">
          <StepEventType
            value={state.eventType}
            onChange={(type: EventType) => {
              dispatch({ type: 'SET_EVENT_TYPE', payload: type });
              setActive(1);
            }}
          />
        </Stepper.Step>

        <Stepper.Step label="Tiedot">
          <StepTitle
            title={state.title}
            subtitle={state.subtitle}
            location={state.location}
            race={state.race}
            onTitleChange={(v) => dispatch({ type: 'SET_TITLE', payload: v })}
            onSubtitleChange={(v) => dispatch({ type: 'SET_SUBTITLE', payload: v })}
            onLocationChange={(v) => dispatch({ type: 'SET_LOCATION', payload: v })}
            onRaceChange={(v) => dispatch({ type: 'SET_RACE', payload: v })}
          />
        </Stepper.Step>

        <Stepper.Step label="Päivä">
          <StepDate
            value={state.dateStart}
            onChange={(v) => dispatch({ type: 'SET_DATE', payload: v })}
          />
        </Stepper.Step>

        <Stepper.Step label="Aika">
          <StepTime
            value={state.timeStart}
            onChange={(v) => dispatch({ type: 'SET_TIME', payload: v })}
          />
        </Stepper.Step>

        <Stepper.Step label="Kuvaus">
          <StepDescription
            value={state.description}
            onChange={(v) => dispatch({ type: 'SET_DESCRIPTION', payload: v })}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <StepPreview data={state} />
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="xl">
        <Button variant="default" onClick={handleBack} disabled={active === 0}>
          Takaisin
        </Button>

        {active < 5 ? (
          <Button onClick={handleNext} disabled={!canAdvance()}>
            Seuraava
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        )}
      </Group>
    </>
  );
}
