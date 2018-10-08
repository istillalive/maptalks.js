// the distance over which the line edge fades out.
// Retina devices need a smaller distance to avoid aliasing.
#define DEVICE_PIXEL_RATIO 1.0
#define ANTIALIASING 1.0 / DEVICE_PIXEL_RATIO / 2.0

// floor(127 / 2) == 63.0
// the maximum allowed miter limit is 2.0 at the moment. the extrude normal is
// stored in a byte (-128..127). we scale regular normals up to length 63, but
// there are also "special" normals that have a bigger length (of up to 126 in
// this case).
// #define scale 63.0
#define EXTRUDE_SCALE 0.015873016

attribute vec3 aPosition;
attribute vec2 aNormal;
attribute vec2 aExtrude;
// attribute float aLinesofar;

uniform float cameraToCenterDistance;
uniform float lineGapWidth;
uniform float lineWidth;
uniform vec2 canvasSize;
uniform mat4 projViewModelMatrix;
uniform mat4 uMatrix;

varying vec2 vNormal;
varying vec2 vWidth;
varying float vGammaScale;

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = gl_Position.w;
    //预乘w，得到gl_Position在NDC中的坐标值
    // gl_Position /= gl_Position.w;

    float gapwidth = lineGapWidth / 2.0;
    float halfwidth = lineWidth / 2.0;
    // offset = -1.0 * offset;

    float inset = gapwidth + (gapwidth > 0.0 ? ANTIALIASING : 0.0);
    float outset = gapwidth + halfwidth * (gapwidth > 0.0 ? 2.0 : 1.0) + (halfwidth == 0.0 ? 0.0 : ANTIALIASING);

    vec2 extrude = aExtrude - 128.0;
    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    mediump vec2 dist = outset * extrude * EXTRUDE_SCALE;
    dist /= canvasSize;

    gl_Position.xy += (uMatrix * vec4(dist, aPosition.z, 1.0)).xy * gl_Position.w;

    // x is 1 if it's a round cap, 0 otherwise
    // y is 1 if the normal points up, and -1 if it points down
    vNormal = aNormal;
    vWidth = vec2(outset, inset);
    vGammaScale = cameraToCenterDistance / distance;
}
