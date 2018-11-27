
/**
 * @file: demo.js
 * @author: robertzhang
 *
 * @date: 2018 Nov.27
 */

var Web3= require('web3');
var config=require('../web3lib/config');
var fs=require('fs');
var execSync =require('child_process').execSync;
var web3sync = require('../web3lib/web3sync');
var BigNumber = require('bignumber.js');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(config.HttpProvider));
}

console.log(config);




var filename="ResourceManager";




var address=fs.readFileSync(config.Ouputpath+filename+'.address','utf-8');
var abi=JSON.parse(fs.readFileSync(config.Ouputpath/*+filename+".sol:"*/+filename+'.abi', 'utf-8'));
var contract = web3.eth.contract(abi);
var instance = contract.at(address);



console.log(filename+"contract address:"+address);

var user1 = "user1";
var user2 = "user2";
var user3 = "user3";

var unregisteredUser = "unregisteredUser";


var user1Resource1Key = "user1Resource1Key";
var user1Resource1Value = "user1Resource1Value";
var user1Resource2Key = "user1Resource2Key";
var user1Resource2Value = "user1Resource2Value";
var user1Resource3Key = "user1Resource3Key";
var user1Resource3Value = "user1Resource3Value";
var user1Resource4Key = "user1Resource4Key";
var user1Resource4Value = "user1Resource4Value";

const uploadResource = async (userName, key, value) =>{
  console.log("用户%s上传资源： %s:%s",userName, key, value);
  const func = "uploadResource(string,string,string)";

  var receipt = await web3sync.sendRawTransaction(config.account, config.privKey, address, func, [userName, key, value]);
  console.log("\n===================");
  console.log(receipt);
  console.log("===================\n");

  var resourceList=instance.getResourceList(user1);
  console.log("当前资源列表:", resourceList);
}


const testFailGet = (user, resource) =>{
  try{
    var failed = instance.get(user, resource);
    throw Error("用户获取成功")
  }catch(e){
    console.log("用户%s获取资源%s失败",user, resource);
  }
}

const register = async (userName) =>{
  var func = "register(string)";
  var params = [userName];
  var receipt = await web3sync.sendRawTransaction(config.account, config.privKey, address, func, params);

  console.log("\n===================");
  console.log(receipt);
  console.log("===================\n");
  console.log("%s注册成功",userName);

}

(async function(){

  console.log("===================start===================");
  console.log("===================验证注册===================");

  var registered = instance.isRegistered(user1);

  console.log("%s已注册: ", user1, registered);

  await register(user1);

  var registered = instance.isRegistered(user1);

  console.log("%s已注册: ", user1, registered);
  console.log("===================验证获取资源列表+上传资源+验证升级逻辑===================");
  var resourceList=instance.getResourceList(user1);
  console.log("当前资源列表:", resourceList);

  var status = instance.getUserStatus(user1);
  console.log("%s 状态: 贡献值->%s, 等级->%s", user1,status[0],status[1]);

  await uploadResource(user1,user1Resource1Key,user1Resource1Value);
  await uploadResource(user1,user1Resource2Key,user1Resource2Value);
  await uploadResource(user1,user1Resource3Key,user1Resource3Value);
  await uploadResource(user1,user1Resource4Key,user1Resource4Value);

  var status = instance.getUserStatus(user1);

  console.log("%s 状态: 贡献值->%s, 等级->%s", user1,status[0],status[1]);

  console.log("===================验证访问权限逻辑===================");
  func = "setprivilege(string,uint256,string)";
  params = [user1,5,user1Resource1Key];
  console.log("用户%s设置资源访问限制: %s->%d", params[0], params[2],params[1]);
  var receipt = await web3sync.sendRawTransaction(config.account, config.privKey, address, func, params);
  console.log("\n===================");
  console.log(receipt);
  console.log("===================\n");
  console.log("===================1.上传资源用户可无视限制访问自己的资源===================");
  var u1r1 = instance.get(user1, user1Resource1Key);
  console.log("%s获取资源成功 %s:%s",user1, user1Resource1Key, u1r1);

  console.log("===================2.未注册用户禁止访问===================");
  testFailGet(unregisteredUser, user1Resource1Key)

  console.log("===================3.级别不足用户禁止访问===================");
  await register(user2);
  var status = instance.getUserStatus(user2);
  console.log("%s 状态: 贡献值->%s, 等级->%s", user2,status[0],status[1]);
  testFailGet(user2, user1Resource1Key);

  console.log("===================4.级别达标用户允许访问===================");
  var u1r4 = instance.get(user2, user1Resource4Key);
  console.log("%s获取资源成功 %s:%s",user2, user1Resource4Key, u1r4);

  console.log("===================end===================");

})()
