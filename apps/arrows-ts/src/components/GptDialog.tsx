import { Button, Segment, TextArea } from 'semantic-ui-react';

export interface GptState {
  prompt: string;
  showGpt: boolean;
  gptLoading: boolean;
}

interface GtpDialogProps {
  loading: boolean;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClick: () => void;
}

export const GptDialog = ({ loading, onChange, onClick }: GtpDialogProps) => (
  <Segment
    style={{
      boxShadow: 'none',
    }}
    loading={loading}
  >
    <TextArea
      style={{
        fontFamily: 'monospace',
        marginBottom: 8,
      }}
      onChange={onChange}
    />
    <Button secondary onClick={onClick}>
      Generate
    </Button>
  </Segment>
);
