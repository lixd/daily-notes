var birdPrototype = {
    x: 150,
    draw: function (dt) {
        this.update(dt);
        this.ctx.save(); // 保存绘制之前的canvas的状态
        var temp = this.speed;
        var speedAtMaxAngle = 0.5;
        if (temp > speedAtMaxAngle) {
            temp = speedAtMaxAngle;
        } else if (temp < -speedAtMaxAngle) {
            temp = -speedAtMaxAngle;
        }
        // 根据鸟的速度改变鸟的朝向
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(60 / 180 * Math.PI * (temp / speedAtMaxAngle));
        this.ctx.drawImage(this.img,
            52 * this.frameIndex, 0, 52, 45,
            -26, -22.5, 52, 45
        );
        this.ctx.restore(); // 恢复到保存的状态
    },
    update: function (dt) {
        // 精灵在这一帧等待的时间 = 原等待时间 + 全局传来的两帧间隔时间
        this.waitTime = this.waitTime + dt;
        if (this.waitTime >= 200) {
            // 如果这一帧的等待时间超过200毫秒，则播放下一帧，并将等待时间减去200毫秒
            this.waitTime = this.waitTime - 200;
            this.frameIndex = ++this.frameIndex % 3;
        }
        // 速度 = 原速度 + 加速度 * 时间
        this.speed = this.speed + this.accelerate * dt;
        // 新位置 = 原位置 + 速度 * 时间
        this.y = this.y + this.speed * dt;
    }
};


function Bird(ctx, img) {
    this.ctx = ctx;
    this.img = img;
    this.y = 200; // y轴位置
    this.speed = 0; // 速度
    this.accelerate = 0.0005; // 加速度
    this.frameIndex = 0; // 当前帧
    this.waitTime = 0; // 在当前帧的等待时间
}

Bird.prototype = birdPrototype;