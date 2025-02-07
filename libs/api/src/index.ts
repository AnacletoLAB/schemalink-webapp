const testLinkML = `
id: https://example.com/untitled_schema
default_range: string
name: untitled_schema
title: Untitled schema
description: ''
prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  HGNC: http://identifiers.org/hgnc/
imports:
  - ontogpt:core
  - linkml:types
classes:
  PatientToClinicianRelationship:
    is_a: Triple
    description: >-
      A triple where the subject is a Patient and where the object is a
      Clinician. A relationship representing a treatment plan where the subject
      is a Patient, and the object is a Clinician.
    slot_usage:
      subject:
        range: Patient
        annotations:
          prompt.examples: ''
        minimum_cardinality: 0
      object:
        range: Clinician
        annotations:
          prompt.examples: ''
        minimum_cardinality: 0
      predicate:
        range: PatientToClinicianPredicate
        annotations:
          prompt.examples: ''
  PatientToClinicianPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the PatientToClinician relationships.
    id_prefixes: []
    annotations: {}
  Patient:
    is_a: NamedEntity
    mixins: []
    attributes:
      patient_id:
        description: A unique identifier for the Patient.
        required: true
        identifier: true
      name:
        description: The name of the patient.
        required: true
        identifier: false
      date_of_birth:
        description: The date of birth of the patient.
        required: true
        identifier: false
      gender:
        description: The gender of the patient.
        required: false
        identifier: false
      contact_info:
        description: The contact information of the patient.
        required: false
        identifier: false
      medical_history:
        description: A brief medical history of the patient.
        required: false
        identifier: false
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:HGNC
  Clinician:
    is_a: NamedEntity
    mixins: []
    attributes:
      clinician_id:
        description: A unique identifier for the Clinician.
        required: true
        identifier: true
      name:
        description: The name of the clinician.
        required: true
        identifier: false
      specialty:
        description: The medical specialty of the clinician (e.g., Cardiology, Pediatrics).
        required: true
        identifier: false
      contact_info:
        description: The contact information of the clinician.
        required: false
        identifier: false
      years_of_experience:
        description: The number of years the clinician has been practicing.
        required: false
        identifier: false
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:HGNC
`;

export const generate = async (
  prompt: string,
  url: string
): Promise<string> => {
  // return fetch(url, {
  //   body: prompt,
  //   method: 'POST',
  // }).then((response) => response.text());
  return Promise.resolve(testLinkML);
};

export const edit = async (
  linkmlSchema: string,
  linkmlSelection: string | null,
  prompt: string,
  url: string
): Promise<string> => {
  const fullPrompt = `
Given this LinkML schema\n\n
${linkmlSchema}\n\n
${
  linkmlSelection
    ? `Given this selection of classes in that schema\n\n${linkmlSelection}\n\n`
    : ''
}
Perform this operation\n\n
${prompt}\n\n
Return an updated version of the full LinkML schema`;

  return generate(fullPrompt, url);
};

interface ValidationIssue {
  message: string;
}

interface ValidateLinkmlResponse {
  validationIssues: ValidationIssue[];
  error: string;
}

export const validateLinkml = async (
  linkml: string,
  url: string
): Promise<ValidateLinkmlResponse> => {
  return fetch(url, {
    body: linkml,
    method: 'POST',
  })
    .then((response) =>
      response.status === 200
        ? response.json().then((data) => {
            return { validationIssues: data, error: '' };
          })
        : {
            validationIssues: [],
            error: `The server returned status ${response.status}`,
          }
    )
    .catch((e) => {
      return { validationIssues: [], error: e.message };
    });
};

export const genPydantic = async (
  linkml: string,
  url: string
): Promise<Blob> => {
  return fetch(url, {
    body: linkml,
    method: 'POST',
  }).then((response) => response.blob());
};
