<template>
    <div class="app-container">
        <el-button @click="print">打印</el-button>
        <el-row>
            <el-col :span="10">
                <div class="sidebar">
                    <div
                            v-for="(item, index) in items"
                            :key="index"
                            class="draggable-item"
                            :draggable="true"
                            @dragstart="onDragStart($event, item)"
                    >
                        <template v-if="item.type === 'text'"><p style="height:20px">{{ item.content }}</p></template>
                        <template v-else-if="item.type === 'image'">
                            <img :src="item.content" style="height:50px;width:50px" alt="draggable image" />
                        </template>
                    </div>
                </div>
            </el-col>
            <el-col :span="14">
                <div class="dropzone" @dragover="onDragOver" @drop="onDrop" ref="printTemplate">
                    <div
                            v-for="(box, index) in dropItems"
                            :key="index"
                            class="dropped-item"
                            :style="{ left: `${box.x}px`, top: `${box.y}px` }"
                            @mousedown="startDrag(index, $event)"
                    >
                        <template v-if="box.type === 'text'">{{ box.content }}</template>
                        <template v-else-if="box.type === 'image'">
                            <img :src="box.content" alt="dropped image" style="height:50px;width:50px" />
                        </template>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
    import printHtmlBatch from "@/utils/print2";
    const printTemplate = ref(null);
    const items = ref([
        { type: 'text', content: '标准品名称:我是标准品' },
        { type: 'text', content: '入库人:张三' },
        { type: 'image', content: 'https://prod-saas-5.oss-cn-shanghai.aliyuncs.com/icon/3e96169958c14395b22d5a8ad4151c51/%E7%BD%91%E5%85%B3%E4%BA%A7%E5%93%81%E5%8C%852x.png' }
    ]);

    const dropItems = ref([]);
    let currentBoxIndex = null;
    let offsetX = 0;
    let offsetY = 0;

    const onDragStart = (event, item) => {
        event.dataTransfer.setData('item', JSON.stringify(item));
    };

    const onDragOver = (event) => {
        event.preventDefault();
    };

    const onDrop = (event) => {
        event.preventDefault();
        const item = JSON.parse(event.dataTransfer.getData('item'));
        const dropZoneRect = event.target.getBoundingClientRect();
        dropItems.value.push({
            ...item,
            x: event.clientX - dropZoneRect.left,
            y: event.clientY - dropZoneRect.top
        });
    };

    const startDrag = (index, event) => {
        currentBoxIndex = index;
        const box = dropItems.value[index];
        offsetX = event.clientX - box.x;
        offsetY = event.clientY - box.y;
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const onDrag = (event) => {
        if (currentBoxIndex !== null) {
            const dropZoneRect = document.querySelector('.dropzone').getBoundingClientRect();
            dropItems.value[currentBoxIndex].x = event.clientX - dropZoneRect.left - offsetX;
            dropItems.value[currentBoxIndex].y = event.clientY - dropZoneRect.top - offsetY;
        }
    };

    const stopDrag = () => {
        currentBoxIndex = null;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    };
    function print() {
        let stringArray = [];
        stringArray.push(printTemplate.value.outerHTML);
        stringArray.push(printTemplate.value.outerHTML);
        console.log(stringArray)
        printHtmlBatch(stringArray,500,500);
    }
</script>
<style scoped>
    #app-container {
        display: flex;
        height: 100vh;
    }

    .sidebar {
        width: 80%;
        background: #f0f0f0;
        padding: 10px;
    }

    .dropzone {
        flex: 1;
        position: relative;
        background: #fff;
        border: 2px dashed #ccc;
        /*height: 1123px;*/
        height: 189px;
        /*width: 794px*/
        width: 189px;
    }

    .draggable-item {
        margin: 10px;
        padding: 10px;
        border: 1px solid #ccc;
        background: #e0e0e0;
        cursor: grab;
    }

    .dropped-item {
        position: absolute;
        padding: 0px;
        border: 1px solid #333;
        background: darkgrey;
        cursor: grab;

    }

    .dropped-item img {
        max-width: 100%;
        max-height: 100%;
    }
</style>
