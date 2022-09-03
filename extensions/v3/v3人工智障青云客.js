import {segment} from "oicq";
import fetch from "node-fetch";
import lodash from "lodash";

//消息和谐转换，自行添加
let bad2good = {
	"傻逼": ["天使", "大可爱"],
	"去死": ["去玩", "去打电动"],
	"测试你妹": "测试"
};

//机器人名字，推荐不改(机器人如果换名字了需要重启来刷新)
const BotName = global.Bot.nickname;

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

export class stupidAI extends plugin{
	constructor(){
		super({
			name: "青云客",
			dsc: "调用青云客免费接口回答消息",
			event: "message",
			//优先级(数值越小优先度越高)
			priority: 800000,
			//消息匹配规则
			rule: [
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
		//群聊是否需要消息中带有机器人昵称或者@机器人才触发
		if(e.isGroup) if(!e.msg.includes(BotName) && !e.atBot) return false;
		//接收时将机器人名字替换为青云客AI的菲菲
		let message = e.msg.trim().replace(eval(`/${BotName}/g`), "菲菲").replace(/[\n|\r]/g, "，");
		let postUrl = `http://api.qingyunke.com/api.php?key=free&appid=0&msg=${message}`;
		//抓取消息并转换为Json
		let response = await fetch(postUrl);
		let replyData = await response.json();
		//处理消息
		let tempReplyMsg = [];
		let replyMsg = replyData.content.replace(/菲菲/g, BotName)
			.replace(/\{br\}/g, "\n")
			.replace(/&nbsp;/g, " ")
			.replace(/\{face:([\d]+)\}/g, "#face$1#[div]")
			//消息和谐处理
			.beGood()
			.trim();
		//表情处理
		if(replyMsg.includes("[div]")){
			for(let item of replyMsg.split("[div]")){
				if(/#face[\d]+#/.test(item)) item = segment.face(item.replace(/#face([\d]+)#/, "$1"));
				tempReplyMsg.push(item);
			}
		}
		//是否有表情
		if(tempReplyMsg && tempReplyMsg.length > 0) replyMsg = tempReplyMsg;
		//是否有消息输出
		if(replyMsg){
			//设置了log: false; 好像是没有输出日志的
			logger.mark(`[青云客回复] ${e.msg}`);
			//发送消息
			await this.reply(replyMsg, e.isGroup);
			//阻止继续匹配其他命令
			return true;
		}
		//返回false继续匹配其他命令
		return false;
	};
	//Created by Yoolan.
};