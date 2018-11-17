// 传入一组显示对象（带.draw()函数的对象），将它们依次执行
function renderView(ctx, model, dt) {
    ctx.clearRect(0, 0, 800, 600);
    for (var i = 0; i < model.displayObjects.length; i++) {
        model.displayObjects[i].draw(dt);
    }
}