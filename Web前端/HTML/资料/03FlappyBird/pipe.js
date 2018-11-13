var pipePrototype = {
    build: function () {
        this.downPipeH = Math.random() * 175 + 100;
        this.x = 800;
    },
    update: function (dt) {
        this.x = this.x + this.speed * dt;
    },
    draw: function (dt) {
        this.update(dt);
        var upPipeY = this.downPipeH + 150;
        var upPipeH = 500 - upPipeY;
        this.ctx.drawImage(this.imgUp,
            0, 0, 52, upPipeH,
            this.x, upPipeY, 52, upPipeH);
        this.ctx.rect(this.x - 10, upPipeY - 10, 52 + 20, upPipeH + 10);


        var downPipeY = 420 - this.downPipeH;
        this.ctx.drawImage(this.imgDown,
            0, downPipeY, 52, this.downPipeH,
            this.x, 0, 52, this.downPipeH);
        this.ctx.rect(this.x - 10, 0, 52 + 20, this.downPipeH + 10);
    }
};

function Pipe(ctx, x, imgUp, imgDown, speed) {
    this.ctx = ctx;
    this.imgUp = imgUp;
    this.imgDown = imgDown;
    this.speed = speed;
    this.build();
    this.x = x;
}

Pipe.prototype = pipePrototype;