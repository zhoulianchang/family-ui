<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="平账情况" prop="balanced">
                <el-select v-model="queryParams.balanced" placeholder="请选择" clearable>
                    <el-option
                            v-for="dict in favor_balanced"
                            :key="dict.value"
                            :label="dict.label"
                            :value="parseInt(dict.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="资金流向" prop="flow">
                <el-select v-model="queryParams.flow" placeholder="请选择" clearable>
                    <el-option
                            v-for="dict in bill_flow"
                            :key="dict.value"
                            :label="dict.label"
                            :value="parseInt(dict.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="礼金人" prop="userNameLike">
                <el-input v-model="queryParams.userNameLike" placeholder="请输入礼金人名称"></el-input>
            </el-form-item>
            <el-form-item label="备注" prop="remarkLike">
                <el-input v-model="queryParams.remarkLike" placeholder="请输入备注信息"></el-input>
            </el-form-item>
            <el-form-item label="人情日期" style="width: 308px">
                <el-date-picker
                        v-model="dateRange"
                        value-format="YYYY-MM-DD"
                        type="daterange"
                        range-separator="-"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                ></el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                        type="primary"
                        plain
                        icon="Plus"
                        @click="handleAdd"
                        v-hasPermi="['family:favor:add']"
                >新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="success"
                        plain
                        icon="Edit"
                        :disabled="single"
                        @click="handleUpdate"
                        v-hasPermi="['family:favor:edit']"
                >修改
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="danger"
                        plain
                        icon="Delete"
                        :disabled="multiple"
                        @click="handleDelete"
                        v-hasPermi="['family:favor:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="info"
                        plain
                        icon="Upload"
                        @click="handleImport"
                        v-hasPermi="['family:favor:import']"
                >导入
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="warning"
                        plain
                        icon="Download"
                        @click="handleExport"
                        v-hasPermi="['family:favor:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="favorList" @selection-change="handleSelectionChange"
                  :default-sort="defaultSort" @sort-change="handleSortChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="人情编号" align="center" prop="favorId" :show-overflow-tooltip="true" width="100"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']"/>
            <el-table-column label="关联人情编号" align="center" prop="relationId" :show-overflow-tooltip="true" width="120">
                <template #default="scope">
                    <span>{{scope.row.relationId?scope.row.relationId:"-"}}</span>
                </template>
            </el-table-column>
            <el-table-column label="礼金人" align="center" prop="userName" :show-overflow-tooltip="true" width="120"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']"/>
            <el-table-column label="人情日期" align="center" prop="favorTime" width="200" sortable="custom"
                             :sort-orders="['descending', 'ascending']">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.favorTime, '{y}-{m}-{d}') }}</span>
                </template>
            </el-table-column>
            <el-table-column label="礼金金额" align="center" prop="amount" :show-overflow-tooltip="true" width="100"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']">
                <template #default="scope">
                    <span>{{scope.row.amount}}元</span>
                </template>
            </el-table-column>
            <el-table-column label="资金流向" align="center" prop="flow" width="80">
                <template #default="scope">
                    <dict-tag :options="bill_flow" :value="scope.row.flow"/>
                </template>
            </el-table-column>
            <el-table-column label="平账情况" align="center" prop="balanced" width="80">
                <template #default="scope">
                    <dict-tag :options="favor_balanced" :value="scope.row.balanced"/>
                </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" width="200"/>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                               v-hasPermi="['family:favor:edit']">修改
                    </el-button>
                    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                               v-hasPermi="['family:favor:remove']">删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-row>
            <el-col :span="3">
                <div style="margin-top: 20px">
                    <el-text style="font-size: 14px">
                        <el-icon>
                            <Money/>
                        </el-icon>
                        总额：{{totalAmount || 0 }}元
                    </el-text>
                </div>
            </el-col>
            <el-col :span="21">
                <pagination
                        v-show="total > 0"
                        :total="total"
                        v-model:page="queryParams.pageNum"
                        v-model:limit="queryParams.pageSize"
                        @pagination="getList"
                />
            </el-col>
        </el-row>


        <!-- 添加或修改人情账薄对话框 -->
        <el-dialog :title="title" v-model="open" width="400px" append-to-body>
            <el-form ref="favorRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="礼金人" prop="userName">
                    <el-input v-model="form.userName" placeholder="请输入礼金人" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item label="人情时间" prop="favorTime">
                    <el-date-picker
                            v-model="form.favorTime"
                            type="date"
                            placeholder="请选择一个日期"
                            :shortcuts="shortcuts"
                    />
                </el-form-item>
                <el-form-item label="礼金金额" prop="amount">
                    <el-input-number style="margin-right: 10px" v-model="form.amount" :precision="2" :step="1"
                                     :min="0"/>
                    元
                </el-form-item>
                <el-form-item label="平账情况" prop="balanced">
                    <el-radio-group v-model="form.balanced">
                        <el-radio
                                v-for="dict in favor_balanced"
                                :key="dict.value"
                                :label="parseInt(dict.value)"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="form.balanced && form.balanced === 2" label="关联礼金编号" prop="relationId">
                    <el-input v-model="form.relationId" placeholder="请输入关联礼金编号" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item label="资金流向" prop="flow">
                    <el-radio-group v-model="form.flow">
                        <el-radio
                                v-for="dict in bill_flow"
                                :key="dict.value"
                                :label="parseInt(dict.value)"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
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

        <!-- 账单导入对话框 -->
        <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
            <el-upload
                    ref="uploadRef"
                    :limit="1"
                    accept=".xlsx, .xls"
                    :headers="upload.headers"
                    :action="upload.url + '?updateSupport=' + upload.updateSupport"
                    :disabled="upload.isUploading"
                    :on-progress="handleFileUploadProgress"
                    :on-success="handleFileSuccess"
                    :auto-upload="false"
                    drag
            >
                <el-icon class="el-icon--upload">
                    <upload-filled/>
                </el-icon>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                    <div class="el-upload__tip text-center">
                        <div class="el-upload__tip">
                            <el-checkbox v-model="upload.updateSupport"/>
                            是否更新已经存在的账单数据
                        </div>
                        <span>仅允许导入xls、xlsx格式文件。</span>
                        <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;"
                                 @click="importTemplate">下载模板
                        </el-link>
                    </div>
                </template>
            </el-upload>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitFileForm">确 定</el-button>
                    <el-button @click="upload.open = false">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Favor">
    import {listFavor, addFavor, delFavor, getFavor, updateFavor, statsFavorAmount} from "@/api/family/favor";
    import {getToken} from "@/utils/auth";
    import {onMounted} from 'vue'

    const {proxy} = getCurrentInstance();
    const {favor_balanced, bill_flow} = proxy.useDict("favor_balanced", "bill_flow");

    const favorList = ref([]);
    const dateRange = ref([]);
    const open = ref(false);
    const loading = ref(true);
    const showSearch = ref(true);
    const ids = ref([]);
    const single = ref(true);
    const multiple = ref(true);
    const total = ref(0);
    const totalAmount = ref(0);
    const title = ref("");
    const defaultSort = ref({prop: "favorId", order: "descending"});
    const shortcuts = ref([
        {
            text: '今天',
            value: new Date(),
        },
        {
            text: '昨天',
            value: () => {
                const date = new Date()
                date.setTime(date.getTime() - 3600 * 1000 * 24)
                return date
            },
        }]);
    /*** 用户导入参数 */
    const upload = reactive({
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: {Authorization: "Bearer " + getToken()},
        // 上传的地址
        url: import.meta.env.VITE_APP_BASE_API + "/family/favor/importData"
    });
    const data = reactive({
        form: {},
        queryParams: {
            pageNum: 1,
            pageSize: 10,
            postCode: undefined,
            postName: undefined,
            status: undefined
        },
        rules: {
            userName: [{required: true, message: "礼金人不能为空", trigger: "blur"}],
            amount: [{required: true, message: "礼金金额不能为空", trigger: "blur"}],
            balanced: [{required: true, message: "平账情况必须选择", trigger: "blur"}],
            favorTime: [{required: true, message: "人情时间不能为空", trigger: "blur"}],
            flow: [{required: true, message: "资金流向必须选择", trigger: "blur"}],
        },
        stats: {
            in: 0,
            out: 0
        }
    });

    const {queryParams, form, rules, stats} = toRefs(data);

    /** 查询列表 */
    function getList() {
        loading.value = true;
        listFavor(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            favorList.value = response.rows;
            total.value = response.total;
            loading.value = false;
        });
        statsFavorAmount(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            totalAmount.value = response.data;
        });
    }

    /** 取消按钮 */
    function cancel() {
        open.value = false;
        reset();
    }

    function cancelView() {
        viewOpen.value = false;
        reset();
    }

    /** 表单重置 */
    function reset() {
        form.value = {
            favorId: undefined,
            relationId: undefined,
            userName: undefined,
            flow: undefined,
            favorTime: new Date(),
            flow: 1,
            amount: undefined,
            balanced: 1,
        };
        proxy.resetForm("favorRef");
    }

    /** 搜索按钮操作 */
    function handleQuery() {
        queryParams.value.pageNum = 1;
        getList();
    }

    /** 重置按钮操作 */
    function resetQuery() {
        dateRange.value = [];
        proxy.resetForm("queryRef");
        handleQuery();
    }

    /** 多选框选中数据 */
    function handleSelectionChange(selection) {
        ids.value = selection.map(item => item.favorId);
        single.value = selection.length != 1;
        multiple.value = !selection.length;
    }

    /** 新增按钮操作 */
    function handleAdd() {
        reset();
        open.value = true;
        title.value = "添加人情账薄";
    }

    /** 修改按钮操作 */
    function handleUpdate(row) {
        reset();
        const favorId = row.favorId || ids.value;
        getFavor(favorId).then(response => {
            form.value = response.data;
            open.value = true;
            title.value = "修改人情账薄";
        });
    }

    /** 提交按钮 */
    function submitForm() {
        proxy.$refs["favorRef"].validate(valid => {
            if (valid) {
                if (form.value.balanced !== 2) {
                    delete form.value.relationId;
                }
                if (form.value.favorId != undefined) {
                    updateFavor(form.value).then(response => {
                        proxy.$modal.msgSuccess("修改成功");
                        open.value = false;
                        getList();
                    });
                } else {
                    addFavor(form.value).then(response => {
                        proxy.$modal.msgSuccess("新增成功");
                        open.value = false;
                        getList();
                    });
                }
            }
        });
    }

    /** 删除按钮操作 */
    function handleDelete(row) {
        const favorIds = row.favorId || ids.value;
        proxy.$modal.confirm('是否确认删除编号为"' + favorIds + '"的数据项?').then(function () {
            return delFavor(favorIds);
        }).then(() => {
            getList();
            proxy.$modal.msgSuccess("删除成功");
        }).catch(() => {
        });
    }


    /** 导入按钮操作 */
    function handleImport() {
        upload.title = "人情账薄导入";
        upload.open = true;
    };

    /** 下载模板操作 */
    function importTemplate() {
        proxy.download("family/favor/importTemplate", {}, `favor_template_${new Date().getTime()}.xlsx`);
    };
    /**文件上传中处理 */
    const handleFileUploadProgress = (event, file, fileList) => {
        upload.isUploading = true;
    };
    /** 文件上传成功处理 */
    const handleFileSuccess = (response, file, fileList) => {
        upload.open = false;
        upload.isUploading = false;
        proxy.$refs["uploadRef"].handleRemove(file);
        proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", {dangerouslyUseHTMLString: true});
        getList();
    };

    /** 提交上传文件 */
    function submitFileForm() {
        proxy.$refs["uploadRef"].submit();
    };

    /** 导出按钮操作 */
    function handleExport() {
        proxy.download("family/favor/export", {
            ...queryParams.value
        }, `favor_${new Date().getTime()}.xlsx`);
    }

    /** 排序触发事件 */
    function handleSortChange(column, prop, order) {
        queryParams.value.orderByColumn = column.prop;
        queryParams.value.isAsc = column.order;
        getList();
    }

    onMounted(() => {
        queryParams.value.orderByColumn = defaultSort.value.prop;
        queryParams.value.isAsc = defaultSort.value.order;
        getList();
    });
</script>
<style scoped>
</style>
