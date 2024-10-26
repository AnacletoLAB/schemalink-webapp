export const generate = async (
  prompt: string,
  url: string
): Promise<string> => {
  return fetch(url, {
    body: prompt,
    method: 'POST',
  }).then((response) => response.text());
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
