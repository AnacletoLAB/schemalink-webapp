import React, { Component } from 'react';
import { Form, Button, Message, Accordion } from 'semantic-ui-react';
import { PropertyRow } from './PropertyRow';
import {
  Attribute,
  Properties,
  PropertiesSummary,
  Property,
} from '@neo4j-arrows/model';

interface PropertyTableProps {
  properties: Properties;
  propertySummary: PropertiesSummary;
  onMergeOnValues: (key: string) => void;
  onSavePropertyKey: (oldKey: string, newKey: string) => void;
  onSavePropertyValue: (key: string, value: Attribute) => void;
  onDeleteProperty: (key: string) => void;
}

interface PropertyTableState {
  local: boolean;
  properties: Properties | null;
  error: string | null;
  lastValidKey: string | null;
  invalidIndex: number | null;
  activeIndex?: number;
}

export default class PropertyTable extends Component<
  PropertyTableProps,
  PropertyTableState
> {
  constructor(props: PropertyTableProps) {
    super(props);
    this.focusHandlers = [];
    this.state = {
      local: false,
      properties: null,
      error: null,
      lastValidKey: null,
      invalidIndex: null,
    };
  }

  focusHandlers: unknown[];

  static propertyInput(property: Property) {
    switch (property.status) {
      case 'CONSISTENT':
        return {
          valueFieldValue: property.value.description,
          valueFieldPlaceHolder: null,
        };

      case 'INCONSISTENT':
        return {
          valueFieldValue: '',
          valueFieldPlaceHolder: '<multiple values>',
        };

      default:
        return {
          valueFieldValue: '',
          valueFieldPlaceHolder: '<partially present>',
        };
    }
  }

  render() {
    const {
      properties,
      propertySummary,
      onMergeOnValues,
      onSavePropertyKey,
      onSavePropertyValue,
      onDeleteProperty,
    } = this.props;
    const {
      properties: localProperties,
      local,
      error,
      lastValidKey,
      invalidIndex,
    } = this.state;

    let propertiesList;
    if (local) {
      propertiesList = localProperties;
    } else {
      propertiesList = properties;
    }

    const addEmptyProperty = () => {
      onSavePropertyValue('', {
        description: '',
        required: false,
      });
    };

    const onNextProperty = (nextIndex: number) => {
      if (nextIndex === Object.entries(propertiesList ?? {}).length) {
        addEmptyProperty();
      } else {
        this.focusHandlers[nextIndex]();
      }
    };

    const onPropertyKeyChange = (
      propertyKey: string,
      value: string,
      index: number
    ) => {
      if (local) {
        if (
          Object.entries(propertiesList ?? {}).find(
            ([key, property]) => key === value
          )
        ) {
          // switch to global
          onSavePropertyKey(lastValidKey ?? '', value);
          this.setState({
            local: false,
            error: null,
            properties: null,
            lastValidKey: null,
            invalidIndex: null,
          });
        }
      } else {
        if (
          Object.entries(propertiesList ?? {}).find(
            ([key, property]) => key === value
          )
        ) {
          const property = Object.entries(propertiesList ?? {}).find(
            ([key, property]) => key === value
          );
          if (property) {
            property[0] = value;
            this.setState({
              local: true,
              error: 'Duplicate attributes found. Please rename the attribute.',
              properties: propertiesList,
              lastValidKey: propertyKey,
              invalidIndex: index,
            });
          }
        } else {
          onSavePropertyKey(propertyKey, value);
        }
      }
    };

    const rows = Object.entries(propertiesList ?? {}).map(
      ([key, prop], index) => {
        const { valueFieldValue, valueFieldPlaceHolder } =
          PropertyTable.propertyInput(prop);
        return (
          <PropertyRow
            key={'row-' + index}
            propertyKey={key}
            propertySummary={propertySummary}
            onMergeOnValues={() => onMergeOnValues(key)}
            onKeyChange={(newKey) => onPropertyKeyChange(key, newKey, index)}
            onValueChange={(newValue) => onSavePropertyValue(key, newValue)}
            onDeleteProperty={() => onDeleteProperty(key)}
            valueFieldValue={valueFieldValue}
            valueFieldPlaceHolder={valueFieldPlaceHolder}
            setFocusHandler={(action) => (this.focusHandlers[index] = action)}
            onNext={() => onNextProperty(index + 1)}
            keyDisabled={!!error && invalidIndex !== index}
            valueDisabled={!!error}
            attributeValue={prop.value ?? {}}
            active={this.state.activeIndex === index}
            onClick={() =>
              this.setState({
                activeIndex:
                  index !== this.state.activeIndex ? index : undefined,
              })
            }
          />
        );
      }
    );
    return (
      <Form.Field key="propertiesTable">
        <label>Attributes</label>
        {!!rows.length && (
          <Accordion
            compact
            collapsing
            activeIndex={this.state.activeIndex}
            styled
            style={{ marginBottom: '1em' }}
          >
            {rows}
          </Accordion>
        )}
        {error ? <Message negative>{error}</Message> : null}
        <Button
          key="addProperty"
          onClick={addEmptyProperty}
          basic
          color="black"
          floated="right"
          size="tiny"
          icon="plus"
          content="Attribute"
          type="button"
          disabled={!!error}
        />
      </Form.Field>
    );
  }
}
