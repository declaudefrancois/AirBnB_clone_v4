$(function () {
  const amenities = {};
  const $amenitiesPreview = $('.amenities h4');

  // Check Api status.
  checkApiStatus().catch((e) => console.log({ e }));

  fetchPlaces();

  // Setup initial values.
  $('.amenities input').each(function () {
    onCheckboxValue($(this), amenities, $amenitiesPreview);
  });

  // Listen for changes.
  $('.amenities input').on('change', (e) => onCheckboxValue($(e.currentTarget), amenities, $amenitiesPreview));

  $('.filters button').on('click', async (e) => {
    const $btn = $(e.currentTarget);
    $btn.attr('disabled', true);
    $btn.text('Searching...');
    try {
      await fetchPlaces({ amenities: Object.keys(amenities) });
    } catch (e) { console.log({ e }); } finally { $btn.attr('disabled', false); $btn.text('Search'); }
  });
});

function onCheckboxValue ($input, amenities, $amenitiesPreview) {
  if ($input.prop('checked')) {
    amenities[$input.data('id')] = {
      id: $input.data('id'),
      name: $input.data('name')
    };
  } else {
    delete amenities[$input.data('id')];
  }

  updateAmenitiesPreview($amenitiesPreview, amenities);
}

async function checkApiStatus () {
  const { status } = await $.get('http://0.0.0.0:5001/api/v1/status/');

  if (status.match(/OK/s)) { $('div#api_status').addClass('available'); } else { $('div#api_status').removeClass('available'); }
}

function updateAmenitiesPreview ($amenitiesPreview, amenities) {
  const names = [];
  for (const id in amenities) {
    names.push(amenities[id].name);
  }
  $amenitiesPreview.text(names.join(', '));
}

function fetchPlaces (filters = {}) {
  const url = 'http://0.0.0.0:5001/api/v1/places_search';
  const $places = $('section.places');
  return $.ajax({
    type: 'POST',
    url,
    data: JSON.stringify(filters),
    success,
    headers: {
      'Content-Type': 'application/json'
    },
    dataType: 'json'
  });

  function success (data) {
    $places.html(data.map(renderPlace).join('\n'));
  }
}

function renderPlace (place) {
  return (`
<article>
  <div class="title_box">
    <h2>${place.name}</h2>
    <div class="price_by_night">${place.price_by_night}</div>
  </div>
  <div class="information">
    <div class="max_guest">${place.max_guest > 1 ? 'Guest' : 'Guests'}</div>
    <div class="number_rooms">${place.number_rooms > 1 ? 'Bedrooms' : 'Bedroom'}</div>
    <div class="number_bathrooms">${place.number_bathrooms > 1 ? 'Bathrooms' : 'Bathroom'}</div>
  </div>
  <div class="description">
    ${place.description ?? 'No description.'}
  </div>
</article>`);
}
