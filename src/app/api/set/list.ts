import type { components } from '../../../../gen/set/v1/set.schema';
import { client as setClient } from './client';

type Set = components['schemas']['v1Set'];

const PAGE_SIZE = 500;

export async function fetchAllSets(accessToken: string): Promise<{ sets: Set[]; error?: unknown }> {
  const sets: Set[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;

  while (true) {
    const { data, error } = await setClient.GET('/v1/sets', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { query: { pageSize: PAGE_SIZE, pageToken } },
    });
    if (error) return { sets, error };
    if (data?.sets) sets.push(...data.sets);
    if (!data?.nextPageToken) return { sets };
    if (seenTokens.has(data.nextPageToken)) {
      return { sets, error: new Error('repeated page token') };
    }
    seenTokens.add(data.nextPageToken);
    pageToken = data.nextPageToken;
  }
}
