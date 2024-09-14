import React, { Component } from 'react';
import {
  Segment,
  Form,
  Button,
  ButtonGroup,
  Divider,
  Input,
} from 'semantic-ui-react';
import { GeneralToolbox } from './GeneralToolbox';
import GeneralStyling from './GeneralStyling';
import ThemeCards from './ThemeCards';
import { renderCounters } from './EntityCounters';
import { ImageInfo } from '@neo4j-arrows/graphics';
import { Entity, Graph } from '@neo4j-arrows/model';

type GeneralInspectorProps = {
  graph: Graph;
  onSaveGraphStyle: (key: string, value: unknown) => void;
  cachedImages: Record<string, ImageInfo>;
  onApplyTheme: (style: any) => void;
  styleMode: string;
  onSelect: (entities: Entity[]) => void;
  onDescriptionChange: (description: string) => void;
  onPlusNodeClick: () => void;
  onStyleTheme: () => void;
  onStyleCustomize: () => void;
};

export default class GeneralInspector extends Component<GeneralInspectorProps> {
  render() {
    const {
      graph,
      onSaveGraphStyle,
      cachedImages,
      onApplyTheme,
      styleMode,
      onSelect,
      onDescriptionChange,
    } = this.props;

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

    return (
      <Segment basic style={{ margin: 0 }}>
        <Form style={{ textAlign: 'left' }}>
          <Form.Field key="_selected">
            <label>
              {graph.nodes.length + graph.relationships.length > 0
                ? 'Graph:'
                : 'Empty graph'}
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
            <label>Description</label>
            <Input
              value={graph.description}
              onChange={(e, { value }) => onDescriptionChange(value)}
            />
          </Form.Field>
          <Divider
            key="StyleDivider"
            horizontal
            clearing
            style={{ paddingTop: 50 }}
          >
            Style
          </Divider>
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
        </Form>
      </Segment>
    );
  }
}
