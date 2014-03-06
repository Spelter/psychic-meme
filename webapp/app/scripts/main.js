$(document).ready(function() {
    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/733e599a1fe841afaceb855b0ac0f833/{styleId}/256/{z}/{x}/{y}.png',
        cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';

    var rail   = L.tileLayer(cloudmadeUrl, {styleId: 33738, attribution: cloudmadeAttribution});
    var railAndRoad  = L.tileLayer(cloudmadeUrl, {styleId: 12790,   attribution: cloudmadeAttribution});

    //definerer en liste vi skal samle punktene våre i
    var pointList = [];
    //definer en funksjon som vi skal kalle for hver feature som leses i L.geoJson()
    function visPopup(feature, layer) {
        //legg til et punkt i punktlisten. Punktet er en liste med "lat, lng"
        pointList.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);

        //knytter en popup til hver feature med strengen vi nettopp bygde
        var popupContent = feature.properties.tags.name;
        if (popupContent != undefined)
            layer.bindPopup(feature.properties.tags.name);
    };

    //Sett opp stil til de nye sirkelmarkørene
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
    };
    //var railStations = new L.LayerGroup();
    /*var railStations = L.geoJson(rail2, {
        onEachFeature: visPopup,
        /*pointToLayer: function (feature, latlng) {
            var popupOptions = {maxWidth: 20};
            var popupContent = feature.properties.tags.name;
            if (popupContent != undefined)
         	 return L.marker(latlng).bindPopup(popupContent);
         	else
         	 return L.circleMarker(latlng);
        }
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
        pointToLayer: function (feature, latlng) {
            var popupOptions = {maxWidth: 20};
            var popupContent = feature.properties.tags.name;
            if (popupContent != undefined)
             return L.marker(latlng);
            else
             return L.circleMarker(latlng,geojsonMarkerOptions);
        }
    }); //.addTo(railStations)*/

    //start clustermotoren
    var markers = new L.MarkerClusterGroup({animateAddingMarkers: true});

    //legg til stasjons-laget til clustermotoren og legg til kartet
    
    //legg også til som eget lag i layer control
    //map.LayerControl.addOverlay(markers, "Datalag (cluster)");

    var map = L.map('map', {
        center: new L.LatLng(59.9102, 10.75656),
        zoom: 12,
        layers: [rail, markers]
    });

    var baseMaps = {
        "Rail": rail,
        "Rail and road": railAndRoad
    };
    var overlayMaps = {
        //"Rail stations" : railStations,
        "Datalag (cluster)" : markers
    }
    map.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);  

    /*
    L.marker([63.40909, 10.40641]).addTo(map)
    	.bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();

    L.circle([63.41696, 10.43367], 500, {
    	color: 'red',
    	fillColor: '#f03',
    	fillOpacity: 0.5
    }).addTo(map).bindPopup("I am a circle.");

    L.polygon([
    	[63.41266, 10.38826],
    	[63.40624, 10.40607],
    	[63.40361, 10.38367]
    ]).addTo(map).bindPopup("I am a polygon.");

    var popup = L.popup();

    function onMapClick(e) {
    	popup
    		.setLatLng(e.latlng)
    		.setContent("You clicked the map at " + e.latlng.toString())
    		.openOn(map);
    }

    map.on('click', onMapClick);*/

    $.getJSON("/lib/rail2.geojson")
    	.done(function(data) {
        //Start "geoJson"-motoren til Leaflet. Den tar inn et JSON-objekt i en variabel. Denne har vi definert i JSON-filen i index.html
        var railStations = L.geoJson(data, {
            onEachFeature: visPopup,//vi refererer til funksjonen vi skal kalle. Husk at funksjonen også er et objekt

		    pointToLayer: function (feature, latlng) {
		        var popupOptions = {maxWidth: 20};
		        var popupContent = feature.properties.tags.name;
		        if (popupContent != undefined)
		         return L.marker(latlng);
		        else
		         return L.circleMarker(latlng,geojsonMarkerOptions);
		    }
        });

    	

        //legg til punktene til "layer control"
        markers.addLayer(railStations);
        map.layerControl.addOverlay(railStations, "Datalag (geojson)");
    })
	.fail(function( jqxhr, textStatus, error ) {
	    var err = textStatus + ", " + error;
	    console.log( "Request Failed: " + err );
	});

});
