export interface GeocodeAddress {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

function buildAddressQuery(address: GeocodeAddress): string {
  const parts = [
    address.logradouro,
    address.numero,
    address.bairro,
    address.cidade,
    address.estado,
    "Brasil",
  ].filter(Boolean);

  return parts.join(", ");
}

async function geocodeWithGoogle(
  query: string,
  apiKey: string,
): Promise<GeocodeResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "br");

  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
  };

  const location = data.results?.[0]?.geometry?.location;

  if (location?.lat == null || location?.lng == null) {
    return null;
  }

  return { latitude: location.lat, longitude: location.lng };
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "FXStudio/1.0" },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { lat?: string; lon?: string }[];

  if (!data[0]?.lat || !data[0]?.lon) {
    return null;
  }

  return {
    latitude: Number.parseFloat(data[0].lat),
    longitude: Number.parseFloat(data[0].lon),
  };
}

export async function geocodeAddress(address: GeocodeAddress): Promise<GeocodeResult | null> {
  const query = buildAddressQuery(address);

  if (!query.trim()) {
    return null;
  }

  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? process.env.GOOGLE_MAPS_KEY;

  if (googleKey) {
    const googleResult = await geocodeWithGoogle(query, googleKey);
    if (googleResult) {
      return googleResult;
    }
  }

  return geocodeWithNominatim(query);
}
