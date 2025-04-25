/**
 * PluginRegistry - Manages available collage layouts and effects
 */

import CrystalLayout from '../plugins/layouts/CrystalLayout.js';
import FragmentsLayout from '../plugins/layouts/FragmentsLayout.js';
import TilingLayout from '../plugins/layouts/TilingLayout.js';
import SlicedLayout from '../plugins/layouts/SlicedLayout.js';
import NarrativeLayout from '../plugins/layouts/NarrativeLayout.js';
import MosaicLayout from '../plugins/layouts/MosaicLayout.js';
import LayeredLayout from '../plugins/layouts/LayeredLayout.js';

export class PluginRegistry {
    constructor() {
        this.layouts = {
            crystal: new CrystalLayout(),
            fragments: new FragmentsLayout(),
            tiling: new TilingLayout(),
            sliced: new SlicedLayout(),
            narrative: new NarrativeLayout(),
            mosaic: new MosaicLayout(),
            layered: new LayeredLayout()
        };
    }

    getLayout(name) {
        return this.layouts[name] || this.layouts.fragments;
    }

    getAvailableLayouts() {
        return Object.keys(this.layouts);
    }
} 