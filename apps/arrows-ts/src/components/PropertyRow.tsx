import { PropertiesSummary, ValueSummary } from '@neo4j-arrows/model';
import React, { Component } from 'react';
import {
  Table,
  Input,
  Form,
  Icon,
  Popup,
  Button,
  Label,
  Checkbox,
} from 'semantic-ui-react';

interface PropertyRowProps {
  keyDisabled: boolean;
  multivaluedFieldValue: boolean;
  onMultivaluedChange: (multivalued: boolean) => void;
  propertyKey: string;
  propertySummary: PropertiesSummary;
  onMergeOnValues: () => void;
  onKeyChange: (key: string) => void;
  valueFieldValue: string;
  valueFieldPlaceHolder: string | null;
  onValueChange: (value: string) => void;
  onDeleteProperty: () => void;
  onNext: () => void;
  setFocusHandler: (action: unknown) => void;
  valueDisabled: boolean;
}

interface PropertyRowState {
  mouseOver: boolean;
}

export class PropertyRow extends Component<PropertyRowProps, PropertyRowState> {
  constructor(props: PropertyRowProps) {
    super(props);
    this.state = {
      mouseOver: false,
    };
  }

  onMouseEnter = () => {
    this.setState({
      mouseOver: true,
    });
  };

  onMouseLeave = () => {
    this.setState({
      mouseOver: false,
    });
  };

  keyInput: Input | null = null;
  valueInput: Input | null = null;

  componentDidMount() {
    if (!this.props.propertyKey || this.props.propertyKey.length === 0) {
      this.keyInput && this.keyInput.focus();
    }

    this.props.setFocusHandler(
      () => this.valueInput && this.valueInput.focus()
    );
  }

  render = () => {
    const {
      multivaluedFieldValue,
      propertyKey,
      propertySummary,
      onMergeOnValues,
      onKeyChange,
      valueFieldValue,
      valueFieldPlaceHolder,
      onValueChange,
      onMultivaluedChange,
      onDeleteProperty,
      onNext,
      keyDisabled,
      valueDisabled,
    } = this.props;
    const handleKeyPress = (source: 'key' | 'value', evt: KeyboardEvent) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        if (source === 'key') {
          this.valueInput && this.valueInput.focus();
        } else {
          onNext();
        }
      }
    };

    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Enter' && evt.metaKey) {
        evt.target?.blur();
      }
    };

    const propertyKeyButtons = propertySummary.keys.map((entry) => (
      <Table.Row key={'suggest_' + entry.key} textAlign="right">
        <Table.Cell>
          <Label>{entry.nodeCount}</Label>
        </Table.Cell>
        <Table.Cell>
          <Button
            basic
            color="black"
            size="tiny"
            onClick={() => onKeyChange(entry.key)}
          >
            {entry.key}
          </Button>
        </Table.Cell>
      </Table.Row>
    ));

    const keyPopupContent = (
      <Form>
        <Form.Field>
          <label>other property keys</label>
          <Table basic="very" compact="very">
            <Table.Body>{propertyKeyButtons}</Table.Body>
          </Table>
        </Form.Field>
      </Form>
    );

    const suggestedValues = propertySummary.values
      .get(propertyKey)
      ?.filter((entry) => entry.value !== valueFieldValue);
    const possibleToMergeByValue = suggestedValues?.some(
      (entry) => entry.nodeCount > 1
    );
    const suggestedValuesInSelection = suggestedValues?.filter(
      (entry) => entry.inSelection
    );
    const suggestedValuesInRestOfGraph = suggestedValues?.filter(
      (entry) => !entry.inSelection
    );

    const entryToSuggestion = (entry: ValueSummary) => (
      <Table.Row key={'suggest_' + entry.value} textAlign="left">
        <Table.Cell>
          <Button
            basic
            color="black"
            size="tiny"
            onClick={() => onValueChange(entry.value)}
          >
            {entry.value}
          </Button>
        </Table.Cell>
        <Table.Cell>
          <Label>{entry.nodeCount}</Label>
        </Table.Cell>
      </Table.Row>
    );

    const valuePopupContent = (
      <Form>
        {possibleToMergeByValue ? (
          <Form.Field>
            <Button
              key="mergeOnValues"
              onClick={onMergeOnValues}
              basic
              color="black"
              size="tiny"
              icon="crosshairs"
              content="Merge on values"
              type="button"
            />
          </Form.Field>
        ) : null}
        {suggestedValuesInSelection && suggestedValuesInSelection.length > 0 ? (
          <Form.Field>
            <label>in selection</label>
            <Table basic="very" compact="very">
              <Table.Body>
                {suggestedValuesInSelection.map(entryToSuggestion)}
              </Table.Body>
            </Table>
          </Form.Field>
        ) : null}
        {suggestedValuesInRestOfGraph &&
        suggestedValuesInRestOfGraph.length > 0 ? (
          <Form.Field>
            <label>other values</label>
            <Table basic="very" compact="very">
              <Table.Body>
                {suggestedValuesInRestOfGraph.map(entryToSuggestion)}
              </Table.Body>
            </Table>
          </Form.Field>
        ) : null}
      </Form>
    );

    const keyField = (
      <Input
        value={propertyKey}
        onChange={(event) => onKeyChange(event.target.value)}
        transparent
        className={'property-key'}
        ref={(elm) => (this.keyInput = elm)}
        onKeyPress={(evt: KeyboardEvent) => handleKeyPress('key', evt)}
        onKeyDown={handleKeyDown}
        disabled={keyDisabled}
      />
    );
    const valueField = (
      <Input
        value={valueFieldValue}
        placeholder={valueFieldPlaceHolder}
        onChange={(event) => onValueChange(event.target.value)}
        ref={(elm) => (this.valueInput = elm)}
        onKeyPress={(evt: KeyboardEvent) => handleKeyPress('value', evt)}
        onKeyDown={handleKeyDown}
        transparent
        disabled={valueDisabled}
      />
    );
    return (
      <Table.Row
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        <Table.Cell width={3} collapsing>
          <Form.Field>
            <Popup
              trigger={keyField}
              content={keyPopupContent}
              on="focus"
              {...(propertySummary.keys.length > 0 ? {} : { open: false })}
              position="bottom right"
              flowing
            />
            :
          </Form.Field>
        </Table.Cell>
        <Table.Cell width={3}>
          <Form.Field>
            <Popup
              trigger={valueField}
              content={valuePopupContent}
              on="focus"
              {...(suggestedValues && suggestedValues.length > 0
                ? {}
                : { open: false })}
              position="bottom left"
              flowing
            />
          </Form.Field>
        </Table.Cell>{' '}
        <Table.Cell width={1}>
          <Form.Field>
            <Checkbox
              checked={multivaluedFieldValue}
              onChange={(event, data) => onMultivaluedChange(!!data.checked)}
              disabled={valueDisabled}
            />
          </Form.Field>
        </Table.Cell>
        <Table.Cell width={1}>
          <Icon
            style={{
              visibility:
                this.state.mouseOver && !valueDisabled ? 'visible' : 'hidden',
            }}
            name="trash alternate outline"
            onClick={onDeleteProperty}
          />
        </Table.Cell>
      </Table.Row>
    );
  };
}
