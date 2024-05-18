<template>
    <div class="icon-with-label" :style="{width: svgWidth}">
        <el-checkbox class="checkbox" :model-value="isSelected" @change="toggleSelect"/>
        <svg-icon :icon-class="iconName" :svgClass="svgClass" :style="{width: svgWidth,height: svgHeight}"
                  @click="handleSvgClick"/>
        <!--        <div class="label" @click="handleLabelClick">{{ label }}</div>-->
        <div v-if="!isEditing" class="label" @click="startEditing">{{ label }}</div>
        <el-input class="label" v-else ref="inputField" type="text" v-model="editedLabel"
                  @keydown.enter="handleKeyDown" @blur="finishEditing"/>
    </div>
</template>

<script setup name="File">
    const props = defineProps({
        iconName: {
            type: String,
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
    }
    const finishEditing = (event) => {
        if (editedLabel.value.trim() !== '') {
            emit('update:label', editedLabel.value);
        }
        isEditing.value = false;
    };
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
</style>
