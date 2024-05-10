<template>
    <div class="app-container">
        <el-row style="margin-bottom: 20px">
            <el-col :span="11" style="margin-right: 10px">
                <div class="statistic-card-income">
                    <el-statistic :value="stats.in" :precision="2">
                        <template #title>
                            <div class="card-font">收入合计</div>
                        </template>
                    </el-statistic>
                </div>
            </el-col>
            <el-col :span="11">
                <div class="statistic-card-expend">
                    <el-statistic :value="stats.out" :precision="2">
                        <template #title>
                            <div class="card-font">支出合计</div>
                        </template>
                    </el-statistic>
                </div>
            </el-col>
        </el-row>

        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="用户" prop="userName">
                <el-select v-model="queryParams.userName" placeholder="请选择用户" clearable>
                    <el-option
                            v-for="dict in userSelect"
                            :key="dict.id"
                            :label="dict.name"
                            :value="dict.name"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="账户" prop="accountId">
                <el-select v-model="queryParams.accountId" placeholder="请选择扣款账户" clearable>
                    <el-option
                            v-for="dict in accountSelect"
                            :key="dict.id"
                            :label="dict.name"
                            :value="dict.id"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="分类" prop="type">
                <el-select v-model="queryParams.type" placeholder="请选择账单分类" clearable>
                    <el-option
                            v-for="dict in bill_type"
                            :key="dict.value"
                            :label="dict.label"
                            :value="parseInt(dict.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="资金流向" prop="flow">
                <el-select v-model="queryParams.flow" placeholder="请选择资金流向" clearable>
                    <el-option
                            v-for="dict in bill_flow"
                            :key="dict.value"
                            :label="dict.label"
                            :value="parseInt(dict.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="账单日期" style="width: 308px">
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
                        v-hasPermi="['family:bill:add']"
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
                        v-hasPermi="['family:bill:edit']"
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
                        v-hasPermi="['family:bill:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="info"
                        plain
                        icon="Upload"
                        @click="handleImport"
                        v-hasPermi="['family:bill:import']"
                >导入
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="warning"
                        plain
                        icon="Download"
                        @click="handleExport"
                        v-hasPermi="['family:bill:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table ref="billTableRef" v-loading="loading" :data="billList" @selection-change="handleSelectionChange"
                  :default-sort="defaultSort" @sort-change="handleSortChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="账单编号" align="center" prop="billId" :show-overflow-tooltip="true" width="100"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']"/>
            <el-table-column label="用户" align="center" prop="userName" :show-overflow-tooltip="true" width="120"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']"/>
            <el-table-column label="账单日期" align="center" prop="payTime" width="200" sortable="custom"
                             :sort-orders="['descending', 'ascending']">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.payTime, '{y}-{m}-{d}') }}</span>
                </template>
            </el-table-column>
            <el-table-column label="金额" align="center" prop="amount" :show-overflow-tooltip="true" width="100"
                             sortable="custom"
                             :sort-orders="['descending', 'ascending']"/>
            <el-table-column label="扣款账户" align="center" prop="accountName" :show-overflow-tooltip="true" width="120"/>
            <el-table-column label="分类" align="center" prop="type" width="100">
                <template #default="scope">
                    <dict-tag :options="bill_type" :value="scope.row.type"/>
                </template>
            </el-table-column>
            <el-table-column label="资金流向" align="center" prop="flow" width="80">
                <template #default="scope">
                    <dict-tag :options="bill_flow" :value="scope.row.flow"/>
                </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" width="200"/>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button link type="primary" icon="View" @click="handleView(scope.row)"
                               v-hasPermi="['family:bill:query']">详情
                    </el-button>
                    <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                               v-hasPermi="['family:bill:edit']">修改
                    </el-button>
                    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                               v-hasPermi="['family:bill:remove']">删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination
                v-show="total > 0"
                :total="total"
                v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize"
                @pagination="getList"
        />

        <!-- 添加或修改账单对话框 -->
        <el-dialog :title="title" v-model="open" width="500px" append-to-body>
            <el-form ref="billRef" :model="form" :rules="rules" label-width="110px">
                <el-form-item label="用户" prop="userName">
                    <el-select v-model="form.userName" placeholder="请选择用户" clearable>
                        <el-option
                                v-for="dict in userSelect"
                                :key="dict.id"
                                :label="dict.name"
                                :value="dict.name"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="账户" prop="accountId">
                    <el-select v-model="form.accountId" placeholder="请选择账户" clearable>
                        <el-option
                                v-for="dict in accountSelect"
                                :key="dict.id"
                                :label="dict.name"
                                :value="dict.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="账单日期" prop="payTime">
                    <el-date-picker
                            v-model="form.payTime"
                            type="date"
                            placeholder="请选择一个账单日期"
                            :shortcuts="shortcuts"
                    />
                </el-form-item>
                <el-form-item label="金额" prop="amount">
                    <el-input-number style="margin-right: 10px" v-model="form.amount" :precision="2" :step="1"
                                     :min="0"/>
                    元
                </el-form-item>
                <el-form-item label="分类" prop="type">
                    <el-select v-model="form.type" placeholder="请选择账单分类" clearable>
                        <el-option
                                v-for="dict in bill_type"
                                :key="dict.value"
                                :label="dict.label"
                                :value="parseInt(dict.value)"
                        />
                    </el-select>
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
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"/>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>


        <!-- 查看账单详情 -->
        <el-dialog :title="title" v-model="viewOpen" width="500px" append-to-body>
            <el-form :disabled="true" :model="form">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="用户" prop="userName">
                            {{form.userName?form.userName:"-"}}
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="扣款账户" prop="accountName">
                            {{form.accountName}}
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="账单日期" prop="payTime">
                            {{ parseTime(form.payTime, '{y}-{m}-{d}') }}
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="金额" prop="amount">
                            {{form.amount}} 元
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="分类" prop="type">
                            <dict-tag :options="bill_type" :value="form.type"/>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="资金流向" prop="flow">
                            <dict-tag :options="bill_flow" :value="form.flow"/>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="备注" prop="remark">
                    {{form.remark?form.remark:"-"}}
                </el-form-item>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="创建人" prop="createBy">
                            {{form.createBy?form.createBy:"-"}}
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="创建时间" prop="createTime">
                            {{form.createTime?parseTime(form.createTime):"-"}}
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="最近更新人">
                            {{form.updateBy?form.updateBy:"-"}}
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="最近更新时间">
                            {{form.updateTime?parseTime(form.updateTime):"-"}}
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancelView">取 消</el-button>
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

<script setup name="Bill">
    import {listBill, statsBill, addBill, delBill, getBill, updateBill} from "@/api/family/bill";
    import {selectUser} from "@/api/system/user";
    import {selectAccount} from "@/api/family/account";
    import {getToken} from "@/utils/auth";
    import {onMounted} from 'vue'
    import {parseTime} from "../../../utils/family";

    const {proxy} = getCurrentInstance();
    const {bill_type, bill_flow} = proxy.useDict("bill_type", "bill_flow");

    const billList = ref([]);
    const userSelect = ref([]);
    const accountSelect = ref([]);
    const now = ref(new Date());
    const dateRange = ref([
        parseTime(new Date(now.value.getFullYear(), now.value.getMonth(), 1)),
        parseTime(new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0), '{y}-{m}-{d}')
    ]);
    const open = ref(false);
    const viewOpen = ref(false);
    const loading = ref(true);
    const showSearch = ref(true);
    const ids = ref([]);
    const single = ref(true);
    const multiple = ref(true);
    const total = ref(0);
    const title = ref("");
    const defaultSort = ref({prop: "billId", order: "descending"});
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
        url: import.meta.env.VITE_APP_BASE_API + "/family/bill/importData"
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
            amount: [{required: true, message: "金额不能为空", trigger: "blur"}],
            accountId: [{required: true, message: "账户必须选择", trigger: "blur"}],
            type: [{required: true, message: "分类必须选择", trigger: "blur"}],
            payTime: [{required: true, message: "账单日期不能为空", trigger: "blur"}],
            flow: [{required: true, message: "资金流向必须选择", trigger: "blur"}],
        },
        stats: {
            in: 0,
            out: 0
        }
    });

    const {queryParams, form, rules, stats} = toRefs(data);

    /** 查询课程列表 */
    function getList() {
        loading.value = true;
        listBill(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            billList.value = response.rows;
            total.value = response.total;
            loading.value = false;
        });
    }

    function initSelect() {
        selectUser().then(response => {
            userSelect.value = response.data;
        })
        selectAccount().then(response => {
            accountSelect.value = response.data;
        })
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
            billId: undefined,
            type: undefined,
            amount: undefined,
            payTime: new Date(),
            flow: 2,
            userName: userSelect.value && userSelect.value[1] ? userSelect.value[1].name : undefined,
            accountId: accountSelect.value ? accountSelect.value[0].id : undefined,
        };
        initSelect();
        proxy.resetForm("billRef");
    }

    /** 搜索按钮操作 */
    function handleQuery() {
        queryParams.value.pageNum = 1;
        getList();
        handelStatsBill();
    }

    /** 重置按钮操作 */
    function resetQuery() {
        dateRange.value = [];
        proxy.resetForm("queryRef");
        proxy.$refs["billTableRef"].sort(defaultSort.value.prop, defaultSort.value.order);
        handleQuery();
    }

    /** 多选框选中数据 */
    function handleSelectionChange(selection) {
        ids.value = selection.map(item => item.billId);
        single.value = selection.length != 1;
        multiple.value = !selection.length;
    }

    /** 新增按钮操作 */
    function handleAdd() {
        reset();
        open.value = true;
        title.value = "添加账单";
    }

    /** 修改按钮操作 */
    function handleUpdate(row) {
        reset();
        const billId = row.billId || ids.value;
        getBill(billId).then(response => {
            form.value = response.data;
            open.value = true;
            title.value = "修改账单";
        });
    }

    /** 提交按钮 */
    function submitForm() {
        proxy.$refs["billRef"].validate(valid => {
            if (valid) {
                if (form.value.billId != undefined) {
                    updateBill(form.value).then(response => {
                        proxy.$modal.msgSuccess("修改成功");
                        open.value = false;
                        getList();
                        handelStatsBill();
                    });
                } else {
                    addBill(form.value).then(response => {
                        proxy.$modal.msgSuccess("新增成功");
                        open.value = false;
                        getList();
                        handelStatsBill();
                    });
                }
            }
        });
    }

    /** 删除按钮操作 */
    function handleDelete(row) {
        const billIds = row.billId || ids.value;
        proxy.$modal.confirm('是否确认删除？').then(function () {
            return delBill(billIds);
        }).then(() => {
            getList();
            handelStatsBill();
            proxy.$modal.msgSuccess("删除成功");
        }).catch(() => {
        });
    }

    /** 排序触发事件 */
    function handleSortChange(column, prop, order) {
        queryParams.value.orderByColumn = column.prop;
        queryParams.value.isAsc = column.order;
        getList();
    }

    /** 导入按钮操作 */
    function handleImport() {
        upload.title = "账单导入";
        upload.open = true;
    };

    /** 下载模板操作 */
    function importTemplate() {
        proxy.download("family/bill/importTemplate", {}, `bill_template_${new Date().getTime()}.xlsx`);
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
        handelStatsBill();
    };

    /** 提交上传文件 */
    function submitFileForm() {
        proxy.$refs["uploadRef"].submit();
    };

    /** 导出按钮操作 */
    function handleExport() {
        proxy.download("family/bill/export", {
            ...queryParams.value
        }, `bill_${new Date().getTime()}.xlsx`);
    }

    function handelStatsBill() {
        statsBill(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            stats.value.in = 0;
            stats.value.out = 0;
            for (let statsData in response.data) {
                const data = response.data[statsData]
                if (data.flow === 1) {
                    stats.value.in = data.amount;
                }
                if (data.flow === 2) {
                    stats.value.out = data.amount;
                }
            }
        })
    }

    /**
     * 查看账单详情
     * @param row
     */
    function handleView(row) {
        getBill(row.billId).then(response => {
            form.value = response.data;
            viewOpen.value = true;
            title.value = "查看账单";
        });
    }

    onMounted(() => {
        queryParams.value.orderByColumn = defaultSort.value.prop;
        queryParams.value.isAsc = defaultSort.value.order;
        getList();
        handelStatsBill();
        initSelect();
    });

</script>
<style scoped>
    .card-font {
        font-size: 16px;
        font-weight: bold;
    }

    .el-statistic {
        text-align: center;
    }

    .statistic-card-income {
        padding: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 8px 8px 8px rgba(0, 0, 0, 0.1);
        background-color: #FFFFFF;
    }

    .statistic-card-expend {
        padding: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 8px 8px 8px rgba(0, 0, 0, 0.1);
        background-color: #FFFFFF;
    }
</style>
