import React, { Component } from 'react';
import {
  Segment,
  Form,
  Button,
  ButtonGroup,
  Divider,
  Input,
  Dropdown,
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
} from 'semantic-ui-react';
import { GeneralToolbox } from './GeneralToolbox';
import GeneralStyling from './GeneralStyling';
import ThemeCards from './ThemeCards';
import { renderCounters } from './EntityCounters';
import { ImageInfo } from '@neo4j-arrows/graphics';
import { Entity, Graph, License, SchemaProperties } from '@neo4j-arrows/model';

type GeneralInspectorProps = {
  graph: Graph;
  onSaveGraphStyle: (key: string, value: unknown) => void;
  cachedImages: Record<string, ImageInfo>;
  onApplyTheme: (style: any) => void;
  styleMode: string;
  onSelect: (entities: Entity[]) => void;
  onSchemaPropertiesChange: (properties: SchemaProperties) => void;
  onPlusNodeClick: () => void;
  onStyleTheme: () => void;
  onStyleCustomize: () => void;
};

type GeneralInspectorState = {
  styleActive: boolean;
};

export default class GeneralInspector extends Component<
  GeneralInspectorProps,
  GeneralInspectorState
> {
  constructor(props: GeneralInspectorProps) {
    super(props);
    this.state = { styleActive: false };
  }

  render() {
    const {
      graph,
      onSaveGraphStyle,
      cachedImages,
      onApplyTheme,
      styleMode,
      onSelect,
      onSchemaPropertiesChange,
    } = this.props;

    const { styleActive } = this.state;

    const styleContent =
      styleMode === 'customize' ? (
        <GeneralStyling
          graph={graph}
          onSaveGraphStyle={onSaveGraphStyle}
          cachedImages={cachedImages}
        />
      ) : (
        <ThemeCards onApplyTheme={onApplyTheme} />
      );

    const hasElements = graph.nodes.length + graph.relationships.length > 0;

    return (
      <Segment basic style={{ margin: 0 }}>
        {hasElements && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
            fontSize: '12px', color: '#64748b',
          }}>
            <span style={{ fontSize: '15px' }}>👆</span>
            <span>Click a <strong>node</strong> or <strong>relationship</strong> to inspect and edit it.</span>
          </div>
        )}
        <Form style={{ textAlign: 'left' }}>
          <Form.Field key="_selected">
            <label>
              {hasElements ? 'Schema:' : 'Empty schema'}
            </label>
            {renderCounters(
              graph.nodes.map((node) => node.id),
              graph.relationships.map((relationship) => relationship.id),
              onSelect,
              null
            )}
          </Form.Field>
          <GeneralToolbox onPlusNodeClick={this.props.onPlusNodeClick} />
          <Form.Field key="_description">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              Description
            </label>
            <Input
              defaultValue={graph.description}
              onChange={(e, { value }) =>
                onSchemaPropertiesChange({
                  description: value,
                })
              }
            />
          </Form.Field>
          <Form.Field key="_ner_guidelines">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              NER Guidelines
            </label>
            <Input
              defaultValue={graph.nerGuidelines}
              placeholder="e.g. Only extract diseases with a known OMIM ID"
              onChange={(e, { value }) =>
                onSchemaPropertiesChange({
                  nerGuidelines: value,
                })
              }
            />
          </Form.Field>
          <Form.Field key="_re_guidelines">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              RE Guidelines
            </label>
            <Input
              defaultValue={graph.reGuidelines}
              placeholder="e.g. Only extract relations explicitly stated in the text"
              onChange={(e, { value }) =>
                onSchemaPropertiesChange({
                  reGuidelines: value,
                })
              }
            />
          </Form.Field>
          <Form.Field key="_license">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              License
            </label>
            <Dropdown
              selection
              clearable
              defaultValue={graph.license}
              onChange={(e, { value }) =>
                onSchemaPropertiesChange({
                  license: value as License,
                })
              }
              options={Object.entries(License).map(([key, value]) => {
                return {
                  key,
                  text: key,
                  value,
                };
              })}
            />
          </Form.Field>
          <Accordion>
            <AccordionTitle
              active={styleActive}
              onClick={(e) => this.setState({ styleActive: !styleActive })}
            >
              <Divider
                key="StyleDivider"
                horizontal
                clearing
                style={{ paddingTop: 50 }}
              >
                <Icon name="dropdown" />
                Style
              </Divider>
            </AccordionTitle>
            <AccordionContent active={styleActive}>
              <div
                style={{
                  clear: 'both',
                  textAlign: 'center',
                  paddingBottom: 20,
                }}
              >
                <ButtonGroup>
                  <Button
                    onClick={this.props.onStyleTheme}
                    active={styleMode === 'theme'}
                    secondary={styleMode === 'theme'}
                  >
                    Theme
                  </Button>
                  <Button
                    onClick={this.props.onStyleCustomize}
                    active={styleMode === 'customize'}
                    secondary={styleMode === 'customize'}
                  >
                    Customize
                  </Button>
                </ButtonGroup>
              </div>
              {styleContent}
            </AccordionContent>
          </Accordion>
        </Form>
      </Segment>
    );
  }
}
