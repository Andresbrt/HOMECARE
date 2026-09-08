/**
 * addressAutocompleteService.js
 * 
 * Servicio de autocompletado y sugerencias de direcciones para Medellín y el Valle de Aburrá.
 * Permite desambiguar la misma dirección en diferentes barrios (ej: Cra 75 en Castilla vs Laureles vs Pilarica).
 */

const MEDELLIN_VIEWBOX = '-75.75,6.45,-75.45,6.0'; // Bounding box del Valle de Aburrá

/**
 * Normaliza abreviaturas comunes en direcciones colombianas
 */
function normalizeAddressQuery(input) {
  if (!input) return '';
  let q = input.trim();
  
  // Separar números y caracteres especiales pegados como Cra75#96-24 -> Cra 75 # 96-24
  q = q.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  q = q.replace(/#/g, ' # ');
  q = q.replace(/-/g, ' - ');
  q = q.replace(/\s+/g, ' ').trim();

  return q;
}

/**
 * Busca sugerencias de direcciones similares en Medellín
 * @param {string} query Texto escrito por el usuario (ej: "Cra 75 # 96-24")
 * @returns {Promise<Array>} Lista de sugerencias con dirección, barrio y coordenadas
 */
export async function searchMedellinAddresses(query) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const normalized = normalizeAddressQuery(query);
  const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    normalized + ' Medellin'
  )}&format=json&addressdetails=1&countrycodes=co&viewbox=${MEDELLIN_VIEWBOX}&limit=7`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'HomecareApp-Mobile/1.0 (contact: soporte@homecare.com.co)',
        'Accept-Language': 'es',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    const suggestions = data.map((item) => {
      const addr = item.address || {};
      const street = addr.road || addr.pedestrian || addr.cycleway || query.trim();
      const houseNumber = addr.house_number || '';
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
      const comuna = addr.suburb || addr.city_district || '';
      const city = addr.city || addr.town || addr.municipality || 'Medellín';
      const state = addr.state || 'Antioquia';

      // Construir título principal (ej: "Cra. 75 # 96-24" o la calle)
      let primaryText = query.trim();
      if (street && houseNumber) {
        primaryText = `${street} #${houseNumber}`;
      } else if (street) {
        primaryText = `${street}`;
        // Si el usuario ya escribió número de placa, preservarlo
        const matchPlaca = query.match(/#\s*[\d\w-]+/i);
        if (matchPlaca) {
          primaryText += ` ${matchPlaca[0]}`;
        }
      }

      // Construir subtítulo con Barrio y Comuna (ej: "Pilarica · Comuna 7 Robledo, Medellín")
      const locationParts = [neighbourhood, comuna !== neighbourhood ? comuna : '', city, state].filter(Boolean);
      const secondaryText = locationParts.join(', ');

      return {
        id: String(item.place_id || Math.random()),
        primaryText,
        secondaryText,
        barrio: neighbourhood || comuna || 'Medellín',
        ciudad: city,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        fullAddress: `${primaryText}, ${secondaryText}`,
      };
    });

    // Eliminar duplicados por barrio similar
    const seen = new Set();
    return suggestions.filter((s) => {
      const key = `${s.primaryText.toLowerCase()}_${s.barrio.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('⚠️ [AddressAutocomplete] Error buscando sugerencias:', error.message);
    }
    return [];
  }
}
