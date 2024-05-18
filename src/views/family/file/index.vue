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
                     v-for="file in fileList"
                     :key="file.fileId"
                     :isSelected="selectedFiles.includes(file.fileId)"
                     @update:selected="toggleFileSelection(file.fileId)"
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
        <!-- 添加或修改人情账薄对话框 -->
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
                <el-form-item v-if="form.type === 'DIR'" label="文件夹名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入文件夹名称" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item v-if="form.type === 'FILE'" prop="realFile">
                    <el-upload :before-upload="beforeUpload" :on-change="handleChange">
                        <el-button type="primary">点击选择文件</el-button>
                    </el-upload>
                    <div style="width: 100%"><span>{{uploadFileName?'已选择文件：'+uploadFileName:''}}</span></div>
                </el-form-item>

                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" style="width: 220px"/>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
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
    const title = ref("");
    const uploadFileName = ref("");
    const fileOptions = ref(undefined);

    const data = reactive({
        // 查询到的文件数据
        fileList: [],
        // 表单内容用于修改新增数据
        form: {},
        // 表单内容规则
        rules: {
            realFile: [{required: true, message: "文件必须选择", trigger: "blur"}],
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

        const fileExtType = file.fileExt?.fileType;
        return extensionIconMap[fileExtType] || "file_unknown";
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
            // 预览文件
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
        reset();
    }


    /** 提交按钮 */
    function submitForm() {
        proxy.$refs["fileRef"].validate(valid => {
            if (valid) {
                if (form.value.fileId != undefined) {
                    updateFile(form.value).then(response => {
                        proxy.$modal.msgSuccess("修改成功");
                        open.value = false;
                        getList();
                    });
                } else {
                    addFile(form.value).then(response => {
                        proxy.$modal.msgSuccess("新增成功");
                        open.value = false;
                        getList();
                    });
                }
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
        uploadFileName.value = file.name;
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
