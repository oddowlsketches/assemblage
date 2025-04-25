class FragmentsGenerator {
  constructor(canvas, parameters) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parameters = parameters;
    this.images = [];
  }

  setImages(images) {
    this.images = images;
  }

  generateFragments() {
    if (!this.images || this.images.length === 0) {
      console.error('No images available to generate fragments');
      return [];
    }

    const fragments = [];
    const numFragments = Math.min(this.images.length, 4); // Limit to 4 fragments max

    for (let i = 0; i < numFragments; i++) {
      const image = this.images[i];
      if (!image) continue;

      const fragment = {
        id: `fragment-${i}`,
        image: image,
        position: this.calculateFragmentPosition(i, numFragments),
        rotation: this.calculateFragmentRotation(i),
        scale: this.calculateFragmentScale(i)
      };
      fragments.push(fragment);
    }

    return fragments;
  }

  calculateFragmentPosition(index, totalFragments) {
    const padding = 20;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Calculate grid positions
    const cols = Math.ceil(Math.sqrt(totalFragments));
    const rows = Math.ceil(totalFragments / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Add some randomness to position
    const randomOffset = 30;
    const x = col * cellWidth + padding + (Math.random() * randomOffset - randomOffset/2);
    const y = row * cellHeight + padding + (Math.random() * randomOffset - randomOffset/2);
    
    return { x, y };
  }

  calculateFragmentRotation(index) {
    // Generate random rotation between -45 and 45 degrees
    return (Math.random() * 90 - 45) * Math.PI / 180;
  }

  calculateFragmentScale(index) {
    // Generate random scale between 0.8 and 1.2
    return 0.8 + Math.random() * 0.4;
  }

  drawFragment(fragment) {
    if (!fragment.image) return;

    this.ctx.save();
    
    // Apply transformations
    this.ctx.translate(fragment.position.x, fragment.position.y);
    this.ctx.rotate(fragment.rotation);
    this.ctx.scale(fragment.scale, fragment.scale);
    
    // Draw the image
    const width = fragment.image.width * 0.8; // Scale down slightly
    const height = fragment.image.height * 0.8;
    this.ctx.drawImage(fragment.image, -width/2, -height/2, width, height);
    
    this.ctx.restore();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const fragments = this.generateFragments();
    fragments.forEach(fragment => this.drawFragment(fragment));
  }
}

export default FragmentsGenerator; 