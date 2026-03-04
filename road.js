class Road {
    constructor(x, width, laneCount = 3) {
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;

        this.left = x - width / 2;
        this.right = x + width / 2;

        this.top = -1000000;
        this.bottom = 1000000;

        this.roadMarkings = 5;

        this.roadLane = [];

        this.borders = [];

        this.#generateBorders();
    }

    #generateBorders() {
        this.borders = [];
        for (let i = 0; i < this.laneCount; i++) {
            this.borders.push([
                { x: this.left, y: this.top },
                { x: this.left, y: this.bottom },
            ]);
            this.borders.push([
                { x: this.right, y: this.top },
                { x: this.right, y: this.bottom },
            ]);
        }
    }

    getLaneCenter(laneNumber) {
        const laneWidth = (this.width) / this.laneCount;
        const laneShift = laneNumber * laneWidth;
        return this.left + laneShift + laneWidth / 2 - this.roadMarkings;
    }

    draw(ctx) {
        this.#drawRoad(ctx);
    }

    #drawRoad(ctx) {
        this.#drawSideBorder(ctx);
        this.#drawRoadLane(ctx);
    }

    #drawSideBorder(ctx) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = this.roadMarkings;
        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left, this.bottom);
        ctx.moveTo(this.right, this.top);
        ctx.lineTo(this.right, this.bottom);
        ctx.stroke();
    }

    #drawRoadLane(ctx) {
        for (let i = 1; i < this.laneCount; i++) {
            const x = lerp(this.left, this.right, i / this.laneCount);
            ctx.setLineDash([30, 50]);
            ctx.beginPath();
            ctx.moveTo(x, this.top);
            ctx.lineTo(x, this.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}