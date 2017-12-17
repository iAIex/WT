var files = new Vue({
  el: "#files",
  data: {
    myFiles:[],

    sharedFiles:[]
  }
});

function myFiles(json){
    files.myFiles = [];
    for(i=0; i<json.length; i++){
      var temp = {};
      temp.name = json[i].filename;
      temp.datum = '21.01.2009';
      temp.teilenMit = 'Alex';
      files.myFiles.push(temp);
    }
}

function ajaxTest()
{
   xmlhttp = new XMLHttpRequest();
   xmlhttp.open("GET",window.location.href+"getUserFiles2", true);
   xmlhttp.onreadystatechange=function(){
         if (xmlhttp.readyState==4 && xmlhttp.status==200){
            myFiles(JSON.parse(xmlhttp.responseText));
         }
   }
   xmlhttp.send();
}
