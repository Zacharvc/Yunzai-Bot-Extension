import {segment} from "oicq";
import {pipeline} from "stream";
import {promisify} from "util";
import fetch from "node-fetch";
import moment from "moment";
import YAML from "yaml";
import fs from "fs";

/*
	=================================
	※｜仅限v3Yunzai-Bot使用。
	※｜命令啥的发 插件管理 可以看，或者自己看rule。
	※｜注释？啥注释？新人会写注释吗？
	※｜新人练手用的插件，要搬随便搬。
	※｜老强迫症了，使用了很多重复的方法，所以文件看起来比较大。
	※｜使用v2版本直接移植的，BUG啥的不清楚不清楚。
	=================================
	※｜其他：https://github.com/Zacharvc/Yunzai-Bot-Extension
	=================================
*/

const _path = process.cwd();
const _extensionPath = "./plugins/example/";

const BotConfig = YAML.parse(fs.readFileSync("././config/config/qq.yaml", "utf-8").toString());

let noneNotice = "※｜这里空空的●︿●";
let notInputFile = "请发送文件对应的序号或者文件名(•́ω•̀ ٥)";

//maxSize: 单个插件最大存储，6M
let maxSize = 6291456, isUpload = {}, waitUploadTime = 90000, cancelDelay;
let extensionFileData = {}, tempBackDir = _extensionPath + ".tempBackup/";

async function extensionFileDataInit(clear = false){
	//
	if(clear) extensionFileData = {};
	//
	if(!fs.existsSync(_extensionPath)) fs.mkdirSync(_extensionPath);
	//
	let extensionNum = 0;
	let exampleFiles = fs.readdirSync(_extensionPath);
	//
	if(exampleFiles.length > 0){
		//
		for(let item of exampleFiles){
			if(/(\.js)$/.test(item) && !/^\.tempBackup$/.test(item)){
				extensionNum++;
				extensionFileData[extensionNum] = item;
			}
		}
		//
		for(let item of exampleFiles){
			if(/(\.unable)$/.test(item) && !/^\.tempBackup$/.test(item)){
				extensionNum++;
				extensionFileData[extensionNum] = item;
			}
		}
		//
		for(let item of exampleFiles){
			if(!/(\.js)$/.test(item) && !/(\.unable)$/.test(item) && !/^\.tempBackup$/.test(item)){
				extensionNum++;
				extensionFileData[extensionNum] = item;
			}
		}
		//
	}
	//
	return true;
};

async function isFile(path){
	return fs.existsSync(path) && fs.statSync(path).isFile();
};

const BotQQ = parseInt(BotConfig.qq);

const int2Number = {
	"1": "❶",
	"2": "❷",
	"3": "❸",
	"4": "❹",
	"5": "❺",
	"6": "❻",
	"7": "❼",
	"8": "❽",
	"9": "❾",
	"10": "❿",
	"11": "⓫",
	"12": "⓬",
	"13": "⓭",
	"14": "⓮",
	"15": "⓯",
	"16": "⓰",
	"17": "⓱",
	"18": "⓲",
	"19": "⓳",
	"20": "⓴"
};

Number.prototype.toCount = function(){
	//
	let output = this.toString();
	//
	let mainKeys = Object.keys(int2Number);
	//
	if(mainKeys.includes(output)) output = int2Number[this];
	//
	return output;
};

String.prototype.isInteger = function(){
	return (!isNaN(this) && (parseInt(this).toString().length === this.length));
};

export class pluginManager extends plugin{
	constructor(){
		super({
			name: "插件管理",
			dsc: "",
			event: "message",
			priority: 90000,
			//
			rule: [
				{
					reg: "^#*插件(列表|管理)$",
					fnc: "extensionList"
				},
				{
					reg: "^#*(开启|启用|打开|关闭|停用)插件(.*)$",
					fnc: "changeExtension"
				},
				{
					reg: "^#*(覆盖)*安装(多个)*插件$",
					fnc: "uploadFile"
				},
				{
					reg: "^#确定删除文件(.*)$",
					fnc: "deleteFile"
				},
				{
					reg: "^#*撤销删除$",
					fnc: "recoverFile"
				},
				{
					reg: "^#*查看(插件)*(.*)方法",
					fnc: "gainExport"
				},
				//大范围检测一定放最后
				{
					reg: "(.*)",
					fnc: "uploadFileAdd",
					log: false
				}
				//
			]
		})
	};

	async extensionList(e){
		//
		//if(!e.isMaster) return; //注释掉给群友开放权限
		//
		extensionFileData = {};
		//
		if(!fs.existsSync(_extensionPath)) fs.mkdirSync(_extensionPath);
		//
		let extensionNum = 0;
		let num = 0, sendMsg = [], pushMsg = [], tempMsg = {};
		let exampleFiles = fs.readdirSync(_extensionPath);
		//
		if(exampleFiles.length > 0){
			//
			let BotName = global.Bot.nickname;
			//
			tempMsg = {user_id: BotQQ, nickname: BotName, message: []};
			pushMsg = ["●======启用插件======●"];
			//
			num = 0;
			//
			for(let item of exampleFiles){
				//
				if(/(\.js)$/.test(item) && !/^\.tempBackup$/.test(item)){
					//
					num++, extensionNum++;
					//
					pushMsg.push(`${extensionNum.toCount()}｜${item}`);
					//
					extensionFileData[extensionNum] = item;
				}
				//
			}
			//
			if(num == 0) pushMsg.push(noneNotice);
			pushMsg.push("➥");
			tempMsg.message = pushMsg.join("\n");
			sendMsg.push(tempMsg);
			//
			tempMsg = {user_id: BotQQ, nickname: BotName, message: []};
			pushMsg = ["●======停用插件======●"];
			//
			num = 0;
			//
			for(let item of exampleFiles){
				//
				if(/(\.unable)$/.test(item) && !/^\.tempBackup$/.test(item)){
					//
					num++, extensionNum++;
					//
					pushMsg.push(`${extensionNum.toCount()}｜${item}`);
					//
					extensionFileData[extensionNum] = item;
				}
				//
			}
			//
			if(num == 0) pushMsg.push(noneNotice);
			pushMsg.push("➥");
			tempMsg.message = pushMsg.join("\n");
			sendMsg.push(tempMsg);
			//
			tempMsg = {user_id: BotQQ, nickname: BotName, message: []};
			pushMsg = ["●======其他文件======●"];
			//
			num = 0;
			//
			for(let item of exampleFiles){
				//
				if(!/(\.js)$/.test(item) && !/(\.unable)$/.test(item) && !/^\.tempBackup$/.test(item)){
					//
					num++, extensionNum++;
					//
					pushMsg.push(`${extensionNum.toCount()}｜${item}`);
					//
					extensionFileData[extensionNum] = item;
				}
				//
			}
			//
			if(num == 0) pushMsg.push(noneNotice);
			pushMsg.push("➥");
			tempMsg.message = pushMsg.join("\n");
			sendMsg.push(tempMsg);
			//
			tempMsg = {
				user_id: BotQQ,
				nickname: BotName,
				message: [
					"●======控制命令======●", "\n",
					"◎｜#(覆盖)安装(多个)插件", "\n",
					"◎｜#开启(关闭)插件+序号", "\n",
					"◎｜#确定删除文件+序号", "\n",
					"◎｜#撤销删除", "\n",
					"➥括号内为可选项目", "\n",
					"➥更新插件后请手动重启确保正常应用！"
				]
			};
			//
			sendMsg.push(tempMsg);
			//
			if(e.isGroup) e.reply(await e.group.makeForwardMsg(sendMsg));
			else e.reply(await e.friend.makeForwardMsg(sendMsg));
			//
		}else e.reply("啊这，一个插件都木有？！ Σ(ﾟДﾟ|||)");
		//
		return true;
	};

	async changeExtension(e){
		//
		if(!e.isMaster) return;
		//
		if(Object.keys(extensionFileData).length <= 0){
			//
			e.reply("数据不完整，建议使用 #插件管理 初始化数据");
			//
			return false;
		}
		//
		if(/^#*(开启|启用|打开)插件(.*)$/.test(e.msg)){
			//开启
			let count = e.msg.replace(/#*(开启|启用|打开)插件/g, "").trim();
			//
			let tempFile;
			if(Object.keys(extensionFileData).includes(count) || (!count.isInteger() && fs.existsSync(`${_extensionPath + count}`))){
				//
				if(count.isInteger()) tempFile = extensionFileData[parseInt(count)];
				else tempFile = count;
				//
				let tempFileName = tempFile.split(`.${tempFile.replace(/.*\./g, "").trim()}`)[0];
				//
				if(!/(\.unable)$/.test(tempFile)) e.reply(`【${tempFileName}】并未关闭`);
				else{
					let afterFile = tempFile.replace(/(\.unable)$/g, "").trim();
					if(!/(\.js)$/.test(afterFile)) afterFile += ".js";
					fs.rename(`${_extensionPath + tempFile}`, `${_extensionPath + afterFile}`, (error) => {
						//
						if(error) console.log("文件重命名失败了～");
					});
					//
					e.reply(`【${tempFileName}】已开启`);
					//
					extensionFileDataInit(true);
				}
			}else{
				if(count.length == 0) e.reply(notInputFile);
				else e.reply(`没有找到“${count}”所对应的文件(。_。)`);
			}
		}else if(/^#*(关闭|停用)插件(.*)$/.test(e.msg)){
			//关闭
			let count = e.msg.replace(/#*(关闭|停用)插件/g, "").trim();
			//
			let tempFile;
			if(Object.keys(extensionFileData).includes(count) || (!count.isInteger() && fs.existsSync(`${_extensionPath + count}`))){
				//
				if(count.isInteger()) tempFile = extensionFileData[parseInt(count)];
				else tempFile = count;
				//
				let tempFileName = tempFile.split(`.${tempFile.replace(/.*\./g, "").trim()}`)[0];
				//
				if(!/(\.js)$/.test(tempFile)) e.reply(`【${tempFileName}】并未开启`);
				else{
					let afterFile = tempFile.replace(/(\.js)$/g, "").trim();
					if(!/(\.unable)$/.test(afterFile)) afterFile += ".unable";
					fs.rename(`${_extensionPath + tempFile}`, `${_extensionPath + afterFile}`, (error) => {
						//
						if(error) console.log("文件重命名失败了～");
					});
					//
					e.reply(`【${tempFileName}】已关闭`);
					//
					extensionFileDataInit(true);
				}
			}else{
				if(count.length == 0) e.reply(notInputFile);
				else e.reply(`没有找到“${count}”所对应的文件(。_。)`);
			}
		}
		//
		return true;
	};

	async uploadFile(e){
		//
		if(!e.isMaster) return;
		//
		if(isUpload[e.user_id]){
			e.reply("等待文件上传...");
			return;
		}
		//
		isUpload[e.user_id] = {};
		//
		if(/覆盖/.test(e.msg)) isUpload[e.user_id]["cover"] = true;
		else isUpload[e.user_id]["cover"] = false;
		//
		if(/多个/.test(e.msg)) isUpload[e.user_id]["hasMore"] = true;
		else isUpload[e.user_id]["hasMore"] = false;
		//
		e.reply("请上传需要安装的插件...");
		//
		if(waitUploadTime <= 0) return;
		//
		cancelDelay = setTimeout(() => {
			if(isUpload[e.user_id]){
				//
				if(!isUpload[e.user_id]["hasMore"]){
					e.reply(`等待超时，已取消本次安装`);
				}else{
					let num = 0;
					if(isUpload[e.user_id]["num"]) num = isUpload[e.user_id]["num"];
					e.reply(`等待超时，安装结束，本次共安装了 ${num} 个文件`);
				}
				//
				delete isUpload[e.user_id];
			}
		}, waitUploadTime);
		//
		return true;
	};

	async uploadFileAdd(e){
		//
		if(!isUpload[e.user_id]) return;
		//
		if(e.msg && /^#*结束安装$/.test(e.msg) && isUpload[e.user_id]["hasMore"]){
			//
			let num = 0;
			if(isUpload[e.user_id]["num"]) num = isUpload[e.user_id]["num"];
			e.reply(`安装结束，本次共安装了 ${num} 个文件`);
			//
			delete isUpload[e.user_id];
			//
			return;
		}
		//
		if(e.message[0].type == "file"){
			//
			clearTimeout(cancelDelay);
			//
			if(e.message[0].size > maxSize){
				//
				if(!isUpload[e.user_id]["hasMore"]){
					//
					delete isUpload[e.user_id];
					//
					e.reply("安装失败: 文件过大，已取消本次安装");
					//
					return;
				}else{
					e.reply("安装失败: 文件过大，请发送其他文件");
					//
					cancelDelay = setTimeout(() => {
						if(isUpload[e.user_id]){
							//
							if(!isUpload[e.user_id]["hasMore"]){
								e.reply(`等待超时，已取消本次安装`);
							}else{
								let num = 0;
								if(isUpload[e.user_id]["num"]) num = isUpload[e.user_id]["num"];
								e.reply(`等待超时，安装结束，本次共安装了 ${num} 个文件`);
							}
							//
							delete isUpload[e.user_id];
						}
					}, waitUploadTime);
				//
				}
			}
			//
			let _storagePath = `${_extensionPath + e.file.name}`;
			//
			if(fs.existsSync(_storagePath) && isUpload[e.user_id] && isUpload[e.user_id].cover === false){
				//
				if(isUpload[e.user_id]["hasMore"]){
					//
					e.reply("安装失败: 插件已存在，覆盖安装请使用 #覆盖安装多个插件");
					//
					cancelDelay = setTimeout(() => {
						if(isUpload[e.user_id]){
							//
							if(!isUpload[e.user_id]["hasMore"]){
								e.reply(`等待超时，已取消本次安装`);
							}else{
								let num = 0;
								if(isUpload[e.user_id]["num"]) num = isUpload[e.user_id]["num"];
								e.reply(`等待超时，安装结束，本次共安装了 ${num} 个文件`);
							}
							//
							delete isUpload[e.user_id];
						}
					}, waitUploadTime);
					//
					return;
					//
				}else{
					//
					delete isUpload[e.user_id];
					//
					e.reply("安装失败: 插件已存在，覆盖安装请使用 #覆盖安装插件");
					return;
				}
				//
			}
			//
			let fileUrl;
			if(e.isGroup) fileUrl = await e.group.getFileUrl(e.file.fid);
			else fileUrl = await e.friend.getFileUrl(e.file.fid);
			//
			const response = await fetch(fileUrl);
			const streamPipeline = promisify(pipeline);
			await streamPipeline(response.body, fs.createWriteStream(_storagePath));
			//
			if(!isUpload[e.user_id]["hasMore"]){
				//
				delete isUpload[e.user_id];
				e.reply("安装成功，可使用 #插件列表 检查是否正确安装");
			}else{
				//
				if(isUpload[e.user_id] && !isUpload[e.user_id]["num"]) isUpload[e.user_id]["num"] = 0;
				isUpload[e.user_id]["num"] += 1;
				//
				e.reply("安装成功，请继续发送需要安装的文件或者使用 #结束安装 来完成安装");
				//
				cancelDelay = setTimeout(() => {
					if(isUpload[e.user_id]){
						//
						if(!isUpload[e.user_id]["hasMore"]){
							e.reply(`等待超时，已取消本次安装`);
						}else{
							let num = 0;
							if(isUpload[e.user_id]["num"]) num = isUpload[e.user_id]["num"];
							e.reply(`等待超时，安装结束，本次共安装了 ${num} 个文件`);
						}
						//
						delete isUpload[e.user_id];
					}
				}, waitUploadTime);
			}
			//
		}
		//
		return true;
	};

	async deleteFile(e){
		//
		if(!e.isMaster) return;
		//
		if(!fs.existsSync(tempBackDir)) fs.mkdirSync(tempBackDir);
		//
		if(Object.keys(extensionFileData).length <= 0){
			//
			e.reply("数据不完整，建议使用 #插件管理 初始化数据");
			//
			return false;
		}
		//
		let count = e.msg.replace(/^#确定删除文件/g, "").trim();
		//
		if(count.length == 0) e.reply(notInputFile);
		else{
			let tempFile;
			if(Object.keys(extensionFileData).includes(count) || (!count.isInteger() && fs.existsSync(`${_extensionPath + count}`))){
				//
				if(count.isInteger()) tempFile = extensionFileData[parseInt(count)];
				else tempFile = count;
				//
				fs.writeFileSync(`${tempBackDir}${tempFile}.date`, moment().format("YYYYMMDDHHmmss"));
				fs.writeFileSync(`${tempBackDir}tempKeep.bak`, fs.readFileSync(`${_extensionPath + tempFile}`, "utf-8"));
				//
				fs.unlink(`${_extensionPath + tempFile}`, (error) => {
					if(error) console.log("删除文件失败了～");
				});
				//
				extensionFileDataInit(true);
				//
				e.reply(`【${tempFile}】已删除，你可以使用 #撤销删除 来还原文件`);
			}else e.reply(`没有找到“${count}”所对应的文件(。_。)`);
		}
		//
		return true;
	};

	async recoverFile(e){
		//
		if(!e.isMaster) return;
		//
		if(!fs.existsSync(tempBackDir + "tempKeep.bak") || !fs.existsSync(tempBackDir)){
			e.reply("没有可以还原的文件～");
			return;
		}
		//
		let tempBackFile = fs.readdirSync(tempBackDir);
		//
		let fileName, time = 0;
		for(let item of tempBackFile){
			if(/(.date)$/.test(item)){
				//
				let timeIf = fs.readFileSync(`${tempBackDir + item}`, "utf-8");
				//
				if(timeIf > time){
					time = timeIf;
					fileName = item.replace(/(.date)$/g, "");
				}
			}
		}
		//
		if(!fileName) fileName = `unknown_${moment().format("MMDDHHmmss")}.re`;
		//
		fs.writeFileSync(_extensionPath + fileName, fs.readFileSync(`${tempBackDir}tempKeep.bak`, "utf-8"));
		//
		extensionFileDataInit(true);
		//
		e.reply(`【${fileName}】文件已恢复`);
		//
		for(let item of tempBackFile){
			fs.unlink(`${tempBackDir + item}`, (error) => {
				if(error) console.log("删除文件失败了～");
			});
		}
		//
		return true;
	};

	async gainExport(e){
		//
		//if(!e.isMaster) return; //注释掉给群友开放权限
		//
		/*诶！是新功能诶！*/
		//
		return true;
	};

};

//初始化
extensionFileDataInit(true);