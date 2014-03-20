$(document).ready(function() {
    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/733e599a1fe841afaceb855b0ac0f833/{styleId}/256/{z}/{x}/{y}.png',
        cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';

    var rail   = L.tileLayer(cloudmadeUrl, {styleId: 33738, attribution: cloudmadeAttribution});
    var railAndRoad  = L.tileLayer(cloudmadeUrl, {styleId: 12790,   attribution: cloudmadeAttribution});

    
    //start clustermotoren
    var markers = new L.MarkerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var markers = cluster.getAllChildMarkers();
                return L.divIcon({ html: markers.length, className: 'mycluster', iconSize: L.point(40, 30) });
            }
    });

    var map = L.map('map', {
        center: new L.LatLng(64.4367, 16.39882),
        zoom: 5,
        layers: [rail, markers]
    });

    $.getJSON("lib/latlon-pretty.geojson")
        .done(function(data) {
        //Start "geoJson"-motoren til Leaflet. Den tar inn et JSON-objekt i en variabel. Denne har vi definert i JSON-filen i index.html
        var railStations = L.geoJson(data, {
            //onEachFeature: visPopup,//vi refererer til funksjonen vi skal kalle. Husk at funksjonen også er et objekt

            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.tags.name);
            }
            /*pointToLayer: function (feature, latlng) {
                //var popupOptions = {maxWidth: 20};
                var popupContent = feature.properties.tags.name;
                return L.marker(latlng).bindPopup(popupContent);
            }*/
        });

               //Custom radius and icon create function
        /*var markers = L.markerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var markers = cluster.getAllChildMarkers();
                var n = 0;
                for (var i = 0; i < markers.length; i++) {
                    n += markers[i].number;
                }
                return L.divIcon({ html: n, className: 'mycluster', iconSize: L.point(40, 40) });
            },
            //Disable all of the defaults:
            spiderfyOnMaxZoom: false, showCoverageOnHover: false, zoomToBoundsOnClick: false
        });*/
 

        //legg til punktene til "layer control"
        markers.addLayer(railStations);
        map.layerControl.addOverlay(railStations, "Datalag (geojson)");
    });


    var baseMaps = {
        "Rail": rail,
        "Rail and road": railAndRoad
    };
    var overlayMaps = {
        "Datalag (cluster)" : markers
    }
    map.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);  

    //definerer en liste vi skal samle punktene våre i
    var pointList = [];
    //definer en funksjon som vi skal kalle for hver feature som leses i L.geoJson()
    function visPopup(feature, layer) {
        //legg til et punkt i punktlisten. Punktet er en liste med "lat, lng"
        pointList.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);

        //knytter en popup til hver feature med strengen vi nettopp bygde
        var popupContent = feature.properties.tags.name;
        if (popupContent != undefined)
            //layer.bindPopup(feature.properties.tags.name);
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


});
    /*

    var popup = L.popup();

    function onMapClick(e) {
    	popup
    		.setLatLng(e.latlng)
    		.setContent("You clicked the map at " + e.latlng.toString())
    		.openOn(map);
    }

    map.on('click', onMapClick);*/
