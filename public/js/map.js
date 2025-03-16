mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: listing.geometry.coordinates,
    zoom: 10
});

// Create a marker and popup
const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`
        <h4>${listing.title}</h4>
        <p>${listing.location}, ${listing.country}</p>
        <p>₹${listing.price}/night</p>
    `);

// Add marker to map
new mapboxgl.Marker({ color: '#FF0000' })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(popup)  // Attach popup to marker
    .addTo(map);