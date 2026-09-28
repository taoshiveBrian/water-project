import type { Feature, Polygon } from 'geojson';

const EARTH_RADIUS_MILES = 3958.8;

export type LngLat = [longitude: number, latitude: number];

/**
 * A geodesic circle as a GeoJSON polygon: each vertex is `radiusMiles` from the
 * center along the earth's surface, so it stays round at any latitude.
 */
export function circlePolygon(
    center: LngLat,
    radiusMiles: number,
    steps = 128,
): Feature<Polygon> {
    const [lng, lat] = center.map((degrees) => (degrees * Math.PI) / 180);
    const angular = radiusMiles / EARTH_RADIUS_MILES;
    const ring: LngLat[] = [];

    for (let step = 0; step <= steps; step++) {
        const bearing = (2 * Math.PI * step) / steps;
        const pointLat = Math.asin(
            Math.sin(lat) * Math.cos(angular) +
                Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
        );
        const pointLng =
            lng +
            Math.atan2(
                Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
                Math.cos(angular) - Math.sin(lat) * Math.sin(pointLat),
            );

        ring.push([(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI]);
    }

    return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
    };
}

/**
 * [[west, south], [east, north]] around a polygon.
 */
export function polygonBounds(polygon: Feature<Polygon>): [LngLat, LngLat] {
    const ring = polygon.geometry.coordinates[0];
    const lngs = ring.map(([lng]) => lng);
    const lats = ring.map(([, lat]) => lat);

    return [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
    ];
}
