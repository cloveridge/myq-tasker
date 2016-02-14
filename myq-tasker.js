/*
 *	MyQ Library
 * Allows you to control and read data from most MyQ devices,
 *	such as Liftmaster and Chamberlain garage door openers.
 *	--------
 *	Designed for Tasker & MyQ Garage Door openers
 *	Made by: Enlil (Invisimine)
 */

 
/* CONFIG */
const MYQ_USER = ""; // e-mail address
const MYQ_PASS = ""; // password


/*
 * DO NOT MODIFY ANYTHING UNDER THIS LINE UNLESS YOU KNOW WHAT YOU'RE DOING!!
 */

 // Constants
const MYQ_API = "https://myqexternal.myqdevice.com"
const APP_ID = "OA9I/hgmPHFp9RYKJqCKfwnhh28uqLJzZ9KOJf1DXoo8N2XAaVX6A1wcLYyWsnnv";

// Variables
var region = "en";
var token = "";
var errorMsg = "";
var errorCode = "";


function taskerGarage(desiredstate, doorId)
{
	if (desiredstate != "close" && desiredstate != "open") {
		if (desiredstate != "0" && desiredstate != "1") {
			flash("Invalid door state request.");
			return;
		}
	} else {
		if (desiredstate == "close") {
			desiredstate = "0";
		} else if (desiredstate == "open") {
			desiredstate = "1";
		}
	}
	
	authenticate(function(res) {
		if (!res) {
			flash(errorCode + ": " + errorMsg);
			return;
		}
		getRegion(function(res, newRegion) {
			if (!res) {
				flash("Warning! " + errorCode + ": " + errorMsg);
			} else {
				region = newRegion;
			}
			getDevicesDetails(function(res, devices) {
				if (!res) {
					flash(errorCode + ": " + errorMsg);
					return;
				}
				if (typeof doorId !== "undefined" && doorId > 0) {
					putDeviceAttribute(doorId, "desireddoorstate", desiredstate, garageStateChanged);
					return;
				}
				var garageDoors = [];
				for (var i = 0; i < devices.length; i++) {
					if (devices[i]["MyQDeviceTypeName"] == "GarageDoorOpener") {
						for (var j = 0; j < devices[i]["Attributes"].length; j++) {
							if (devices[i]["Attributes"][j]["AttributeDisplayName"] == "desc") {
								garageDoors.push({"doorId": devices[i]["MyQDeviceId"], "doorDesc": devices[i]["Attributes"][j]["Value"]});
							}
						}
					}
				}
				if (garageDoors.length < 1) {
					flashLong("No garage doors found");
					return;
				} else if (garageDoors.length > 1) {
					flashLong("Multiple garage doors found. This is currently not supported.");
					return;
				} else {
					putDeviceAttribute(garageDoors[0]["doorId"], "desireddoorstate", desiredstate, garageStateChanged);
					return;
				}
			});
		});
	});
}

function garageStateChanged(res, time)
{
	if (res) {
		if (time > 0) {
			flashLong("Garage door state change seems successful");
			say('Garage door state changed.', 'undefined', 'undefined', 'media', 6, 6);
		} else {
			flashLong("Garage door state change does not seem successful");
			say('Garage door state does not seem to have changed.', 'undefined', 'undefined', 'media', 6, 6);
		}
	} else {
		flashLong("Garage door state change failed");
		say('Garage door state failed to change.', 'undefined', 'undefined', 'media', 6, 6);
	}
}

///

function authenticate(callback)
{
	var data = {
		"username": MYQ_USER,
		"password": MYQ_PASS
	};
	var url = MYQ_API + "/api/v4/User/Validate";
	
	var httpReq = new XMLHttpRequest();
	httpReq.onload = function() {
		var result = JSON.parse(this.responseText);
		if (result["ErrorMessage"].length == 0) {
			token = result["SecurityToken"];
			callback(true); // Successfully Authenticated
		} else {
			errorMsg = result["ErrorMessage"];
			errorCode = result["ReturnCode"];
			callback(false); // Failed to authenticate
		}
	}
	httpReq.open("POST", url);
	httpReq.setRequestHeader("SecurityToken", token);
	httpReq.setRequestHeader("Culture", region);
	httpReq.setRequestHeader("MyQApplicationId", APP_ID);
	httpReq.setRequestHeader("Content-Type", "application/json");
	httpReq.send(JSON.stringify(data));
}

function getRegion(callback)
{
	var url = MYQ_API + "/api/v4/User/GetUserCulture";
	
	var httpReq = new XMLHttpRequest();
	httpReq.onload = function() {
		var result = JSON.parse(this.responseText);
		if (result["ErrorMessage"].length == 0) {
			callback(true, result["CultureCode"]); // Request was successful
		} else {
			errorMsg = result["ErrorMessage"];
			errorCode = result["ReturnCode"];
			callback(false, ""); // Request failed
		}
	}
	httpReq.open("GET", url);
	httpReq.setRequestHeader("SecurityToken", token);
	httpReq.setRequestHeader("Culture", region);
	httpReq.setRequestHeader("MyQApplicationId", APP_ID);
	httpReq.send();
}

function getDevicesDetails(callback)
{
	var url = MYQ_API + "/api/v4/UserDeviceDetails/Get?filterOn=true";
	
	var httpReq = new XMLHttpRequest();
	httpReq.onload = function() {
		var result = JSON.parse(this.responseText);
		if (typeof result["error"] === "undefined") {
			callback(true, result["Devices"]); // Request was successful
		} else {
			errorMsg = (typeof result["ErrorMessage"] === "undefined") ? result["error_description"] : result["ErrorMessage"];
			errorCode = (typeof result["ReturnCode"] === "undefined") ? result["error"] : result["ReturnCode"];
			callback(false, ""); // Request failed
		}
	}
	httpReq.open("GET", url);
	httpReq.setRequestHeader("SecurityToken", token);
	httpReq.setRequestHeader("Culture", region);
	httpReq.setRequestHeader("MyQApplicationId", APP_ID);
	httpReq.send();
}

function getDeviceAttribute(deviceId, attribute, callback)
{
	var url = MYQ_API + "/api/v4/DeviceAttribute/GetDeviceAttribute?myQDeviceId=" + deviceId + "&attributeName=" + attribute;
	
	var httpReq = new XMLHttpRequest();
	httpReq.onload = function() {
		var result = JSON.parse(this.responseText);
		if (typeof result["error"] === "undefined") {
			callback(true, result["AttributeValue"]); // Request was successful
		} else {
			errorMsg = (typeof result["ErrorMessage"] === "undefined") ? result["error_description"] : result["ErrorMessage"];
			errorCode = (typeof result["ReturnCode"] === "undefined") ? result["error"] : result["ReturnCode"];
			callback(false, ""); // Request failed
		}
	}
	httpReq.open("GET", url);
	httpReq.setRequestHeader("SecurityToken", token);
	httpReq.setRequestHeader("Culture", region);
	httpReq.setRequestHeader("MyQApplicationId", APP_ID);
	httpReq.send();
}

function putDeviceAttribute(deviceId, attributeName, attributeValue, callback)
{
	var data = {
		"AttributeValue": attributeValue,
		"myQDeviceId": deviceId,
		"attributeName": attributeName
	};
	var url = MYQ_API + "/api/v4/DeviceAttribute/PutDeviceAttribute";
	
	var httpReq = new XMLHttpRequest();
	httpReq.onload = function() {
		var result = JSON.parse(this.responseText);
		if (typeof result["error"] === "undefined") {
			callback(true, result["UpdatedTime"]); // Request was successful
		} else {
			errorMsg = (typeof result["ErrorMessage"] === "undefined") ? result["error_description"] : result["ErrorMessage"];
			errorCode = (typeof result["ReturnCode"] === "undefined") ? result["error"] : result["ReturnCode"];
			callback(false, ""); // Request failed
		}
	}
	httpReq.open("PUT", url);
	httpReq.setRequestHeader("SecurityToken", token);
	httpReq.setRequestHeader("Culture", region);
	httpReq.setRequestHeader("MyQApplicationId", APP_ID);
	httpReq.setRequestHeader("Content-Type", "application/json");
	httpReq.send(JSON.stringify(data));
}