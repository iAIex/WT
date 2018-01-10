//jshint esversion:6
var user = 1;
function upload() {
  var jsonobjekt = {"id": user, "shareWith": [], "fileSize": 0};
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

function init() {
	document.getElementById('uploadForm').onsubmit=function() {
		document.getElementById('uploadForm').target = 'upload_target'; //'upload_target' is the name of the iframe
	}
}
window.onload=init;
/*
function uploadFiles(result){
  document.getElementById('uploadForm').submit;
var form = document.getElementById('HANS');
var formData = new FormData(form);
var xhr = new XMLHttpRequest();
xhr.open('POST', window.location.href+"upload/5", true);
xhr.send(formData);
  var blob = new Blob;
  blob=(document.getElementById("uploadFile").files[0]);
  var tempForm = new FormData();
  tempForm.append('myFile',blob);

  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("POST", window.location.href+"upload/5", true);
  xmlhttp.setRequestHeader("Content-type", "multipart/form-data; boundary=---------------------------237211699217316");
  xmlhttp.onreadystatechange=function(){
    if(xmlhttp.readyState==4 && xmlhttp.status==201){
      console.log(xmlhttp.responseText);
    }
  };
  xmlhttp.send(formData);
}*/

function uploadFilesEXPERIMENTAL(result){
  var fileid= new Blob ([document.getElementById("uploadFile").files[0]],{type:'text/plain'});
  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("POST", window.location.href+"upload/"+ result, true);
  xmlhttp.setRequestHeader("Content-type", "application/binary");
  xmlhttp.onreadystatechange=function(){
    if(xmlhttp.readyState==4 && xmlhttp.status==201){
      console.log(xmlhttp.responseText);
    }
  };
  xmlhttp.send(fileid);
}

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
    files.myFiles = [];
    for(var i=0; i<json.length; i++)
    {
      var temp = {};
      temp.name = json[i].filename;
      var datum = json[i].upload_time.split("T")[0].split("-");//Hilfsobjekt
      temp.datum="";
      for(var k=(datum.length-1); k>=0; k--)
      {
        if(k===0){
          temp.datum = temp.datum+datum[k];
        }
        else{
          temp.datum = temp.datum+datum[k]+".";
        }
      }
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
      temp.datum = json[i].upload_time;
      var datum = json[i].upload_time.split("T")[0].split("-");
      temp.datum="";//Hilfsobjekt
      for(var k=(datum.length-1); k>=0; k--)
      {
        if(k===0){
          temp.datum = temp.datum+datum[k];
        }
        else{
          temp.datum = temp.datum+datum[k]+".";
        }
      }
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
