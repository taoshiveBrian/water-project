import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import MapGL, {
    Layer,
    Marker,
    NavigationControl,
    ScaleControl,
    Source,
} from 'react-map-gl/maplibre';
import { circlePolygon, polygonBounds } from '@/components/map/geo';
import type { LngLat } from '@/components/map/geo';

/**
 * MapLibre 6 finds its worker relative to its own file, which breaks once Vite
 * bundles it (the worker file isn't there). Without the worker no vector data
 * (roads, labels, our zone) is drawn, so hand it a worker Vite builds for us.
 */
setWorkerUrl(maplibreWorkerUrl);

/**
 * Free OpenStreetMap vector tiles from OpenFreeMap: no API key or usage billing.
 * Swap this URL to change the basemap (MapTiler, self-hosted PMTiles, …).
 */
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Taos, NM (ZIP 87571), approximated by the town center.
 */
export const ZONE_CENTER: LngLat = [-105.5731, 36.4072];

export const ZONE_RADIUS_MILES = 30;

const zone = circlePolygon(ZONE_CENTER, ZONE_RADIUS_MILES);
const zoneBounds = polygonBounds(zone);

/**
 * The starting service zone: a 30-mile circle around 87571. Browser-only
 * (MapLibre needs WebGL), so load this with React.lazy after mount.
 */
export default function ZoneMap() {
    return (
        <MapGL
            initialViewState={{
                bounds: zoneBounds,
                fitBoundsOptions: { padding: 40 },
            }}
            mapStyle={MAP_STYLE_URL}
            style={{ width: '100%', height: '100%' }}
            cooperativeGestures
        >
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-left" unit="imperial" />

            <Source id="zone" type="geojson" data={zone}>
                <Layer
                    id="zone-fill"
                    type="fill"
                    paint={{ 'fill-color': '#0284c7', 'fill-opacity': 0.12 }}
                />
                <Layer
                    id="zone-outline"
                    type="line"
                    paint={{
                        'line-color': '#0284c7',
                        'line-width': 2,
                        'line-dasharray': [2, 1.5],
                    }}
                />
            </Source>

            <Marker
                longitude={ZONE_CENTER[0]}
                latitude={ZONE_CENTER[1]}
                color="#0284c7"
            />
        </MapGL>
    );
}
