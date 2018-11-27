pragma solidity ^0.4.2;

/// @title ResourceManager
/// @author robertzhang
/**
 * 资源管理器
 * 实现一个去中心化资源共享系统，在这个系统中，用户可以完成账号注册登记，
 并且上传自己的资源信息（自定义，可以假设是图书资源，资源信息由key-value构成，key可以是书名，value就以一个简要的字符串表示具体内容），
 任何用户都可以查询到系统中的所有资源信息列表。用户还可以为自己的资源设置访问权限，
 比如只有等级大于X级的用户才可以访问，用户的等级可以与贡献的资源量挂钩，贡献越多等级越高。简要描述该系统支持的功能接口：
  1. 用户注册接口

  2. 资源上传接口

  3. 用户设置访问权限接口

  4. 查询系统资源列表接口

 */

contract ResourceManager {
  // 用户资料
  struct UserInfo {
     uint contribution; // 贡献值
     bool registered;// 是否已注册
     uint level;// 等级
   }
   // 资源
   struct Resource {
     string value; // 资源值
     uint privilege; // 权限值
     bool uploaded; // 是否已上传
     string owner; // 资源拥有者
   }
  mapping (string => Resource) resources; // 用户名-资源映射
  mapping (string => UserInfo) userInfo; // 用户名-用户资料关系
  string[] allResourceNames;// 资源列表

  uint constant baseLevelFactor = 4;// 升级基数

  // 判定已注册用户切口
  modifier registrationRequired(string userName) {
    if (!userInfo[userName].registered)
      revert();
        _;
    }
  // 注册接口
  function register(string userName) public{
    UserInfo storage user = userInfo[userName];
    if(!user.registered){
      user.registered = true;
      user.level = 1;
      user.contribution=0;
    }
  }
  // 是否已注册接口
  function isRegistered(string userName) public constant returns(bool){
    UserInfo storage user = userInfo[userName];
    return user.registered;
  }
  // 获取用户资料接口
  function getUserStatus(string userName) public constant returns(uint,uint){
    UserInfo storage user = userInfo[userName];
    return (user.contribution,user.level);
  }
  //上传资源接口
  function uploadResource(string userName, string key, string value) public registrationRequired(userName) returns(uint){
    UserInfo storage user = userInfo[userName];
    Resource storage resource = resources[key];
    if(resource.uploaded){
      return user.contribution;
    }else{
      updateUserContribution(userName);
      resource.uploaded = true;
      resource.value = value;
      resource.privilege = 0;
      resource.owner = userName;
      allResourceNames.push(key);
      return user.contribution;
    }
  }

  // 用户升级逻辑  4^用户等级
  function updateUserContribution(string userName) internal{
    UserInfo storage user = userInfo[userName];
    user.contribution++;
    if(user.contribution == baseLevelFactor**user.level){
      user.level++;
    }
  }
  //设置资源权限接口
  function setprivilege(string userName, uint privilege, string key) public registrationRequired(userName) {
    Resource storage resource = resources[key];
    if(!stringUtilCompareInternal(resource.owner, userName)){
      revert();
    }else{
      resource.privilege = privilege;
    }
  }

  //获取资源列表接口
  function getResourceList(string userName) public constant registrationRequired(userName) returns(string){
    string memory results = "";
    for (uint i = 0; i < allResourceNames.length; i++){
      results = strConcat(results, allResourceNames[i]);
      if(i < allResourceNames.length - 1){
        results = strConcat(results, ",");
      }
    }

    return results;
  }
  //获取资源接口
  function get(string userName, string key)public constant registrationRequired(userName) returns(string){
    UserInfo storage user = userInfo[userName];
    Resource storage resource = resources[key];
    if(!resource.uploaded || (!stringUtilCompareInternal(resource.owner,userName) && user.level < resource.privilege)){
      revert();
    }else{
      return resource.value;
    }
  }
  // 内部方法：拼接字符串
  function strConcat(string _a, string _b) internal constant returns (string){
    bytes memory _ba = bytes(_a);
    bytes memory _bb = bytes(_b);
    string memory ab = new string(_ba.length + _bb.length);
    bytes memory bab = bytes(ab);
    uint k = 0;
    for (uint i = 0; i < _ba.length; i++) bab[k++] = _ba[i];
    for (i = 0; i < _bb.length; i++) bab[k++] = _bb[i];
    return string(bab);
}
// 内部方法：对比字符串
function stringUtilCompareInternal(string a, string b) internal constant returns (bool) {
        if (bytes(a).length != bytes(b).length) {
            return false;
        }
        for (uint i = 0; i < bytes(a).length; i ++) {
            if(bytes(a)[i] != bytes(b)[i]) {
                return false;
            }
        }
        return true;
    }

}
