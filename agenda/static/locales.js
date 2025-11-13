async function get_maps_locale() {
    let map;
    let center;
    
    async function initMap() {
        const { Map } = await google.maps.importLibrary("maps");
        center = { lat: -23.6639484, lng: -46.5080881};
        map = new Map(document.getElementById('map'), {
            center: center,
            zoom: 10,
            mapId: 'SPD_MEDICAL_MAP_ID'
        });
        findPlaces();
    }

    async function findPlaces() {
        center = { lat: -23.6639484, lng: -46.5080881};
        const { Place } = await google.maps.importLibrary("places");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const request = {
            textQuery: "Femme",
            fields: ['displayName', 'location', 'businessStatus'],
            includedType: '',
            locationBias: center,
            maxResultCount: 10,
            useStrictTypeFiltering: false
        };
        //@ts-ignore
        const { places } = await Place.searchByText(request);

        if(places.length) {
            console.log(places);
            const { LatLngBounds } = await google.maps.importLibrary("core");
            const bounds = new LatLngBounds();
            // Itera pela pesquisa e gera os resultados
            places.forEach((place) => {
                const markerView = new AdvancedMarkerElement({
                    map,
                    position: place.location,
                    title: place.displayName
                });
                bounds.extend(place.location);
                console.log(place);
            });
            map.fitBounds(bounds);
        }
        else {
            console.log("Sem resultados");
        }
    }

    initMap();
}

async function getPlaces() {
    const Place = await google.maps.importLibrary("places");
    let center = { lat: -23.6639484, lng: -46.5080881};

    const defaultBounds = {
        north: center.lat + 0.1,
        south: center.lat - 0.1,
        east: center.lng + 0.1,
        west: center.lng - 0.1
    };

    const input = document.getElementById("maps_auto_complete_input");
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: "br" },
        fields: ["name", "formatted_address", "place_id", "geometry", "icon", "address_components"],
        strictBounds: false
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    // //@ts-ignore
    // const placeAutoComplete = new google.maps.places.PlaceAutocompleteElement();
    // // placeAutoComplete.classList.add("form-control");
    // // placeAutoComplete.classList.add("form-control-lg");
    // placeAutoComplete.id = "place_input";
    // placeAutoComplete.locationBias = center;

    // //@ts-ignore
    // const inputField = document.getElementById("auto_complete_input_2");
    // inputField.appendChild(placeAutoComplete);

    // //@ts-ignore
    // placeAutoComplete.addEventListener('gmp-select', async({ placePrediction }) => {
    //     const places = placePrediction.toPlace();
    //     await places.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
    //     console.log(places.Eg.displayName);
    //     console.log(places.Eg.formattedAddress);
    //     console.log(places.Eg.location);
    // });
}

function clear_address_field(id) {
    const address_field = document.getElementById(id);
    address_field.value = "";
}

getPlaces();