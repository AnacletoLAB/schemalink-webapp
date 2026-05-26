import React, { Component } from 'react';
import {
  Modal,
  Button,
  Tab,
  TabProps,
  Checkbox,
  Form,
  Input,
  Dropdown,
  Icon,
  Message,
  List,
  Label,
} from 'semantic-ui-react';
import { EnumType, RegexType } from '@neo4j-arrows/model';
import {
  loadEnumRegexPreferences,
  saveEnumRegexPreferences,
} from '../actions/localStorage';
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast';
import { clearServerRegistryCache, getServerRegistries } from '../utils/enumRegexFilter';

interface EnumRegexModalProps {
  userData: { username?: string } | null;
  onCancel: () => void;
}

interface EnumEntry {
  name: string;
  permissible_values?: string[];
  reachable_from?: {
    source_ontology: string;
    source_nodes: string[];
    relationship_types?: string[];
  };
}

interface RegexEntry {
  name: string;
  expression: string;
}

interface EnumRegexModalState {
  activeIndex: number;
  enums: Record<string, EnumEntry>;
  regexes: Record<string, RegexEntry>;
  hiddenEnums: string[];
  hiddenRegexes: string[];
  loading: boolean;
  error: string | null;
  // Admin state
  editingEnum: string | null;
  editingRegex: string | null;
  newEnumName: string;
  newRegexName: string;
  newRegexExpression: string;
  editingEnumValues: string[];
  newEnumValue: string;
  regexValidationError: string | null;
}

class EnumRegexModal extends Component<EnumRegexModalProps, EnumRegexModalState> {
  constructor(props: EnumRegexModalProps) {
    super(props);
    this.state = {
      activeIndex: 0,
      enums: {},
      regexes: {},
      hiddenEnums: [],
      hiddenRegexes: [],
      loading: true,
      error: null,
      editingEnum: null,
      editingRegex: null,
      newEnumName: '',
      newRegexName: '',
      newRegexExpression: '',
      editingEnumValues: [],
      newEnumValue: '',
      regexValidationError: null,
    };
  }

  componentDidMount() {
    this.loadData();
    this.loadPreferences();
  }

  loadPreferences = () => {
    const preferences = loadEnumRegexPreferences();
    this.setState({
      hiddenEnums: preferences.hiddenEnums || [],
      hiddenRegexes: preferences.hiddenRegexes || [],
    });
  };

  /**
   * Loads enum and regex registry data.
   * Reuses cached data from enumRegexFilter if available to avoid duplicate fetches.
   * 
   * Server API endpoints (configured via VITE_ENUM_REGISTRY_ENDPOINT/VITE_REGEX_REGISTRY_ENDPOINT env vars):
   * - GET /api/enum-registry - Get all enums (public)
   * - POST /api/enum-registry - Create enum (admin, requires JWT cookie)
   * - PUT /api/enum-registry/{enumName} - Update enum (admin, requires JWT cookie)
   * - DELETE /api/enum-registry/{enumName} - Delete enum (admin, requires JWT cookie)
   * - GET /api/regex-registry - Get all regexes (public)
   * - POST /api/regex-registry - Create regex (admin, requires JWT cookie)
   * - PUT /api/regex-registry/{regexName} - Update regex (admin, requires JWT cookie)
   * - DELETE /api/regex-registry/{regexName} - Delete regex (admin, requires JWT cookie)
   * 
   * Authentication: JWT token stored in cookie named 'access_token'
   * Admin check: username === "schemalink"
   * Complex enums (with reachable_from) are read-only (403 on edit/delete)
   */
  loadData = async () => {
    this.setState({ loading: true, error: null });
    try {
      // Reuse cached registries from enumRegexFilter to avoid duplicate fetches
      const { enums: enumData, regexes: regexData } = await getServerRegistries();
      
      const enumRegistry = this.normalizeEnumRegistry(enumData);
      const regexRegistry = this.normalizeRegexRegistry(regexData);

      this.setState({
        enums: enumRegistry,
        regexes: regexRegistry,
        loading: false,
      });
    } catch (error: any) {
      this.setState({
        error: error.message || 'Failed to load registry data. Please ensure the server is running and endpoints are configured.',
        loading: false,
      });
    }
  };

  /**
   * Normalizes enum registry data from server response to our internal format
   */
  normalizeEnumRegistry = (data: any): Record<string, EnumEntry> => {
    const normalized: Record<string, EnumEntry> = {};
    for (const [name, entry] of Object.entries(data)) {
      if (typeof entry === 'object' && entry !== null) {
        normalized[name] = {
          name,
          permissible_values: (entry as any).permissible_values,
          reachable_from: (entry as any).reachable_from,
        };
      }
    }
    return normalized;
  };

  /**
   * Normalizes regex registry data from server response to our internal format
   */
  normalizeRegexRegistry = (data: any): Record<string, RegexEntry> => {
    const normalized: Record<string, RegexEntry> = {};
    for (const [name, entry] of Object.entries(data)) {
      if (typeof entry === 'object' && entry !== null) {
        const entryObj = entry as any;
        normalized[name] = {
          name: entryObj.name || name,
          expression: entryObj.expression || '',
        };
      }
    }
    return normalized;
  };


  isAdmin = () => {
    return this.props.userData?.username === 'schemalink';
  };

  handleTabChange = (e: React.MouseEvent, { activeIndex }: TabProps) => {
    this.setState({ activeIndex: activeIndex as number });
  };

  handleEnumToggle = (enumName: string) => {
    const { hiddenEnums } = this.state;
    const newHiddenEnums = hiddenEnums.includes(enumName)
      ? hiddenEnums.filter((e) => e !== enumName)
      : [...hiddenEnums, enumName];
    this.setState({ hiddenEnums: newHiddenEnums });
  };

  handleRegexToggle = (regexName: string) => {
    const { hiddenRegexes } = this.state;
    const newHiddenRegexes = hiddenRegexes.includes(regexName)
      ? hiddenRegexes.filter((r) => r !== regexName)
      : [...hiddenRegexes, regexName];
    this.setState({ hiddenRegexes: newHiddenRegexes });
  };

  handleSelectAllEnums = () => {
    this.setState({ hiddenEnums: [] });
  };

  handleUncheckAllEnums = () => {
    const { enums } = this.state;
    this.setState({ hiddenEnums: Object.keys(enums) });
  };

  handleSelectAllRegexes = () => {
    this.setState({ hiddenRegexes: [] });
  };

  handleUncheckAllRegexes = () => {
    const { regexes } = this.state;
    this.setState({ hiddenRegexes: Object.keys(regexes) });
  };

  handleSave = () => {
    const { hiddenEnums, hiddenRegexes } = this.state;
    saveEnumRegexPreferences({ hiddenEnums, hiddenRegexes });
    // Clear server registry cache to force reload
    clearServerRegistryCache();
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
    showSuccess('Preferences saved successfully!');
  };

  // Admin functions
  handleAddEnum = async () => {
    const { newEnumName, editingEnumValues, enums } = this.state;
    if (!newEnumName.trim()) {
      showWarning('Please enter an enum name');
      return;
    }
    if (editingEnumValues.length === 0) {
      showWarning('Please add at least one permissible value');
      return;
    }

    if (!this.isAdmin()) {
      showError('Only admins can add enums');
      return;
    }

    const endpoint = import.meta.env.VITE_ENUM_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newEnumName,
          permissible_values: editingEnumValues,
        }),
      });

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        this.setState({
          newEnumName: '',
          editingEnumValues: [],
        });
        showSuccess('Enum added successfully!');
      } else if (response.status === 401) {
        showError('Unauthorized: You must be logged in as admin to add enums');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to add enum: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to add enum: ' + (error.message || 'Unknown error'));
    }
  };

  handleUpdateEnum = async (enumName: string) => {
    const { editingEnumValues } = this.state;
    if (!this.isAdmin()) {
      showError('Only admins can update enums');
      return;
    }

    const endpoint = import.meta.env.VITE_ENUM_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(enumName)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: enumName,
            permissible_values: editingEnumValues,
          }),
        }
      );

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        this.setState({
          editingEnum: null,
          editingEnumValues: [],
        });
        showSuccess('Enum updated successfully!');
      } else if (response.status === 403) {
        showWarning('Cannot edit complex enums with ontology mappings');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to update enum: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to update enum: ' + (error.message || 'Unknown error'));
    }
  };

  handleDeleteEnum = async (enumName: string) => {
    if (!this.isAdmin()) {
      showError('Only admins can delete enums');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete enum "${enumName}"?`)) {
      return;
    }

    const endpoint = import.meta.env.VITE_ENUM_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(enumName)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        showSuccess('Enum deleted successfully!');
      } else if (response.status === 403) {
        showWarning('Cannot delete complex enums with ontology mappings');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to delete enum: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to delete enum: ' + (error.message || 'Unknown error'));
    }
  };

  handleAddRegex = async () => {
    const { newRegexName, newRegexExpression } = this.state;
    if (!newRegexName.trim()) {
      showWarning('Please enter a regex name');
      return;
    }
    if (!newRegexExpression.trim()) {
      showWarning('Please enter a regex expression');
      return;
    }

    // Validate regex
    try {
      new RegExp(newRegexExpression);
    } catch (e) {
      this.setState({ regexValidationError: 'Invalid regex expression' });
      return;
    }

    if (!this.isAdmin()) {
      showError('Only admins can add regexes');
      return;
    }

    const endpoint = import.meta.env.VITE_REGEX_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newRegexName,
          expression: newRegexExpression,
        }),
      });

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        this.setState({
          newRegexName: '',
          newRegexExpression: '',
          regexValidationError: null,
        });
        showSuccess('Regex added successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to add regex: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to add regex: ' + (error.message || 'Unknown error'));
    }
  };

  handleUpdateRegex = async (regexName: string) => {
    const { newRegexExpression } = this.state;
    if (!this.isAdmin()) {
      showError('Only admins can update regexes');
      return;
    }

    // Validate regex
    try {
      new RegExp(newRegexExpression);
    } catch (e) {
      this.setState({ regexValidationError: 'Invalid regex expression' });
      return;
    }

    const endpoint = import.meta.env.VITE_REGEX_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(regexName)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: regexName,
            expression: newRegexExpression,
          }),
        }
      );

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        this.setState({
          editingRegex: null,
          newRegexExpression: '',
          regexValidationError: null,
        });
        showSuccess('Regex updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to update regex: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to update regex: ' + (error.message || 'Unknown error'));
    }
  };

  handleDeleteRegex = async (regexName: string) => {
    if (!this.isAdmin()) {
      showError('Only admins can delete regexes');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete regex "${regexName}"?`)) {
      return;
    }

    const endpoint = import.meta.env.VITE_REGEX_REGISTRY_ENDPOINT;

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(regexName)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Clear shared cache BEFORE reloading to ensure fresh data
        clearServerRegistryCache(); // Clears shared cache (used by both UI and import/export)
        await this.loadData(); // Reload with fresh data
        window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
        showSuccess('Regex deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to delete regex: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error: any) {
      showError('Failed to delete regex: ' + (error.message || 'Unknown error'));
    }
  };

  handleAddEnumValue = () => {
    const { newEnumValue, editingEnumValues } = this.state;
    if (newEnumValue.trim() && !editingEnumValues.includes(newEnumValue.trim())) {
      this.setState({
        editingEnumValues: [...editingEnumValues, newEnumValue.trim()],
        newEnumValue: '',
      });
    }
  };

  handleDeleteEnumValue = (index: number) => {
    const { editingEnumValues } = this.state;
    this.setState({
      editingEnumValues: editingEnumValues.filter((_, i) => i !== index),
    });
  };

  handleEditEnumValue = (index: number, newValue: string) => {
    const { editingEnumValues } = this.state;
    const updated = [...editingEnumValues];
    updated[index] = newValue;
    this.setState({ editingEnumValues: updated });
  };

  startEditEnum = (enumName: string) => {
    const { enums } = this.state;
    const enumEntry = enums[enumName];
    this.setState({
      editingEnum: enumName,
      editingEnumValues: enumEntry?.permissible_values ? [...enumEntry.permissible_values] : [],
    });
  };

  startEditRegex = (regexName: string) => {
    const { regexes } = this.state;
    const regexEntry = regexes[regexName];
    this.setState({
      editingRegex: regexName,
      newRegexExpression: regexEntry?.expression || '',
    });
  };

  cancelEditEnum = () => {
    this.setState({ editingEnum: null, editingEnumValues: [], newEnumValue: '' });
  };

  cancelEditRegex = () => {
    this.setState({ editingRegex: null, newRegexExpression: '', regexValidationError: null });
  };

  validateRegex = (expression: string) => {
    try {
      new RegExp(expression);
      this.setState({ regexValidationError: null });
      return true;
    } catch (e) {
      this.setState({ regexValidationError: 'Invalid regex expression' });
      return false;
    }
  };

  render() {
    const {
      activeIndex,
      enums,
      regexes,
      hiddenEnums,
      hiddenRegexes,
      loading,
      error,
      editingEnum,
      editingRegex,
      newEnumName,
      newRegexName,
      newRegexExpression,
      editingEnumValues,
      newEnumValue,
      regexValidationError,
    } = this.state;

    const isAdmin = this.isAdmin();

    const enumPanes = {
      menuItem: 'Enums',
      render: () => (
        <Tab.Pane attached={false}>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <Message negative>{error}</Message>
          ) : (
            <div>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <Button
                  size="small"
                  onClick={this.handleSelectAllEnums}
                  content="Select All"
                />
                <Button
                  size="small"
                  onClick={this.handleUncheckAllEnums}
                  content="Uncheck All"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                {Object.entries(enums).map(([enumName, enumEntry]) => (
                  <div
                    key={enumName}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      marginBottom: '10px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <Checkbox
                        checked={!hiddenEnums.includes(enumName)}
                        onChange={() => this.handleEnumToggle(enumName)}
                        label={enumName}
                        style={{ flex: 1 }}
                      />
                      {isAdmin && enumEntry.permissible_values && !enumEntry.reachable_from && (
                        <div>
                          {editingEnum === enumName ? (
                            <>
                              <Button
                                size="small"
                                positive
                                onClick={() => this.handleUpdateEnum(enumName)}
                              >
                                Save
                              </Button>
                              <Button size="small" onClick={this.cancelEditEnum}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="small"
                                icon="edit"
                                onClick={() => this.startEditEnum(enumName)}
                              />
                              <Button
                                size="small"
                                icon="trash"
                                negative
                                onClick={() => this.handleDeleteEnum(enumName)}
                              />
                            </>
                          )}
                        </div>
                      )}
                      {isAdmin && enumEntry.reachable_from && (
                        <Label size="small" color="grey" title="Complex enums with ontology mappings cannot be edited">
                          Read-only
                        </Label>
                      )}
                    </div>
                    {editingEnum === enumName ? (
                      <div>
                        <Form>
                          <Form.Field>
                            <label>Permissible Values</label>
                            <List>
                              {editingEnumValues.map((value, index) => (
                                <List.Item key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                  <Input
                                    value={value}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      this.handleEditEnumValue(index, e.target.value)
                                    }
                                    style={{ flex: 1, marginRight: '5px' }}
                                  />
                                  <Button
                                    size="small"
                                    icon="trash"
                                    negative
                                    onClick={() => this.handleDeleteEnumValue(index)}
                                  />
                                </List.Item>
                              ))}
                            </List>
                            <div style={{ display: 'flex', marginTop: '10px' }}>
                              <Input
                                placeholder="Add new value"
                                value={newEnumValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  this.setState({ newEnumValue: e.target.value })
                                }
                                onKeyPress={(e: React.KeyboardEvent) => {
                                  if (e.key === 'Enter') {
                                    this.handleAddEnumValue();
                                  }
                                }}
                                style={{ flex: 1, marginRight: '5px' }}
                              />
                              <Button
                                icon="plus"
                                onClick={this.handleAddEnumValue}
                                disabled={!newEnumValue.trim()}
                              />
                            </div>
                          </Form.Field>
                        </Form>
                      </div>
                    ) : (
                      <div style={{ marginLeft: '30px', color: '#666' }}>
                        {enumEntry.permissible_values ? (
                          <div>
                            <strong>Permissible Values:</strong>
                            <ul>
                              {enumEntry.permissible_values.map((value, idx) => (
                                <li key={idx}>{value}</li>
                              ))}
                            </ul>
                          </div>
                        ) : enumEntry.reachable_from ? (
                          <div>
                            <strong>Reachable From:</strong>
                            <div>Ontology: {enumEntry.reachable_from.source_ontology}</div>
                            <div>Source Nodes: {enumEntry.reachable_from.source_nodes.join(', ')}</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div
                  style={{
                    padding: '15px',
                    border: '2px dashed #ddd',
                    borderRadius: '4px',
                    marginTop: '20px',
                  }}
                >
                  <Form>
                    <Form.Field>
                      <label>Add New Enum</label>
                      <Input
                        placeholder="Enum name"
                        value={newEnumName}
                        onChange={(e) => this.setState({ newEnumName: e.target.value })}
                        style={{ marginBottom: '10px' }}
                      />
                      <div>
                        <label>Permissible Values</label>
                        <List>
                          {editingEnumValues.map((value, index) => (
                            <List.Item key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                              <Input
                                value={value}
                                onChange={(e) =>
                                  this.handleEditEnumValue(index, e.target.value)
                                }
                                style={{ flex: 1, marginRight: '5px' }}
                              />
                              <Button
                                size="small"
                                icon="trash"
                                negative
                                onClick={() => this.handleDeleteEnumValue(index)}
                              />
                            </List.Item>
                          ))}
                        </List>
                        <div style={{ display: 'flex', marginTop: '10px' }}>
                          <Input
                            placeholder="Add new value"
                            value={newEnumValue}
                            onChange={(e) =>
                              this.setState({ newEnumValue: e.target.value })
                            }
                            onKeyPress={(e: React.KeyboardEvent) => {
                              if (e.key === 'Enter') {
                                this.handleAddEnumValue();
                              }
                            }}
                            style={{ flex: 1, marginRight: '5px' }}
                          />
                          <Button icon="plus" onClick={this.handleAddEnumValue} />
                        </div>
                      </div>
                      <Button
                        primary
                        onClick={this.handleAddEnum}
                        disabled={!newEnumName.trim() || editingEnumValues.length === 0}
                        style={{ marginTop: '10px' }}
                      >
                        Add Enum
                      </Button>
                    </Form.Field>
                  </Form>
                </div>
              )}
            </div>
          )}
        </Tab.Pane>
      ),
    };

    const regexPanes = {
      menuItem: 'Regexes',
      render: () => (
        <Tab.Pane attached={false}>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <Message negative>{error}</Message>
          ) : (
            <div>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <Button
                  size="small"
                  onClick={this.handleSelectAllRegexes}
                  content="Select All"
                />
                <Button
                  size="small"
                  onClick={this.handleUncheckAllRegexes}
                  content="Uncheck All"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                {Object.entries(regexes).map(([regexName, regexEntry]) => (
                  <div
                    key={regexName}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      marginBottom: '10px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <Checkbox
                        checked={!hiddenRegexes.includes(regexName)}
                        onChange={() => this.handleRegexToggle(regexName)}
                        label={regexName}
                        style={{ flex: 1 }}
                      />
                      {isAdmin && (
                        <div>
                          {editingRegex === regexName ? (
                            <>
                              <Button
                                size="small"
                                positive
                                onClick={() => this.handleUpdateRegex(regexName)}
                                disabled={!!regexValidationError}
                              >
                                Save
                              </Button>
                              <Button size="small" onClick={this.cancelEditRegex}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="small"
                                icon="edit"
                                onClick={() => this.startEditRegex(regexName)}
                              />
                              <Button
                                size="small"
                                icon="trash"
                                negative
                                onClick={() => this.handleDeleteRegex(regexName)}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {editingRegex === regexName ? (
                      <div style={{ marginLeft: '30px' }}>
                        <Form.Field>
                          <label>Regex Expression</label>
                          <Input
                            value={newRegexExpression}
                            onChange={(e) => {
                              this.setState({ newRegexExpression: e.target.value });
                              this.validateRegex(e.target.value);
                            }}
                            error={!!regexValidationError}
                          />
                          {regexValidationError && (
                            <Label pointing="above" color="red">
                              {regexValidationError}
                            </Label>
                          )}
                        </Form.Field>
                      </div>
                    ) : (
                      <div style={{ marginLeft: '30px', color: '#666' }}>
                        <strong>Expression:</strong> <code>{regexEntry.expression}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div
                  style={{
                    padding: '15px',
                    border: '2px dashed #ddd',
                    borderRadius: '4px',
                    marginTop: '20px',
                  }}
                >
                  <Form>
                    <Form.Field>
                      <label>Add New Regex</label>
                      <Input
                        placeholder="Regex name"
                        value={newRegexName}
                        onChange={(e) => this.setState({ newRegexName: e.target.value })}
                        style={{ marginBottom: '10px' }}
                      />
                      <Input
                        placeholder="Regex expression"
                        value={newRegexExpression}
                        onChange={(e) => {
                          this.setState({ newRegexExpression: e.target.value });
                          this.validateRegex(e.target.value);
                        }}
                        error={!!regexValidationError}
                        style={{ marginBottom: '10px' }}
                      />
                      {regexValidationError && (
                        <Label pointing="above" color="red" style={{ marginBottom: '10px' }}>
                          {regexValidationError}
                        </Label>
                      )}
                      <Button
                        primary
                        onClick={this.handleAddRegex}
                        disabled={
                          !newRegexName.trim() ||
                          !newRegexExpression.trim() ||
                          !!regexValidationError
                        }
                      >
                        Add Regex
                      </Button>
                    </Form.Field>
                  </Form>
                </div>
              )}
            </div>
          )}
        </Tab.Pane>
      ),
    };

    const panes = [enumPanes, regexPanes];

    return (
      <Modal size="large" centered={false} open={true} onClose={this.props.onCancel}>
        <Modal.Header>Enum / Regex Panel</Modal.Header>
        <Modal.Content scrolling>
          <Tab
            menu={{ secondary: true }}
            panes={panes}
            activeIndex={activeIndex}
            onTabChange={this.handleTabChange}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleSave} primary>
            Save Preferences
          </Button>
          <Button onClick={this.props.onCancel}>Done</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default EnumRegexModal;

