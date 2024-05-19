<template>
    <div class="icon-with-label" :style="{width: svgWidth}">
        <el-checkbox class="checkbox" :model-value="isSelected" @change="toggleSelect"/>
        <svg-icon :icon-class="iconName" :svgClass="svgClass" @click="handleSvgClick"
                  :style="{width: svgWidth, height: svgHeight}"/>
        <el-tooltip content="额外的信息" placement="top" v-if="fileInfo.type === 'FILE'">
            <i class="info-icon" @click="handleInfoClick">i</i>
        </el-tooltip>
        <div v-if="!isEditing" class="label" @click="startEditing">{{ label }}</div>
        <el-input class="label" v-else ref="inputField" type="text" v-model="editedLabel"
                  @keydown.enter="handleKeyDown" @blur="finishEditing"/>
        <el-dialog v-model="open" title="文件信息" width="400px" @close="cancelView" >
            <el-form :model="fileInfo" label-width="40%">
                <el-form-item label="文件编号:">
                    <el-text>{{ fileInfo.fileId }}</el-text>
                </el-form-item>
                <el-form-item label="文件名称:">
                    <el-text>{{ fileInfo.name }}</el-text>
                </el-form-item>
                <el-form-item label="文件大小:">
                    <el-text>{{ fileInfo.fileExt.fileSize }}MB</el-text>
                </el-form-item>
                <el-form-item label="上传者:">
                    <el-text>{{ fileInfo.createBy }}</el-text>
                </el-form-item>
                <el-form-item label="上传时间:">
                    <el-text>{{ fileInfo.createTime }}</el-text>
                </el-form-item>
                <el-form-item label="文件链接:">
                    <a :href="fileInfo.fileExt.filePath" target="_blank">文件详情</a>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>

<script setup name="File">
    const props = defineProps({
        iconName: {
            type: String,
            required: true
        },
        fileInfo: {
            type: Object,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        svgClass: {
            type: String,
            default: 'svg-icon'
        },
        svgWidth: {
            type: String,
            default: '60px'
        },
        svgHeight: {
            type: String,
            default: '60px'
        },
        isSelected: {
            type: Boolean,
            default: false
        }
    });
    const isEditing = ref(false);
    const open = ref(false);
    const editedLabel = ref(props.label);
    const emit = defineEmits(['update:selected', 'svgClick', 'update:label']);
    const toggleSelect = () => {
        emit('update:selected', !props.isSelected);
    };
    const handleSvgClick = () => {
        emit('svgClick'); // 触发SVG点击事件
    };
    const startEditing = () => {
        isEditing.value = true;
        setTimeout(() => {
            // 在渲染后将焦点放在输入框上
            inputField.value.focus();
        }, 0);
    };
    const handleKeyDown = (event) => {
        isEditing.value = false;
    };
    const finishEditing = (event) => {
        if (editedLabel.value.trim() !== '') {
            emit('update:label', editedLabel.value);
        }
        isEditing.value = false;
    };
    const handleInfoClick = () => {
        open.value = true;
    };
    const cancelView = () => {
        open.value = false;
    }
</script>

<style scoped>
    .icon-with-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        width: 80px; /* Adjust width as needed */
    }

    .checkbox {
        position: absolute;
        top: -4px; /* Adjust as necessary */
        left: -2px; /* Adjust as necessary */
        z-index: 1; /* Ensure the checkbox is above the SVG icon */
    }

    .label {
        margin-top: 8px;
        font-size: 14px;
        color: #333;
        width: 100px;
        line-height: 1.5; /* Ensures consistent line height */
        height: 1.5em; /* Sets a fixed height */
        justify-content: center; /* Centers text horizontally */
        white-space: nowrap; /* 防止文字换行 */
        overflow: hidden;
        text-align: center; /* 初始设置为居中 */
        text-overflow: ellipsis; /* 显示省略号 */
    }

    .label:hover {
        white-space: normal; /* 让文字换行 */
        overflow: visible; /* 显示全部文字 */
    }

    .info-icon {
        position: absolute;
        top: 4px; /* 调整到 SVG 的右上角 */
        right: 4px; /* 调整到 SVG 的右上角 */
        width: 12px;
        height: 12px;
        background-color: rgba(0, 51, 102, 0.7); /* 70% 透明度 */
        color: white;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        cursor: pointer;
        z-index: 2; /* 确保在 SVG 之上 */
    }

    .info-icon:hover {
        background-color: rgba(0, 51, 102, 0.9); /* 70% 透明度 */
    }
</style>
