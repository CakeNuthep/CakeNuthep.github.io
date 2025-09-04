class Box {
    constructor({
            width,
            height,
            depth,
            position
            
        }) {
        this.width = width;
        this.height = height;
        this.depth = depth

        this.position = position;

        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }

    updateSides() {
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }

    describe() {
        return `Box: width=${this.width}, height=${this.height}, area=${this.area()}, perimeter=${this.perimeter()}`;
    }  
}

export { Box };