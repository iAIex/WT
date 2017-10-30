var xhr = new XMLHttpRequest();
xhr.open('GET', '//openmensa.org/api/v2/canteens/229/days/20171026/meals');
xhr.onload = function() {
  console.log('meh');
    if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        processMenu(data);
    }
    else {
        console.log('Request failed.  Returned status of ' + xhr.status);
    }
};
xhr.send();

/** 
	Takes the openmensa JSON output and transforms it into
	an array of Meal instances.
*/
/*function processData(data) {
	// TODO

	return ???
}*/

function processMenu(data){
  console.log(data.length);
  
  for(var i = 0;i<data.length;i++){
    console.log(data[i]);
    console.log("---------------------------------------")
  }
}

class Meal{
  constructor(name,ingredients){
    this.name = name;
    this.ingredients = ingredients;
  }
  
  isVegan(){
    
  }
}