var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/733e599a1fe841afaceb855b0ac0f833/{styleId}/256/{z}/{x}/{y}.png',
    cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';

var rail   = L.tileLayer(cloudmadeUrl, {styleId: 33738, attribution: cloudmadeAttribution});
var railAndRoad  = L.tileLayer(cloudmadeUrl, {styleId: 12790,   attribution: cloudmadeAttribution});

var railStations = new L.LayerGroup();
L.geoJson(rail2, {
            pointToLayer: function (feature, latlng) {
                var popupOptions = {maxWidth: 20};
                var popupContent = feature.properties.tags.name;
                if (popupContent != undefined)
             	 return L.marker(latlng).bindPopup(popupContent);
             	else
             	 return L.circleMarker(latlng);
            }
        }).addTo(railStations); 

var map = L.map('map', {
    center: new L.LatLng(59.9102, 10.75656),
    zoom: 12,
    layers: [rail, railStations]
});

var baseMaps = {
    "Rail": rail,
    "Rail and road": railAndRoad
};
var overlayMaps = {
	"Rail stations" : railStations
}
L.control.layers(baseMaps, overlayMaps).addTo(map);

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
