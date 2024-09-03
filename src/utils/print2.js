export default function printHtmlBatch(htmlArray, pageWidth = 189, pageHeight = 189) {
    if (!Array.isArray(htmlArray) || htmlArray.length === 0) {
        return;
    }

    let style = getStyle(pageWidth, pageHeight);  // 将页面尺寸作为参数传入
    let container = getBatchContainer(htmlArray);
    console.log(htmlArray);
    console.log(container);
    document.body.appendChild(style);
    document.body.appendChild(container);

    getLoadPromise(container).then(() => {
        window.print();
        document.body.removeChild(style);
        document.body.removeChild(container);
    });
}

// 设置打印样式
function getStyle(pageWidth, pageHeight) {
    let styleContent = `
        @media print {
            body > :not(#print-container) {
                display: none;
            }
            @page {
                margin: 0;
                size: ${pageWidth}px ${pageHeight}px; /* 动态页面尺寸 */
            }
            html, body {
                margin: 0;
                padding: 0;
                width: ${pageWidth}px;
                height: ${pageHeight}px;
                display: block !important;
            }
            #print-container {
                display: block;
            }
            .print-container {
                width: ${pageWidth}px; /* 动态容器宽度 */
                height: ${pageHeight}px; /* 动态容器高度 */
                overflow: hidden;
                page-break-after: always; /* 强制分页 */
            }
        }
    `;
    let style = document.createElement("style");
    style.innerHTML = styleContent;
    return style;
}

// 清空打印内容
function cleanPrint() {
    let div = document.getElementById('print-container');
    if (div) {
        document.querySelector('body').removeChild(div);
    }
}

// 新建DOM，将需要打印的所有内容填充到DOM
function getBatchContainer(htmlArray) {
    cleanPrint();
    let container = document.createElement("div");
    container.id = "print-container"; // 设置容器ID

    htmlArray.forEach(html => {
        let pageContainer = document.createElement("div");
        pageContainer.classList.add("print-container"); // 添加print-container类
        pageContainer.innerHTML = html;
        container.appendChild(pageContainer);
    });

    return container;
}

// 图片完全加载后再调用打印方法
function getLoadPromise(dom) {
    let imgs = dom.querySelectorAll("img");
    imgs = [].slice.call(imgs);

    if (imgs.length === 0) {
        return Promise.resolve();
    }

    let finishedCount = 0;
    return new Promise(resolve => {
        function check() {
            finishedCount++;
            if (finishedCount === imgs.length) {
                resolve();
            }
        }

        imgs.forEach(img => {
            img.addEventListener("load", check);
            img.addEventListener("error", check);
        });
    });
}
