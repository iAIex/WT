var data = [
	["Hans", 1998],
	["Susan", 2001],
	["Peter", 1974]
];

class Person {
  constructor(name,year){
    this.name = name;
    this.year = year;
  }
  
  getAge(){
    return this.year - 2017;
  }
}

var persons = [];

for(i=0;i<data.length;i++){
  var newPers = new Person(data[i][0],data[i][1]);
  persons.push(newPers);
}

console.log(persons);