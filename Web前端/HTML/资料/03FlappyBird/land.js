var landPrototype = {
    build: function () {
        this.x = 800;
    },
    update: function (dt) {
        this.x = this.x + this.speed * dt;
    },
    draw: function (dt) {
        this.update(dt);
        this.ctx.drawImage(this.img, this.x, 500)
    }
};

function Land(ctx, x, img, speed) {
    this.ctx = ctx;
    this.img = img;
    this.speed = speed;
    this.build();
    this.x = x;
}

Land.prototype = landPrototype;