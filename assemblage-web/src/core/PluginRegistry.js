/**
 * PluginRegistry - Manages available collage layouts and effects
 */

import CrystalLayout from '../plugins/layouts/CrystalLayout.js';
import FragmentsLayout from '../plugins/layouts/FragmentsLayout.js';

export class PluginRegistry {
    constructor() {
        this.layouts = {
            crystal: new CrystalLayout(),
            fragments: new FragmentsLayout()
        };
    }

    getLayout(name) {
        return this.layouts[name] || this.layouts.fragments;
    }

    getAvailableLayouts() {
        return Object.keys(this.layouts);
    }
} 