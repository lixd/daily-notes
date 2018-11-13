var sources = ['birds', 'land', 'pipe1', 'pipe2', 'sky']; // 保存了源文件的路径
var images = {count: 0}; // 保存了加载好的图像标签



// 统一的加载事件处理器
function loadHandler(name, elem, event) {
    // 加载好一张图，就在images里面新增一条记录，将计数器加一
    images[name] = elem;
    images.count++;
    if (images.count >= sources.length) {
        /* 如果images的计数次数等于sources数组的长度，
         则代表全部加载完成
         此时执行主函数，游戏主逻辑开始
         */
        main();
    }
}
for (var i = 0; i < sources.length; i++) {

    /*
     根据源文件路径数组 依次创建多个图像标签
     */
    var imageElem = new Image(); // 创建图像标签
    imageElem.src = 'imgs/' + sources[i] + '.png';

    /* 使用bind方法的原因是，
     我们addEventListener时，所传入的函数是浏览器在图像加载之后自己调用的。
     浏览器调用这个函数时，会传入一个evt对象，
     而我们的loadHandler函数需要传入一个我们自制的imageObj对象，
     于是我们就可以用bind方法把imageObj对象作为第一个参数绑定到一个新的函数上，
     把这个新的函数传递给addEventListener函数。
     */
    (function (i) {
        var handlerFn = loadHandler.bind(window, sources[i], imageElem);
        imageElem.addEventListener('load', handlerFn)
    })(i)
}