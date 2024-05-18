<template>
    <div class="icon-with-label" :style="{width: svgWidth}">
        <el-checkbox class="checkbox" :model-value="isSelected" @change="toggleSelect"/>
        <svg-icon :icon-class="iconName" :svgClass="svgClass" :style="{width: svgWidth,height: svgHeight}"
                  @click="handleSvgClick"/>
        <div class="label" @click="handleLabelClick">{{ label }}</div>
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
    const emit = defineEmits(['update:selected', 'svgClick', 'labelClick']);
    const toggleSelect = () => {
        emit('update:selected', !props.isSelected);
    };
    const handleSvgClick = () => {
        emit('svgClick'); // 触发SVG点击事件
    };

    const handleLabelClick = () => {
        emit('labelClick'); // 触发Label点击事件
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
        line-height: 1.5; /* Ensures consistent line height */
        height: 1.5em; /* Sets a fixed height */
        overflow: hidden; /* Ensures text overflow is hidden */
        text-align: center; /* Centers text horizontally */
        display: flex;
        align-items: center; /* Centers text vertically */
        justify-content: center; /* Centers text horizontally */
    }
</style>
