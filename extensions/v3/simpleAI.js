import {segment} from "oicq";
import fetch from "node-fetch";
import lodash from "lodash";

/*
*【新增功能】
*❶AI列表
*❷AI设置使用
*/

//Redis数据库
const redisKeys = {
	autoTalk: "AI:autoTalk",
	useApi: "AI:useApi"
};

//默认使用的Api
const defaultApi = "OwnThink";

//Api地址、规则
let postApi = {
	"QingYunKe": "http://api.qingyunke.com/api.php?key=free&appid=0&msg=#msg#",
	"OwnThink": "https://api.ownthink.com/bot?spoken=#msg#"
};
//对应机器人名字
let BotNameList = {
	"QingYunKe": "菲菲",
	"OwnThink": "小思"
};
//消息数据链
let gainTrain = {
	"QingYunKe": "content",
	"OwnThink": ["data", "info", "text"]
};

//消息和谐转换，自行添加
let bad2good = {
	"傻逼": ["天使", "小可爱"],
	"去死": ["去玩", "去打电动"],
	"测试你妹": "测试"
};

//机器人名字，推荐不改(机器人如果换名字了需要重启来刷新)
const BotName = global.Bot.nickname;

//屏蔽QQ，数组注意逗号
let banQQ = [
	//Q群管家
	2854196310
];

//转换和谐词，降低被举报的概率
String.prototype.beGood = function(){
	let output = this;
	for(let item in bad2good){
		let get = "";
		//如果是数组则随机获取
		if(bad2good[item] instanceof Array) get = bad2good[item][lodash.random(item.length - 1)];
		else get = bad2good[item];
		output = output.replace(eval(`/${item}/g`), get);
	}
	//输出转化结果
	return output;
};

export class simpleAI extends plugin{
	constructor(){
		super({
			name: "simpleAI",
			dsc: "调用AI接口回答消息",
			event: "message",
			//优先级(数值越小优先度越高)
			priority: 150000,
			//消息匹配规则
			rule: [
				{
					reg: "^#*(A|a)(I|i)列表$",
					fnc: "aiList",
					permission: "master"
				},
				{
					reg: "^#*(A|a)(I|i)(设置)*使用(.*)$",
					fnc: "aiSet",
					permission: "master"
				},
				{
					reg: "",
					fnc: "aiDialog",
					log: false
				}
			]
		})
	};
	//添加异步方法: aiDialog
	async aiDialog(e){
		//是否为文本消息
		if(!e.msg) return false;
		//是否带#
		if(/^#/.test(e.msg)) return false;
		//屏蔽QQ
		if(banQQ.includes(e.user_id)) return false;
		//群聊是否需要消息中带有机器人昵称或者@机器人才触发
		if(e.isGroup) if(!e.msg.includes(BotName) && !e.atBot) return false;
		//选择API
		let redisApi = await redis.get(redisKeys.useApi);
		let chooseApi = redisApi || defaultApi;
		//获取消息
		let replyMsg = await apiMsg(chooseApi, e.msg);
		//储存redis
		redis.set(redisKeys.useApi, chooseApi);
		//是否有消息输出
		if(replyMsg && replyMsg.length > 0){
			//输出日志
			logger.mark(`[${chooseApi}] ${e.msg}`);
			//发送消息
			this.reply(replyMsg, e.isGroup);
			//阻止继续匹配其他命令
			return true;
		}else if(!replyMsg){
			//报错
			if(this.e.isMaster) this.reply("返回消息失败！");
			//
			return true;
		}
		//返回false继续匹配其他命令
		return false;
	};
	//
	async aiSet(e){
		//
		let choiceApi = e.msg.replace(/#*(A|a)(I|i)(设置)*使用/, ""), setApi;
		//
		if(choiceApi.length === 0){
			//
			this.reply("请发送需要使用的AI");
			//没有上下文添加
			return true;
		}
		//
		setApi = Object.keys(postApi)[parseInt(choiceApi) - 1] || choiceApi;
		//
		if(!setApi || !Object.keys(postApi).includes(setApi)){
			//
			this.reply(`设置失败，没有找到AI: ${setApi}`);
			//
			return true;
		}
		//
		redis.set(redisKeys.useApi, setApi);
		//
		this.reply(`AI设置${setApi}成功`);
		//
		return true;
	};
	//
	async aiList(e){
		//
		let replyMsg = [];
		//
		for(let i = 0; i < Object.keys(postApi).length; i++) replyMsg.push(`${i + 1}、【${Object.keys(postApi)[i]}】\n`);
		//
		if(replyMsg.length <= 0) this.reply("没有可使用的AI");
		else{
			//
			let redisApi = await redis.get(redisKeys.useApi);
			let chooseApi = redisApi || defaultApi;
			//
			replyMsg.push(`当前使用: ${chooseApi}`);
			//
			this.reply(replyMsg);
		}
		//
		return true;
	};
	//Created by Yoolan.
};

//api管理
async function apiMsg(api, msg){
	//
	let message;
	//
	if(!Object.keys(postApi).includes(api)) return false;
	//把机器人名字替换为AI名字
	for(let item in BotNameList) msg = msg.trim().replace(eval(`/${BotName}/g`), BotNameList[item]).replace(/[\n|\r]/g, "，");
	//得到api
	let postUrl = postApi[api].replace(/#msg#/g, msg);
	//抓取消息
	let response = await fetch(postUrl);
	let replyData = await response.json();
	//获取Object
	if(gainTrain[api] instanceof Array){
		//
		let replyData2 = replyData;
		//
		for(let item of gainTrain[api]) replyData2 = replyData2[item];
		//
		if(replyData2) message = replyData2;
	}else{
		message = replyData[gainTrain[api]];
	}
	//
	for(let item in BotNameList) message = message.replace(eval(`/${BotNameList[item]}/g`), BotName);
	//消息处理
	message = message
	.replace(/\{br\}/g, "\n")
	.replace(/&nbsp;/g, " ")
	.replace(/(\{face:[\d]+\})/g, "$1\\n")
	//消息和谐处理
	.beGood()
	.trim();
	//
	let tempMsg = [];
	//表情处理(有图片有的话可以用同样的方法处理)
	if(message.includes("\\n") && message.includes("face")){
		for(let item of message.split("\\n")){
			if(/\{face:[\d]+\}/.test(item)) item = segment.face(item.replace(/\{face:([\d]+)\}/g, "$1"));
			tempMsg.push(item);
		}
	}
	//是否有表情
	if(tempMsg && tempMsg.length > 0) message = tempMsg;
	//返回消息
	return message || false;
};