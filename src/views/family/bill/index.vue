<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="消费用户" prop="userName">
                <el-select v-model="queryParams.userName" placeholder="请选择消费用户" clearable>
                    <el-option
                            v-for="dict in userSelect"
                            :key="dict.id"
                            :label="dict.name"
                            :value="dict.name"
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
            <el-form-item label="消费日期" style="width: 308px">
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

        <el-table v-loading="loading" :data="billList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="消费用户" align="center" prop="userName" :show-overflow-tooltip="true" width="120"/>
            <el-table-column label="消费日期" align="center" prop="payTime" width="200">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.payTime, '{y}-{m}-{d}') }}</span>
                </template>
            </el-table-column>
            <el-table-column label="消费金额" align="center" prop="amount" :show-overflow-tooltip="true" width="100"/>
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

        <!-- 添加或修改课程对话框 -->
        <el-dialog :title="title" v-model="open" width="500px" append-to-body>
            <el-form ref="billRef" :model="form" :rules="rules" label-width="110px">
                <el-form-item label="消费用户" prop="userName">
                    <el-select v-model="form.userName" placeholder="请选择消费用户" clearable>
                        <el-option
                                v-for="dict in userSelect"
                                :key="dict.id"
                                :label="dict.name"
                                :value="dict.name"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="消费日期" prop="payTime">
                    <el-date-picker
                            v-model="form.payTime"
                            value-format="YYYY-MM-DD"
                            type="date"
                            placeholder="请选择一个消费日期"
                            :shortcuts="shortcuts"
                    />
                </el-form-item>
                <el-form-item label="消费金额" prop="amount">
                    <el-input-number style="margin-right: 10px" v-model="form.amount" :precision="2" :step="1"
                                     :min="0.1"/>
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
    </div>
</template>

<script setup name="Post">
    import {listBill, addBill, delBill, getBill, updateBill} from "@/api/family/bill";
    import {selectUser} from "@/api/system/user";

    const {proxy} = getCurrentInstance();
    const {bill_type, bill_flow} = proxy.useDict("bill_type", "bill_flow");

    const billList = ref([]);
    const userSelect = ref([]);
    const dateRange = ref([]);
    const open = ref(false);
    const loading = ref(true);
    const showSearch = ref(true);
    const ids = ref([]);
    const single = ref(true);
    const multiple = ref(true);
    const total = ref(0);
    const title = ref("");
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
            amount: [{required: true, message: "消费金额不能为空", trigger: "blur"}],
            type: [{required: true, message: "分类必须选择", trigger: "blur"}],
            payTime: [{required: true, message: "消费日期不能为空", trigger: "blur"}],
            flow: [{required: true, message: "资金流向必须选择", trigger: "blur"}],
        }
    });

    const {queryParams, form, rules} = toRefs(data);

    /** 查询课程列表 */
    function getList() {
        loading.value = true;
        listBill(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            billList.value = response.rows;
            total.value = response.total;
            loading.value = false;
        });
    }

    function getUserSelect() {
        selectUser().then(response => {
            userSelect.value = response.data;
        })
    }

    /** 取消按钮 */
    function cancel() {
        open.value = false;
        reset();
    }

    /** 表单重置 */
    function reset() {
        form.value = {
            billId: undefined,
            type: 1,
            amount: undefined,
            payTime: undefined,
            flow: 2,
            userName: undefined,
        };
        getUserSelect();
        proxy.resetForm("billRef");
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
                    });
                } else {
                    addBill(form.value).then(response => {
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
        const billIds = row.billId || ids.value;
        proxy.$modal.confirm('是否确认删除？').then(function () {
            return delBill(billIds);
        }).then(() => {
            getList();
            proxy.$modal.msgSuccess("删除成功");
        }).catch(() => {
        });
    }

    /** 导出按钮操作 */
    function handleExport() {
        proxy.download("family/bill/export", {
            ...queryParams.value
        }, `bill_${new Date().getTime()}.xlsx`);
    }

    getList();
    getUserSelect();
</script>
