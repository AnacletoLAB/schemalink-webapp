import {
  Attribute,
  BasicType,
  CollectionType,
  EnumType,
  PropertiesSummary,
  RegexType,
  RequiredType,
  ValueSummary,
  ConstraintOperator,
  PropertyConstraint,
  PropertyConstraintDraft,
  REFERENCE_CONSTRAINT_TYPE_BY_OPERATOR,
  OPERATOR_BY_REFERENCE_CONSTRAINT_TYPE,
} from '@neo4j-arrows/model';
import React, { Component } from 'react';
import { getFilteredEnumTypes, getFilteredRegexTypes } from '../utils/enumRegexFilter';
import {
  Table,
  Input,
  Form,
  Icon,
  Popup,
  Button,
  Label,
  AccordionTitle,
  AccordionContent,
  Dropdown,
  Checkbox,
} from 'semantic-ui-react';

interface PropertyRowProps {
  keyDisabled: boolean;
  attributeValue: Attribute;
  propertyKey: string;
  propertySummary: PropertiesSummary;
  rangeOptions: string[];
  onMergeOnValues: () => void;
  onKeyChange: (key: string) => void;
  valueFieldValue: string;
  valueFieldPlaceHolder: string | null;
  onValueChange: (value: Attribute) => void;
  onDeleteProperty: () => void;
  onNext: () => void;
  setFocusHandler: (action: unknown) => void;
  valueDisabled: boolean;
  active: boolean;
  onClick: () => void;
  constraints?: PropertyConstraint[];
  constraintTargetOptions?: string[];
  onConstraintsChange?: (constraints: PropertyConstraintDraft[]) => void;
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

  handlePreferencesChange = () => {
    this.forceUpdate();
  };

  componentDidMount() {
    if (!this.props.propertyKey || this.props.propertyKey.length === 0) {
      this.keyInput && this.keyInput.focus();
    }

    this.props.setFocusHandler(
      () => this.valueInput && this.valueInput.focus()
    );
    
    // Listen for preference changes to force re-render
    window.addEventListener('enumRegexPreferencesChanged', this.handlePreferencesChange);
    
    // Trigger initial load of server registries
    this.handlePreferencesChange();
  }

  componentWillUnmount() {
    window.removeEventListener('enumRegexPreferencesChanged', this.handlePreferencesChange);
  }

  render = () => {
    const {
      attributeValue,
      propertyKey,
      propertySummary,
      rangeOptions,
      onMergeOnValues,
      onKeyChange,
      valueFieldValue,
      valueFieldPlaceHolder,
      onValueChange,
      onDeleteProperty,
      onNext,
      keyDisabled,
      valueDisabled,
      active,
      onClick,
      constraints,
      constraintTargetOptions = [],
      onConstraintsChange,
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
        const targetEl = evt.target as unknown as { blur?: () => void };
        targetEl?.blur && targetEl.blur();
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
          <label>other attribute keys</label>
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
            onClick={() =>
              onValueChange({ ...attributeValue, description: entry.value })
            }
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
        action={
          <Icon
            style={{
              visibility:
                (this.state.mouseOver && !valueDisabled) || active
                  ? 'visible'
                  : 'hidden',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
            name="trash alternate outline"
            onClick={onDeleteProperty}
          />
        }
        value={propertyKey}
        label={
          attributeValue.range && {
            content: `${
              attributeValue.collectionType
                ? `${attributeValue.collectionType}(`
                : ''
            }${attributeValue.range}${
              attributeValue.collectionType ? `)` : ''
            }`,
            style: { marginRight: '1em' },
          }
        }
        onChange={(event) => onKeyChange(event.target.value)}
        transparent
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
        onChange={(event) =>
          onValueChange({ ...attributeValue, description: event.target.value })
        }
        ref={(elm) => (this.valueInput = elm)}
        onKeyPress={(evt: KeyboardEvent) => handleKeyPress('value', evt)}
        onKeyDown={handleKeyDown}
        disabled={valueDisabled}
      />
    );

    const isReferenceRange =
      !!attributeValue.range && rangeOptions.includes(attributeValue.range);
    const identifierForbiddenByCollection =
      attributeValue.collectionType === CollectionType.LIST ||
      attributeValue.collectionType === CollectionType.SET;
    const identifierNotAllowed =
      isReferenceRange || identifierForbiddenByCollection;
    const effectiveRequiredType =
      identifierNotAllowed &&
      attributeValue.requiredType === RequiredType.IDENTIFIER
        ? RequiredType.REQUIRED
        : attributeValue.requiredType;

    return (
      <div onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <AccordionTitle active={active} onClick={(e) => onClick()} collapsing>
          <Form.Field style={{ marginBottom: 0 }}>
            <Popup
              trigger={keyField}
              content={keyPopupContent}
              on="focus"
              {...(propertySummary.keys.length > 0 ? {} : { open: false })}
              position="bottom right"
              flowing
            />
          </Form.Field>
        </AccordionTitle>
        <AccordionContent active={active}>
          <Form.Field>
            <label>Description</label>
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
          <Form.Field>
            <label>Range</label>
            <Dropdown
              selection
              value={attributeValue.range ?? BasicType.STRING}
              options={[
                ...Object.values(BasicType).map((type) => ({ 
                  key: String(type), 
                  text: String(type), 
                  value: String(type) 
                })),
                ...getFilteredRegexTypes().map((type) => ({ 
                  key: String(type), 
                  text: `Regex: ${String(type)}`, 
                  value: String(type) 
                })),
                ...getFilteredEnumTypes().map((type) => ({ 
                  key: String(type), 
                  text: `Enum: ${String(type)}`, 
                  value: String(type) 
                })),
                ...rangeOptions.map((name) => ({
                  key: `class-${name}`,
                  text: `Reference: ${name}`,
                  value: name,
                }))
              ]}
              onChange={(e, { value }) => {
                const newRange = value as string;
                const newIsReferenceRange = rangeOptions.includes(newRange);
                if (
                  newIsReferenceRange &&
                  attributeValue.requiredType === RequiredType.IDENTIFIER
                ) {
                  onValueChange({
                    ...attributeValue,
                    range: newRange,
                    requiredType: RequiredType.REQUIRED,
                  });
                } else {
                  onValueChange({ ...attributeValue, range: newRange });
                }
              }}
              disabled={valueDisabled}
            />
          </Form.Field>
          <Form.Field>
            <label>
              Collection Type
              {attributeValue.requiredType === RequiredType.IDENTIFIER && (
                <Popup
                  trigger={<Icon name="question circle" color="grey" style={{ marginLeft: '4px' }} />}
                  content="Identifier cannot be a collection."
                  position="top center"
                />
              )}
            </label>
            <Dropdown
              selection
              clearable={attributeValue.requiredType !== RequiredType.IDENTIFIER}
              value={attributeValue.collectionType ?? undefined}
              options={
                attributeValue.requiredType === RequiredType.IDENTIFIER
                  ? []
                  : Object.values(CollectionType).map((type) => {
                      return {
                        key: type,
                        text: type,
                        value: type,
                      };
                    })
              }
              onChange={(e, { value }) => {
                const newCollectionType = value as CollectionType | undefined;
                // If selecting list or set, and current requiredType is identifier, change it to required
                if (
                  (newCollectionType === CollectionType.LIST ||
                    newCollectionType === CollectionType.SET) &&
                  attributeValue.requiredType === RequiredType.IDENTIFIER
                ) {
                  onValueChange({
                    ...attributeValue,
                    collectionType: newCollectionType,
                    requiredType: RequiredType.REQUIRED,
                  });
                } else {
                  onValueChange({
                    ...attributeValue,
                    collectionType: newCollectionType,
                  });
                }
              }}
              disabled={valueDisabled}
            />
          </Form.Field>
          {attributeValue.collectionType === CollectionType.ARRAY && (
            <Form.Field
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '4em',
              }}
            >
              <label>Dimensions</label>
              <Input
                type="number"
                value={attributeValue.dimensions}
                onChange={(event) =>
                  onValueChange({
                    ...attributeValue,
                    dimensions: parseInt(event.target.value),
                  })
                }
                disabled={
                  valueDisabled ||
                  attributeValue.collectionType !== CollectionType.ARRAY
                }
              />
            </Form.Field>
          )}
          <Form.Field>
            <label>Required</label>
            <Dropdown
              selection
              value={effectiveRequiredType}
              options={Object.values(RequiredType)
                .filter((type) => {
                  // Remove identifier option if forbidden by range or collection
                  if (
                    type === RequiredType.IDENTIFIER &&
                    identifierNotAllowed
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((type) => {
                  return {
                    key: type,
                    text: type,
                    value: type,
                  };
                })}
              onChange={(e, { value }) => {
                const newRequiredType = value as RequiredType;
                if (
                  newRequiredType === RequiredType.IDENTIFIER &&
                  identifierNotAllowed
                ) {
                  onValueChange({
                    ...attributeValue,
                    requiredType: RequiredType.REQUIRED,
                  });
                  return;
                }
                if (newRequiredType === RequiredType.IDENTIFIER) {
                  onValueChange({
                    ...attributeValue,
                    requiredType: newRequiredType,
                    collectionType: undefined,
                    dimensions: undefined,
                  });
                } else {
                  onValueChange({
                    ...attributeValue,
                    requiredType: newRequiredType,
                  });
                }
              }}
              disabled={valueDisabled}
            />
          </Form.Field>
          <Form.Field>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <label style={{ margin: 0, fontWeight: 'bold' }}>
                Unique
                <Popup
                  content="PG-Schema only — not available when exporting to LinkML."
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                />
              </label>
              <Checkbox
                toggle
                checked={!!attributeValue.unique}
                onChange={(e, { checked }) =>
                  onValueChange({ ...attributeValue, unique: !!checked })
                }
                disabled={valueDisabled}
              />
            </div>
          </Form.Field>
          {onConstraintsChange ? (
            <Form.Field>
              <label>
                Value Constraints
                <Popup
                  content="PG-Schema only — not available when exporting to LinkML."
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                />
              </label>
              {(constraints ?? []).map((c, index) => {
                const toDraft = (
                  existing: PropertyConstraint
                ): PropertyConstraintDraft =>
                  existing.type === 'property_value'
                    ? {
                        type: 'property_value',
                        operator: existing.operator,
                        value: existing.value,
                      }
                    : { type: existing.type, target: existing.target };
                const replaceAt = (next: PropertyConstraintDraft) => {
                  onConstraintsChange(
                    (constraints ?? []).map((existing, i) =>
                      i === index ? next : toDraft(existing)
                    )
                  );
                };
                const isReference = c.type !== 'property_value';
                const operator: ConstraintOperator = isReference
                  ? OPERATOR_BY_REFERENCE_CONSTRAINT_TYPE[c.type]
                  : c.operator;

                const handleOperatorChange = (newOperator: ConstraintOperator) => {
                  if (isReference) {
                    replaceAt({
                      type: REFERENCE_CONSTRAINT_TYPE_BY_OPERATOR[newOperator],
                      target: c.target,
                    });
                  } else {
                    replaceAt({
                      type: 'property_value',
                      operator: newOperator,
                      value: c.value,
                    });
                  }
                };

                const handleModeChange = (mode: 'value' | 'reference') => {
                  if (mode === 'reference') {
                    replaceAt({
                      type: REFERENCE_CONSTRAINT_TYPE_BY_OPERATOR[operator],
                      target: constraintTargetOptions[0] ?? '',
                    });
                  } else {
                    replaceAt({ type: 'property_value', operator, value: '' });
                  }
                };

                return (
                  <div
                    key={index}
                    style={{
                      border: '1px solid rgba(34, 36, 38, 0.15)',
                      borderRadius: '4px',
                      padding: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <Dropdown
                        selection
                        placeholder="Operator"
                        value={operator}
                        options={(
                          ['=', '!=', '>', '<', '>=', '<='] as ConstraintOperator[]
                        ).map((op) => ({ key: op, text: op, value: op }))}
                        onChange={(e, { value }) =>
                          handleOperatorChange(value as ConstraintOperator)
                        }
                        style={{ minWidth: '90px' }}
                        disabled={valueDisabled}
                      />
                      <Dropdown
                        selection
                        value={isReference ? 'reference' : 'value'}
                        options={[
                          { key: 'value', text: 'Literal value', value: 'value' },
                          {
                            key: 'reference',
                            text: 'Reference attribute',
                            value: 'reference',
                          },
                        ]}
                        onChange={(e, { value }) =>
                          handleModeChange(value as 'value' | 'reference')
                        }
                        style={{ minWidth: '150px' }}
                        disabled={valueDisabled}
                      />
                      <Icon
                        name="trash alternate outline"
                        style={{ cursor: 'pointer', marginLeft: 'auto' }}
                        onClick={() =>
                          onConstraintsChange(
                            (constraints ?? [])
                              .filter((_, i) => i !== index)
                              .map(toDraft)
                          )
                        }
                      />
                    </div>
                    {isReference ? (
                      <Dropdown
                        selection
                        search
                        fluid
                        placeholder="Class.attribute"
                        value={c.target}
                        options={constraintTargetOptions.map((target) => ({
                          key: target,
                          text: target,
                          value: target,
                        }))}
                        onChange={(e, { value }) =>
                          replaceAt({ type: c.type, target: value as string })
                        }
                        disabled={valueDisabled}
                      />
                    ) : (
                      <Input
                        placeholder="Value (int or string)"
                        value={c.value}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const isNumeric = raw !== '' && !isNaN(Number(raw));
                          replaceAt({
                            type: 'property_value',
                            operator,
                            value: isNumeric ? Number(raw) : raw,
                          });
                        }}
                        disabled={valueDisabled}
                        fluid
                      />
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                basic
                color="black"
                size="tiny"
                icon="plus"
                content="Constraint"
                onClick={() =>
                  onConstraintsChange([
                    ...(constraints ?? []).map((existing): PropertyConstraintDraft =>
                      existing.type === 'property_value'
                        ? {
                            type: 'property_value',
                            operator: existing.operator,
                            value: existing.value,
                          }
                        : { type: existing.type, target: existing.target }
                    ),
                    { type: 'property_value', operator: '=', value: '' },
                  ])
                }
                disabled={valueDisabled}
              />
            </Form.Field>
          ) : null}
        </AccordionContent>
      </div>
    );
  };
}
