import Material from './Material.js';

const DEFAULT_UNIFORMS = {
    'baseColorFactor': [1, 1, 1, 1],
    'materialShininess' : 32.0,
    'environmentExposure' : 1,
    'specularStrength' : 32,
    'opacity' : 1.0,
    'extrusionOpacity': 0,
    'extrusionOpacityRange': [0, 1.8],

    'baseColorTexture': null,
    'normalTexture': null,
    'emissiveTexture': null,
    'occlusionTexture': null,

    'uvScale': [1, 1],
    'uvOffset': [0, 0],
    'alphaTest': 0
};

class PhongMaterial extends Material {
    constructor(uniforms) {
        super(uniforms, DEFAULT_UNIFORMS);
    }

    static convertFrom(standardMaterial) {
        const matUniforms = {};
        for (const u in DEFAULT_UNIFORMS) {
            matUniforms[u] = standardMaterial.get(u);
        }
        return new PhongMaterial(matUniforms);
    }

    appendDefines(defines, geometry) {
        super.appendDefines(defines, geometry);
        const uniforms = this.uniforms;
        if (uniforms['extrusionOpacity']) {
            defines['HAS_EXTRUSION_OPACITY'] = 1;
        }
        if (geometry.data[geometry.desc.colorAttribute]) {
            defines['HAS_COLOR'] = 1;
        }
        const color0 = geometry.data[geometry.desc.color0Attribute];
        if (color0) {
            defines['HAS_COLOR0'] = 1;
            defines['COLOR0_SIZE'] = geometry.getColor0Size();
        }
        if (!geometry.data[geometry.desc.uv0Attribute]) {
            return defines;
        }
        if (uniforms['baseColorTexture']) {
            defines['HAS_BASECOLOR_MAP'] = 1;
        }
        if (uniforms['occlusionTexture']) {
            defines['HAS_AO_MAP'] = 1;
        }
        if (uniforms['emissiveTexture']) {
            defines['HAS_EMISSIVE_MAP'] = 1;
        }
        if (uniforms['normalTexture']) {
            defines['HAS_NORMAL_MAP'] = 1;
        }
        if (defines['HAS_BASECOLOR_MAP'] ||
            defines['HAS_AO_MAP'] ||
            defines['HAS_EMISSIVE_MAP'] ||
            defines['HAS_NORMAL_MAP']) {
            defines['HAS_MAP'] = 1;
        }
        return defines;
    }
}
export default PhongMaterial;
