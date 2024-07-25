<template>
    <div class="app-container">
<!--        <div class="delete-area" ref="deleteArea">-->
<!--            <el-icon-delete class="delete-icon"></el-icon-delete>-->
<!--            拖动到此删除-->
<!--        </div>-->
        <el-row>
            <el-col :span="6">
                <div>
                    <el-button @click="print">打印</el-button>
                    <h3>资源库</h3>
                    <draggable
                            class="dragArea list-group"
                            :list="list1"
                            :group="{ name: 'printLabel'}"
                            @change="log"
                            item-key="id"
                    >
                        <template #item="{ element }">
                            <div class="list-group-item">
                                <el-text v-if="element.type === 'text'">{{ element.name }}</el-text>
                                <el-image v-else-if="element.type === 'image'" style="width: 100px; height: 100px" :src="element.url" />
                            </div>
                        </template>
                    </draggable>
                </div>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="7">
                    <div ref="printTemplate">
                        <h3>Draggable 2</h3>
                        <draggable
                                class="dragArea list-group"
                                :list="list2"
                                group="printLabel"
                                @change="log"
                                @end="checkDelete(list2)"
                                item-key="id"
                        >
                            <template #item="{ element }">
                                <div class="list-group-item">
                                    <el-text v-if="element.type === 'text'">{{ element.name }}</el-text>
                                    <el-image v-else-if="element.type === 'image'" style="width: 100px; height: 100px" :src="element.url" />
                                </div>
                            </template>
                        </draggable>
                    </div>
            </el-col>
<!--            <el-col :span="7">-->
<!--                <h3>Draggable 3</h3>-->
<!--                <draggable-->
<!--                        class="dragArea list-group"-->
<!--                        :list="list3"-->
<!--                        group="printLabel"-->
<!--                        @change="log"-->
<!--                        @end="checkDelete"-->
<!--                        item-key="id"-->
<!--                >-->
<!--                    <template #item="{ element }">-->
<!--                        <div class="list-group-item">-->
<!--                            <el-text v-if="element.type === 'text'">{{ element.name }}</el-text>-->
<!--                            <el-image v-else-if="element.type === 'image'" style="width: 100px; height: 100px" :src="element.url" />-->
<!--                        </div>-->
<!--                    </template>-->
<!--                </draggable>-->
<!--            </el-col>-->
        </el-row>
    </div>
</template>

<script setup>
    import printHtml from "@/utils/print";
    const printTemplate = ref(null);
    const list1 = ref([
        {name: "标准品名称:xxx", id: 1,field:"name",type:"text"},
        {name: "入库人:xxx", id: 2,field:"user",type:"text"},
        {url:"https://prod-saas-5.oss-cn-shanghai.aliyuncs.com/icon/3e96169958c14395b22d5a8ad4151c51/%E7%BD%91%E5%85%B3%E4%BA%A7%E5%93%81%E5%8C%852x.png", id: 3,field:"image",type:"image"},
    ]);
    const list2 = ref([
    ]);
    const list3 = ref([
    ]);
    const deleteArea = ref(null);
    function log(evt) {
        // window.console.log(evt);
    }
    function print() {
        const htmlContent = printTemplate.value.outerHTML;
        printHtml(htmlContent);
    }
    function checkDelete(evt,list) {
        console.log(evt)
        console.log(list)
    }
</script>
<style scoped>
    .list-group {
        display: -ms-flexbox;
        display: -webkit-box;
        display: flex;
        -ms-flex-direction: column;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        flex-direction: column;
        padding-left: 0;
        margin-bottom: 0;
        border-radius: .25rem;
        border: 1px solid rgba(0, 0, 0, .125);
        height: 500px;
    }
    .list-group-item {
        cursor: move;
        position: relative;
        display: block;
        padding: .75rem 1.25rem;
        background-color: #fff;
        border: 1px solid rgba(0, 0, 0, .125);
    }
    .delete-area {
        position: relative;
        top: 20px;
        left: 20px;
        width: 150px;
        height: 150px;
        border: 2px dashed red;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 16px;
        color: red;
        background-color: rgba(255, 255, 255, 0.9);
        z-index: 1000;
        transition: background-color 0.3s;
    }
    .delete-area.delete-active {
        background-color: rgba(255, 0, 0, 0.5);
    }
    .delete-icon {
        font-size: 32px;
        margin-right: 10px;
    }
</style>
