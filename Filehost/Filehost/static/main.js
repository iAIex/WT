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
    if(share.vshares == 0)
    {
      uploadJson();
    }else
    {
     var name={"ids": share.vshares};
     var xmlhttp = new XMLHttpRequest();
     xmlhttp.open("POST",window.location.href+"checkIds", true);
     xmlhttp.setRequestHeader("Content-type", "application/json");
     xmlhttp.onreadystatechange=function()
     {
           if(xmlhttp.readyState==4 &&  xmlhttp.status!=200)
           {
             console.log(xmlhttp.responseText);
           }
           else if(xmlhttp.readyState==4 && xmlhttp.status==200)
           {
              console.log(JSON.parse(xmlhttp.responseText));
              var response = JSON.parse(xmlhttp.responseText).ValidIds;
              var tempLength=share.vshares.length;
              share.vshares=[];
              for(var m=0; m<response.length; m++)
              {
                share.vshares=response.slice(0);
              }
              console.log(tempLength);
              if(tempLength !== share.vshares.length)
              {
                alert("Eingabe enthält ungültige Nuternamen!");
              }
              else
              {
                uploadJson();
              }
           }
      };
     xmlhttp.send(JSON.stringify(name));
   }
}

/****************************************************************************
File upload
****************************************************************************/
var user = 1;
function uploadJson()
{
  if(upload.filesToUpload == 0){
    console.log("No Files");
    alert("Put some Files in there");
  }/*else if (arrContainsObj(upload.filesToUpload, files.myFiles))
  {
    alert("Bitte anderen Filenamen wählen.");
  }*/
  else
  {
    var jsonobjekt = {"id": user, "shareWith": share.vshares, "fileSize": daFiles[0].size, "fileName": daFiles[0].name};
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
        getMyFiles();
        getSharedFiles();
        upload.filesToUpload=[];
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
    inpc: deletes,
    deleteNames: function(shares){
      this.vshares.splice(shares, 1);
    }
  }
});

/*****************************************************************************
Send fileId to delete the file
******************************************************************************/
function getDeletedFiles(deleteFileId)
{
    console.log(deleteFileId);
     var delId={"delId": deleteFileId};
     var xmlhttp2 = new XMLHttpRequest();
     xmlhttp2.open("POST",window.location.href+"delete", true);
     xmlhttp2.setRequestHeader("Content-type", "application/json");
     xmlhttp2.onreadystatechange=function()
     {
           if(xmlhttp2.readyState==4 &&  xmlhttp2.status!=200)
           {
             console.log(xmlhttp2.responseText);
           }
           else if(xmlhttp2.readyState==4 && xmlhttp2.status==200)
           {
              console.log(xmlhttp2.responseText);
              getMyFiles();
              getSharedFiles();
           }
      };
     xmlhttp2.send(JSON.stringify(delId));
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
      temp.id=json[i].ID;
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
      temp.id=json[i].id;
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

/*****************************************************************************
Sign In
*****************************************************************************/
function onSignIn(googleUser)
{
  var token = googleUser.getAuthResponse().id_token;


  if(token==undefined)
  {
    alert("Invalid Google Account or Password!");
  }
  else
  {
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.open("POST", window.location.href+"signIn", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.onreadystatechange=function()
    {
        if(xmlhttp.readyState==4 && xmlhttp.status!=200)
        {
          console.log(xmlhttp.responseText);
        }else
        {
          console.log(xmlhttp.responseText);
          if(responseText==false)
          {
            prompt("Bitte Nutzernamen eingeben:");
          }else
          {
          xmlhttp.send(JSON.stringify({"token":token}));

          }
        }

    };
  }
}


/****************************************************************************
Sign Out
******************************************************************************/

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
	});
}

/*var auth2;
var googleUser;

var appStart = function() {
	gapi.load('auth2', initSigninV2);
};

var initSigninV2 = function() {
auth2 = gapi.auth2.init({
		client_id: '942241099204-887hriil80dgus1ubdmd88r834sjuabd.apps.googleusercontent.com',
		scope: 'profile'
});
auth2.isSignedIn.listen(signinChanged);
auth2.currentUser.listen(userChanged);

if (auth2.isSignedIn.get() == true) {
console.log('User is signed in');
}else {
console.log('User is not signed in');
	}
}*/
