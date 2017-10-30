function hello(name){
  console.log("Hello, " + name);
}

function fibIter(n){
  var nums1 = [];
  
  for(var i = 0; i <= n; i++){
    if(i < 2){
      nums1.push(i);
    }else{
      nums1.push(nums1[i-2] + nums1[i-1]);
    }
  }
  console.log(nums1);
}

function fiberRecurs(n){
  if(n === 0 || n === 1){
    return n;
  }else{
    var temp = fiberRecurs(n - 1) + fiberRecurs(n - 2);
    return temp;
  }
}

hello("Alex");
fiberRecurs(10);
