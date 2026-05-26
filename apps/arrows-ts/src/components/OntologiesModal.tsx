import React, { Component } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  Icon,
  Message,
  List,
  Label,
  TextArea,
} from 'semantic-ui-react';
import { Ontology } from '@neo4j-arrows/model';
import { showSuccess, showError, showWarning } from '../utils/toast';

interface OntologiesModalProps {
  userData: { username?: string } | null;
  onCancel: () => void;
}

interface OntologiesModalState {
  ontologies: Record<string, Ontology>;
  loading: boolean;
  error: string | null;
  // Admin state
  editingOntology: string | null;
  newOntology: Partial<Ontology>;
  editingTerms: string[];
  editingProperties: string[];
  newTerm: string;
  newProperty: string;
  // UI state for collapsible sections
  expandedSections: Record<string, { terms: boolean; properties: boolean }>;
  // Loading states for CRUD operations
  saving: boolean;
  deleting: string | null; // ID of ontology being deleted
}

class OntologiesModal extends Component<OntologiesModalProps, OntologiesModalState> {
  // Security: Input validation constants
  private static readonly MAX_ID_LENGTH = 100;
  private static readonly MAX_NAME_LENGTH = 200;
  private static readonly MAX_DESCRIPTION_LENGTH = 2000;
  private static readonly MAX_NAMESPACE_LENGTH = 500;
  private static readonly MAX_ANNOTATOR_LENGTH = 200;
  private static readonly MAX_TERM_LENGTH = 500;
  private static readonly MAX_PROPERTY_LENGTH = 500;
  private static readonly MAX_TERMS_COUNT = 1000;
  private static readonly MAX_PROPERTIES_COUNT = 1000;
  private static readonly MAX_JSON_SIZE = 500000; // 500KB
  private static readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB

  constructor(props: OntologiesModalProps) {
    super(props);
    this.state = {
      ontologies: {},
      loading: true,
      error: null,
      editingOntology: null,
      newOntology: {
        id: '',
        name: '',
        description: '',
        namespace: '',
        annotator: '',
        terms: [],
        properties: [],
      },
      editingTerms: [],
      editingProperties: [],
      newTerm: '',
      newProperty: '',
      expandedSections: {},
      saving: false,
      deleting: null,
    };
  }

  fileInputRef: HTMLInputElement | null = null;

  componentDidMount() {
    this.loadData();
  }

  /**
   * Loads custom ontologies from the backend API.
   * 
   * Server API endpoints (configured via VITE_CUSTOM_ONTOLOGIES_ENDPOINT env var):
   * - GET /api/custom-ontologies - Get all custom ontologies (admin only)
   * - POST /api/custom-ontologies - Create ontology (admin only)
   * - PUT /api/custom-ontologies/{ontology_id} - Update ontology (admin only)
   * - DELETE /api/custom-ontologies/{ontology_id} - Delete ontology (admin only)
   * 
   * Authentication: JWT token stored in cookie named 'access_token'
   * Admin check: username === "schemalink" (frontend) + backend enforces admin-only access
   */
  loadData = async () => {
    this.setState({ loading: true, error: null });
    try {
      const endpoint = import.meta.env.VITE_CUSTOM_ONTOLOGIES_ENDPOINT;
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const ontologiesMap: Record<string, Ontology> = {};
        
        // Handle both array and object responses
        const ontologiesArray = Array.isArray(data) ? data : (data.ontologies || []);
        ontologiesArray.forEach((ontology: Ontology) => {
          ontologiesMap[ontology.id] = ontology;
        });

        this.setState({
          ontologies: ontologiesMap,
          loading: false,
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        this.setState({
          error: errorData.detail || 'Failed to load custom ontologies',
          loading: false,
        });
      }
    } catch (error: any) {
      this.setState({
        error: error.message || 'Failed to load custom ontologies. Please ensure the server is running and endpoints are configured.',
        loading: false,
      });
    }
  };

  isAdmin = () => {
    return this.props.userData?.username === 'schemalink';
  };

  handleAddOntology = async () => {
    const { newOntology, editingTerms, editingProperties, ontologies, saving } = this.state;
    
    if (saving) return; // Prevent multiple submissions
    
    if (!newOntology.id?.trim()) {
      showWarning('Please enter an ontology ID');
      return;
    }
    
    // Security: Validate ID length and characters
    const trimmedId = newOntology.id.trim();
    if (trimmedId.length > OntologiesModal.MAX_ID_LENGTH) {
      showError(`Ontology ID must be ${OntologiesModal.MAX_ID_LENGTH} characters or less`);
      return;
    }
    
    // Check for duplicate ID
    if (ontologies[trimmedId]) {
      showError(`An ontology with ID "${trimmedId}" already exists`);
      return;
    }
    
    if (!newOntology.name?.trim()) {
      showWarning('Please enter an ontology name');
      return;
    }
    if (newOntology.name.trim().length > OntologiesModal.MAX_NAME_LENGTH) {
      showError(`Ontology name must be ${OntologiesModal.MAX_NAME_LENGTH} characters or less`);
      return;
    }
    if (!newOntology.namespace?.trim()) {
      showWarning('Please enter a namespace');
      return;
    }
    if (newOntology.namespace.trim().length > OntologiesModal.MAX_NAMESPACE_LENGTH) {
      showError(`Namespace must be ${OntologiesModal.MAX_NAMESPACE_LENGTH} characters or less`);
      return;
    }
    if (!newOntology.annotator?.trim()) {
      showWarning('Please enter an annotator');
      return;
    }
    if (newOntology.annotator.trim().length > OntologiesModal.MAX_ANNOTATOR_LENGTH) {
      showError(`Annotator must be ${OntologiesModal.MAX_ANNOTATOR_LENGTH} characters or less`);
      return;
    }
    
    // Security: Validate terms and properties arrays
    if (editingTerms.length > OntologiesModal.MAX_TERMS_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_TERMS_COUNT} terms allowed`);
      return;
    }
    if (editingProperties.length > OntologiesModal.MAX_PROPERTIES_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_PROPERTIES_COUNT} properties allowed`);
      return;
    }
    
    // Security: Validate individual term/property lengths
    const invalidTerm = editingTerms.find(term => term.trim().length > OntologiesModal.MAX_TERM_LENGTH);
    if (invalidTerm) {
      showError(`Terms must be ${OntologiesModal.MAX_TERM_LENGTH} characters or less`);
      return;
    }
    const invalidProperty = editingProperties.find(property => property.trim().length > OntologiesModal.MAX_PROPERTY_LENGTH);
    if (invalidProperty) {
      showError(`Properties must be ${OntologiesModal.MAX_PROPERTY_LENGTH} characters or less`);
      return;
    }

    if (!this.isAdmin()) {
      showError('Only admins can add ontologies');
      return;
    }

    const endpoint = import.meta.env.VITE_CUSTOM_ONTOLOGIES_ENDPOINT;

    this.setState({ saving: true });
    try {
      // Security: Filter out empty strings and limit lengths
      const filteredTerms = editingTerms
        .filter(term => term.trim().length > 0)
        .map(term => term.trim().substring(0, OntologiesModal.MAX_TERM_LENGTH));
      const filteredProperties = editingProperties
        .filter(property => property.trim().length > 0)
        .map(property => property.trim().substring(0, OntologiesModal.MAX_PROPERTY_LENGTH));

      const ontologyData: Ontology = {
        id: newOntology.id.trim().substring(0, OntologiesModal.MAX_ID_LENGTH),
        name: newOntology.name.trim().substring(0, OntologiesModal.MAX_NAME_LENGTH),
        description: (newOntology.description?.trim() || '').substring(0, OntologiesModal.MAX_DESCRIPTION_LENGTH),
        namespace: newOntology.namespace.trim().substring(0, OntologiesModal.MAX_NAMESPACE_LENGTH),
        annotator: newOntology.annotator.trim().substring(0, OntologiesModal.MAX_ANNOTATOR_LENGTH),
        terms: filteredTerms.length > 0 ? filteredTerms : undefined,
        properties: filteredProperties.length > 0 ? filteredProperties : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ontologyData),
      });

      if (response.ok) {
        await this.loadData();
        this.setState({
          newOntology: {
            id: '',
            name: '',
            description: '',
            namespace: '',
            annotator: '',
            terms: [],
            properties: [],
          },
          editingTerms: [],
          editingProperties: [],
          newTerm: '',
          newProperty: '',
          saving: false,
        });
        showSuccess('Ontology added successfully!');
      } else if (response.status === 401) {
        showError('Unauthorized: You must be logged in as admin to add ontologies');
        this.setState({ saving: false });
      } else if (response.status === 403) {
        showError('Forbidden: You do not have permission to add ontologies');
        this.setState({ saving: false });
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to add ontology: ' + (errorData.detail || 'Unknown error'));
        this.setState({ saving: false });
      }
    } catch (error: any) {
      showError('Failed to add ontology: ' + (error.message || 'Unknown error'));
      this.setState({ saving: false });
    }
  };

  handleUpdateOntology = async (ontologyId: string) => {
    const { editingTerms, editingProperties, newOntology, saving, ontologies } = this.state;
    
    if (saving) return; // Prevent multiple submissions
    
    if (!this.isAdmin()) {
      showError('Only admins can update ontologies');
      return;
    }

    // Validate ID field
    if (!newOntology.id?.trim()) {
      showWarning('Please enter an ontology ID');
      return;
    }
    const trimmedId = newOntology.id.trim();
    if (trimmedId.length > OntologiesModal.MAX_ID_LENGTH) {
      showError(`Ontology ID must be ${OntologiesModal.MAX_ID_LENGTH} characters or less`);
      return;
    }
    
    // Check if ID has changed
    const idChanged = trimmedId !== ontologyId;
    
    // If ID changed, check for duplicate
    if (idChanged && ontologies[trimmedId]) {
      showError(`An ontology with ID "${trimmedId}" already exists`);
      return;
    }
    
    // If ID changed, show warning and get confirmation
    if (idChanged) {
      const confirmed = window.confirm(
        `Warning: Changing the ID from "${ontologyId}" to "${trimmedId}" will:\n\n` +
        `1. Delete the old ontology (ID: ${ontologyId})\n` +
        `2. Create a new ontology with the new ID\n\n` +
        `All data will be transferred to the new ontology.\n\n` +
        `Do you want to continue?`
      );
      if (!confirmed) {
        return;
      }
    }

    // Validate required fields
    if (!newOntology.name?.trim()) {
      showWarning('Please enter an ontology name');
      return;
    }
    if (newOntology.name.trim().length > OntologiesModal.MAX_NAME_LENGTH) {
      showError(`Ontology name must be ${OntologiesModal.MAX_NAME_LENGTH} characters or less`);
      return;
    }
    if (!newOntology.namespace?.trim()) {
      showWarning('Please enter a namespace');
      return;
    }
    if (newOntology.namespace.trim().length > OntologiesModal.MAX_NAMESPACE_LENGTH) {
      showError(`Namespace must be ${OntologiesModal.MAX_NAMESPACE_LENGTH} characters or less`);
      return;
    }
    if (!newOntology.annotator?.trim()) {
      showWarning('Please enter an annotator');
      return;
    }
    if (newOntology.annotator.trim().length > OntologiesModal.MAX_ANNOTATOR_LENGTH) {
      showError(`Annotator must be ${OntologiesModal.MAX_ANNOTATOR_LENGTH} characters or less`);
      return;
    }
    
    // Security: Validate terms and properties arrays
    if (editingTerms.length > OntologiesModal.MAX_TERMS_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_TERMS_COUNT} terms allowed`);
      return;
    }
    if (editingProperties.length > OntologiesModal.MAX_PROPERTIES_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_PROPERTIES_COUNT} properties allowed`);
      return;
    }
    
    // Security: Validate individual term/property lengths
    const invalidTerm = editingTerms.find(term => term.trim().length > OntologiesModal.MAX_TERM_LENGTH);
    if (invalidTerm) {
      showError(`Terms must be ${OntologiesModal.MAX_TERM_LENGTH} characters or less`);
      return;
    }
    const invalidProperty = editingProperties.find(property => property.trim().length > OntologiesModal.MAX_PROPERTY_LENGTH);
    if (invalidProperty) {
      showError(`Properties must be ${OntologiesModal.MAX_PROPERTY_LENGTH} characters or less`);
      return;
    }
    
    // Filter out empty strings from terms and properties and limit lengths
    const filteredTerms = editingTerms
      .filter(term => term.trim().length > 0)
      .map(term => term.trim().substring(0, OntologiesModal.MAX_TERM_LENGTH));
    const filteredProperties = editingProperties
      .filter(property => property.trim().length > 0)
      .map(property => property.trim().substring(0, OntologiesModal.MAX_PROPERTY_LENGTH));

    const endpoint = import.meta.env.VITE_CUSTOM_ONTOLOGIES_ENDPOINT;

    this.setState({ saving: true });
    try {
      const ontologyData: Ontology = {
        id: trimmedId,
        name: newOntology.name.trim().substring(0, OntologiesModal.MAX_NAME_LENGTH),
        description: (newOntology.description?.trim() || '').substring(0, OntologiesModal.MAX_DESCRIPTION_LENGTH),
        namespace: newOntology.namespace.trim().substring(0, OntologiesModal.MAX_NAMESPACE_LENGTH),
        annotator: newOntology.annotator.trim().substring(0, OntologiesModal.MAX_ANNOTATOR_LENGTH),
        terms: filteredTerms.length > 0 ? filteredTerms : undefined,
        properties: filteredProperties.length > 0 ? filteredProperties : undefined,
      };

      if (idChanged) {
        // ID changed: Delete old and create new
        // First, create the new ontology
        const createResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(ontologyData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({ detail: `HTTP ${createResponse.status}` }));
          showError('Failed to create new ontology: ' + (errorData.detail || 'Unknown error'));
          this.setState({ saving: false });
          return;
        }

        // Then, delete the old ontology
        const deleteResponse = await fetch(
          `${endpoint}/${encodeURIComponent(ontologyId)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!deleteResponse.ok) {
          // If delete fails, try to clean up the new one we just created
          await fetch(
            `${endpoint}/${encodeURIComponent(trimmedId)}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          ).catch(() => {}); // Ignore cleanup errors
          
          const errorData = await deleteResponse.json().catch(() => ({ detail: `HTTP ${deleteResponse.status}` }));
          showError('Failed to delete old ontology: ' + (errorData.detail || 'Unknown error') + '. The new ontology was created but the old one could not be deleted.');
          this.setState({ saving: false });
          await this.loadData();
          return;
        }

        // Clean up expanded sections for old ontology
        const { expandedSections } = this.state;
        const updatedExpandedSections = { ...expandedSections };
        delete updatedExpandedSections[ontologyId];
        
        await this.loadData();
        this.setState({
          editingOntology: null,
          editingTerms: [],
          editingProperties: [],
          newTerm: '',
          newProperty: '',
          saving: false,
          expandedSections: updatedExpandedSections,
          // Reset newOntology to clear the "Add New Ontology" form
          newOntology: {
            id: '',
            name: '',
            description: '',
            namespace: '',
            annotator: '',
            terms: [],
            properties: [],
          },
        });
        showSuccess(`Ontology ID changed successfully! Old ID "${ontologyId}" was deleted and new ID "${trimmedId}" was created with all data transferred.`);
      } else {
        // ID unchanged: Normal update
        const response = await fetch(
          `${endpoint}/${encodeURIComponent(ontologyId)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(ontologyData),
          }
        );

        if (response.ok) {
          await this.loadData();
          this.setState({
            editingOntology: null,
            editingTerms: [],
            editingProperties: [],
            newTerm: '',
            newProperty: '',
            saving: false,
            // Reset newOntology to clear the "Add New Ontology" form
            newOntology: {
              id: '',
              name: '',
              description: '',
              namespace: '',
              annotator: '',
              terms: [],
              properties: [],
            },
          });
          showSuccess('Ontology updated successfully!');
        } else if (response.status === 403) {
          showError('Forbidden: You do not have permission to update ontologies');
          this.setState({ saving: false });
        } else {
          const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
          showError('Failed to update ontology: ' + (errorData.detail || 'Unknown error'));
          this.setState({ saving: false });
        }
      }
    } catch (error: any) {
      showError('Failed to update ontology: ' + (error.message || 'Unknown error'));
      this.setState({ saving: false });
    }
  };

  handleDeleteOntology = async (ontologyId: string) => {
    const { deleting } = this.state;
    
    if (deleting === ontologyId) return; // Already deleting
    
    if (!this.isAdmin()) {
      showError('Only admins can delete ontologies');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ontology "${ontologyId}"?`)) {
      return;
    }

    const endpoint = import.meta.env.VITE_CUSTOM_ONTOLOGIES_ENDPOINT;

    this.setState({ deleting: ontologyId });
    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(ontologyId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Clean up expanded sections for deleted ontology
        const { expandedSections } = this.state;
        const updatedExpandedSections = { ...expandedSections };
        delete updatedExpandedSections[ontologyId];
        
        await this.loadData();
        this.setState({
          deleting: null,
          expandedSections: updatedExpandedSections,
        });
        showSuccess('Ontology deleted successfully!');
      } else if (response.status === 403) {
        showError('Forbidden: You do not have permission to delete ontologies');
        this.setState({ deleting: null });
      } else {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        showError('Failed to delete ontology: ' + (errorData.detail || 'Unknown error'));
        this.setState({ deleting: null });
      }
    } catch (error: any) {
      showError('Failed to delete ontology: ' + (error.message || 'Unknown error'));
      this.setState({ deleting: null });
    }
  };

  startEditOntology = (ontologyId: string) => {
    const { ontologies } = this.state;
    const ontology = ontologies[ontologyId];
    if (ontology) {
      this.setState({
        editingOntology: ontologyId,
        newOntology: {
          id: ontology.id,
          name: ontology.name,
          description: ontology.description || '',
          namespace: ontology.namespace,
          annotator: ontology.annotator,
        },
        editingTerms: ontology.terms ? [...ontology.terms] : [],
        editingProperties: ontology.properties ? [...ontology.properties] : [],
        newTerm: '',
        newProperty: '',
      });
    }
  };

  cancelEditOntology = () => {
    this.setState({
      editingOntology: null,
      editingTerms: [],
      editingProperties: [],
      newTerm: '',
      newProperty: '',
      saving: false,
      // Reset newOntology to clear the "Add New Ontology" form
      newOntology: {
        id: '',
        name: '',
        description: '',
        namespace: '',
        annotator: '',
        terms: [],
        properties: [],
      },
    });
  };

  handleAddTerm = () => {
    const { newTerm, editingTerms } = this.state;
    const trimmedTerm = newTerm.trim();
    
    if (!trimmedTerm) {
      return;
    }
    
    // Security: Validate length before adding
    if (trimmedTerm.length > OntologiesModal.MAX_TERM_LENGTH) {
      showError(`Term must be ${OntologiesModal.MAX_TERM_LENGTH} characters or less`);
      return;
    }
    
    // Security: Validate array size limit
    if (editingTerms.length >= OntologiesModal.MAX_TERMS_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_TERMS_COUNT} terms allowed`);
      return;
    }
    
    // Check for duplicates
    if (editingTerms.includes(trimmedTerm)) {
      showWarning('This term already exists');
      return;
    }
    
    this.setState({
      editingTerms: [...editingTerms, trimmedTerm],
      newTerm: '',
    });
  };

  handleDeleteTerm = (index: number) => {
    const { editingTerms } = this.state;
    this.setState({
      editingTerms: editingTerms.filter((_, i) => i !== index),
    });
  };

  handleEditTerm = (index: number, newValue: string) => {
    const { editingTerms } = this.state;
    const updated = [...editingTerms];
    
    // If the value is empty, remove the term
    if (!newValue.trim()) {
      this.setState({
        editingTerms: updated.filter((_, i) => i !== index),
      });
      return;
    }
    
    // Security: Validate length before updating
    const trimmedValue = newValue.trim();
    if (trimmedValue.length > OntologiesModal.MAX_TERM_LENGTH) {
      showError(`Term must be ${OntologiesModal.MAX_TERM_LENGTH} characters or less`);
      return;
    }
    
    // Update the value
    updated[index] = trimmedValue;
    
    // Check for duplicates (case-sensitive, excluding current index)
    const duplicateIndex = updated.findIndex((term, i) => i !== index && term.trim() === trimmedValue);
    if (duplicateIndex !== -1) {
      showWarning('This term already exists');
      return;
    }
    
    this.setState({ editingTerms: updated });
  };

  handleAddProperty = () => {
    const { newProperty, editingProperties } = this.state;
    const trimmedProperty = newProperty.trim();
    
    if (!trimmedProperty) {
      return;
    }
    
    // Security: Validate length before adding
    if (trimmedProperty.length > OntologiesModal.MAX_PROPERTY_LENGTH) {
      showError(`Property must be ${OntologiesModal.MAX_PROPERTY_LENGTH} characters or less`);
      return;
    }
    
    // Security: Validate array size limit
    if (editingProperties.length >= OntologiesModal.MAX_PROPERTIES_COUNT) {
      showError(`Maximum ${OntologiesModal.MAX_PROPERTIES_COUNT} properties allowed`);
      return;
    }
    
    // Check for duplicates
    if (editingProperties.includes(trimmedProperty)) {
      showWarning('This property already exists');
      return;
    }
    
    this.setState({
      editingProperties: [...editingProperties, trimmedProperty],
      newProperty: '',
    });
  };

  handleDeleteProperty = (index: number) => {
    const { editingProperties } = this.state;
    this.setState({
      editingProperties: editingProperties.filter((_, i) => i !== index),
    });
  };

  handleEditProperty = (index: number, newValue: string) => {
    const { editingProperties } = this.state;
    const updated = [...editingProperties];
    
    // If the value is empty, remove the property
    if (!newValue.trim()) {
      this.setState({
        editingProperties: updated.filter((_, i) => i !== index),
      });
      return;
    }
    
    // Security: Validate length before updating
    const trimmedValue = newValue.trim();
    if (trimmedValue.length > OntologiesModal.MAX_PROPERTY_LENGTH) {
      showError(`Property must be ${OntologiesModal.MAX_PROPERTY_LENGTH} characters or less`);
      return;
    }
    
    // Update the value
    updated[index] = trimmedValue;
    
    // Check for duplicates (case-sensitive, excluding current index)
    const duplicateIndex = updated.findIndex((property, i) => i !== index && property.trim() === trimmedValue);
    if (duplicateIndex !== -1) {
      showWarning('This property already exists');
      return;
    }
    
    this.setState({ editingProperties: updated });
  };

  toggleSection = (ontologyId: string, section: 'terms' | 'properties') => {
    const { expandedSections } = this.state;
    const current = expandedSections[ontologyId] || { terms: false, properties: false };
    this.setState({
      expandedSections: {
        ...expandedSections,
        [ontologyId]: {
          ...current,
          [section]: !current[section],
        },
      },
    });
  };

  handleFileSelect = () => {
    this.fileInputRef?.click();
  };

  handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { editingOntology, newOntology, editingTerms, editingProperties } = this.state;
    
    if (editingOntology) {
      showWarning('Please finish editing the current ontology before importing a new one.');
      // Reset file input
      if (this.fileInputRef) {
        this.fileInputRef.value = '';
      }
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Security: Check file size (limit to 1MB)
    if (file.size > OntologiesModal.MAX_FILE_SIZE) {
      showError(`File size exceeds ${OntologiesModal.MAX_FILE_SIZE / (1024 * 1024)}MB limit. Please use a smaller file.`);
      if (this.fileInputRef) {
        this.fileInputRef.value = '';
      }
      return;
    }
    
    // Security: Validate file type by MIME type (more secure than extension check)
    const validMimeTypes = ['application/json', 'text/json', 'text/plain'];
    if (!validMimeTypes.includes(file.type) && file.type !== '') {
      // Empty type is acceptable (some browsers don't set it for .json files)
      // But if type is set and invalid, reject it
      showError('Invalid file type. Please upload a JSON file.');
      if (this.fileInputRef) {
        this.fileInputRef.value = '';
      }
      return;
    }
    
    // Warn if form already has data
    if (newOntology.id || newOntology.name || editingTerms.length > 0 || editingProperties.length > 0) {
      const confirmed = window.confirm('This will replace the current form data. Continue?');
      if (!confirmed) {
        // Reset file input
        if (this.fileInputRef) {
          this.fileInputRef.value = '';
        }
        return;
      }
    }
    
    try {
      const text = await file.text();
      
      // Security: Limit JSON text size to prevent DoS (additional check beyond file size)
      if (text.length > OntologiesModal.MAX_JSON_SIZE) {
        showError(`JSON content is too large. Maximum size is ${OntologiesModal.MAX_JSON_SIZE / 1024}KB.`);
        if (this.fileInputRef) {
          this.fileInputRef.value = '';
        }
        return;
      }
      
      // Security: Use reviver to prevent prototype pollution
      const jsonData = JSON.parse(text, (key, value) => {
        // Reject dangerous keys that could lead to prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        return value;
      });
      
      // Map JSON to Ontology structure
      const mappedOntology = this.mapJsonToOntology(jsonData);
      
      if (mappedOntology) {
        // Security: Escape user input in error messages to prevent XSS if message is rendered elsewhere
        const escapeHtml = (str: string): string => {
          const div = document.createElement('div');
          div.textContent = str;
          return div.innerHTML;
        };
        
        // Check if ID already exists
        const { ontologies } = this.state;
        if (mappedOntology.id && ontologies[mappedOntology.id]) {
          // Security: Escape user input in warning message
          const safeId = escapeHtml(mappedOntology.id);
          showWarning(`An ontology with ID "${safeId}" already exists. Please change the ID before adding.`);
        }
        
        // Validate that required fields are present
        if (!mappedOntology.id || !mappedOntology.name || !mappedOntology.namespace || !mappedOntology.annotator) {
          showWarning('JSON imported but some required fields are missing. Please fill in id, name, namespace, and annotator before adding.');
        }
        
        // Filter out empty strings from terms and properties
        const filteredTerms = (mappedOntology.terms || []).filter((term: string) => term && term.trim().length > 0);
        const filteredProperties = (mappedOntology.properties || []).filter((property: string) => property && property.trim().length > 0);
        
        this.setState({
          newOntology: {
            id: mappedOntology.id || '',
            name: mappedOntology.name || '',
            description: mappedOntology.description || '',
            namespace: mappedOntology.namespace || '',
            annotator: mappedOntology.annotator || '',
            terms: [],
            properties: [],
          },
          editingTerms: filteredTerms,
          editingProperties: filteredProperties,
        });
        showSuccess('JSON imported successfully! Please review and adjust the fields before adding.');
      } else {
        showError('Invalid JSON structure. Expected an ontology object with id, name, namespace, and annotator fields.');
      }
    } catch (error: any) {
      showError('Failed to parse JSON file: ' + (error.message || 'Invalid JSON format'));
      // Reset file input on error
      if (this.fileInputRef) {
        this.fileInputRef.value = '';
      }
    }
    
    // Reset file input
    if (this.fileInputRef) {
      this.fileInputRef.value = '';
    }
  };

  mapJsonToOntology = (jsonData: any): Partial<Ontology> | null => {
    // Security: Prevent prototype pollution by checking for __proto__ or constructor
    if (jsonData && typeof jsonData === 'object') {
      const keys = Object.keys(jsonData);
      if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
        return null;
      }
    }
    
    // Handle both single ontology object and array of ontologies
    let ontologyData = jsonData;
    
    // If it's an array, take the first one
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      ontologyData = jsonData[0];
      // Security: Check for prototype pollution in array items
      if (ontologyData && typeof ontologyData === 'object') {
        const keys = Object.keys(ontologyData);
        if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
          return null;
        }
      }
    }
    
    // If it's an object with an 'ontologies' property (like API response)
    if (ontologyData && typeof ontologyData === 'object' && ontologyData.ontologies && Array.isArray(ontologyData.ontologies) && ontologyData.ontologies.length > 0) {
      ontologyData = ontologyData.ontologies[0];
      // Security: Check for prototype pollution
      if (ontologyData && typeof ontologyData === 'object') {
        const keys = Object.keys(ontologyData);
        if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
          return null;
        }
      }
    }
    
    // Validate required fields
    if (!ontologyData || typeof ontologyData !== 'object' || Array.isArray(ontologyData)) {
      return null;
    }
    
    // Security: Validate and sanitize string fields (max length, type checking)
    const sanitizeString = (value: any, maxLength: number = 1000): string => {
      if (typeof value !== 'string') return '';
      // Limit length to prevent DoS
      return value.substring(0, maxLength).trim();
    };
    
    // Security: Validate arrays and sanitize string items
    const sanitizeStringArray = (value: any, maxLength: number = 500, maxItems: number = 1000): string[] => {
      if (!Array.isArray(value)) return [];
      return value
        .slice(0, maxItems) // Limit array size
        .filter(item => typeof item === 'string')
        .map(item => sanitizeString(item, maxLength))
        .filter(item => item.length > 0);
    };
    
    // Map the JSON structure to Ontology type with sanitization
    return {
      id: sanitizeString(ontologyData.id, 100),
      name: sanitizeString(ontologyData.name, 200),
      description: sanitizeString(ontologyData.description, 2000),
      namespace: sanitizeString(ontologyData.namespace, 500),
      annotator: sanitizeString(ontologyData.annotator, 200),
      terms: sanitizeStringArray(ontologyData.terms, 500, 1000),
      properties: sanitizeStringArray(ontologyData.properties, 500, 1000),
    };
  };

  render() {
    const {
      ontologies,
      loading,
      error,
      editingOntology,
      newOntology,
      editingTerms,
      editingProperties,
      newTerm,
      newProperty,
      saving,
      deleting,
    } = this.state;

    const isAdmin = this.isAdmin();
    const sortedOntologies = Object.entries(ontologies).sort(([, left], [, right]) => {
      const leftLabel = (left.name || left.id).toLowerCase();
      const rightLabel = (right.name || right.id).toLowerCase();
      const labelCompare = leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
      return labelCompare !== 0 ? labelCompare : left.id.localeCompare(right.id, undefined, { sensitivity: 'base' });
    });

    return (
      <Modal size="large" centered={false} open={true} onClose={this.props.onCancel}>
        <Modal.Header>Custom Ontologies Management</Modal.Header>
        <Modal.Content scrolling>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <Message negative>{error}</Message>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                {sortedOntologies.map(([ontologyId, ontology]) => (
                  <div
                    key={ontologyId}
                    style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      marginBottom: '15px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{ontology.name || ontology.id}</strong> ({ontology.id})
                      </div>
                      {isAdmin && (
                        <div>
                          {editingOntology === ontologyId ? (
                            <>
                              <Button
                                size="small"
                                positive
                                onClick={() => this.handleUpdateOntology(ontologyId)}
                                disabled={saving}
                                loading={saving}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={this.cancelEditOntology}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="small"
                                icon="edit"
                                onClick={() => this.startEditOntology(ontologyId)}
                              />
                              <Button
                                size="small"
                                icon="trash"
                                negative
                                onClick={() => this.handleDeleteOntology(ontologyId)}
                                disabled={deleting === ontologyId}
                                loading={deleting === ontologyId}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {editingOntology === ontologyId ? (
                      <div style={{ marginTop: '15px' }}>
                        <Form>
                          <Form.Field>
                            <label>ID</label>
                            <Input
                              value={newOntology.id || ''}
                              onChange={(e) =>
                                this.setState({
                                  newOntology: { ...newOntology, id: e.target.value },
                                })
                              }
                              placeholder="Ontology ID"
                            />
                            {newOntology.id && newOntology.id.trim() !== ontology.id && (
                              <Message warning size="small" style={{ marginTop: '5px' }}>
                                Changing the ID will delete the old ontology and create a new one with all data transferred.
                              </Message>
                            )}
                          </Form.Field>
                          <Form.Field>
                            <label>Name</label>
                            <Input
                              value={newOntology.name || ''}
                              onChange={(e) =>
                                this.setState({
                                  newOntology: { ...newOntology, name: e.target.value },
                                })
                              }
                            />
                          </Form.Field>
                          <Form.Field>
                            <label>Description</label>
                            <TextArea
                              value={newOntology.description || ''}
                              onChange={(e) =>
                                this.setState({
                                  newOntology: { ...newOntology, description: e.target.value },
                                })
                              }
                              rows={3}
                            />
                          </Form.Field>
                          <Form.Field>
                            <label>Namespace</label>
                            <Input
                              value={newOntology.namespace || ''}
                              onChange={(e) =>
                                this.setState({
                                  newOntology: { ...newOntology, namespace: e.target.value },
                                })
                              }
                            />
                          </Form.Field>
                          <Form.Field>
                            <label>Annotator</label>
                            <Input
                              value={newOntology.annotator || ''}
                              onChange={(e) =>
                                this.setState({
                                  newOntology: { ...newOntology, annotator: e.target.value },
                                })
                              }
                            />
                          </Form.Field>
                          <Form.Field>
                            <label>Terms</label>
                            <List>
                              {editingTerms.map((term, index) => (
                                <List.Item
                                  key={index}
                                  style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}
                                >
                                  <Input
                                    value={term}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      this.handleEditTerm(index, e.target.value)
                                    }
                                    style={{ flex: 1, marginRight: '5px' }}
                                  />
                                  <Button
                                    size="small"
                                    icon="trash"
                                    negative
                                    onClick={() => this.handleDeleteTerm(index)}
                                  />
                                </List.Item>
                              ))}
                            </List>
                            <div style={{ display: 'flex', marginTop: '10px' }}>
                              <Input
                                placeholder="Add new term"
                                value={newTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  this.setState({ newTerm: e.target.value })
                                }
                                onKeyPress={(e: React.KeyboardEvent) => {
                                  if (e.key === 'Enter') {
                                    this.handleAddTerm();
                                  }
                                }}
                                style={{ flex: 1, marginRight: '5px' }}
                              />
                              <Button icon="plus" onClick={this.handleAddTerm} disabled={!newTerm.trim()} />
                            </div>
                          </Form.Field>
                          <Form.Field>
                            <label>Properties</label>
                            <List>
                              {editingProperties.map((property, index) => (
                                <List.Item
                                  key={index}
                                  style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}
                                >
                                  <Input
                                    value={property}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      this.handleEditProperty(index, e.target.value)
                                    }
                                    style={{ flex: 1, marginRight: '5px' }}
                                  />
                                  <Button
                                    size="small"
                                    icon="trash"
                                    negative
                                    onClick={() => this.handleDeleteProperty(index)}
                                  />
                                </List.Item>
                              ))}
                            </List>
                            <div style={{ display: 'flex', marginTop: '10px' }}>
                              <Input
                                placeholder="Add new property"
                                value={newProperty}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  this.setState({ newProperty: e.target.value })
                                }
                                onKeyPress={(e: React.KeyboardEvent) => {
                                  if (e.key === 'Enter') {
                                    this.handleAddProperty();
                                  }
                                }}
                                style={{ flex: 1, marginRight: '5px' }}
                              />
                              <Button icon="plus" onClick={this.handleAddProperty} disabled={!newProperty.trim()} />
                            </div>
                          </Form.Field>
                        </Form>
                      </div>
                    ) : (
                      <div style={{ marginLeft: '10px', color: '#666', marginTop: '10px' }}>
                        <div><strong>Description:</strong> {ontology.description || 'N/A'}</div>
                        <div><strong>Namespace:</strong> {ontology.namespace}</div>
                        <div><strong>Annotator:</strong> {ontology.annotator}</div>
                        {ontology.terms && ontology.terms.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                              onClick={() => this.toggleSection(ontologyId, 'terms')}
                            >
                              <Icon
                                name={
                                  (this.state.expandedSections[ontologyId]?.terms ?? false)
                                    ? 'chevron down'
                                    : 'chevron right'
                                }
                                style={{ marginRight: '5px' }}
                              />
                              <strong>
                                Terms ({ontology.terms.length}):
                              </strong>
                            </div>
                            {(this.state.expandedSections[ontologyId]?.terms ?? false) && (
                              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                                {ontology.terms.map((term, idx) => (
                                  <li key={idx}>{term}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        {ontology.properties && ontology.properties.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                              onClick={() => this.toggleSection(ontologyId, 'properties')}
                            >
                              <Icon
                                name={
                                  (this.state.expandedSections[ontologyId]?.properties ?? false)
                                    ? 'chevron down'
                                    : 'chevron right'
                                }
                                style={{ marginRight: '5px' }}
                              />
                              <strong>
                                Properties ({ontology.properties.length}):
                              </strong>
                            </div>
                            {(this.state.expandedSections[ontologyId]?.properties ?? false) && (
                              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                                {ontology.properties.map((property, idx) => (
                                  <li key={idx}>{property}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {Object.keys(ontologies).length === 0 && (
                  <Message info>No custom ontologies found.</Message>
                )}
              </div>
              {isAdmin && (
                <div
                  style={{
                    padding: '15px',
                    border: '2px dashed #ddd',
                    borderRadius: '4px',
                    marginTop: '20px',
                    opacity: editingOntology ? 0.5 : 1,
                  }}
                >
                  <Form>
                    <Form.Field>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Add New Ontology</label>
                        <Button
                          icon="upload"
                          content="Import JSON"
                          size="small"
                          onClick={this.handleFileSelect}
                          disabled={!!editingOntology}
                          style={{ marginLeft: '10px' }}
                        />
                      </div>
                      {editingOntology && (
                        <Message warning size="small" style={{ marginTop: '5px' }}>
                          Finish editing the current ontology before adding a new one.
                        </Message>
                      )}
                      <input
                        ref={(ref) => { this.fileInputRef = ref; }}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={this.handleFileChange}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>ID</label>
                      <Input
                        placeholder="Ontology ID (e.g., MY_ONTOLOGY)"
                        value={newOntology.id || ''}
                        onChange={(e) =>
                          this.setState({
                            newOntology: { ...newOntology, id: e.target.value },
                          })
                        }
                        disabled={!!editingOntology}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Name</label>
                      <Input
                        placeholder="Ontology name"
                        value={newOntology.name || ''}
                        onChange={(e) =>
                          this.setState({
                            newOntology: { ...newOntology, name: e.target.value },
                          })
                        }
                        disabled={!!editingOntology}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Description</label>
                      <TextArea
                        placeholder="Ontology description"
                        value={newOntology.description || ''}
                        onChange={(e) =>
                          this.setState({
                            newOntology: { ...newOntology, description: e.target.value },
                          })
                        }
                        rows={3}
                        disabled={!!editingOntology}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Namespace</label>
                      <Input
                        placeholder="Namespace URI (e.g., http://example.org/ontology/)"
                        value={newOntology.namespace || ''}
                        onChange={(e) =>
                          this.setState({
                            newOntology: { ...newOntology, namespace: e.target.value },
                          })
                        }
                        disabled={!!editingOntology}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Annotator</label>
                      <Input
                        placeholder="Annotator (e.g., sqlite:obo:MY_ONTOLOGY)"
                        value={newOntology.annotator || ''}
                        onChange={(e) =>
                          this.setState({
                            newOntology: { ...newOntology, annotator: e.target.value },
                          })
                        }
                        disabled={!!editingOntology}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Terms</label>
                      <List>
                        {editingTerms.map((term, index) => (
                          <List.Item
                            key={index}
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}
                          >
                            <Input
                              value={term}
                              onChange={(e) => this.handleEditTerm(index, e.target.value)}
                              style={{ flex: 1, marginRight: '5px' }}
                            />
                            <Button
                              size="small"
                              icon="trash"
                              negative
                              onClick={() => this.handleDeleteTerm(index)}
                            />
                          </List.Item>
                        ))}
                      </List>
                      <div style={{ display: 'flex', marginTop: '10px' }}>
                        <Input
                          placeholder="Add new term"
                          value={newTerm}
                          onChange={(e) => this.setState({ newTerm: e.target.value })}
                          onKeyPress={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter') {
                              this.handleAddTerm();
                            }
                          }}
                          style={{ flex: 1, marginRight: '5px' }}
                          disabled={!!editingOntology}
                        />
                        <Button 
                          icon="plus" 
                          onClick={this.handleAddTerm} 
                          disabled={!!editingOntology || !newTerm.trim()} 
                        />
                      </div>
                    </Form.Field>
                    <Form.Field>
                      <label>Properties</label>
                      <List>
                        {editingProperties.map((property, index) => (
                          <List.Item
                            key={index}
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}
                          >
                            <Input
                              value={property}
                              onChange={(e) => this.handleEditProperty(index, e.target.value)}
                              style={{ flex: 1, marginRight: '5px' }}
                            />
                            <Button
                              size="small"
                              icon="trash"
                              negative
                              onClick={() => this.handleDeleteProperty(index)}
                            />
                          </List.Item>
                        ))}
                      </List>
                      <div style={{ display: 'flex', marginTop: '10px' }}>
                        <Input
                          placeholder="Add new property"
                          value={newProperty}
                          onChange={(e) => this.setState({ newProperty: e.target.value })}
                          onKeyPress={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter') {
                              this.handleAddProperty();
                            }
                          }}
                          style={{ flex: 1, marginRight: '5px' }}
                          disabled={!!editingOntology}
                        />
                        <Button 
                          icon="plus" 
                          onClick={this.handleAddProperty} 
                          disabled={!!editingOntology || !newProperty.trim()} 
                        />
                      </div>
                    </Form.Field>
                    <Button
                      primary
                      onClick={this.handleAddOntology}
                      disabled={
                        !!editingOntology ||
                        saving ||
                        !newOntology.id?.trim() ||
                        !newOntology.name?.trim() ||
                        !newOntology.namespace?.trim() ||
                        !newOntology.annotator?.trim()
                      }
                      loading={saving}
                      style={{ marginTop: '10px' }}
                    >
                      Add Ontology
                    </Button>
                  </Form>
                </div>
              )}
            </div>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.props.onCancel}>Done</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default OntologiesModal;

