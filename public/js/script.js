$(document).ready(function () {
    $('#login-modal').modal('show');
});

$('#templatedevicelist').hide();
$('#channelslbl').hide();

$(".close").click(function () {
	clearSession();
});

$("#logout").click(function() {
	clearSession();
});

function clearSession() {
	$("#selectdevicetemplate").empty();
	$("#selectdevice").empty();
	$("#channels").empty();
}

if (userCredentials.enabled) {
	document.getElementById("email").defaultValue = userCredentials.username;
	document.getElementById("password").defaultValue = userCredentials.userPassword;
	document.getElementById("accountId").defaultValue = userCredentials.userXivelyAccountId;
}

const xi_id_url = "https://id.xively.eu/api/v1/auth/login-user";
const xi_bp_url = "https://blueprint.xively.eu/api/v1/";
const xi_ts_url = "https://timeseries.xively.eu/api/v4/data/xi/blue/v1/";

 // Create a base class
function user_account_data() {
 	emailAddress = "";
 	password = "";
 	accountId = "";
 	jwt = ""; // JSON Web Token
 	
 	deviceTemplates: [];
 	organizations: [];
     devices: [];
 	selectedDevice: null;
 	selectedDeviceData: [];
 	selectedChannel: null;
 	selectedDeviceChannels: [];
}

 // Create sub-class and extend UserProperties class.
 user_related_data.prototype = new user_account_data();
 user_related_data.constructor = user_related_data;

 function user_related_data (strProperty) {
     // Call super constructor.
     user_account_data.call( this );
     this.UserProperty = strProperty;
 }

 /* 
  * User login in
  */
 $("#login").click(function (e) {
 	
 	console.log("Logging user in...");
 	
 	if ($('input#email').val() !== "" && $('input#password').val() !== "" && $('input#accountId').val() !== ""){
 	    
 		e.preventDefault();
 		
 		// Create two instances of sub-class.
 	    userAccountData = new user_related_data( Math.round(Math.exp(Math.random()*Math.log(10000000-0+1)))+0 );
 	    
 	    // Update the simple property in the base class.
 	    userAccountData.emailAddress = document.getElementById("email").value;
 	    userAccountData.password = document.getElementById("password").value;
 	    userAccountData.accountId = document.getElementById("accountId").value;
 	    
 	 	// Log updated property profiles.
 		var data = JSON.stringify({
 			"emailAddress": userAccountData.emailAddress,
 	        "password": userAccountData.password,
 	        "accountId": userAccountData.accountId,
 	        "renewalType": ""
 		});
 		
 		var headers = new Headers();
         headers.append("Content-Type", "application/json");
         headers.append("Content-Length", data.length.toString());
         
         fetch(xi_id_url, {
         	method: "POST",
             headers: headers,
             body: data
         })
         .then(function(response) { return response.json(); })
         .then(function(data) {
         	
         	console.log("User logged in successfully");
             
             userAccountData.jwt = data.jwt;
             get_device_templates(); // Get the device template list
             
             $('#login-modal').modal('hide');
           get_organisations(); // Get the list of groups/organisations 
         }.bind(this)).catch(() => {
         	alert("Connection failed");
         });
 	}
 });
 
 
 /*
  * Get the list of device templates
  * returns the list of device templates within an account
  */
 function get_device_templates() {
 	
 	console.log("Getting device templates...");
 	
 	 var headers = new Headers();
      headers.append("Authorization", "Bearer " + userAccountData.jwt);
      headers.append("Content-Type", "application/json");
      
      fetch(xi_bp_url+'devices/templates?accountId=' + userAccountData.accountId, {
     	 method: "GET",
          headers: headers,
          cache: "no-store"
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
     	 console.log("Getting the devices templates: done");
           
     	 userAccountData.deviceTemplates = data.deviceTemplates.results;
         $select = $("#selectdevicetemplate").empty();
         $select.append('<option value="" disabled selected>Choose one of the devices templates...</option>');
         $.each(userAccountData.deviceTemplates, function(key, val){
        	 $select.append('<option id="' + key + '"' + ' templateId="' + val.id + '">' + val.name + '</option>');
         });
         $('#device_templates').modal('show');
      }.bind(this)).catch(() => {
    	  clearSession();
          alert("Couldn't fetch the device templates");	
      });
 }

 /*
  * Select a devices list of a device template
  * This gets all devices that are from a specific template
  */
 $("#selectdevicetemplate").change(function(){
 	
 	var device_template_id = $(this).children(":selected").attr("templateId");

 	var headers = new Headers();
     headers.append("Authorization", "Bearer " + userAccountData.jwt);
     headers.append("Content-Type", "application/json");
     
     fetch(xi_bp_url+'devices?accountId=' + userAccountData.accountId
             + '&deviceTemplateId=' + device_template_id
             + '&meta=true&results=true&page=1&pageSize=100&sortOrder=asc&', {
         method: "GET",
         headers: headers,
         cache: "no-store"
     })
     .then(function(response) { return response.json(); })
     .then(function(data) {
         console.log("Getting the device list: done");
         userAccountData.devices =  data.devices.results;
         
         $select = $("#selectdevice").empty();
         $select.append('<option value="" disabled selected>Choose one of the devices...</option>');
         $.each(userAccountData.devices, function(key, val){
         	$select.append('<option id="' + key + '"' + ' deviceId="' + userAccountData.devices[key].id + '">' + userAccountData.devices[key].serialNumber + '</option>');
         });
         $('#templatedevicelist').show();
         
     }.bind(this)).catch(() => {
         alert("Couldn't fetch devices for the selected template");
     });
     		
 });
 
 /*
  * On selected device 
  */
 $("#selectdevice").change(function(){
		
	var device_id = $(this).children(":selected").attr("deviceId");
	
	console.log("Getting a device data for id: " + device_id); 

	var headers = new Headers();
    headers.append("Authorization", "Bearer " + userAccountData.jwt);
    headers.append("Content-Type", "application/json");
    
    fetch(xi_bp_url+'devices/' + device_id, {
        method: "GET",
        headers: headers,
        cache: "no-store"
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        console.log("Device selected: done");
        userAccountData.selectedDeviceData = data;
        userAccountData.selectedDevice = data.device;
        userAccountData.selectedDeviceChannels = data.device.channels;
      	//console.log("Channel: " + JSON.stringify(data.device.channels));
      	$("label[for='channelslbl']").html(" Time Series available for device Id: " + userAccountData.selectedDevice.id);
      	$('#channelslbl').show();
      	
      	$channels = $("#channels").empty();
        $.each(userAccountData.selectedDeviceChannels, function(key, val){
         	
        	if (userAccountData.selectedDeviceChannels[key].persistenceType == "timeSeries") {

        		// Capitalise the first letter of the channel for display only
        		var channel_selected_capitalised = (userAccountData.selectedDeviceChannels[key].channelTemplateName).charAt(0).toUpperCase() + 
        			(userAccountData.selectedDeviceChannels[key].channelTemplateName).slice(1);

        		$channels.append('<div class="panel panel-primary">' + 
                  '<div class="panel-heading" role="tab" id="heading' + key + '">' +
                  '<h3 class="panel-title">' +
                  '<a role="button" data-toggle="collapse" data-parent="#channels" href="#collapse' + key + '" aria-expanded="true" aria-controls="collapse' + 
                  key + 
                  '" deviceId="' + userAccountData.selectedDevice.id + 
                  '" name="' + userAccountData.selectedDeviceChannels[key].channelTemplateName + '">' + 
                  (userAccountData.selectedDeviceChannels[key].channelTemplateName).charAt(0).toUpperCase() + (userAccountData.selectedDeviceChannels[key].channelTemplateName).slice(1) + 
                  '</a>' +
                  '</h3>' +
                  '</div>' +
                  '<div id="collapse' + key + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + key + '">' +
                  '<div class="panel-body">' +
                  '<div id="chartContainer-' + userAccountData.selectedDeviceChannels[key].channelTemplateName + '" style="height: 300px; width: 100%;">' +
                  '</div>' +
                  '</div>' +
                  '</div>' +
                  '</div>');
        	} 
        });

        var icons = {
        		header: "ui-icon-circle-arrow-e",
        	    activeHeader: "ui-icon-circle-arrow-s"
        };
        $("#channels").accordion({
        	icons: icons,
        	header: "h3",
        	collapsible: true,
        	active: false
        }); 

        $('#channels h3 a').on('click', function() {
            console.log($(this).attr("id"));
            get_device_channels_data($(this).attr("deviceId"), $(this).attr("name"));
            
        });
        $('#channels').accordion("refresh");

    }.bind(this)).catch(() => {
    	alert("Couldn't fetch device channels data on the selected device");
    });
});

/*
 * Get device channels
 */
function get_device_channels_data(device_id, channel_name) {
	
	console.log("Getting the device's channel " + channel_name + " data ...");
	
	var chartData = []; // chart
	var dataPoints = []; // chart
	var channel_name_capitalised = channel_name.charAt(0).toUpperCase() + channel_name.slice(1);
	var dataSeries = { type: "line", showInLegend: true, legendText: channel_name_capitalised}; // chart
	
	var char_container = "chartContainer-"+channel_name;
	
	var headers = new Headers();
    headers.append("Authorization", "Bearer " + userAccountData.jwt);
    headers.append("Content-Type", "application/json");
    
    fetch(xi_ts_url + userAccountData.accountId + '/d/' + device_id + "/" + channel_name + '/latest?pageSize=100', {
        method: "GET",
        headers: headers,
        cache: "no-store"
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        console.log(channel_name + " channel data published: done");
        
        $.each(data.result, function(key, val){
        	
         	dataPoints.push({
         		x: key, //new Date(data.result[key].time),
            	y: data.result[key].numericValue
            }); 
        });
        //console.log(dataPoints);
        dataSeries.dataPoints = dataPoints;
        chartData.push(dataSeries);
		
 		var chart = new CanvasJS.Chart(char_container, {
			zoomEnabled : true,
			animationEnabled : true,
			title : {
				text : "Device " + channel_name_capitalised + " variations! Zoom-in And Observe Axis Labels"
			},
			axisX : {
				labelAngle : 30,
				//valueFormatString : "DD/MM/YY hh:mm:ss", // valueFormatString : "DD/MM/YY hh:mm:ssz"
				title: "" // Reading number
			},
			axisY : {
				includeZero : true,
				title: "" // i.e. Â°C
			},
			data : chartData
		});
 		var char_container_id = "#" + char_container;
		chart.render();       
        //userAccountData.selectedDevice = device_id;
        //userAccountData.selectedDeviceChannels = data;

    }.bind(this))
    .catch(() => {
    	$('<P>Couldn\'t fetch device channel data</P>').appendTo("#"+char_container);
        console.log("Couldn't fetch device channel data");
    });
}

/*
 * Get the list of organisations
 */
function get_organisations() {
	
	console.log("Getting organisations...");
	
	var headers = new Headers();
    headers.append("Authorization", "Bearer " + userAccountData.jwt);
    headers.append("Content-Type", "application/json");
	//console.log(accountObj.deviceTemplates);
	fetch(xi_bp_url+'organizations?accountId=' + userAccountData.accountId, {
		method: "GET",
        headers: headers,
        cache: "no-store"
	})
	.then(function(response) { return response.json(); })
    .then(function(data) {
    	console.log("Getting the organisations: done");

    	userAccountData.organizations = data.organizations.results;
        console.log(userAccountData.organizations);
    }.bind(this)).catch(() => {
        alert("Couldn't fetch the organisations");
    });
}