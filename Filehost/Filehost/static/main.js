
/*****************************************************************************
Drop
***************************************************************************/
var daFiles=false;
document.addEventListener("dragover",function(e){
  e = e || event;
  e.preventDefault();
},false);
document.addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
  /**var output=[];
  for(var i=0, f; f=Files[i]; i++){
    output.push('<li>', escape(f.name), '(', f.type || 'n/a',')',
  f.lastModifiedDate.toLocaleDateString(),'</li>');
}*/
},false);
document.getElementById("moin").addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
  daFiles = e.dataTransfer.files;

  for(var i=0; i<daFiles.length; i++)
  {
    for(var j=0;j<upload.filesToUpload.length;j++)
    {
      if(upload.filesToUpload[j].name.indexOf(daFiles[i]) === -1)
      {
        upload.filesToUpload.push(daFiles[i]);
        console.log(daFiles[i]);
      }
    }
  }
});
/****************************************************************************
File upload
****************************************************************************/
var user = 1;
function upload() {
  var jsonobjekt = {"id": user, "shareWith": [], "fileSize": 0, "fileName": "test.jpg"};
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST",window.location.href+"upload", true);
  xmlhttp.setRequestHeader("Content-type", "application/json");
  xmlhttp.onreadystatechange=function(){
    if(xmlhttp.readyState==4 && xmlhttp.status==201){
      console.log(JSON.parse(xmlhttp.responseText).UploadID);
      uploadFiles(xmlhttp.responseText);
    }
  };
  xmlhttp.send(JSON.stringify(jsonobjekt));
}

/**var fileid= new Blob ([daFiles[0]],{type:'text/plain'});
var xmlhttp=new XMLHttpRequest();
xmlhttp.open("POST", window.location.href+"upload/2", true);
xmlhttp.setRequestHeader("Content-type", "application/octet-stream");
xmlhttp.onreadystatechange=function(){
  if(xmlhttp.readyState==4 && xmlhttp.status==201){
    console.log(xmlhttp.responseText);
  }
};
xmlhttp.send(fileid);
},false);*/

var files = new Vue({
  el: "#files",
  data: {
    myFiles:[],

    sharedFiles:[],
  }
});

var upload = new Vue({
  el:'#fileList',
  data:{
    filesToUpload:[]
  }
});

var maxPers=4; //Max numbers of names to show in shared with collumn
function myFiles(json)
{
    files.myFiles = [];
    for(var i=0; i<json.length; i++)
    {
      var temp = {};
      temp.name = json[i].filename;
      var datum = new Date(json[i].upload_time);
      temp.datum = datum.getDate()+"."+datum.getMonth()+"."+datum.getFullYear();
      if(json[i].name == 0){
        temp.teilenMit = "Niemandem";
      }else{
        for(var j=0;j<json[i].name.length;j++){
          if(j===0){
            temp.teilenMit=json[i].name[j];
          }else{
            if(j<maxPers){
              temp.teilenMit=temp.teilenMit+", "+json[i].name[j];
            }else if(j===maxPers){
              temp.teilenMit=temp.teilenMit+" + "+(json[i].name.length-maxPers)+
              " anderen";
            }
          }
        }
      }
      files.myFiles.push(temp);
    }
}

function sharedFiles(json){
    files.sharedFiles = [];
    for(var i=0; i<json.length; i++){
      var temp = {};
      temp.name = json[i].filename;
      var datum = new Date(json[i].upload_time);
      temp.datum = datum.getDate()+"."+datum.getMonth()+"."+datum.getFullYear();
      temp.geteiltVon = json[i].name;
      files.sharedFiles.push(temp);
    }
}
function getMyFiles()
{
  var userId = getUserId();
   if(userId == undefined)
   {
     console.log("userId is undefined");
     return;
   }
   else
   {
      xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET",window.location.href+"getUserFiles/"+userId, true);
      xmlhttp.setRequestHeader("Accept", "application/json, text/plain");
      xmlhttp.onreadystatechange=function()
        {
           if(xmlhttp.readyState==4 && xmlhttp.status!=200){
             console.log(xmlhttp.responseText);
           }
           else if (xmlhttp.readyState==4 && xmlhttp.status==200)
           {
              myFiles(JSON.parse(xmlhttp.responseText));
           }

         };
        xmlhttp.send();
    }
}

function getSharedFiles()
{
  var userId = getUserId();
  if(userId == undefined)
  {
    console.log("userId is undefined");
    return;
  }

  else
  {
     xmlhttp = new XMLHttpRequest();
     xmlhttp.open("GET",window.location.href+"getSharedFiles/"+userId, true);
     xmlhttp.setRequestHeader("Accept", "application/json, text/plain");
     xmlhttp.onreadystatechange=function()
     {
           if(xmlhttp.readyState==4 &&  xmlhttp.status!=200)
           {
             console.log(xmlhttp.responseText);
           }
           else if(xmlhttp.readyState==4 && xmlhttp.status==200)
           {
              sharedFiles(JSON.parse(xmlhttp.responseText));
           }
     };
     xmlhttp.send();
   }
}


function getUserId(){
  return document.getElementById("inpUserId").value;
}
