'use strict';
var map;
var railStations = new L.featureGroup();
var railStationsInfoBoxes = new L.featureGroup();
$(document).ready(function() {
    //var host = 'http://' + window.document.location.host.replace(/:.*/, ''); //for build
    var host = 'http://localhost:8080'; //for local testing
    var timeInterval = [];
    timeInterval.length = 4;
    L.Icon.Default.imagePath = '/images/';
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
    /*var markers = new L.MarkerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var markers = cluster.getAllChildMarkers();
                //console.log(cluster.getLatLng());
                //return L.divIcon({ html: markers.length, className: 'mycluster', iconSize: L.point(40, 30) });
                return L.divIcon({ html: generatePieChartForCluster(cluster.getLatLng)});
            }
        });*/

    map = L.map('map', {
        center: new L.LatLng(64.4367, 16.39882),
        zoom: 5,
        layers: [Thunderforest_Transport, railStations, railStationsInfoBoxes],
        worldCopyJump: true
    });
    /*$.getJSON('http://localhost:8080/rail/station')
        .done(function(data) {
        //Start "geoJson"-motoren til Leaflet. Den tar inn et JSON-objekt i en variabel. Denne har vi definert i JSON-filen i index.html
        L.geoJson(data, {
            //onEachFeature: visPopup,//vi refererer til funksjonen vi skal kalle. Husk at funksjonen også er et objekt

            /*onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.tags.name);
            }
            pointToLayer: function (feature, latlng) {
                //var popupOptions = {maxWidth: 20};
                var popupContent = feature.properties.tags.name;
                //return generatePieChartForCluster(latlng);
                return L.marker(latlng).bindPopup(popupContent);
            }
        }).addTo(railStations);
 

        //legg til punktene til "layer control"
        //markers.addLayer(railStations);
//        map.layerControl.addOverlay(railStations, 'Datalag (geojson)');
    });*/


    var baseMaps = {
        'Rail': rail,
        'Rail and road': railAndRoad,
        'Thunderforest Transport' : Thunderforest_Transport
    };

    var htmlList = "";

    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = htmlList;
    };

    $.getJSON(host + '/rail/section').done( function generateLayoutList(jsonList) {
                        var htmlListFromJson = '<div id="listContainer"><ul id="expList"><li>Norge<ul>';
                        for (var i = 0; i < jsonList.length; i++) {
                            htmlListFromJson += '<li>' + jsonList[i].omrade + '<ul>';

                            for (var j = 0; j < jsonList[i].baner.length; j++) {
                                htmlListFromJson += '<li>' + jsonList[i].baner[j].banesjef + '<ul>';
                                for (var k = 0; k < jsonList[i].baner[j].banestrekninger.length; k++) {
                                    htmlListFromJson += '<li>' + jsonList[i].baner[j].banestrekninger[k].banestrekning + '</li>';
                                };
                                htmlListFromJson += '</ul></li>';
                            };
                            htmlListFromJson += '</ul></li>';
                        };
                        htmlListFromJson += '</ul></li></ul></div>';
                        info._div.innerHTML = htmlListFromJson; 
                        createDemoList();
                    })
            .fail(function(jqxhr, textStatus, error){
                console.dir(arguments);
            });

    info.addTo(map);

    $('#theLink').click(function (event) {

    // This stops the link from actually being followed which is the 
    // default action 
    event.preventDefault();
    showAlert();
  });
    adaptMapToCurrentSelection('Norge');


    //map.layerControl = L.control.layers(baseMaps, overlayMaps, {position:'topRight'}).addTo(map);
    //map.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

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
    
    /*var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
    }

    map.on('click', onMapClick);*/

    function createDemoList () {                    
        $('#expList').find('li:has(ul)')
        .click( function(event) {
            if (this == event.target) {
                $(this).toggleClass('expanded');
                $(this).children('ul').toggle('medium');
            }
            adaptMapToCurrentSelection(event.target.firstChild.nodeValue);
            return false;
        })
        .addClass('collapsed')
        .children('ul').hide();

        //Create the button funtionality
        $('#expandList')
        .unbind('click')
        .click( function() {
            $('.collapsed').addClass('expanded');
            $('.collapsed').children().show('medium');
        })
        $('#collapseList')
        .unbind('click')
        .click( function() {
            $('.collapsed').removeClass('expanded');
            $('.collapsed').children().hide('medium');
        })
    }

    function adaptMapToCurrentSelection (searchName) {
        railStations.clearLayers();
        railStationsInfoBoxes.clearLayers();
        var coordinates = [];
        $.getJSON(host + '/rail/view/' + searchName)
            .done(function(data) {
            L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    var popupContent = feature.properties.tags.name;
                    coordinates.push(latlng);
                    var htmlIcon = L.divIcon({ className: 'iconbox', iconSize: new L.Point(50, 50), html: '<div class="info"> test</div>' });
                    //L.marker(latlng, {icon: htmlIcon}).addTo(railStationsInfoBoxes);
                    return L.marker(latlng, {icon: htmlIcon}).bindPopup(popupContent);
                    //return L.marker(latlng).bindPopup(popupContent);
                }
            }).addTo(railStations);
            map.fitBounds(new L.latLngBounds(coordinates).pad(0.2));
        });
    };

    L.Control.timeControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div');
            var datePickerContainer = L.DomUtil.create('div', 'info', container);
            var timeContainer = L.DomUtil.create('div', 'info', container);
            this._fromDate = this._createDateInput('fromDate', timeContainer);
            this._fromTime = this._createTimeInput('fromTime', timeContainer);
            this._toDate = this._createDateInput('toDate', timeContainer);
            this._toTime = this._createTimeInput('toTime', timeContainer);
            this._changeButton = this._createChangeTimeButton('changeTimeButton', timeContainer, 
                                                              this._changeTimeVariables, this);
            this._container = container;
            this._changeTimeVariables();
            //container.append($('#fromDate').glDatePicker(
            //{
                //dowOffset: 1

            //}));
        
            //this._update();
            return this._container;
        },

        _createDateInput: function (className, container) {
            var link = L.DomUtil.create('a', className, container);
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth() + 1;
            console.log(today.getTime());
            if (className === 'fromDate') {
                if (month > 1) {
                    month--;
                } else {
                    month = 12;
                }
            }
            if (month < 10) {
                month = '0' + month;
            }
            var date = today.getDate();
            if (date < 10) {
                date = '0' + date;
            }
            var html = '<input type="text" id ="' + className +'" name="'+className+'" value="'+year+'-'+month+'-'+date+'">';
            link.innerHTML = html;
            return link;
        },

        _createTimeInput: function (className, container) {
            var link = L.DomUtil.create('a', className, container);
            var today = new Date();
            var hours = today.getHours();
            var minutes = today.getMinutes();
            if (hours < 10) {
                hours = '0' + hours;
            };
            if (minutes < 10) {
                minutes = '0' + minutes;
            };
            var html = '<input type="text" name="'+className+'" value="'+hours+':'+minutes+'" size="2">';
            link.innerHTML = html;
            return link;
        },

        _createChangeTimeButton: function (className, container, fn, context) {
            var link = L.DomUtil.create('a', className, container);
            link.innerHTML = 'Change';
            link.href = '#';
            link.title = 'Change time interval';

            var stop = L.DomEvent.stopPropagation;

            L.DomEvent
                .on(link, 'click', stop)
                .on(link, 'mousedown', stop)
                .on(link, 'dblclick', stop)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', fn, context);
        },

        _changeTimeVariables: function  () {
            var newTimeInterval = [];
            newTimeInterval.length = 4;
            var dateRegex = /^(19|20)\d\d[- /.]((0[1-9]|[0-9])|1[012])[- /.]((0[1-9]|[1-9])|[12][0-9]|3[01])$/;
            var timeRegex = /^([\d]|[0-5][\d])[: /.]([\d]|[0-5][\d])$/;
            var fromDate = this._fromDate.children.fromDate.value;
            var toDate = this._toDate.children.toDate.value;
            var fromTime = this._fromTime.children.fromTime.value;
            var toTime = this._toTime.children.toTime.value;
            console.log(new Date(fromDate));
            console.log(toDate);
            if (dateRegex.test(fromDate) && dateRegex.test(toDate) &&
                timeRegex.test(fromTime) && timeRegex.test(toTime)) {
                newTimeInterval[0] = fromDate;
                newTimeInterval[2] = toDate; 
                newTimeInterval[1] = fromTime;
                newTimeInterval[3] = toTime;
                timeInterval = newTimeInterval;
            } else {
                console.log('Invalid time input');
            }
            //for (var i = 0; i < newTimeInterval.length; i++) {
            //    console.log(newTimeInterval[i]);
            //};
        }
    });

    var myButton = new L.Control.timeControl().addTo(map);
    /*$('#fromDate').glDatePicker(
    {
        dowOffset: 1

    });*/
});
