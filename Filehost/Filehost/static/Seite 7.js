function loadJSON(file,callback){
  var xobj = new XMLHHttpRequest();
  xobj.overrideMimeType('application/json');
  xobj.open('GET', file, true);
  xobj.onreadystatechange = function(){
    if(xobj.readyState == 4 && xobj.status == '200'){
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

loadJSON('/Users/Documents/GitHub/WT/Filehost/Filehost/static/dummy.html', function(text)
{
  var data = JSON.parse(text);
  console.log(data);
});
