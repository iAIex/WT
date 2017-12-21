//jshint esversion:6
var files = new Vue({
  el: "#files",
  data: {
    myFiles:[],

    sharedFiles:[]
  }
});

var maxPers=4; //Max numbers of names to show in shared with collumn
function myFiles(json)
{
  console.log(json);
    files.myFiles = [];
    for(var i=0; i<json.length; i++)
    {
      var temp = {};
      temp.name = json[i].filename;
      temp.datum = json[i].upload_time;
      if(json[i].name.length === 0){
        temp.teilenMit = "Niemandem";
      }else{
        for(var j=0;j<json[i].name.length;j++){
          if(j===0){
            temp.teilenMit=json[i].name[j];
          }else{
            if(j<maxPers){
              temp.teilenMit=temp.teilenMit+", "+json[i].name[j];
            }else if(j===maxPers){
              temp.teilenMit=temp.teilenMit+" + "+(json[i].name.length-maxPers)+" anderen";
            }
          }
        }
      }
      files.myFiles.push(temp);
    }
}

function sharedFiles(json){
console.log(json);
    files.sharedFiles = [];
    for(var i=0; i<json.length; i++){
      var temp = {};
      temp.name = json[i].filename;
      temp.datum = json[i].upload_time;
      temp.geteiltVon = json[i].name;
      files.sharedFiles.push(temp);
    }
}

function getMyFiles(userId)
{
  return new Promise(function(resolve, reject){
   if(userId == undefined)
   {
     console.log("userId is undefined");
     return;
   }
   else
   {
      xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET",window.location.href+"getUserFiles"+userId, true);
      xmlhttp.onreadystatechange=function()
        {
           if (xmlhttp.readyState==4 && xmlhttp.status==200)
           {
              return resolve(JSON.parse(xmlhttp.responseText));
           }

         };
        xmlhttp.send();
    }
  });
}

function getSharedFiles(userId)
{
  return new Promise(function(resolve, reject){
  if(userId == undefined)
  {
    console.log("userId is undefined");
    return;
  }
  else
  {
     xmlhttp = new XMLHttpRequest();
     xmlhttp.open("GET",window.location.href+"getSharedFiles"+userId, true);
     xmlhttp.onreadystatechange=function()
     {
           if (xmlhttp.readyState==4 && xmlhttp.status==200)
           {
              return resolve(JSON.parse(xmlhttp.responseText));
           }
     };
     xmlhttp.send();
   }
 });
}

function showFiles(userId){
Promise.all([getMyFiles(userId), getSharedFiles(userId)])
.then(allData =>{
  myFiles(allData[0]);
  sharedFiles(allData[1]);
});
}

getMyFiles(2);
