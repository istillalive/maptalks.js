#include <invert_matrix>
#ifdef HAS_INSTANCE
    #include <instance_vert>
    #ifdef HAS_INSTANCE_COLOR
        varying vec4 vInstanceColor;
    #endif
#endif

#ifdef HAS_SKIN
    uniform int skinAnimation;
    #include <skin_vert>
#endif

#ifdef HAS_MORPH
    attribute vec3 POSITION_0;
    attribute vec3 POSITION_1;
    attribute vec3 POSITION_2;
    attribute vec3 POSITION_3;
    #ifdef HAS_MORPHNORMALS
        attribute vec3 NORMAL_0;
        attribute vec3 NORMAL_1;
        attribute vec3 NORMAL_2;
        attribute vec3 NORMAL_3;
    #endif
    uniform vec4 morphWeights;
#endif

mat4 getPositionMatrix() {
    mat4 worldMatrix;
    #ifdef HAS_INSTANCE
        #ifdef HAS_INSTANCE_COLOR
            vInstanceColor = instance_getInstanceColor();
        #endif
        mat4 attributeMatrix = instance_getAttributeMatrix();
        #ifdef HAS_SKIN
            if (skinAnimation == 1) {
                worldMatrix = attributeMatrix * positionMatrix * skin_getSkinMatrix();
            } else {
                worldMatrix = attributeMatrix * positionMatrix;
            }
        #else
            worldMatrix = attributeMatrix * positionMatrix;
        #endif
    #else
        #ifdef HAS_SKIN
            if (skinAnimation == 1) {
                worldMatrix = skin_getSkinMatrix() * positionMatrix;
            } else {
                worldMatrix = positionMatrix;
            }
        #else
            worldMatrix = positionMatrix;
        #endif
    #endif
    return worldMatrix;
}

vec4 getPosition(vec3 position) {
    #ifdef HAS_MORPH
        vec4 POSITION = vec4(position + morphWeights.x * POSITION_0 + morphWeights.y * POSITION_1 + morphWeights.z * POSITION_2 + morphWeights.w * POSITION_3, 1.0);
   #else
        vec4 POSITION = vec4(position, 1.0);
    #endif
    return POSITION;
}

mat4 getNormalMatrix(mat4 worldMatrix) {
    mat4 inverseMat = invert_matrix(worldMatrix);
    mat4 normalMat = transpose_matrix(inverseMat);
    return normalMat;
}

vec4 getNormal(vec3 NORMAL) {
    #ifdef HAS_MORPHNORMALS
        vec4 normal = vec4(NORMAL + morphWeights.x * NORMAL_0 + morphWeights.y * NORMAL_1 + morphWeights.z * NORMAL_2 + morphWeights.w * NORMAL_3, 1.0);
    #else
        vec4 normal = vec4(NORMAL, 1.0);
    #endif
    return normal;
}