const MAPSTR_PARSE_HEADERS = {
  "X-Parse-Application-Id": "ZooIy4vfzkoQxKsAOM9iShvAUxi3u7hM0RiTdFYd",
  "X-Parse-Javascript-Key": "BBHHUTomOmCiH7veEOQwJTstBzOS8kSMNAAJUiGM",
  "Content-Type": "application/json",
};

const MAPSTR_PARSE_BASE_URL = "https://server.mapstr.com/parse";
const MAPSTR_PAGE_SIZE = 1000;

export type MapstrMapInfo = {
  mapId: string;
  placesCount?: number;
  followersCount?: number;
  name?: string;
  description?: string;
  objectId?: string;
  author?: {
    alias?: string;
    displayName?: string;
    objectId?: string;
    placesCount?: number;
  };
};

export type MapstrPlaceRecord = {
  objectId: string;
  name: string;
  address: string | null;
  icon?: string | null;
  googleId?: string | null;
  website?: string | null;
  phone?: string | null;
  menu?: string | null;
  mapId: string;
  placeSourceId?: string | null;
  deleted?: boolean;
  isPrivate?: boolean;
  toTry?: boolean;
  tags_names?: string[];
  addressComponents?: {
    city?: string;
    country?: string;
    country_code?: string;
    postal_code?: string;
    street_name?: string;
    street_number?: string;
  };
  geopoint?: {
    latitude: number;
    longitude: number;
  };
  services?: Array<{
    type?: string;
    widget_url?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

async function fetchMapstrParse<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${MAPSTR_PARSE_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...MAPSTR_PARSE_HEADERS,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Mapstr Parse request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

export async function fetchMapstrMapInfo(mapId: string) {
  const payload = await fetchMapstrParse<{ result: MapstrMapInfo }>(
    "/functions/retrieveStoreMapInfo",
    {
      method: "POST",
      body: JSON.stringify({ mapId }),
    },
  );

  return payload.result;
}

export async function fetchAllMapstrPlaces(mapId: string) {
  const places: MapstrPlaceRecord[] = [];

  for (let skip = 0; ; skip += MAPSTR_PAGE_SIZE) {
    const url = new URL(`${MAPSTR_PARSE_BASE_URL}/classes/MAPPlace`);
    url.searchParams.set(
      "where",
      JSON.stringify({
        mapId,
        deleted: false,
      }),
    );
    url.searchParams.set("limit", String(MAPSTR_PAGE_SIZE));
    url.searchParams.set("skip", String(skip));
    url.searchParams.set("order", "-createdAt");

    const payload = await fetch(url, {
      headers: MAPSTR_PARSE_HEADERS,
    });

    if (!payload.ok) {
      throw new Error(`Mapstr place query failed (${payload.status}) for skip=${skip}`);
    }

    const json = (await payload.json()) as { results?: MapstrPlaceRecord[] };
    const batch = json.results ?? [];
    places.push(...batch);

    if (batch.length < MAPSTR_PAGE_SIZE) {
      break;
    }
  }

  return places;
}
