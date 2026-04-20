import { Injectable } from '@nestjs/common';
import { HomeFiltersDto, SortBy } from '../dto/home-filters.dto';

@Injectable()
export class FilterService {
  /**
   * Calcula la distancia en kilómetros entre dos puntos usando la fórmula de Haversine
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Verifica si un precio pasa el filtro de precio
   */
  private matchesPriceFilter(
    price: number,
    minPrice?: number,
    maxPrice?: number,
  ): boolean {
    if (minPrice !== undefined && price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && price > maxPrice) {
      return false;
    }
    return true;
  }

  /**
   * Verifica si una calificación pasa el filtro
   */
  private matchesRatingFilter(rating: number, minRating?: number): boolean {
    if (minRating !== undefined && rating < minRating) {
      return false;
    }
    return true;
  }

  /**
   * Verifica si una distancia pasa el filtro
   */
  private matchesDistanceFilter(
    businessLat: number | null,
    businessLng: number | null,
    userLat?: number,
    userLng?: number,
    maxDistance?: number,
  ): boolean {
    if (!maxDistance) return true; // Si no hay maxDistance, no filtrar
    if (!businessLat || !businessLng || !userLat || !userLng) return true; // Si no hay coordenadas, no filtrar

    const distance = this.calculateDistance(
      userLat,
      userLng,
      businessLat,
      businessLng,
    );
    return distance <= maxDistance;
  }

  /**
   * Aplica todos los filtros a un array de items
   */
  applyFilters<
    T extends {
      price?: number | string;
      averageRating?: number | string;
      lat?: number | string | null;
      lng?: number | string | null;
    },
  >(items: T[], filters: HomeFiltersDto): T[] {
    let filtered = items;

    // Filtro de precio
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = filtered.filter((item) => {
        if (item.price === undefined) return false;
        const price =
          typeof item.price === 'string' ? Number(item.price) : item.price;
        return this.matchesPriceFilter(
          price,
          filters.minPrice,
          filters.maxPrice,
        );
      });
    }

    // Filtro de rating
    if (filters.minRating !== undefined) {
      filtered = filtered.filter((item) => {
        if (item.averageRating === undefined) return false;
        const rating =
          typeof item.averageRating === 'string'
            ? Number(item.averageRating)
            : item.averageRating;
        return this.matchesRatingFilter(rating, filters.minRating);
      });
    }

    // Filtro de distancia
    if (filters.maxDistance !== undefined) {
      filtered = filtered.filter((item) => {
        const lat =
          item.lat === null || item.lat === undefined
            ? null
            : typeof item.lat === 'string'
              ? Number(item.lat)
              : item.lat;
        const lng =
          item.lng === null || item.lng === undefined
            ? null
            : typeof item.lng === 'string'
              ? Number(item.lng)
              : item.lng;
        return this.matchesDistanceFilter(
          lat,
          lng,
          filters.lat,
          filters.lng,
          filters.maxDistance,
        );
      });
    }

    return filtered;
  }

  /**
   * Ordena los items según el criterio especificado
   */
  sortItems<
    T extends {
      price?: number | string;
      averageRating?: number | string;
      lat?: number | string | null;
      lng?: number | string | null;
      totalRatings?: number;
    },
  >(items: T[], filters: HomeFiltersDto): T[] {
    if (!filters.sortBy) return items;

    const sorted = [...items];

    switch (filters.sortBy) {
      case SortBy.rating:
        sorted.sort((a, b) => {
          const ratingA = a.averageRating
            ? typeof a.averageRating === 'string'
              ? Number(a.averageRating)
              : a.averageRating
            : 0;
          const ratingB = b.averageRating
            ? typeof b.averageRating === 'string'
              ? Number(b.averageRating)
              : b.averageRating
            : 0;
          return ratingB - ratingA; // Mayor a menor
        });
        break;

      case SortBy.distance:
        if (filters.lat && filters.lng) {
          sorted.sort((a, b) => {
            const latA = a.lat
              ? typeof a.lat === 'string'
                ? Number(a.lat)
                : a.lat
              : null;
            const lngA = a.lng
              ? typeof a.lng === 'string'
                ? Number(a.lng)
                : a.lng
              : null;
            const latB = b.lat
              ? typeof b.lat === 'string'
                ? Number(b.lat)
                : b.lat
              : null;
            const lngB = b.lng
              ? typeof b.lng === 'string'
                ? Number(b.lng)
                : b.lng
              : null;

            if (!latA || !lngA) return 1; // Sin coordenadas al final
            if (!latB || !lngB) return -1;

            const distanceA = this.calculateDistance(
              filters.lat!,
              filters.lng!,
              latA,
              lngA,
            );
            const distanceB = this.calculateDistance(
              filters.lat!,
              filters.lng!,
              latB,
              lngB,
            );
            return distanceA - distanceB; // Menor a mayor distancia
          });
        }
        break;

      case SortBy.price_asc:
        sorted.sort((a, b) => {
          const priceA = a.price
            ? typeof a.price === 'string'
              ? Number(a.price)
              : a.price
            : Infinity;
          const priceB = b.price
            ? typeof b.price === 'string'
              ? Number(b.price)
              : b.price
            : Infinity;
          return priceA - priceB; // Menor a mayor
        });
        break;

      case SortBy.price_desc:
        sorted.sort((a, b) => {
          const priceA = a.price
            ? typeof a.price === 'string'
              ? Number(a.price)
              : a.price
            : 0;
          const priceB = b.price
            ? typeof b.price === 'string'
              ? Number(b.price)
              : b.price
            : 0;
          return priceB - priceA; // Mayor a menor
        });
        break;

      case SortBy.popularity:
        sorted.sort((a, b) => {
          const popularityA = a.totalRatings || 0;
          const popularityB = b.totalRatings || 0;
          return popularityB - popularityA; // Mayor a menor (más popular primero)
        });
        break;

      default:
        break;
    }

    return sorted;
  }

  /**
   * Aplica filtros y ordenamiento
   */
  applyFiltersAndSort<
    T extends {
      price?: number | string;
      averageRating?: number | string;
      lat?: number | string | null;
      lng?: number | string | null;
      totalRatings?: number;
    },
  >(items: T[], filters: HomeFiltersDto): T[] {
    let result = this.applyFilters(items, filters);
    result = this.sortItems(result, filters);
    return result;
  }
}
