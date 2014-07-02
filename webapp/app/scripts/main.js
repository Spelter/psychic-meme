'use strict';
var map;
var railStations = new L.featureGroup();        //Markers will be added here for presentation
var slowDrivingMarkers = new L.featureGroup();  //Own group for speed restriction
$(document).ready(function() {
    var host = 'http://' + window.document.location.host.replace(/:.*/, ''); //for build
    //var host = 'http://localhost:8080'; //for local testing
    var statisticalInformation = 'Crossings';   //Default information type to display
    var lastAreaOptionsClicked = 'Norge';       //Last stakeholder selected
    var timeInterval = [];                      //Selected time interval
    timeInterval.length = 4;
    L.Icon.Default.imagePath = '/images/';

    //Map tiles

    var Thunderforest_Transport = L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    });

    map = L.map('map', {
        center: new L.LatLng(64.4367, 16.39882),
        zoom: 5,
        layers: [Thunderforest_Transport, railStations, slowDrivingMarkers],
        worldCopyJump: true
    });

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

    //Generate interactive list for selecting stakeholder
    $.getJSON(host + '/rail/section').done( function generateLayoutList(jsonList) {
                        var htmlListFromJson = '<div id="listContainer"><ul><li>Norge<ul id="expList">';
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
                        generateClickableCountryList();
                    })
            .fail(function(jqxhr, textStatus, error){
                console.dir(arguments);
            });

    info.addTo(map);

    //Used in interactive stakeholder selection
    $('#theLink').click(function (event) {
    // This stops the link from actually being followed which is the 
    // default action 
    event.preventDefault();
    showAlert();
    });
    adaptMapToCurrentSelection(lastAreaOptionsClicked);

    //If needed to get coordinates on mouse click
    /*var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
    }

    map.on('click', onMapClick);*/

    //Makes stakeholder interactive
    function generateClickableCountryList () {                    
        $('#expList').find('li:has(ul)')
        .click( function(event) {
            if (this == event.target) {
                $(this).toggleClass('expanded');
                $(this).children('ul').toggle('medium');
            }
            //Plots new markers for selected stakeholders
            lastAreaOptionsClicked = event.target.firstChild.nodeValue;
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

    /* 
    Method for calls to back-end.
    Fetches and plots all markers based on current stakeholder.
     */
    function adaptMapToCurrentSelection (searchName) {
        railStations.clearLayers();
        slowDrivingMarkers.clearLayers();
        var coordinates = [];
        $.getJSON(host + '/rail/view/' + searchName)
            .done(function(data) {
            L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    var popupContent = feature.properties.tags.name;
                    coordinates.push(latlng);
                    var htmlIcon = L.divIcon({ className: 'iconbox', iconSize: new L.Point(50, 50), html: '<div class="dashboard" id="' + popupContent + '"></div>' });
                    //Generate markers with dashboard
                    if (statisticalInformation === 'Crossings') {
                        $.getJSON(host + '/rail/numberOfCrossings/' + timeInterval[0] + '/' +
                                            timeInterval[2] + '/' + popupContent).
                            done(function (data) {
                                   $('#' + popupContent).html('Crossings: ' + data.numberOfCrossings);
                            });
                    } else if (statisticalInformation === 'Density') {
                        $.getJSON(host + '/rail/trafficDensity/' + popupContent + '/' + timeInterval[0] + '/' +
                                            timeInterval[2]).
                            done(function (data) {
                                   $('#' + popupContent).html('Density: ' + data[0].count);
                            });
                    }
                    return L.marker(latlng, {icon: htmlIcon}).bindPopup(popupContent);
                    //return L.marker(latlng).bindPopup(popupContent);
                }
            }).addTo(railStations);
        });
        //Own call for speed restrictions since they plots independent of stakeholders right now
        if (statisticalInformation === 'Speed restriction') {
            $.getJSON(host + '/rail/slowDriving/')
                .done(function(data) {
                   L.geoJson(data, {
                    pointToLayer: function (feature, latlng) {
                        //var popupContent = feature.properties.tags.name;
                        var popupContent = '<img src="images/' + feature.properties.tags.name + 
                                '.png" alt="' + feature.properties.tags.name + '"width="600" height="600">';
                        console.log(popupContent);
                        coordinates.push(latlng);
                        return L.marker(latlng).bindPopup(popupContent, {maxWidth: 1400, maxHeight: 800});
                        //return L.marker(latlng).bindPopup(popupContent);
                    }
                }).addTo(slowDrivingMarkers);
            }); 
        }
    };

    //Adds custom time selection at bottom of map
    L.Control.timeControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'info');
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
            var startDate = new Date('2012-02-01');
            var year = startDate.getFullYear();
            var month = startDate.getMonth() + 1;
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
            var date = startDate.getDate();
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
            if (dateRegex.test(fromDate) && dateRegex.test(toDate) &&
                timeRegex.test(fromTime) && timeRegex.test(toTime)) {
                newTimeInterval[0] = fromDate;
                newTimeInterval[1] = fromTime;
                newTimeInterval[2] = toDate; 
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
    
    //Adds custom top 5 list at bottom of map
    L.Control.top5Lists = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'info');
            this._list = this._generateList('topList', container);
            this._container = container;
            return this._container;
        },

        _generateList: function (className, container) {
            var link = L.DomUtil.create('a', className, container);
            var html = 'Top 5 stations with crossings:<br>' +
                       '1: OSL 8 400<br>' +
                       '2: LYS 3 400<br>' +
                       '3: LLS 451<br>' +
                       '4: OTT 300<br>' +
                       '5: REN 162';
            link.innerHTML = html;
            return link;
        }
    });

    //Adds interacte information type selection
    L.Control.changeStatisticalInformation = L.Control.extend({
        options: {
            position: 'topleft'
        },
        
        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'info');
            this._statInfo = this._createChangeInformation('changeStatisticalInformation', container, 
                                                              this._changeInformation, this);
            this._container = container;
            return this._container;
        },

        _createChangeInformation: function (className, container, fn, context) {
            var link = L.DomUtil.create('a', className, container);
            var html =  'Select views:' +
                        '<ul id="infoChangeList">' +
                            '<li>Crossings' +
                            '<li>Speed restriction' +
                            '<li>Density' +
                        '</ul>';
            link.innerHTML = html;

            return link;
        }
    });

    //Adds custom elements to the map
    var timeControl = new L.Control.timeControl().addTo(map);
    var top5Lists = new L.Control.top5Lists().addTo(map);
    var statInfo = new L.Control.changeStatisticalInformation().addTo(map);

    $('#infoChangeList').on('click', 'li', function(event) {
        statisticalInformation = event.currentTarget.firstChild.nodeValue;
        adaptMapToCurrentSelection(lastAreaOptionsClicked);
    });
});
