'use client';

export interface ChileanCity {
  id: string;
  name: string;
  region: string;
  regionCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  population: number;
  timezone: string;
  isActive: boolean;
  deliveryFee: number;
  maxDeliveryRadius: number; // in km
  operatingHours: {
    start: string;
    end: string;
  };
  popularDishes: string[];
  localSpecialties: string[];
}

export interface ChileanRegion {
  id: string;
  name: string;
  code: string;
  capital: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cities: string[];
  timezone: string;
  isActive: boolean;
}

export class ChileanCitiesService {
  private static readonly CHILEAN_REGIONS: ChileanRegion[] = [
    {
      id: 'arica-parinacota',
      name: 'Arica y Parinacota',
      code: 'AP',
      capital: 'Arica',
      coordinates: { latitude: -18.4746, longitude: -70.2979 },
      cities: ['Arica', 'Putre', 'General Lagos'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'tarapaca',
      name: 'Tarapacá',
      code: 'TA',
      capital: 'Iquique',
      coordinates: { latitude: -20.2208, longitude: -70.1389 },
      cities: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'antofagasta',
      name: 'Antofagasta',
      code: 'AN',
      capital: 'Antofagasta',
      coordinates: { latitude: -23.6500, longitude: -70.4000 },
      cities: ['Antofagasta', 'Calama', 'Tocopilla', 'San Pedro de Atacama'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'atacama',
      name: 'Atacama',
      code: 'AT',
      capital: 'Copiapó',
      coordinates: { latitude: -27.3667, longitude: -70.3333 },
      cities: ['Copiapó', 'Vallenar', 'Chañaral', 'Diego de Almagro'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'coquimbo',
      name: 'Coquimbo',
      code: 'CO',
      capital: 'La Serena',
      coordinates: { latitude: -29.9045, longitude: -71.2489 },
      cities: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'valparaiso',
      name: 'Valparaíso',
      code: 'VS',
      capital: 'Valparaíso',
      coordinates: { latitude: -33.0472, longitude: -71.6127 },
      cities: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'metropolitana',
      name: 'Región Metropolitana',
      code: 'RM',
      capital: 'Santiago',
      coordinates: { latitude: -33.4489, longitude: -70.6693 },
      cities: [
        'Santiago', 'Las Condes', 'Providencia', 'Ñuñoa', 'La Reina', 'Vitacura',
        'Lo Barnechea', 'Macul', 'Peñalolén', 'La Florida', 'Puente Alto', 'Maipú',
        'Las Rozas', 'Quilicura', 'Huechuraba', 'Recoleta', 'Independencia', 'Conchalí',
        'Renca', 'Quinta Normal', 'Estación Central', 'Cerrillos', 'Pudahuel', 'Lo Prado',
        'Cerro Navia', 'San Miguel', 'San Joaquín', 'Pedro Aguirre Cerda', 'Lo Espejo',
        'El Bosque', 'La Cisterna', 'San Ramón', 'La Granja', 'La Pintana'
      ],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'ohiggins',
      name: 'O\'Higgins',
      code: 'LI',
      capital: 'Rancagua',
      coordinates: { latitude: -34.1708, longitude: -70.7444 },
      cities: ['Rancagua', 'Pichilemu', 'San Fernando', 'Santa Cruz'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'maule',
      name: 'Maule',
      code: 'ML',
      capital: 'Talca',
      coordinates: { latitude: -35.4264, longitude: -71.6554 },
      cities: ['Talca', 'Curicó', 'Linares', 'Cauquenes', 'Constitución'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'nuble',
      name: 'Ñuble',
      code: 'NB',
      capital: 'Chillán',
      coordinates: { latitude: -36.6066, longitude: -72.1034 },
      cities: ['Chillán', 'Chillán Viejo', 'Bulnes', 'Quirihue'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'biobio',
      name: 'Biobío',
      code: 'BI',
      capital: 'Concepción',
      coordinates: { latitude: -36.8201, longitude: -73.0449 },
      cities: ['Concepción', 'Talcahuano', 'Chiguayante', 'Penco', 'Tomé', 'Lota'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'araucania',
      name: 'La Araucanía',
      code: 'AR',
      capital: 'Temuco',
      coordinates: { latitude: -38.7397, longitude: -72.5984 },
      cities: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Angol'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'los-rios',
      name: 'Los Ríos',
      code: 'LR',
      capital: 'Valdivia',
      coordinates: { latitude: -39.8142, longitude: -73.2459 },
      cities: ['Valdivia', 'La Unión', 'Río Bueno', 'Lago Ranco'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'los-lagos',
      name: 'Los Lagos',
      code: 'LL',
      capital: 'Puerto Montt',
      coordinates: { latitude: -41.4689, longitude: -72.9411 },
      cities: ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'aysen',
      name: 'Aysén',
      code: 'AI',
      capital: 'Coyhaique',
      coordinates: { latitude: -45.5712, longitude: -72.0685 },
      cities: ['Coyhaique', 'Puerto Aysén', 'Chile Chico'],
      timezone: 'America/Santiago',
      isActive: true
    },
    {
      id: 'magallanes',
      name: 'Magallanes',
      code: 'MA',
      capital: 'Punta Arenas',
      coordinates: { latitude: -53.1638, longitude: -70.9171 },
      cities: ['Punta Arenas', 'Puerto Natales'],
      timezone: 'America/Punta_Arenas',
      isActive: true
    }
  ];

  private static readonly CHILEAN_CITIES: ChileanCity[] = [
    // Región Metropolitana
    {
      id: 'santiago',
      name: 'Santiago',
      region: 'Región Metropolitana',
      regionCode: 'RM',
      coordinates: { latitude: -33.4489, longitude: -70.6693 },
      population: 6450000,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2500,
      maxDeliveryRadius: 25,
      operatingHours: { start: '06:00', end: '23:00' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo', 'Cazuela'],
      localSpecialties: ['Sándwich Churrasco', 'Completo', 'Sopaipillas']
    },
    {
      id: 'vina-del-mar',
      name: 'Viña del Mar',
      region: 'Valparaíso',
      regionCode: 'VS',
      coordinates: { latitude: -33.0245, longitude: -71.5518 },
      population: 334248,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 3000,
      maxDeliveryRadius: 20,
      operatingHours: { start: '07:00', end: '22:00' },
      popularDishes: ['Choripán', 'Empanadas', 'Mariscos'],
      localSpecialties: ['Chorrillana', 'Paila Marina']
    },
    {
      id: 'valparaiso',
      name: 'Valparaíso',
      region: 'Valparaíso',
      regionCode: 'VS',
      coordinates: { latitude: -33.0472, longitude: -71.6127 },
      population: 296655,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2800,
      maxDeliveryRadius: 15,
      operatingHours: { start: '07:00', end: '22:00' },
      popularDishes: ['Choripán', 'Empanadas', 'Mariscos'],
      localSpecialties: ['Chorrillana', 'Paila Marina']
    },
    {
      id: 'concepcion',
      name: 'Concepción',
      region: 'Biobío',
      regionCode: 'BI',
      coordinates: { latitude: -36.8201, longitude: -73.0449 },
      population: 967000,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2200,
      maxDeliveryRadius: 18,
      operatingHours: { start: '06:30', end: '22:30' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Sopaipillas', 'Sánguche']
    },
    {
      id: 'antofagasta',
      name: 'Antofagasta',
      region: 'Antofagasta',
      regionCode: 'AN',
      coordinates: { latitude: -23.6500, longitude: -70.4000 },
      population: 425725,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 3500,
      maxDeliveryRadius: 30,
      operatingHours: { start: '06:00', end: '23:00' },
      popularDishes: ['Porotos Granados', 'Cazuela', 'Pastel de Choclo'],
      localSpecialties: ['Caldo de Congrio', 'Mariscos del Norte']
    },
    {
      id: 'la-serena',
      name: 'La Serena',
      region: 'Coquimbo',
      regionCode: 'CO',
      coordinates: { latitude: -29.9045, longitude: -71.2489 },
      population: 221054,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2800,
      maxDeliveryRadius: 20,
      operatingHours: { start: '07:00', end: '22:00' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Choripán', 'Sopaipillas']
    },
    {
      id: 'temuco',
      name: 'Temuco',
      region: 'La Araucanía',
      regionCode: 'AR',
      coordinates: { latitude: -38.7397, longitude: -72.5984 },
      population: 282415,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2600,
      maxDeliveryRadius: 22,
      operatingHours: { start: '06:30', end: '22:30' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Cazuela', 'Sopaipillas']
    },
    {
      id: 'iquique',
      name: 'Iquique',
      region: 'Tarapacá',
      regionCode: 'TA',
      coordinates: { latitude: -20.2208, longitude: -70.1389 },
      population: 191468,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 3200,
      maxDeliveryRadius: 25,
      operatingHours: { start: '06:00', end: '23:00' },
      popularDishes: ['Porotos Granados', 'Cazuela', 'Pastel de Choclo'],
      localSpecialties: ['Caldo de Congrio', 'Mariscos del Norte']
    },
    {
      id: 'puerto-montt',
      name: 'Puerto Montt',
      region: 'Los Lagos',
      regionCode: 'LL',
      coordinates: { latitude: -41.4689, longitude: -72.9411 },
      population: 245902,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2900,
      maxDeliveryRadius: 20,
      operatingHours: { start: '06:30', end: '22:30' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Cazuela', 'Mariscos']
    },
    {
      id: 'rancagua',
      name: 'Rancagua',
      region: 'O\'Higgins',
      regionCode: 'LI',
      coordinates: { latitude: -34.1708, longitude: -70.7444 },
      population: 255000,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2400,
      maxDeliveryRadius: 20,
      operatingHours: { start: '06:30', end: '22:30' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Choripán', 'Sopaipillas']
    },
    {
      id: 'talca',
      name: 'Talca',
      region: 'Maule',
      regionCode: 'ML',
      coordinates: { latitude: -35.4264, longitude: -71.6554 },
      population: 220000,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 2300,
      maxDeliveryRadius: 18,
      operatingHours: { start: '06:30', end: '22:30' },
      popularDishes: ['Porotos Granados', 'Humitas', 'Pastel de Choclo'],
      localSpecialties: ['Cazuela', 'Sopaipillas']
    },
    {
      id: 'arica',
      name: 'Arica',
      region: 'Arica y Parinacota',
      regionCode: 'AP',
      coordinates: { latitude: -18.4746, longitude: -70.2979 },
      population: 210000,
      timezone: 'America/Santiago',
      isActive: true,
      deliveryFee: 3500,
      maxDeliveryRadius: 25,
      operatingHours: { start: '06:00', end: '23:00' },
      popularDishes: ['Porotos Granados', 'Cazuela', 'Pastel de Choclo'],
      localSpecialties: ['Caldo de Congrio', 'Mariscos del Norte']
    },
    {
      id: 'punta-arenas',
      name: 'Punta Arenas',
      region: 'Magallanes',
      regionCode: 'MA',
      coordinates: { latitude: -53.1638, longitude: -70.9171 },
      population: 141984,
      timezone: 'America/Punta_Arenas',
      isActive: true,
      deliveryFee: 4000,
      maxDeliveryRadius: 15,
      operatingHours: { start: '07:00', end: '22:00' },
      popularDishes: ['Porotos Granados', 'Cazuela', 'Pastel de Choclo'],
      localSpecialties: ['Cazuela', 'Mariscos']
    }
  ];

  // Get all Chilean regions
  static getAllRegions(): ChileanRegion[] {
    return this.CHILEAN_REGIONS;
  }

  // Get all Chilean cities
  static getAllCities(): ChileanCity[] {
    return this.CHILEAN_CITIES;
  }

  // Get cities by region
  static getCitiesByRegion(regionCode: string): ChileanCity[] {
    return this.CHILEAN_CITIES.filter(city => city.regionCode === regionCode);
  }

  // Get city by ID
  static getCityById(cityId: string): ChileanCity | null {
    return this.CHILEAN_CITIES.find(city => city.id === cityId) ?? null;
  }

  // Get region by code
  static getRegionByCode(regionCode: string): ChileanRegion | null {
    return this.CHILEAN_REGIONS.find(region => region.code === regionCode) ?? null;
  }

  // Get active cities
  static getActiveCities(): ChileanCity[] {
    return this.CHILEAN_CITIES.filter(city => city.isActive);
  }

  // Get active regions
  static getActiveRegions(): ChileanRegion[] {
    return this.CHILEAN_REGIONS.filter(region => region.isActive);
  }

  // Search cities by name
  static searchCities(query: string): ChileanCity[] {
    const lowercaseQuery = query.toLowerCase();
    return this.CHILEAN_CITIES.filter(city =>
      city.name.toLowerCase().includes(lowercaseQuery) ||
      city.region.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get nearby cities based on coordinates
  static getNearbyCities(lat: number, lng: number, maxDistance: number = 50): ChileanCity[] {
    return this.CHILEAN_CITIES
      .filter(city => {
        const distance = this.calculateDistance(
          lat, lng,
          city.coordinates.latitude,
          city.coordinates.longitude
        );
        return distance <= maxDistance;
      })
      .sort((a, b) => {
        const distA = this.calculateDistance(lat, lng, a.coordinates.latitude, a.coordinates.longitude);
        const distB = this.calculateDistance(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
        return distA - distB;
      });
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get popular dishes for a city
  static getPopularDishesForCity(cityId: string): string[] {
    const city = this.getCityById(cityId);
    return city ? city.popularDishes : [];
  }

  // Get local specialties for a city
  static getLocalSpecialtiesForCity(cityId: string): string[] {
    const city = this.getCityById(cityId);
    return city ? city.localSpecialties : [];
  }

  // Get delivery fee for a city
  static getDeliveryFeeForCity(cityId: string): number {
    const city = this.getCityById(cityId);
    return city ? city.deliveryFee : 2500; // Default fee
  }

  // Check if city is currently operating
  static isCityOperating(cityId: string): boolean {
    const city = this.getCityById(cityId);
    if (!city) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= city.operatingHours.start && currentTime <= city.operatingHours.end;
  }

  // Get operating hours for a city
  static getOperatingHoursForCity(cityId: string): { start: string; end: string } | null {
    const city = this.getCityById(cityId);
    return city ? city.operatingHours : null;
  }

  // Format city name for display
  static formatCityName(cityId: string): string {
    const city = this.getCityById(cityId);
    if (!city) return cityId;

    return `${city.name}, ${city.region}`;
  }

  // Get timezone for a city
  static getTimezoneForCity(cityId: string): string {
    const city = this.getCityById(cityId);
    return city ? city.timezone : 'America/Santiago';
  }
}