import * as maptalks from 'maptalks';

const POINT = new maptalks.Point(0, 0);
export const ID_PROP = '_vector3dlayer_id';

//需要解决精度问题
export function convertToFeature(geo) {
    const map = geo.getMap();
    const glZoom = map.getGLZoom();
    let coordinates = geo.getCoordinates();
    const geometry = [];
    let type = 1;
    if (geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPolygon) {
        if (geo instanceof maptalks.Marker) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            map.coordToPoint(coordinates[i], glZoom, POINT);
            geometry.push([POINT.x, POINT.y]);
        }
    } else if (geo instanceof maptalks.LineString || geo instanceof maptalks.MultiLineString) {
        type = 2;
        if (geo instanceof maptalks.LineString) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            geometry[i] = [];
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                map.coordToPoint(coordinates[i][ii], glZoom, POINT);
                geometry[i].push([POINT.x, POINT.y]);
            }
        }
    } else if (geo instanceof maptalks.Polygon || geo instanceof maptalks.MultiPolygon) {
        type = 3;
        if (geo instanceof maptalks.Polygon) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            geometry[i] = [];
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                geometry[i][ii] = [];
                for (let iii = 0; iii < coordinates[i][ii].length; iii++) {
                    map.coordToPoint(coordinates[i][ii][iii], glZoom, POINT);
                    geometry[i][ii].push([POINT.x, POINT.y]);
                }
            }
        }
    }
    const properties = geo.getProperties() ? Object.assign({}, geo.getProperties()) : {};
    const symbol = geo.getSymbol();
    for (const p in symbol) {
        if (symbol.hasOwnProperty(p)) {
            properties['_symbol_' + p] = symbol[p];
        }
    }
    return {
        type,
        id: geo[ID_PROP],
        properties,
        visible: geo.isVisible(),
        geometry,
        extent: Infinity
    };
}
