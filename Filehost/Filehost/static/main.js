/*****************************************************************************
Sign In
*****************************************************************************/
var globalToken=false;
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
          if(JSON.parse(xmlhttp.responseText).isAuth!==true)
          {
            document.getElementById("logIn").style.display="none";
            document.getElementById("newUser").style.display="block";
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

/******************************************************************************
Nutzer erstellen bei erster Anmeldung auf der Seite
*****************************************************************************/
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
        if(JSON.parse(xmlhttp2.responseText).Userid!==0)
        {
          document.getElementById("newUser").style.display="none";
          document.getElementById("logIn").style.display="none";
          document.getElementById("body").style.display="block";
          getMyFiles();
        }else //Abfangen von gleichen Nutzernamen
        {
          alert("Username already taken!");
        }
      }
    };
    xmlhttp2.send(JSON.stringify({"name": userName, "token":globalToken}));
}

/*****************************************************************************
Dropbox
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
document.getElementById("dropbox").addEventListener("drop",function(e){
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
Eintragen der Nutzer mit denen die Datei geteilt wird
****************************************************************************/
var newShare = function(e)
{
  var leer=false;
  if(e.which === 13) //Durch drücken der Entertaste wird der Nutzer hinzugefügt
  {
    e.preventDefault();
    if(document.getElementById("inpGetShares").value=="")
    {
      alert("Invalid Username! Please correct your input!");
    }else
    {
    this.vshares.push(document.getElementById('inpGetShares').value);
    document.getElementById('inpGetShares').value="";
    }
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
              var response = JSON.parse(xmlhttp.responseText).ValidIds;
              var tempLength=share.vshares.length;
              share.vshares=[];
              for(var m=0; m<response.length; m++)
              {
                share.vshares=response.slice(0);
              }
              if(tempLength !== share.vshares.length)//Abfrage von ungültigen Nutzernamen
              {
                alert("Invalid Username! Please correct your input!");
              }
              else
              {
                uploadJson();
                share.vshares=[];
              }
           }
      };
     xmlhttp.send(JSON.stringify(name));
   }
}

/****************************************************************************
Hochladen der Dateien
****************************************************************************/
function uploadJson()
{
  if(upload.filesToUpload == 0)//Abfangen, falls keine Datei gedroppt wurde
  {
    alert("Put a File in the Dropbox!");
  }
  if(upload.filesToUpload.length>1)//Nur eine Datei kann hochgeladen werden
    {
      alert("Please only upload one file at a time!");
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
        alert("Filename already taken!");
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
    var fileid=new Blob ([upload.filesToUpload[0]],{type:'text/plain'});
    var xmlhttp2=new XMLHttpRequest();
    xmlhttp2.open("PUT", window.location.href+"upload/"+uploadId, true);
    xmlhttp2.setRequestHeader("Content-type", "application/octet-stream");
    xmlhttp2.setRequestHeader("wtfToken", globalToken);
    xmlhttp2.onreadystatechange=function()
    {
      if(xmlhttp2.readyState==4 && xmlhttp2.status==201)
      {
        getMyFiles();
        upload.filesToUpload=[];
      }
    };
    xmlhttp2.send(fileid);
}

/****************************************************************************
Anfrage nach allen eigens hochgeladenen Dateien des eingeloggten Nutzers
****************************************************************************/
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

/****************************************************************************
Auflisten der Datein, des eingeloggten Nutzers
******************************************************************************/
var maxPers=4; //Max. Anzahl an Namen hintereinander, mit denen die Datei geteilt wurden
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
      temp.datum = datum.getDate()+"."+datum.getMonth()+1+"."+datum.getFullYear();
      if(json[i].name == 0){
        temp.teilenMit = "Nobody";
      }else{
        for(var j=0;j<json[i].name.length;j++){
          if(j===0){
            temp.teilenMit=json[i].name[j];
          }else{
            if(j<maxPers){
              temp.teilenMit=temp.teilenMit+", "+json[i].name[j];
            }else if(j===maxPers){
              temp.teilenMit=temp.teilenMit+" + "+(json[i].name.length-maxPers)+
              " others";
            }
          }
        }
      }
      files.myFiles.push(temp);
    }
}

/*****************************************************************************
Löschen einer hochgeladenen Datei
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
           }
      };
     xmlhttp2.send(JSON.stringify(delId)); //ID der Datei wird gesendet zum löschen
}

/*****************************************************************************
Anfrage nach allen Dateien, die mit dem eingeloggten Nutzer geteilt wurden
******************************************************************************/
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
Auflisten der Dateien, die mit dem eingeloggten Nutzer geteilt wurden
******************************************************************************/
function sharedFiles(json){
    files.sharedFiles = [];
    for(var i=0; i<json.length; i++){
      var temp = {};
      temp.token=globalToken;
      temp.name = json[i].filename;
      temp.id=json[i].id;
      var datum = new Date(json[i].upload_time);
      temp.datum = datum.getDate()+"."+datum.getMonth()+1+"."+datum.getFullYear();
      temp.geteiltVon = json[i].name;
      files.sharedFiles.push(temp);
    }
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
      this.filesToUpload.splice(files, 1);//Durch draufklicken auf die Datei
                                          //wird diese aus der Dropbox gelöscht
    }
  }
});

var share = new Vue({
  el:'#shares',
  data:{
    vshares:[]
  },
  methods: {
    inpc: newShare,
    deleteNames: function(shares){
      this.vshares.splice(shares, 1);//Durch draufklicken auf einen Nutzernamen
                                     //wird dieser gelöscht
    }
  }
});

/****************************************************************************
Sign Out
******************************************************************************/
function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.disconnect().then(function () {
		console.log('User signed out.');
	});
  location.reload();
}

/*****************************************************************************
Hilfsfunktion
****************************************************************************/
function arrContainsObj(array, obj)//Abfrage ob es Namenskonflikte gibt
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
