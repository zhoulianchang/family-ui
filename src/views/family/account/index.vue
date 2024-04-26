<template>
    <div class="app-container">
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                        type="primary"
                        plain
                        icon="Plus"
                        @click="handleAdd"
                        v-hasPermi="['family:account:add']"
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
                        v-hasPermi="['family:account:edit']"
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
                        v-hasPermi="['family:account:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                        type="warn"
                        plain
                        icon="Refresh"
                        @click="handleReset"
                        v-hasPermi="['family:account:edit']"
                >重置账户余额
                </el-button>
            </el-col>
            <right-toolbar @queryTable="getList" :search="false"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="accountList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="账户编号" align="center" prop="accountId" :show-overflow-tooltip="true" width="80"/>
            <el-table-column label="账户别名" align="center" prop="name" :show-overflow-tooltip="true" width="120"/>
            <el-table-column label="初始金额" align="center" prop="initAmount" :show-overflow-tooltip="true" width="100">
                <template #default="scope">
                    <span>{{scope.row.initAmount}}元</span>
                </template>
            </el-table-column>
            <el-table-column label="账户余额" align="center" prop="balance" :show-overflow-tooltip="true" width="100">
                <template #default="scope">
                    <span>{{scope.row.balance}}元</span>
                </template>
            </el-table-column>
            <el-table-column label="账户号码" align="center" prop="cardNo" :show-overflow-tooltip="true" width="200"/>
            <el-table-column label="账户类型" align="center" prop="type" width="80">
                <template #default="scope">
                    <dict-tag :options="account_type" :value="scope.row.type"/>
                </template>
            </el-table-column>
            <el-table-column label="所属用户" align="center" prop="userId" width="80">
                <template #default="scope">
                    {{ userSelectMap[scope.row.userId] }}
                </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" width="200"/>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                               v-hasPermi="['family:account:edit']">修改
                    </el-button>
                    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                               v-hasPermi="['family:account:remove']">删除
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

        <!-- 添加或修改账户对话框 -->
        <el-dialog :title="title" v-model="open" width="400px" append-to-body>
            <el-form ref="accountRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="账户类型" prop="type">
                    <el-radio-group v-model="form.type">
                        <el-radio
                                v-for="dict in account_type"
                                :key="dict.value"
                                :label="parseInt(dict.value)"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="账户别名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入账户别名" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item label="账户号码" prop="cardNo">
                    <el-input v-model="form.cardNo" placeholder="请输入账户号码" style="width: 220px"></el-input>
                </el-form-item>
                <el-form-item label="所属用户" prop="userId">
                    <el-select v-model="form.userId" placeholder="请选择所属用户" clearable>
                        <el-option
                                v-for="dict in userSelect"
                                :key="dict.id"
                                :label="dict.name"
                                :value="dict.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="初始金额" prop="initAmount">
                    <el-input-number style="margin-right: 10px" v-model="form.initAmount" :precision="2" :step="1"
                                     :min="0"/>
                    元
                </el-form-item>
                <el-form-item label="账户余额" prop="balance">
                    <el-input-number style="margin-right: 10px" v-model="form.balance" :precision="2" :step="1"
                                     :min="0"/>
                    元
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

<script setup name="Account">
    import {listAccount, addAccount, delAccount, getAccount, updateAccount, resetBalance} from "@/api/family/account";
    import {selectUser} from "@/api/system/user";
    import {onMounted} from 'vue'

    const {proxy} = getCurrentInstance();
    const {account_type} = proxy.useDict("account_type");

    const accountList = ref([]);
    const userSelect = ref([]);
    const userSelectMap = ref(undefined);
    const open = ref(false);
    const loading = ref(true);
    const ids = ref([]);
    const single = ref(true);
    const multiple = ref(true);
    const total = ref(0);
    const title = ref("");
    const data = reactive({
        form: {},
        queryParams: {
            pageNum: 1,
            pageSize: 10,
        },
        rules: {
            type: [{required: true, message: "账户类型不能为空", trigger: "blur"}],
            userId: [{required: true, message: "所属用户必须选择", trigger: "blur"}],
        }
    });

    const {form, queryParams, rules} = toRefs(data);

    /** 查询列表 */
    function getList() {
        loading.value = true;
        listAccount(queryParams.value).then(response => {
            accountList.value = response.rows;
            total.value = response.total;
            loading.value = false;
        });
    }

    /** 取消按钮 */
    function cancel() {
        open.value = false;
        reset();
    }

    /** 表单重置 */
    function reset() {
        form.value = {
            accountId: undefined,
            type: 1,
            userId: undefined,
            cardNo: undefined,
            balance: undefined,
            remark: undefined,
        };
        proxy.resetForm("accountRef");
    }

    /** 多选框选中数据 */
    function handleSelectionChange(selection) {
        ids.value = selection.map(item => item.accountId);
        single.value = selection.length != 1;
        multiple.value = !selection.length;
    }

    /** 新增按钮操作 */
    function handleAdd() {
        reset();
        open.value = true;
        title.value = "添加账户";
    }

    /** 修改按钮操作 */
    function handleUpdate(row) {
        reset();
        const accountId = row.accountId || ids.value;
        getAccount(accountId).then(response => {
            form.value = response.data;
            open.value = true;
            title.value = "修改账户";
        });
    }

    /** 提交按钮 */
    function submitForm() {
        proxy.$refs["accountRef"].validate(valid => {
            if (valid) {
                if (form.value.accountId != undefined) {
                    updateAccount(form.value).then(response => {
                        proxy.$modal.msgSuccess("修改成功");
                        open.value = false;
                        getList();
                    });
                } else {
                    addAccount(form.value).then(response => {
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
        const accountIds = row.accountId || ids.value;
        proxy.$modal.confirm('是否确认删除编号为"' + accountIds + '"的数据项?').then(function () {
            return delAccount(accountIds);
        }).then(() => {
            getList();
            proxy.$modal.msgSuccess("删除成功");
        }).catch(() => {
        });
    }

    function handleReset() {
        loading.value = true;
        resetBalance().then(response => {
            proxy.$modal.msgSuccess("初始化成功");
            getList();
        })
    }

    onMounted(() => {
        getUserSelect();
    });

    function getUserSelect() {
        selectUser().then(response => {
            userSelect.value = response.data;
            userSelectMap.value = userSelect.value.reduce((map, user) => {
                map[user.id] = user.name;
                return map;
            }, {});
            getList();
        })
    }
</script>
<style scoped>
</style>
