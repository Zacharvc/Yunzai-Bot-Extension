import {segment} from "oicq";
import {pipeline} from "stream";
import {promisify} from "util";
import fetch from "node-fetch";
import moment from "moment";
import fs from "fs";

/*
	=================================
	※｜仅限v2Yunzai-Bot使用。
	※｜命令啥的发 插件管理 可以看，或者自己看rule。
	※｜注释？啥注释？新人会写注释吗？
	※｜新人练手用的插件，要搬随便搬。
	※｜老强迫症了，使用了很多重复的方法，所以文件看起来比较大。
	=================================
*/

const _path = process.cwd();
const _extensionPath = "./lib/example/";

let noneNotice = "※｜这里空空的●︿●";
let notInputFile = "请发送文件对应的序号或者文件名(•́ω•̀ ٥)";

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

const BotQQ = parseInt(BotConfig.account.qq);

const int2Count = {
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
	let mainKeys = Object.keys(int2Count);
	//
	if(mainKeys.includes(output)) output = int2Count[this];
	//
	return output;
};

String.prototype.isInteger = function(){
	return (!isNaN(this) && (parseInt(this).toString().length === this.length));
}

export const rule = {
	extensionList: {
		reg: "^#*插件(列表|管理)$",
		priority: 1000,
		describe: "查看lib/example/下的文件"
	},
	changeExtension: {
		reg: "^#*(开启|启用|打开|关闭|停用)插件(.*)$",
		priority: 1000,
		describe: "开关插件"
	},
	uploadFile: {
		reg: "^#*(覆盖)*安装插件$",
		priority: 1000,
		describe: "上传文件"
	},
	uploadFileAdd: {
		reg: "noCheck",
		priority: 20000,
		describe: "上传文件"
	},
	deleteFile: {
		reg: "^#确定删除文件(.*)$",
		priority: 1000,
		describe: "删除文件"
	},
	recoverFile: {
		reg: "^#*撤销删除$",
		priority: 1000,
		describe: "还原文件"
	},
};

export async function extensionList(e){
	//
	//if(!e.isMaster) return; //给群友开放查看插件的权限
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
		let BotName = e.groupConfig.botAlias;
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
				"◎｜#(覆盖)安装插件", "\n",
				"◎｜#开启(关闭)插件+序号", "\n",
				"◎｜#确定删除文件+序号", "\n",
				"◎｜#撤销删除", "\n",
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

export async function changeExtension(e){
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

export async function uploadFile(e){
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
	e.reply("请上传需要安装的插件...");
	//
	if(waitUploadTime <= 0) return;
	//
	cancelDelay = setTimeout(() => {
		if(isUpload[e.user_id]){
			delete isUpload[e.user_id];
			e.reply(`等待超时，已取消本次安装`);
		}
	}, waitUploadTime);
	//
	return true;
};

export async function uploadFileAdd(e){
	//
	if(!isUpload[e.user_id]) return;
	//
	if(e.message[0].type == "file"){
		//
		clearTimeout(cancelDelay);
		//
		if(e.message[0].size > maxSize){
			//
			delete isUpload[e.user_id];
			//
			e.reply("文件过大，已取消本次安装");
			return;
		}
		//
		let _storagePath = `${_extensionPath + e.file.name}`;
		//
		if(fs.existsSync(_storagePath) && isUpload[e.user_id] && isUpload[e.user_id].cover === false){
			//
			delete isUpload[e.user_id];
			//
			e.reply("安装失败: 插件已存在，覆盖安装请使用 #覆盖安装插件");
			return;
		}
		//
		delete isUpload[e.user_id];
		//
		let fileUrl;
		if(e.isGroup) fileUrl = await e.group.getFileUrl(e.file.fid);
		else fileUrl = await e.friend.getFileUrl(e.file.fid);
		//
		const response = await fetch(fileUrl);
		const streamPipeline = promisify(pipeline);
		await streamPipeline(response.body, fs.createWriteStream(_storagePath));
		//
		e.reply("安装成功，可使用 #插件列表 检查是否正确安装");
		//
	}
	//
	return true;
};

export async function deleteFile(e){
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

export async function recoverFile(e){
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

//初始化
extensionFileDataInit(true);