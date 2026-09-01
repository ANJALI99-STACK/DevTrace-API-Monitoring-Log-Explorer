import { Client } from '@opensearch-project/opensearch';

export const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'healthlogs';

export const osClient = new Client({
  node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
});

/**
 * Creates the healthlogs index with an explicit mapping if it doesn't exist yet.
 * Call this once on backend + worker startup.
 */
export const ensureIndex = async (): Promise<void> => {
  try {
    const exists = await osClient.indices.exists({ index: OPENSEARCH_INDEX });
    if (!exists.body) {
      await osClient.indices.create({
        index: OPENSEARCH_INDEX,
        body: {
          mappings: {
            properties: {
              endpointId: { type: 'keyword' },
              endpointName: { type: 'text' },
              userId: { type: 'keyword' },
              statusCode: { type: 'integer' },
              responseTime: { type: 'integer' },
              success: { type: 'boolean' },
              errorMessage: { type: 'text' },
              timestamp: { type: 'date' },
            },
          },
        },
      });
      console.log(`[opensearch] created index "${OPENSEARCH_INDEX}"`);
    }
  } catch (err) {
    // Non-fatal: log search still falls back to Mongo if OpenSearch is unreachable.
    console.error('[opensearch] index setup failed, is the container running?', err);
  }
};

export const indexHealthLog = async (doc: {
  endpointId: string;
  endpointName: string;
  userId: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}): Promise<void> => {
  try {
    await osClient.index({
      index: OPENSEARCH_INDEX,
      body: doc,
      refresh: true,
    });
  } catch (err) {
    console.error('[opensearch] failed to index health log', err);
  }
};
