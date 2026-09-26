// Jeju World_Street_Map returns an HTTP-200 "Map data not yet available"
// image above z13 (verified at Seogwipo). Keep display zoom independent
// from tile request zoom so markers and clusters remain fully interactive.
export const BASEMAP_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const BASEMAP_OPTIONS = { maxNativeZoom: 13, maxZoom: 19, attribution: '&copy; Esri' };
