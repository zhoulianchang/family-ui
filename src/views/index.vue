<template>
    <div class="app-container">
        <el-row style="margin-bottom: 20px">
            <el-col :span="11" style="margin-right: 10px">
                <div class="statistic-card-balance">
                    <el-statistic :value="balance" precision="2">
                        <template #title>
                            <div class="card-font">账户余额</div>
                        </template>
                    </el-statistic>
                </div>
            </el-col>
        </el-row>
        <el-form :model="queryParams" ref="queryRef" :inline="true">
            <el-form-item label="日期" style="width: 308px">
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
        <el-row>
            <el-col :span="24">
                <div ref="outPieChart" style="height: 400px;"></div>
            </el-col>
            <el-col :span="24">
                <div ref="outBarChart" style="height: 400px;"></div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="Index">
    import {statsBillByType, getAccountBalance} from "@/api/index";
    import * as echarts from 'echarts';
    import {onMounted, ref} from 'vue';

    const {proxy} = getCurrentInstance();
    const dateRange = ref([]);
    const balance = ref(undefined);
    const outBarChart = ref(null);
    const outPieChart = ref(null);
    const data = reactive({
        queryParams: {},
        outPieOption: {
            title: {
                text: '分类支出占比',
                subtext: '',
                x: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
            },
            series: [
                {
                    name: '分类',
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '60%'],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        },
        outBarOption: {
            title: {
                text: '分类支出排行榜',
                x: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: {
                type: 'category',
            },
            yAxis: {
                axisLabel: {
                    formatter: '{value} 元' // 在这里添加单位，例如：元
                }
            },
            series: [
                {
                    type: 'bar',
                    itemStyle: {
                        color: function (params) {
                            // 返回不同的颜色
                            const colors = ['#ee6666', '#91cc75', '#fac858', '#5470c6', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
                            return colors[params.dataIndex % colors.length];
                        }
                    },
                    label: {
                        show: true,
                        position: 'top', // 标签显示在柱子的顶部
                        color: 'grey', // 标签颜色
                        formatter: '{c}元', // 标签显示的格式，{c} 表示数据值
                    }
                }
            ]
        }
    });
    const {queryParams, outPieOption, outBarOption} = toRefs(data);
    onMounted(() => {
        handleInitData();
    });

    function handleInitData() {
        statsBillByType(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
            outPieOption.value.legend.data = response.data.out.map(item => item.name);
            outPieOption.value.series[0].data = response.data.out;
            const outBarData = response.data.out.sort((a, b) => b.value - a.value);
            outBarOption.value.xAxis.data = outBarData.map(item => item.name);
            outBarOption.value.series[0].data = outBarData.map(item => item.value);
            echarts.init(outPieChart.value).setOption(outPieOption.value);
            echarts.init(outBarChart.value).setOption(outBarOption.value);
        });
        getAccountBalance().then(response => {
            balance.value = response.data;
        });
    }

    /** 搜索按钮操作 */
    function handleQuery() {
        handleInitData();
    }

    /** 重置按钮操作 */
    function resetQuery() {
        dateRange.value = [];
        proxy.resetForm("queryRef");
        handleQuery();
    }
</script>

<style scoped lang="scss">
    .card-font {
        font-size: 16px;
        font-weight: bold;
    }

    .el-statistic {
        text-align: center;
    }

    .statistic-card-balance {
        padding: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 8px 8px 8px rgba(0, 0, 0, 0.1);
        background-color: #FFFFFF;
    }
</style>

