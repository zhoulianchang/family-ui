<template>
	<div class="app-container">
		<div>
			{{chatMessage}}
		</div>
		<el-input v-model="chatBody.content" placeholder="输入你的消息..." @keyup.enter="sendMessage"
			class="chat-input"></el-input>
		<el-button type="primary" @click="sendMessage">发送</el-button>
	</div>
</template>

<script setup>
	import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
	import {getToken} from '@/utils/auth'
	import {onBeforeUnmount} from 'vue';
	const {proxy} = getCurrentInstance();
	const abortController = ref(null);
	const data = reactive({
	    chatBody: {
			model:"gpt-3.5-turbo",
			content:""
		},
		chatMessage: ""
	});
	const {chatBody,chatMessage} = toRefs(data);
	function sendMessage(){
		const ctrlAbout = new AbortController();
		fetchEventSource(import.meta.env.VITE_APP_BASE_API+'/family/ai/chat', {
			method: 'POST',
			headers: {
			  'Authorization': 'Bearer ' + getToken(),
			  'Content-Type': 'application/json', // 文本返回格式
			},
			body: JSON.stringify(chatBody.value),
			signal: ctrlAbout.signal,
			openWhenHidden: true, // 在浏览器标签页隐藏时保持与服务器的EventSource连接
			onopen(res){
				if(res.ok){
					return;
				} else {
					throw new Error("连接失败");
				}
			},
			onmessage(msg) {
			  // 操作流式数据
			  // 处理 msg.data 是否是有效的 JSON
			  let jsonObject;
			  try {
			    // 尝试解析 JSON 字符串
			    jsonObject = JSON.parse(msg.data);
			    // 如果解析成功且是 JSON 格式，执行以下操作
			    if (msg.event === 'DONE') {
			      proxy.$modal.msgSuccess("聊天结束");
			    } else {
					if (jsonObject.content !== undefined) {
						chatMessage.value = chatMessage.value + jsonObject.content;  // 只有在 content 不为 undefined 时才进行拼接
					}
			    }
			  } catch (e) {
			    // 如果 JSON 解析失败，msg.data 不是有效的 JSON
			    console.warn("收到非 JSON 数据:", msg.data);
			  }
			},
			onclose(res) {
			  // 关闭流
			  console.log("close:"+res)
			  ctrlAbout?.abort()
			},
			onerror(error) {
			  // 返回流报错
			  console.log("error:"+error)
			  proxy.$modal.msgError("机器人聊天连接失败，请稍后重试");
			  throw error;
			}
		})
	}
</script>

<style>
	.chat-window {
		height: 300px;
		overflow-y: auto;
		margin-bottom: 10px;
	}

	.chat-messages {
		display: flex;
		flex-direction: column;
	}

	.chat-message {
		margin: 5px 0;
	}

	.chat-input {
		width: 80%;
		margin-right: 10px;
	}
</style>