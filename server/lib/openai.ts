import OpenAI from 'openai';

export class ApiKeyMissingError extends Error {
  constructor() {
    super('OPENAI_API_KEY is not set on the server.');
    this.name = 'ApiKeyMissingError';
  }
}

let client: OpenAI | null = null;
export function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ApiKeyMissingError();
  if (!client) client = new OpenAI({ apiKey });
  return client;
}

/**
 * Call a chat model and parse a JSON object that conforms to `schema`
 * (OpenAI Structured Outputs). Model-agnostic — any allowed model id drops in.
 */
export async function chatJson<T>(opts: {
  model: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const completion = await getClient().chat.completions.create({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
    },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('The model returned an empty response.');
  return JSON.parse(content) as T;
}
