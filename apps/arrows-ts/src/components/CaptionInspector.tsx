import React, { Component } from 'react';
import { Form, FormInput, Input } from 'semantic-ui-react';

interface CaptionInspectorProps {
  value: string;
  onSaveCaption: (caption: string) => void;
  onConvertCaptionsToPropertyValues: () => void;
  captions: string[];
}

export class CaptionInspector extends Component<CaptionInspectorProps> {
  render() {
    const {
      value,
      onSaveCaption,
      onConvertCaptionsToPropertyValues,
      captions,
    } = this.props;

    const label = 'Class name';
    const fieldValue = value || '';
    const placeholder = value === undefined ? '<multiple values>' : null;
    const error = (value: string) =>
      value !== undefined &&
      ((value === '' && { content: `${label} cannot be empty` }) ||
        (captions.filter(
          (caption) => caption.toLowerCase() === value.toLowerCase()
        ).length > 1 && {
          content: `${label} must be unique`,
        }));

    const textBox = (
      <Input
        value={fieldValue}
        onChange={(event) => onSaveCaption(event.target.value)}
        placeholder={placeholder}
      />
    );

    return (
      <FormInput label={label} error={error(value)} key="_caption">
        {textBox}
      </FormInput>
    );
  }
}
