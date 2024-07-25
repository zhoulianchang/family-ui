<template>
    <div class="app-container">
        <div class="form">
            <el-input v-model="data.productName" placeholder="标准品名称"></el-input>
            <el-input v-model="data.storagePerson" placeholder="入库人"></el-input>
            <el-input v-model="data.expiryDate" placeholder="未开封效期"></el-input>
            <el-input v-model="data.storageDate" placeholder="入库日期"></el-input>
            <el-input v-model="data.qrCode" placeholder="二维码 URL"></el-input>
            <el-button @click="print">打印</el-button>
        </div>
        <div class="print-template" ref="printTemplate">
            <div class="info">
                <div>标准品名称: <span>{{ data.productName }}</span></div>
                <div>入库人: <span>{{ data.storagePerson }}</span></div>
                <div>未开封效期: <span>{{ data.expiryDate }}</span></div>
                <div>入库日期: <span>{{ data.storageDate }}</span></div>
            </div>
            <div class="qr-code">
                <img :src="data.qrCode" alt="二维码" />
                <div>二维码</div>
            </div>
        </div>
    </div>
</template>

<script setup name="FilePrint">

    import printHtml from "@/utils/print";
    const data = reactive({
        productName: 'test',
        storagePerson: '123',
        expiryDate: '123',
        storageDate: '123',
        qrCode: 'https://prod-saas-5.oss-cn-shanghai.aliyuncs.com/icon/3e96169958c14395b22d5a8ad4151c51/%E7%BD%91%E5%85%B3%E4%BA%A7%E5%93%81%E5%8C%852x.png'
    });
    const printTemplate = ref(null);

    function print() {
        const htmlContent = printTemplate.value.outerHTML;
        printHtml(htmlContent);
    }
    function updatePositions() {
        blocks.forEach((block, index) => {
            const element = document.querySelector(`.block[data-index="${index}"]`);
            const rect = element.getBoundingClientRect();
            block.top = rect.top;
            block.left = rect.left;
        });
    }
    function handleBeforePrint(event) {
        // 放开隐藏的元素
        console.log('Before print event triggered');
    }
    function handleAfterPrint(event) {
        // 放开隐藏的元素
        console.log('After print event triggered');
    }

    // 在组件挂载时添加事件监听器
    onMounted(() => {
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);
    });

    // 在组件卸载时移除事件监听器
    onBeforeUnmount(() => {
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
    });
</script>

<style scoped>
    .print-template {
        margin-top: 10px;
        margin-left: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 500px;
    }

    .info {
        flex: 1;
        line-height: 2;
    }

    .qr-code {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
