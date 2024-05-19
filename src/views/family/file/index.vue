<template>
    <div class="app-container">
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                        type="success"
                        plain
                        icon="Select"
                        :disabled="fileList.length === 0"
                        @click="handleSelectAll"
                >全选
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="primary"
                        plain
                        icon="Plus"
                        @click="handleAdd"
                        v-hasPermi="['family:file:add']"
                >新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="danger"
                        plain
                        icon="Delete"
                        :disabled="selectedFiles.length===0"
                        @click="handleDelete"
                        v-hasPermi="['family:file:remove']"
                >删除
                </el-button>
            </el-col>
            <right-toolbar @queryTable="getList" :search="false"></right-toolbar>
        </el-row>
        <el-breadcrumb separator=">">
            <el-breadcrumb-item @click="handleBreadClick(breadCrumb.fileId)" v-for="breadCrumb in breadCrumbs"
                                :key="breadCrumb.fileId" class="breadcrumb-link">{{breadCrumb.name}}
            </el-breadcrumb-item>
        </el-breadcrumb>
        <div class="file-table" v-loading="loading">
            <div v-if="fileList.length === 0" class="no-data">
                空目录
            </div>
            <my-file :iconName="getIconName(file)"
                     :label="file.name"
                     :fileInfo="file"
                     v-for="file in fileList"
                     :key="file.fileId"
                     :isSelected="selectedFiles.includes(file.fileId)"
                     @update:selected="toggleFileSelection(file.fileId)"
                     @update:label="(newLabel) => { fileNameUpdate(newLabel, file) }"
                     @svgClick="handleSvgClick(file)"
                     style="margin-right: 40px"/>
        </div>
        <pagination
                v-show="total > 0"
                :total="total"
                v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize"
                @pagination="getList"
        />
        <!-- 添加文件对话框 -->
        <el-dialog :title="title" v-model="open" width="400px" append-to-body>
            <el-form ref="fileRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="文件类型" prop="fileType">
                    <el-radio-group v-model="form.type">
                        <el-radio
                                v-for="dict in file_type"
                                :key="dict.value"
                                :label="dict.value"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="上级目录" prop="parentId">
                    <el-tree-select
                            v-model="form.parentId"
                            :data="fileOptions"
                            :props="{ value: 'id', label: 'label', children: 'children' }"
                            value-key="id"
                            clearable
                            placeholder="请选择上级目录"
                            check-strictly
                    />
                </el-form-item>
                <el-form-item label="文件名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入文件名称" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item v-if="form.type === 'FILE'" prop="realFile">
                    <el-upload :before-upload="beforeUpload" :on-change="handleChange">
                        <el-button type="primary">点击选择文件</el-button>
                    </el-upload>
                    <div style="width: 100%"><span>{{selectFileName?'已选择文件：'+selectFileName:''}}</span></div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="title" v-model="previewOpen" width="50%" append-to-body>
            <div style="display: grid; place-items: center;">
                <ImagePreview width="90%" height="500px" v-if="previewFileType === 'image'"
                              :src="previewFileUrl"></ImagePreview>
                <video v-if="previewFileType === 'video'" style="width:90%;height:500px" controls>
                    <source :src="previewFileUrl" type="video/mp4">
                </video>
                <iframe v-if="previewFileType === 'iframe'" style="width:90%;height:700px"
                        :src="previewFileUrl">
                </iframe>
            </div>
            <el-progress v-if="previewFileType === undefined"
                         :percentage="downProgress"
                         :color="downProgressColors"></el-progress>
        </el-dialog>
    </div>
</template>

<script setup name="File">
    import {listFile, addFile, updateFile, delFile, treeFile} from "@/api/family/file";

    const {proxy} = getCurrentInstance();
    const {file_type, file_save_place} = proxy.useDict("file_type", "file_save_place");
    const loading = ref(true);
    const selectedFiles = ref([]);
    const breadCrumbs = ref([{fileId: 0, name: '根路径', ancestors: undefined}]);
    // 记录当前面包屑的fileId
    const curBreadId = ref(undefined);
    const selectAll = ref(false);
    const open = ref(false);
    const previewOpen = ref(false);
    const previewFileType = ref("");
    const previewFileUrl = ref("");
    const downProgress = ref(undefined);
    const downFileName = ref("");
    const downProgressColors = ref([
        {color: '#f56c6c', percentage: 20},
        {color: '#e6a23c', percentage: 40},
        {color: '#5cb87a', percentage: 60},
        {color: '#6f7ad3', percentage: 80},
        {color: '#1989fa', percentage: 100},
    ])
    const title = ref("");
    const selectFileName = ref("");
    const fileOptions = ref(undefined);

    const data = reactive({
        // 查询到的文件数据
        fileList: [],
        // 表单内容用于修改新增数据
        form: {},
        // 表单内容规则
        rules: {
            realFile: [{required: true, message: "文件必须选择", trigger: "blur"}],
            name: [{required: true, message: "文件名称不能为空", trigger: "blur"}],
        },
        // 查询条件 日期和条件
        dateRange: [],
        queryParams: {
            parentId: 0,
            pageNum: 1,
            pageSize: 50
        },
        // 分页查询到的总数
        total: 0
    });

    const {fileList, queryParams, rules, form, dateRange, total} = toRefs(data);

    /** 查询列表 */
    function getList() {
        selectedFiles.value = [];
        loading.value = true;
        listFile(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            fileList.value = response.rows;
            total.value = response.total;
            loading.value = false;
        });
    }

    /**
     * 根据文件类型获取图标名称
     * @param file
     * @returns {string|*|string}
     */
    function getIconName(file) {
        if (file.type === "DIR") {
            return "file_dir";
        }

        const extensionIconMap = {
            png: "file_image",
            jpg: "file_image",
            jpeg: "file_image",
            word: "file_word",
            pdf: "file_pdf",
            xlsx: "file_excel",
            xls: "file_excel",
            zip: "file_pkg",
            txt: "file_txt",
            exe: "file_exe",
            sql: "file_db",
            mp4: "file_video"
        };

        const fileSuffix = file.fileExt?.fileType;
        return extensionIconMap[fileSuffix] || "file_unknown";
    }

    /**
     * 全选按钮点击事件
     */
    function handleSelectAll() {
        selectAll.value = !selectAll.value;
        if (selectAll.value) {
            selectedFiles.value = fileList.value.map(file => file.fileId);
        } else {
            selectedFiles.value = [];
        }
    }

    /**
     * 单个文件选择框事件
     * @param fileId
     */
    function toggleFileSelection(fileId) {
        const index = selectedFiles.value.indexOf(fileId);
        if (index === -1) {
            selectedFiles.value.push(fileId);
        } else {
            selectedFiles.value.splice(index, 1);
        }
    }

    /**
     * 文件名称修改
     *
     */
    function fileNameUpdate(newDirName, file) {
        if (file.type === 'DIR') {
            file.name = newDirName;
            updateFile(file).then(response => {
                proxy.$modal.msgSuccess("修改成功");
                getList();
            });
        } else {
            proxy.$modal.msgError("仅支持修改文件夹名称");
        }
    }

    function handleSvgClick(file) {
        if (file.type === 'DIR') {
            //    如果是文件夹类型则请求接口刷新
            queryParams.value.parentId = file.fileId;
            breadCrumbs.value.push({
                name: file.name,
                fileId: file.fileId,
                parentId: file.parentId,
                ancestors: file.ancestors
            });
            curBreadId.value = file.fileId === 0 ? undefined : file.fileId;
            getList();
        } else {
            previewFileUrl.value = file.fileExt.filePath;
            switch (file.fileExt?.fileType) {
                case 'png':
                case 'jpg':
                case 'jpeg':
                    previewFileType.value = 'image';
                    break;
                case 'mp4':
                    previewFileType.value = 'video';
                    break;
                case 'pdf':
                    previewFileType.value = 'iframe';
                    break;
                default:
                    previewFileType.value = undefined;
                    break;
            }
            if (previewFileType.value) {
                // 预览文件
                previewOpen.value = true;
                title.value = '文件预览';
            } else {
                previewOpen.value = true;
                title.value = '文件下载框';
                downFileName.value = file.name;
                // 如果文件格式不支持那么直接下载文件
                const xhr = new XMLHttpRequest();
                xhr.open('GET', previewFileUrl.value, true);
                xhr.responseType = 'blob'; // 将响应类型设置为 Blob 对象，以便处理二进制数据
                xhr.onprogress = updateProgress;
                xhr.onload = handleLoad;
                xhr.onerror = function() {
                    proxy.$modal.msgError("文件下载失败");
                };
                xhr.send();
            }
        }
    }

    function updateProgress(event) {
        if (event.lengthComputable) {
            const percentage = (event.loaded / event.total) * 100;
            downProgress.value = Math.round(percentage);
        }
    }

    function handleLoad(event) {
        const xhr = event.target;
        if (xhr.status === 200) {
            const blob = xhr.response;
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = downFileName.value;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            proxy.$modal.msgError("文件下载失败");
        }
    }

    function handleBreadClick(fileId) {
        // 获取目标对象的 ancestors
        const target = breadCrumbs.value.find(item => item.fileId === fileId);
        if (target) {
            const ancestors = target.ancestors ? target.ancestors.split(',').map(Number) : [];
            ancestors.push(fileId); // 包括自身的 fileId
            // 过滤 breadCrumbs 数组，只保留符合条件的对象
            breadCrumbs.value = breadCrumbs.value.filter(item => ancestors.includes(item.fileId));
        }
        curBreadId.value = fileId === 0 ? undefined : fileId;
        queryParams.value.parentId = fileId;
        getList();
    }

    /** 表单重置 */
    function reset() {
        form.value = {
            type: 'DIR',
            parentId: curBreadId.value
        };
        proxy.resetForm("fileRef");
        getFileTree();
    }

    /** 新增按钮操作 */
    function handleAdd() {
        reset();
        open.value = true;
        title.value = "新增文件夹/文件";
    }

    function handleDelete() {
        proxy.$modal.confirm('是否确认删除选中的数据项?').then(function () {
            return delFile(selectedFiles.value);
        }).then(() => {
            getList();
            proxy.$modal.msgSuccess("删除成功");
        }).catch(() => {
        });
    }

    /** 取消弹窗按钮 */
    function cancel() {
        open.value = false;
        previewOpen.value = false;
        reset();
    }

    /** 取消弹窗按钮 */
    function cancelView() {
        previewOpen.value = false;
    }


    /** 提交按钮 */
    function submitForm() {
        proxy.$refs["fileRef"].validate(valid => {
            if (valid) {
                addFile(form.value).then(response => {
                    proxy.$modal.msgSuccess("新增成功");
                    open.value = false;
                    getList();
                });
            }
        });
    }

    /** 查询文件下拉树结构 */
    function getFileTree() {
        treeFile().then(response => {
            fileOptions.value = response.data;
        });
    };

    function beforeUpload(file) {
        form.value.realFile = file;
        return false; // 阻止文件自动上传
    }

    function handleChange(file, fileList) {
        form.value.name = file.name;
        selectFileName.value = file.name;
    };
    getList();
</script>

<style scoped>
    .file-table {
        display: flex;
        flex-wrap: wrap;
        gap: 20px; /* Adds space between items */
    }

    .no-data {
        width: 100%;
        text-align: center;
        color: #999;
        margin-top: 20px;
    }

    .el-breadcrumb {
        margin-top: 20px;
        margin-bottom: 20px;
    }

    .breadcrumb-link {
        cursor: pointer;
        color: #409EFF;
    }

    .breadcrumb-link:hover {
        text-decoration: underline;
    }
</style>
