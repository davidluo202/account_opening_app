const SANCTIONS_API_BASE = 'https://api.sanctions.io';
const SANCTIONS_API_KEY = process.env.SANCTIONS_API_KEY || '60e75f2d08a24d98a967f6315f00b251';

export interface SanctionsHit {
  confidence_score: number;
  name: string;
  alt_names: string[];
  entity_type: string;
  address: string;
  data_source: string;
}

export interface SanctionsResult {
  searchId: string;
  hitCount: number;
  hits: SanctionsHit[];
  timestamp: string;
}

export async function screenPerson(params: {
  name: string;
  dateOfBirth?: string;
  nationality?: string;
}): Promise<SanctionsResult> {
  const url = new URL('/search/', SANCTIONS_API_BASE);
  url.searchParams.set('min_score', '0.80');
  url.searchParams.set('name', params.name);
  url.searchParams.set('data_source', 'all');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SANCTIONS_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Sanctions API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const hits: SanctionsHit[] = (data.results || []).map((r: any) => ({
    confidence_score: r.confidence_score ?? 0,
    name: r.name ?? '',
    alt_names: r.alt_names ?? [],
    entity_type: r.entity_type ?? '',
    address: r.address ?? '',
    data_source: r.data_source ?? '',
  }));

  return {
    searchId: data.search?.id ?? '',
    hitCount: data.count ?? 0,
    hits,
    timestamp: data.search?.timestamp ?? new Date().toISOString(),
  };
}
