drawFragments(fragments) {
    if (!fragments || !Array.isArray(fragments)) {
        console.warn('No valid fragments to draw');
        return;
    }

    fragments.forEach(fragment => {
        if (!fragment || typeof fragment.img !== 'number') {
            console.warn('Invalid fragment:', fragment);
            return;
        }

 