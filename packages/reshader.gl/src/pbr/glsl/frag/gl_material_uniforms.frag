//maptalksgl的material定义
uniform struct Material {
    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#reference-pbrmetallicroughness
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        sampler2D   baseColorTexture;
    #else
        vec4        baseColorFactor;
    #endif
    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        //G: roughness B: metallic
        sampler2D   metallicRoughnessTexture;
    #else
        float       metallicFactor;
        float       roughnessFactor;
    #endif

    //https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#occlusiontextureinfo
    #if defined(MATERIAL_HAS_AMBIENT_OCCLUSION)
        #if defined(MATERIAL_HAS_AO_MAP)
            // default: 0.0
            sampler2D occlusionTexture;
        #else
            float occlusion;
        #endif
            float occlusionStrength;
    #endif

    #if defined(MATERIAL_HAS_EMISSIVE)
        #if defined(MATERIAL_HAS_EMISSIVE_MAP)
            sampler2D emissiveTexture;
        #else
            float emissiveFactor;
        #endif
    #endif

    #if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
        // default: vec4(0.0)
        vec4 postLightingColor;
    #endif

        //TODO reflectance 是否能做成材质？
        // default: 0.5, not available with cloth
        float reflectance;
    #if defined(MATERIAL_HAS_CLEAR_COAT)
            // default: 1.0, 是否是clearCoat, 0 or 1
            float clearCoat;
        #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
            sampler2D clearCoatRoughnessTexture;
        #else
            // default: 0.0
            float clearCoatRoughness;
        #endif

        #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
            // default: vec3(0.0, 0.0, 1.0)
            sampler2D clearCoatNormalTexture;
        #endif
    #endif

    #if defined(MATERIAL_HAS_ANISOTROPY)
        // default: 0.0
        float anisotropy;
        // default: vec3(1.0, 0.0, 0.0)
        vec3 anisotropyDirection;
    #endif

    //TODO subsurface模型的定义
    // only available when the shading model is subsurface
    // float thickness;           // default: 0.5
    // float subsurfacePower;     // default: 12.234
    // vec3 subsurfaceColor;     // default: vec3(1.0)

    //TODO cloth模型的定义
    // only available when the shading model is cloth
    // vec3 sheenColor;          // default: sqrt(baseColor)
    // vec3 subsurfaceColor;     // default: vec3(0.0)

    // not available when the shading model is unlit
    // must be set before calling prepareMaterial()
    #if defined(MATERIAL_HAS_NORMAL)
        // default: vec3(0.0, 0.0, 1.0)
        sampler2D normalTexture;
    #endif
} material;

void getMaterial(out MaterialInputs materialInputs) {
    #if defined(MATERIAL_HAS_BASECOLOR_MAP)
        materialInputs.baseColor = texture2D(material.baseColorTexture, vertex_uv01.xy);
    #else
        materialInputs.baseColor = material.baseColorFactor;
    #endif

    #if defined(MATERIAL_HAS_METALLICROUGHNESS_MAP)
        vec2 roughnessMetallic = texture2D(material.metallicRoughnessTexture).gb;
        materialInputs.roughness = roughnessMetallicp[0];
        #if !defined(SHADING_MODEL_CLOTH)
            materialInputs.metallic = roughnessMetallic[1];
        #endif
    #else
        materialInputs.roughness = material.roughnessFactor;
        #if !defined(SHADING_MODEL_CLOTH)
            materialInputs.metallic = material.metallicFactor;
        #endif
    #endif

    #if !defined(SHADING_MODEL_CLOTH)
        //TODO 可能需要从纹理中读取
        materialInputs.reflectance = material.reflectance;
    #endif

    #if defined(MATERIAL_HAS_AMBIENT_OCCLUSION)
        #if defined(MATERIAL_HAS_AO_MAP)
            materialInputs.ambientOcclusion = texture2D(material.occlusionTexture, vertex_uv01.xy).r;
        #else
            materialInputs.ambientOcclusion = material.occlusion;
        #endif
        materialInputs.ambientOcclusion *= material.occlusionStrength;
    #endif

    #if defined(MATERIAL_HAS_EMISSIVE)
        #if defined(MATERIAL_HAS_EMISSIVE_MAP)
            materialInputs.emissive = texture2D(material.emissiveTexture, vertex_uv01.xy);
        #else
            materialInputs.emissive = material.emissiveFactor;
        #endif
    #endif

    #if defined(MATERIAL_HAS_CLEAR_COAT)
        materialInputs.clearCoat = material.clearCoat;
        #if defined(MATERIAL_HAS_CLEARCOAT_ROUGNESS_MAP)
            materialInputs.clearCoatRoughness = texture2D(material.clearCoatRoughnessTexture, vertex_uv01.xy).g;
        #else
            materialInputs.clearCoatRoughness = material.clearCoatRoughness;
        #endif

        #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
            materialInputs.clearCoatNormal = texture2D(material.clearCoatNormalTexture, vertex_uv01.xy).xyz;
        #endif
    #endif

    #if defined(MATERIAL_HAS_ANISOTROPY)
        materialInputs.anisotropy = material.anisotropy;
        materialInputs.anisotropyDirection = material.anisotropyDirection;
    #endif

    #if defined(MATERIAL_HAS_NORMAL)
        materialInputs.normal = texture2D(material.normalTexture, vertex_uv01.xy).xyz;
    #endif

    #if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
        materialInputs.postLightingColor = material.postLightingColor;
    #endif
}
