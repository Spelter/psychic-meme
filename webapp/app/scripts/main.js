'use strict';
$(document).ready(function() {
    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/733e599a1fe841afaceb855b0ac0f833/{styleId}/256/{z}/{x}/{y}.png',
        cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';

    var Thunderforest_Transport = L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    });

    var rail   = L.tileLayer(cloudmadeUrl, {styleId: 33738, attribution: cloudmadeAttribution});
    var railAndRoad  = L.tileLayer(cloudmadeUrl, {styleId: 12790,   attribution: cloudmadeAttribution});

    var generatePieChartForCluster = function (latlng) {
        var colorValue = Math.random() * 360;
        var options = {
            color: '#000',
            weight: 1,
            fillColor: 'hsl(' + colorValue + ',100%,50%)',
            radius: 20,
            fillOpacity: 0.7,
            rotation: 0.0,
            position: {
                x: 0,
                y: 0
            },
            offset: 0,
            numberOfSides: 50,
            barThickness: 10
        };
        var delayedRandom = Math.random() * 100;
        options.data = {
            'On time': 100 - delayedRandom,
            'Delayed': delayedRandom
        };

        options.chartOptions = {
            'On time': {
                fillColor: '#00FF00',
                minValue: 0,
                maxValue: 100,
                maxHeight: 20,
                displayText: function (value) {
                    return value.toFixed(2) + '%';
                }
            },
            'Delayed': {
                fillColor: '#FF0000',
                minValue: 0,
                maxValue: 100,
                maxHeight: 20,
                displayText: function (value) {
                    return value.toFixed(2) + '%';
                }
            }
        };

        return new L.PieChartMarker(latlng, options);
    };

    //start clustermotoren
    var markers = new L.MarkerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var markers = cluster.getAllChildMarkers();
                //console.log(cluster.getLatLng());
                return L.divIcon({ html: markers.length, className: 'mycluster', iconSize: L.point(40, 30) });
                //return L.divIcon({ html: generatePieChartForCluster(cluster.getLatLng) + markers.length});
            }
        });

    var map = L.map('map', {
        center: new L.LatLng(64.4367, 16.39882),
        zoom: 5,
        layers: [Thunderforest_Transport, markers]
    });

    $.getJSON('lib/latlon-pretty.geojson')
        .done(function(data) {
        //Start "geoJson"-motoren til Leaflet. Den tar inn et JSON-objekt i en variabel. Denne har vi definert i JSON-filen i index.html
        var railStations = L.geoJson(data, {
            //onEachFeature: visPopup,//vi refererer til funksjonen vi skal kalle. Husk at funksjonen også er et objekt

            /*onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.tags.name);
            }*/
            pointToLayer: function (feature, latlng) {
                //var popupOptions = {maxWidth: 20};
                //var popupContent = feature.properties.tags.name;
                return generatePieChartForCluster(latlng);
                //return L.marker(latlng).bindPopup(popupContent);
            }
        });
 

        //legg til punktene til "layer control"
        markers.addLayer(railStations);
        map.layerControl.addOverlay(railStations, 'Datalag (geojson)');
    });


    var baseMaps = {
        'Rail': rail,
        'Rail and road': railAndRoad,
        'Thunderforest Transport' : Thunderforest_Transport
    };
    var overlayMaps = {
        'Datalag (cluster)' : markers
    };
    map.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    //definerer en liste vi skal samle punktene våre i
    var pointList = [];
    //definer en funksjon som vi skal kalle for hver feature som leses i L.geoJson()
    function visPopup(feature, layer) {
        //legg til et punkt i punktlisten. Punktet er en liste med "lat, lng"
        pointList.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);

        //knytter en popup til hver feature med strengen vi nettopp bygde
        var popupContent = feature.properties.tags.name;
        if (popupContent !== undefined){
            //layer.bindPopup(feature.properties.tags.name);
            layer.bindPopup(feature.properties.tags.name);
        }
    }

    //Sett opp stil til de nye sirkelmarkørene
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: '#ff7800',
        color: '#000',
        weight: 1,
        opacity: 1,
    };

    
});
