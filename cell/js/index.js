// JavaScript Document
/***********************************
        Declarations
***********************************/
var pages = [];
var links = [];
var zoomButtons = [];
var numZoomButtons = 0;
var zoomLevel = 0;
var numLinks = 0;
var numPages = 0;
var pageshow = null;
var tap = null;
var shakeWatchStatus;
var dataArray = [];
var dataTemp = {};
var map;
var latitudedata;
var longitudedata;
var myLatlng;
var randomLat;
var randomLng;
var ranLatlng;
var directionsDisplay;
var directionsService;
var meters = 1000;
var mapImage = new Image();

/***********************************
        Set up functions
***********************************/
window.addEventListener("DOMContentLoaded", init);

function init() {
  pageshow = document.createEvent("Event");
  pageshow.initEvent("pageshow", true, true);

  tap = document.createEvent("Event");
  tap.initEvent("tap", true, true);

  pages = document.querySelectorAll('[data-role="page"]');
  numPages = pages.length;

  links = document.querySelectorAll('[data-role="link"]');
  numLinks = links.length;

  zoomButtons = document.querySelectorAll(".zoomButton li");
  numZoomButtons = zoomButtons.length;

  if (localStorage.getItem("data") != null) {
    dataArray = JSON.parse(localStorage.getItem("data"));
  }

  //if ('localStorage' in window) {
  // localStorage.clear();
  //}
  onDeviceReady();
}
/***********************************
       General Interactions
***********************************/
function onDeviceReady(ev) {
  for (var lnk = 0; lnk < numLinks; lnk++) {
    if (detectTouchSupport()) {
      links[lnk].addEventListener("touchend", handleTouchEnd);
      links[lnk].addEventListener("tap", handleLinkClick);
    } else {
      links[lnk].addEventListener("click", handleLinkClick);
    }
  }

  document.querySelector("#home").addEventListener("pageshow", pageOneStuff);
  document.querySelector("#two").addEventListener("pageshow", pageTwoStuff);
  document.querySelector("#three").addEventListener("pageshow", pageThreeStuff);

  applyCSS("home");
  document.querySelector("#home").dispatchEvent(pageshow);
}

function handleTouchEnd(ev) {
  ev.preventDefault();
  var target = ev.currentTarget;
  target.dispatchEvent(tap);
}

function handleLinkClick(ev) {
  ev.preventDefault();
  var href = ev.currentTarget.href;
  var parts = href.split("#");
  applyCSS(parts[1]);
  var id = "#" + parts[1];
  document.querySelector(id).dispatchEvent(pageshow);
}

function applyCSS(pageid) {

  if (pageid == null || pageid == "undefined") {
    //show the home page
    pageid = pages[0].id;
  }

  for (var pg = 0; pg < numPages; pg++) {
    if (pages[pg].id === pageid) {
      pages[pg].className = "show";
    } else {
      pages[pg].className = "hide";
    }
  }

  for (var lnk = 0; lnk < numLinks; lnk++) {
    links[lnk].className = "";
  }
  document.querySelector('[href="#' + pageid + '"]').className = "activetab";
}

function detectTouchSupport() {
  msGesture = navigator && navigator.msPointerEnabled && navigator.msMaxTouchPoints > 0 && MSGesture;
  touchSupport = (("ontouchstart" in window) || msGesture || (window.DocumentTouch && document instanceof DocumentTouch));
  return touchSupport;
}

function detectShakeWatchOff() {
  if (shakeWatchStatus) {
    shake.stopWatch();
    shakeWatchStatus = false;
  }
}


/***********************************
          PageOne Stuff
***********************************/
function pageOneStuff() {

  shake.startWatch(onShake);
  shakeWatchStatus = true;
}

function onShake() {
  var options = new ContactFindOptions();
  options.filter = "";
  var filter = ["displayName", "phoneNumbers", "photos"];
  options.multiple = "true";
  navigator.contacts.find(filter, successFunc, errFunc, options);
}

function successFunc(matches) {
  var length = matches.length;
  alert("You have " + length + " contacts");
  var selected = Math.floor(Math.random() * length);
  var phoneNumber = matches[selected].phoneNumbers[0].value;
  var displayName = matches[selected].displayName;
  var photo = matches[selected].photos[0].value;

  dataTemp = photo + "#" + displayName + "#" + phoneNumber;
  uploadLocalstorage();
  alert("Lucky guy is " + displayName + "!");
  document.location.href = "tel:" + phoneNumber;
}

function errFunc() {
  alert("Get failed, try again!");
}

/***********************************
          PageTwo Stuff
***********************************/

function pageTwoStuff() {
  document.querySelector(".zoomButton").style.display = "none";
  document.getElementById("loading_b").className = "show";
  detectShakeWatchOff();
  detectGeoSupport();
  for (var i = 0; i < numLinks; i++) {
    if (detectTouchSupport()) {
      zoomButtons[i].addEventListener("touchend", handleTouchEnd);
      zoomButtons[i].addEventListener("tap", handleButtonClick);
    } else {
      links[lnk].addEventListener("click", handleButtonClick);
    }
  }
}

function handleButtonClick(ev) {
  ev.preventDefault();
  zoomLevel = Number(ev.currentTarget.id);
  initMap();
}

function detectGeoSupport() {
  if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(dealPositionData, gpsError);
  } else {
    alert("Your browser does not support geolocation function.");
  }
}

function dealPositionData(position) {
  latitudedata = position.coords.latitude;
  longitudedata = position.coords.longitude;
  myLatlng = new google.maps.LatLng(latitudedata, longitudedata);

  document.querySelector(".zoomButton").style.display = "block";
  document.getElementById("loading_b").className = "hide";

  if (meters <= 30) {
    alert('Congratulation, you almost reach the target(<=30m)');
  }
}

function gpsError(error) {
  var errors = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout'
  };
  alert("Error: " + errors[error.code]);
}

function initMap() {
  document.getElementById("loading").className = "show";
  /////////init Map///////////
  directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true
  });

  var myOptions = {
    zoom: zoomLevel,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  map = new google.maps.Map(document.getElementById("mapCanvas"), myOptions);

  google.maps.event.addListenerOnce(map, 'bounds_changed', setMarker);

}
////////////set Marker///////////
function setMarker() {
  var bounds = map.getBounds();
  var northEast = [bounds.getNorthEast().lat(), bounds.getNorthEast().lng()];
  var southWest = [bounds.getSouthWest().lat(), bounds.getSouthWest().lng()];

  var eastWestRange = Math.abs(Math.abs(northEast[1]) - Math.abs(southWest[1]));
  var northSouthRange = Math.abs(Math.abs(northEast[0]) - Math.abs(southWest[0]));

  randomLat = (Math.random() * northSouthRange);
  randomLat += Math.min(southWest[0], northEast[0]);
  randomLng = (Math.random() * eastWestRange);
  randomLng += Math.min(southWest[1], northEast[1]);

  ranLatlng = new google.maps.LatLng(randomLat, randomLng);

  var marker_current = new google.maps.Marker({
    position: myLatlng,
    map: map,
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    title: "Current"
  });

  var maker_random = new google.maps.Marker({
    position: ranLatlng,
    map: map,
    icon: "http://map.google.com/mapfiles/ms/icons/red-dot.png",
    title: "Random"
  });
  calcRoute();
}
////////////Calculate Route///////////
function calcRoute() {
  directionsService = new google.maps.DirectionsService();
  var request = {
    origin: myLatlng,
    destination: ranLatlng,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
      directionsDisplay.setMap(map);
    }
  });
  getDistance();
}

////////////Get Distance///////////////
function getDistance() {
  meters = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(myLatlng, ranLatlng));
  document.getElementById("distance").innerHTML = meters + "m";
  saveMapImage();
}

////////////saveMapImage///////////////
function saveMapImage() {
  mapImage.crossOrigin = "Anonymous";
  mapImage.src = 'https://maps.googleapis.com/maps/api/staticmap?center=(' + latitudedata + ',' + longitudedata + ')&zoom=' + (zoomLevel - 2) + '&size=95x95&markers=color:green|label=A|' + latitudedata + ',' + longitudedata + '&markers=color:red|label=B|' + randomLat + ',' + randomLng + '&sensor=false';
  console.log(mapImage.src);
  mapImage.onload = function() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    context.drawImage(mapImage, 0, 0);
    var thumbnail = canvas.toDataURL("image/png");
    dataTemp = thumbnail + "#" + Math.round(latitudedata * 100) / 100 + "#" + Math.round(longitudedata * 100) / 100;
    uploadLocalstorage();
    document.getElementById("loading").className = "hide";
  }
}

/***********************************
          PageThree Stuff
***********************************/
////////////Upload Localstorage Support///////////////
function uploadLocalstorage() {
  if ('localStorage' in window) {
    //localStorage.clear();
    dataArray.push(dataTemp);
    localStorage.setItem("data", JSON.stringify(dataArray));
  } else {
    alert("Your browser does not support LocalStorage");
  }
}

////////////Get LocalStorage///////////////
function pageThreeStuff() {
  var ul = document.querySelector(".data");
  ul.innerHTML = "<h1>Latest:</h1>";
  var data = JSON.parse(localStorage.getItem("data"));
  for (var i = data.length - 1; i >= 0; i--) {
    var newData = data[i].split("#");
    var result = document.createElement("li");
    result.innerHTML = '<img src="' + newData[0] + '"/><div>' + newData[1] + '</div><div>' + newData[2] + '</div>';
    ul.appendChild(result);
  }
}