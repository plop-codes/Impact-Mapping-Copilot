import type { Fetcher, GithubConfig, Logger } from './githubTypes';
import type { GlossaryEntry } from '../../boardAnalysis/analyzeContextElements/contextElements';

export type SingleSelectField = {
  id: string;
  options: { id: string; name: string }[];
};

export type ExistingItem = {
  itemId: string;
  issueNodeId: string;
  issueNumber: number;
  issueRestId: number;
};

export type ExistingItems = Record<string, ExistingItem>;

export class GithubProjectClient {
  private readonly headers: Record<string, string>;
  private readonly graphqlUrl = 'https://api.github.com/graphql';

  constructor(
    private readonly config: GithubConfig,
    private readonly fetcher: Fetcher,
    private readonly logger: Logger,
  ) {
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
  }

  async detectIsOrg(): Promise<boolean> {
    const res = await this.fetcher(`https://api.github.com/users/${this.config.owner}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.type === 'Organization';
  }

  async getProjectId(isOrg: boolean): Promise<string> {
    const ownerField = isOrg ? 'organization' : 'user';
    const data = await this.graphql<Record<string, { projectV2: { id: string } }>>(
      `query($owner: String!, $number: Int!) {
        ${ownerField}(login: $owner) {
          projectV2(number: $number) { id }
        }
      }`,
      { owner: this.config.owner, number: this.config.projectNumber },
    );
    return data[ownerField].projectV2.id;
  }

  async ensureTextField(projectId: string, fieldName: string): Promise<string> {
    const field = await this.findField(projectId, fieldName);
    if (field) return field.id;

    const data = await this.graphql<{
      createProjectV2Field: { projectV2Field: { id: string } };
    }>(
      `mutation($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!) {
        createProjectV2Field(input: { projectId: $projectId, dataType: $dataType, name: $name }) {
          projectV2Field { ... on ProjectV2FieldCommon { id } }
        }
      }`,
      { projectId, name: fieldName, dataType: 'TEXT' },
    );
    return data.createProjectV2Field.projectV2Field.id;
  }

  async ensureSingleSelectField(
    projectId: string,
    fieldName: string,
    optionNames: string[],
  ): Promise<SingleSelectField> {
    const field = await this.findField(projectId, fieldName);
    if (field) return field;

    const data = await this.graphql<{
      createProjectV2Field: {
        projectV2Field: { id: string; options: { id: string; name: string }[] };
      };
    }>(
      `mutation($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
        createProjectV2Field(input: { projectId: $projectId, dataType: $dataType, name: $name, singleSelectOptions: $options }) {
          projectV2Field {
            ... on ProjectV2SingleSelectField {
              id
              options { id name }
            }
          }
        }
      }`,
      {
        projectId,
        name: fieldName,
        dataType: 'SINGLE_SELECT',
        options: optionNames.map((n) => ({ name: n, description: '', color: 'GRAY' })),
      },
    );
    return data.createProjectV2Field.projectV2Field;
  }

  async getExistingItems(projectId: string): Promise<ExistingItems> {
    const items: ExistingItems = {};
    let cursor: string | null = null;

    type ExistingItemsResponse = {
      node: {
        items: {
          pageInfo: { hasNextPage: boolean; endCursor: string };
          nodes: {
            id: string;
            fieldValueByName: { text: string } | null;
            content: { id: string; number: number; databaseId: number } | null;
          }[];
        };
      };
    };

    while (true) {
      const data: ExistingItemsResponse = await this.graphql(
        `query($projectId: ID!, $cursor: String) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id
                  fieldValueByName(name: "figjam_element_id") {
                    ... on ProjectV2ItemFieldTextValue { text }
                  }
                  content { ... on Issue { id databaseId number } }
                }
              }
            }
          }
        }`,
        { projectId, cursor },
      );

      for (const node of data.node.items.nodes) {
        const elementId = node.fieldValueByName?.text;
        if (elementId && node.content) {
          items[elementId] = {
            itemId: node.id,
            issueNodeId: node.content.id,
            issueNumber: node.content.number,
            issueRestId: node.content.databaseId,
          };
        }
      }

      if (!data.node.items.pageInfo.hasNextPage) break;
      cursor = data.node.items.pageInfo.endCursor;
    }

    return items;
  }

  async addItemToProject(projectId: string, issueNodeId: string): Promise<string> {
    const data = await this.graphql<{
      addProjectV2ItemById: { item: { id: string } };
    }>(
      `mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
          item { id }
        }
      }`,
      { projectId, contentId: issueNodeId },
    );
    return data.addProjectV2ItemById.item.id;
  }

  async setTextFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
    text: string,
  ): Promise<void> {
    await this.graphql(
      `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: $value }) {
          projectV2Item { id }
        }
      }`,
      { projectId, itemId, fieldId, value: { text } },
    );
  }

  async setSingleSelectFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
    optionId: string,
  ): Promise<void> {
    await this.graphql(
      `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: $value }) {
          projectV2Item { id }
        }
      }`,
      { projectId, itemId, fieldId, value: { singleSelectOptionId: optionId } },
    );
  }

  async updateProjectReadme(productVision?: string[], operationalActors?: string[], glossary?: GlossaryEntry[]): Promise<void> {
    if (!productVision?.length && !operationalActors?.length && !glossary?.length) return;

    const isOrg = await this.detectIsOrg();
    const projectId = await this.getProjectId(isOrg);

    const parts: string[] = [];
    if (productVision?.length) {
      parts.push('## Vision produit');
      parts.push(...productVision);
    }
    if (operationalActors?.length) {
      if (parts.length > 0) parts.push('');
      parts.push('## Acteurs opérationnels');
      parts.push(...operationalActors);
    }
    if (glossary?.length) {
      if (parts.length > 0) parts.push('');
      parts.push(this.formatGlossaryMarkdown(glossary));
    }

    const readme = parts.join('\n');

    await this.graphql(
      `mutation($projectId: ID!, $readme: String!) {
        updateProjectV2(input: { projectId: $projectId, readme: $readme }) {
          projectV2 { id }
        }
      }`,
      { projectId, readme },
    );

    this.logger('README du projet mis à jour.');
  }

  private formatGlossaryMarkdown(glossary: GlossaryEntry[]): string {
    const allBcNames = [...new Set(glossary.flatMap((e) => Object.keys(e.definitions)))];
    const lines: string[] = [];
    lines.push(`## Glossaire`);
    lines.push(`| Terme | ${allBcNames.join(' | ')} |`);
    lines.push(`| --- | ${allBcNames.map(() => '---').join(' | ')} |`);
    for (const entry of glossary) {
      const defs = allBcNames.map((bc) => entry.definitions[bc] ?? '');
      lines.push(`| ${entry.term} | ${defs.join(' | ')} |`);
    }
    return lines.join('\n');
  }

  private async findField(projectId: string, fieldName: string): Promise<SingleSelectField | null> {
    const data = await this.graphql<{
      node: { fields: { nodes: ({ id: string; name: string; options?: { id: string; name: string }[] })[] } };
    }>(
      `query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 50) {
              nodes {
                ... on ProjectV2FieldCommon { id name }
                ... on ProjectV2SingleSelectField { id name options { id name } }
              }
            }
          }
        }
      }`,
      { projectId },
    );
    const field = data.node.fields.nodes.find((f) => f.name === fieldName);
    return field ? { id: field.id, options: field.options ?? [] } : null;
  }

  async deleteProjectItem(projectId: string, itemId: string): Promise<void> {
    await this.graphql(
      `mutation($projectId: ID!, $itemId: ID!) {
        deleteProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
          deletedItemId
        }
      }`,
      { projectId, itemId },
    );
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await this.fetcher(this.graphqlUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data as T;
  }
}
