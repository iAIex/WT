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

document.getElementById("moin").addEventListener("click",function(e)
{
  e = e || event;
  e.preventDefault();
  daFiles=e.dataTransfer.files;
  for(var j=0; j<daFiles.length; j++)
  {
    if(!arrContainsObj(upload.filesToUpload, daFiles[j]))
    {
      upload.filesToUpload.push(daFiles[j]);
    }
  }
},false);
/***************************************************************************
Share With
****************************************************************************/
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
function uploadJson()
{
  if(upload.filesToUpload == 0){
    console.log("No Files");
    alert("Bitte Files einfügen!");
  }else if(upload.filesToUpload!=1)
    {
      alert("Bitte nur ein File!");
    }
  else
  {
    var jsonobjekt = {"id": globalToken, "shareWith": share.vshares, "fileSize": daFiles[0].size, "fileName": daFiles[0].name};
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",window.location.href+"upload", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.onreadystatechange=function()
    {
      if(xmlhttp.readyState==4 && xmlhttp.status!=201)
      {
        console.log(xmlhttp.responseText);
      }
      else if(xmlhttp.readyState==4 && xmlhttp.status==201)
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
    xmlhttp2.setRequestHeader("wtfToken", globalToken);
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
Progress back
******************************************************************************/
function progress()
{
document.getElementById("progress").value=0;
document.getElementById("prozent").innerHTML="0%";
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
     var delId={"delId": deleteFileId, "token": globalToken};
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
      temp.token=globalToken;
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
      temp.token=globalToken;
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
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET",window.location.href+"getUserFiles/"+globalToken, true);
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
        getSharedFiles();
     }

   };
   xmlhttp.send(JSON.stringify({"token": globalToken}));

}

function getSharedFiles()
{
   var xmlhttp = new XMLHttpRequest();
   xmlhttp.open("GET",window.location.href+"getSharedFiles/"+globalToken, true);
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

/*****************************************************************************
Sign In
*****************************************************************************/
var globalToken=undefined;
function onSignIn(googleUser)
{
  var token = googleUser.getAuthResponse().id_token;
  globalToken=token;
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
        }else if(xmlhttp.readyState==4 && xmlhttp.status==200)
        {
          console.log(xmlhttp.responseText);
          if(JSON.parse(xmlhttp.responseText).isAuth!==true)
          {
            document.getElementById("logIn").style.display="none";
            document.getElementById("mmm").style.display="block";
          }else{
            document.getElementById("logIn").style.display="none";
            document.getElementById("body").style.display="block";
            getMyFiles();
          }
        }
    };
    xmlhttp.send(JSON.stringify({"token":token}));
  }
}

function createUserName()
{
    var userName=document.getElementById("user").value;
    var xmlhttp2=new XMLHttpRequest();
    xmlhttp2.open("POST", window.location.href+"createUser", true);
    xmlhttp2.setRequestHeader("Content-type", "application/json");
    xmlhttp2.onreadystatechange=function()
    {
      if(xmlhttp2.readyState==4 && xmlhttp2.status!=200)
      {
        console.log(xmlhttp2.responseText);
      }else if(xmlhttp2.readyState==4 && xmlhttp2.status==200)
      {
        console.log(xmlhttp2.responseText);
        if(JSON.parse(xmlhttp2.responseText).Userid!==0)
        {
          document.getElementById("mmm").style.display="none";
          document.getElementById("logIn").style.display="none";
          document.getElementById("body").style.display="block";
          getMyFiles();
          getSharedFiles();
        }else
        {
          alert("Username wurde schon verwendet!");
        }
      }
    };
    xmlhttp2.send(JSON.stringify({"name": userName, "token":globalToken}));
}


/****************************************************************************
Sign Out
******************************************************************************/

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
	});
  location.reload();
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
};*/
