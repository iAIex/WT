$.ajax({
    url: '//openmensa.org/api/v2/canteens/229/days/20171109/meals'
    })
    .done(function (data) {
        var meals = processMenu(data);
        renderMenu(meals);
    });

function renderMenu(meals) {
  $('tbody').empty();
  for(var i=0;i<meals.length;i++){
    $('tbody').append(
      $('<tr>').text(meals[i].getName())
    );

    if(meals[i].isVegan()){
    	$("tbody :nth-child("+(i+1)+")").addClass("danger");
    }else if(meals[i].isVegetarian()){
    	$("tbody :nth-child("+(i+1)+")").addClass("warning");
    }
   }

function Meal(name, ingredients) {
  var vegan = true;
  var vegetarian = true;
  var glutenfree = true;
  var chicken = false;

  this.getName = function() { return name; };
  this.hasPork = function () { return ingredients.includes("Schweinefleisch"); };
  this.hasChicken = function () { return ingredients.includes("H�hnerfleisch"); };
  this.hasBeef = function () { return ingredients.includes("Rindfleisch"); };
  this.isGlutenFree = function() {
    return !ingredients.includes("Glutenhaltiges Getreide");
  };
  this.isVegetarian = function () { return !(
    ingredients.includes("Rindfleisch") ||
    ingredients.includes("Schweinefleisch") ||
    ingredients.includes("Kalbfleisch"));
  };
  this.isVegan = function () {
    return this.isVegetarian() && !(ingredients.includes("H�hnerei") || ingredients.includes("Milch und Laktose") || ingredients.includes("Fisch"));
  };
}

function processMenu(data) {
  var meals = data
    .filter(function(x) {
      return x.category === 'Self-Service';
    })
    .map(function(x) {
      return new Meal(x.name, x.notes);
    });
  return meals;
}
}
