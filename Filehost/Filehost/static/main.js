/*****************************************************************************
Hilfsfunktion
****************************************************************************/
function arrContainsObj(array, obj)
{
  for(var i= 0; i<array.length; i++)
  {
    if(array[i].name.includes(obj.name))
    {
      return true;
    }
  }
  return false;
}

function getUserId()
{
  return document.getElementById("inpUserId").value;
}
/*****************************************************************************
Drop
*****************************************************************************/
var daFiles=[];
document.addEventListener("dragover",function(e){
  e = e || event;
  e.preventDefault();
},false);
document.addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
},false);
document.getElementById("moin").addEventListener("drop",function(e){
  e = e || event;
  e.preventDefault();
  daFiles = e.dataTransfer.files;
  for(var i=0; i<daFiles.length; i++)
  {
      if(!arrContainsObj(upload.filesToUpload, daFiles[i]))
      {
        upload.filesToUpload.push(daFiles[i]);
      }
  }
},false);

/***************************************************************************
Share With
****************************************************************************/
//var callb=document.getElementById('yyy').addEventListener('keypress', function(e)
var deletes = function(e)
{
  var leer=false;
  if(e.which === 13)
  {
    e.preventDefault();
    this.vshares.push(document.getElementById('yyy').value);
    document.getElementById('yyy').value="";

  }
};

function getSharedPeople()
{
     var name={"ids": share.vshares};
     var xmlhttp = new XMLHttpRequest();
     xmlhttp.open("POST",window.location.href+"checkIds", true);
     xmlhttp.setRequestHeader("Content-type", "application/json");
     xmlhttp.onreadystatechange=function()
     {
           if(xmlhttp.readyState==4 &&  xmlhttp.status!=201)
           {
             console.log(xmlhttp.responseText);
           }
           else if(xmlhttp.readyState==4 && xmlhttp.status==201)
           {
              console.log(JSON.parse(xmlhttp.responseText));
              deleteWrongShares(JSON.parse(xmlhttp.responseText).ids);
           }
      };
     xmlhttp.send(JSON.stringify(name));
}

function deleteWrongShares()
{
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", window.location.href+"checkIds", true);
  xmlhttp.setRequestHeader("Accept", "application/json, text/plain");
  xmlhttp.onreadystatechange=function()
  {
    if(xmlhttp.readyState==4 && xmlhttp.status!=201)
    {
      console.log(xmlhttp.responseText);
    }
    else if(xmlhttp.readyState==4 && xmlhttp.status==201)
    {
      console.log(xmlhttp.responseText);

      uploadJson(JSON.parse(xmlhttp.responseText));
    }
  };
}
/****************************************************************************
File upload
****************************************************************************/
var user = 1;
function uploadJson(ids)
{
  if(upload.filesToUpload == 0){
    console.log("No Files");
    alert("Put some Files in there");
  }else
  {
    var jsonobjekt = {"id": user, "shareWith": share.vshares, "fileSize": 0, "fileName": daFiles[0].name};
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",window.location.href+"upload", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.onreadystatechange=function()
    {
      if(xmlhttp.readyState==4 && xmlhttp.status==201)
      {
        id=JSON.parse(xmlhttp.responseText).UploadID;
        console.log(JSON.parse(xmlhttp.responseText).UploadID);
        uploadBinary(JSON.parse(xmlhttp.responseText).UploadID);
      }
    };
    xmlhttp.send(JSON.stringify(jsonobjekt));
  }
}

function uploadBinary(uploadId)
  {
    console.log(window.location.href+"upload/"+uploadId);
    console.log(upload.filesToUpload[0]);
    var fileid=new Blob ([upload.filesToUpload[0]],{type:'text/plain'});
    console.log(fileid.size);
    var xmlhttp2=new XMLHttpRequest();
    xmlhttp2.open("PUT", window.location.href+"upload/"+uploadId, true);
    xmlhttp2.setRequestHeader("Content-type", "application/octet-stream");
    xmlhttp2.onreadystatechange=function()
    {
      if(xmlhttp2.readyState==4 && xmlhttp2.status==201)
      {
        console.log(xmlhttp2.responseText);
      }
    };
    xmlhttp2.send(fileid);
  }

/*****************************************************************************
Vue
******************************************************************************/
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
  },
  methods: {
    deleteFile: function(files){
      this.filesToUpload.splice(files, 1);
    }
  }
});

var share = new Vue({
  el:'#shares',
  data:{
    vshares:[]
  },
  methods: {
    inpc: deletes
  }
});

/*****************************************************************************
Send fileId to delete the file
******************************************************************************/
function getDeletedFiles(deleteFileId)
{
     var delId={"id": deleteFileId};
     var xmlhttp = new XMLHttpRequest();
     xmlhttp.open("POST",window.location.href+"delete", true);
     xmlhttp.setRequestHeader("Content-type", "application/json");
     xmlhttp.onreadystatechange=function()
     {
           if(xmlhttp.readyState==4 &&  xmlhttp.status!=201)
           {
             console.log(xmlhttp.responseText);
           }
           else if(xmlhttp.readyState==4 && xmlhttp.status==201)
           {
              console.log(JSON.parse(xmlhttp.responseText));
              ulid=JSON.parse(xmlhttp.responseText);
           }
      };
     xmlhttp.send(JSON.stringify(delId));
}
/****************************************************************************
Auflisten der Files
******************************************************************************/
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
function getMyFiles(delId)
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
           if(xmlhttp.readyState==4 && xmlhttp.status!=200)
           {
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
