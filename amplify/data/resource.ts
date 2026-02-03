import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Product: a
    .model({
      phId: a.string().required(),
      name: a.string(),
      tagline: a.string(),
      description: a.string(),
      thumbnailUrl: a.string(),
      launchDate: a.datetime(),
      upvotes: a.integer(),
      score: a.float(), // Overall blitz score
      // Individual scores stored as JSON for simplicity, or could be individual fields.
      // Let's use individual fields for better querying/typing if needed, but JSON is flexible.
      speedScore: a.float(),
      marketScore: a.float(),
      pmfScore: a.float(),
      networkScore: a.float(),
      growthScore: a.float(),
      uncertaintyScore: a.float(),
      scoreExplanation: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
