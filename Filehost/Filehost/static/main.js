function onSignIn(googleUser){
var profile = googleUser.getBasicProfile();
console.log('ID: ' + profile.getId());
console.log('Name: ' + profile.getName());
console.log('Image URL: ' + profile.getImageUrl());
console.log('Email: ' + profile.getEmail());
}

function signOut(){
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function(){
    console.log('User signed out');
  });
}

if (auth2.isSignedIn.get()){
  var profile = auth2.currentUser.get().getBasicProfile();
  console.log('ID: ' + profile.getID());
  console.log('Full Name: ' + profile.getName());
  console.log('Given Name: ' + profile.getGivenName());
  console.log('Family Name: ' + profile.getFamilyName());
  console.log('getImageUrl: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail());
}

gapi.load('auth2', function(){
  auth2 = gapi.auth2.init({
    client_id: 'CLIENT_ID.apps.googleusercontent.com',
    fetch_basic_profile: false,
    scope:'profile'
  });


auth2.signIn().then(function(){
  console.log(auth2.currentUser.get().getId());
});
});
