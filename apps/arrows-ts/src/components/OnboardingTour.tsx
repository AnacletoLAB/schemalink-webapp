import React, { Component, lazy, Suspense } from 'react';
import type { EventData, Step } from 'react-joyride';

const tourKey = (username?: string) =>
  username ? `schemalink_tour_done_${username}` : 'schemalink_tour_done';

export const resetTour = (username?: string) =>
  localStorage.removeItem(tourKey(username));
export const isTourDone = (username?: string) =>
  !!localStorage.getItem(tourKey(username));

// Lazy import so a bundling issue with react-joyride can never blank the whole app
const LazyJoyride = lazy(() =>
  import('react-joyride').then((m) => ({ default: m.Joyride }))
);

const STATUS_FINISHED = 'finished';
const STATUS_SKIPPED = 'skipped';

const STEPS: Step[] = [
  {
    target: '[data-tour="canvas"]',
    title: '👋 Welcome to SchemaLink!',
    content:
      'This is your canvas — we loaded a Drug–Disease example to show you how it works. You can see two entity classes (Drug and Disease) connected by a "Treats" relationship. Draw your own schema the same way: click Add Class in the right panel, then drag between nodes to create edges.',
    placement: 'center',
    skipBeacon: true,
    styles: {
      tooltip: {
        // Pin the tooltip to the bottom of the viewport so it never
        // overlaps the Drug–Disease nodes in the canvas above it
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        top: 'auto',
        transform: 'translateX(-50%)',
        maxWidth: '420px',
        width: '420px',
      },
    },
  },
  {
    target: '[data-tour="inspector"]',
    title: '⚙️ Inspector Panel',
    content:
      'Click any class or relationship on the canvas to configure it here — name, description, ontology prefix, NER/RE guidelines, and more. The top of this panel also holds schema-level settings like a general description and global extraction rules.',
    placement: 'left',
    skipBeacon: true,
    targetWaitTimeout: 0,
  },
  {
    target: '[data-tour="export-btn"]',
    title: '📤 Download / Export',
    content:
      'When your schema is ready, export it as LinkML YAML (the standard format used by OntoGPT / SchemaLink) or download a PNG image of the diagram.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="extract-btn"]',
    title: '🚀 Run AI Extraction',
    content:
      'This is the star feature! Click Extract, paste a biomedical abstract, and SchemaLink will run GPT-powered extraction guided by your schema — grounding entities to ontologies like MONDO and ChEBI.',
    placement: 'bottom',
    skipBeacon: true,
  },
];

interface Props {
  run: boolean;
  username?: string;
  onFinish: () => void;
}

class OnboardingTour extends Component<Props> {
  handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS_FINISHED || status === STATUS_SKIPPED) {
      localStorage.setItem(tourKey(this.props.username), '1');
      this.props.onFinish();
    }
  };

  render() {
    if (!this.props.run) return null;

    return (
      <Suspense fallback={null}>
        <LazyJoyride
          steps={STEPS}
          run={this.props.run}
          continuous
          scrollToFirstStep
          onEvent={this.handleEvent}
          locale={{
            back: '← Back',
            close: 'Close',
            last: 'Done ✓',
            next: 'Next →',
            skip: 'Skip tour',
          }}
          options={{
            backgroundColor: '#ffffff',
            primaryColor: '#3b82f6',
            textColor: '#1e293b',
            zIndex: 20000,
            spotlightRadius: 8,
            buttons: ['back', 'close', 'primary', 'skip'],
          }}
          styles={{
            tooltip: {
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,.15)',
              padding: '16px 20px',
            },
            tooltipTitle: {
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 6,
            },
            tooltipContent: {
              fontSize: 13,
              lineHeight: '1.6',
              padding: '4px 0 8px',
            },
            buttonPrimary: {
              backgroundColor: '#3b82f6',
              borderRadius: 6,
              fontSize: 13,
              padding: '7px 16px',
            },
            buttonBack: {
              color: '#64748b',
              fontSize: 13,
            },
            buttonSkip: {
              color: '#94a3b8',
              fontSize: 12,
            },
            overlay: {
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
            },
          }}
        />
      </Suspense>
    );
  }
}

export default OnboardingTour;
