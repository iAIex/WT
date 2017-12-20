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
    files.sharedFiles = [];
    for(i=0; i<json.length; i++){
      var temp = {};
      temp.name = json[i].filename;
      temp.datum = '21.03.2010';
      temp.geteiltVon = 'Alex';
      files.sharedFiles.push(temp);
    }
}

function getMyFiles(userId)
{

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
              myFiles(JSON.parse(xmlhttp.responseText));
           }

         };
        xmlhttp.send();
    }
}

function getSharedFiles(userId)
{
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
              sharedFiles(JSON.parse(xmlhttp.responseText));
           }
     };
     xmlhttp.send();
   }
}

getMyFiles(2);
