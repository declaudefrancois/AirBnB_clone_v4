$(function () {
  const filters = {
    amenities: {},
    cities: {},
    states: {}
  };
  const $amenitiesPreview = $('.amenities h4');
  const $locationsPreview = $('.locations > h4');

  // Check Api status.
  checkApiStatus().catch((e) => console.log({ e }));

  fetchPlaces();

  // Amenities filters.
  $('.amenities input').each(function () {
    onCheckboxValue($(this), filters, $amenitiesPreview, 'amenities');
  });
  $('.amenities input').on('change', (e) => onCheckboxValue($(e.currentTarget), filters, $amenitiesPreview, 'amenities'));

  // States filters.
  $('.locations .popover > ul > li > h2 input').each(function () {
    onCheckboxValue($(this), filters, $locationsPreview, 'states');
  });
  $('.locations .popover > ul > li > h2 input').on('change', (e) => {
    const $stateInput = $(e.currentTarget);
    onCheckboxValue($stateInput, filters, $locationsPreview, 'states');
    // Update all cities filters.
    $stateInput.parent().parent().find('ul input').each(function () {
      $(this).prop('checked', $stateInput.prop('checked')).trigger('change');
    });
  });

  // Cities filters.
  $('.locations .popover > ul > li ul input').each(function () {
    onCheckboxValue($(this), filters, $locationsPreview, 'cities');
  });
  $('.locations .popover > ul > li ul input').on('change', (e) => onCheckboxValue($(e.currentTarget), filters, $locationsPreview, 'cities'));

  $('.filters button').on('click', async (e) => {
    const $btn = $(e.currentTarget);
    $btn.attr('disabled', true);
    $btn.text('Searching...');
    try {
      await fetchPlaces({ amenities: Object.keys(filters.amenities), cities: Object.keys(filters.cities), states: Object.keys(filters.states) });
    } catch (e) { console.log({ e }); } finally { $btn.attr('disabled', false); $btn.text('Search'); }
  });

  $('.places').on('click', 'article .reviews span', async (e) => {
    const $span = $(e.currentTarget);
    const $reviewsUl = $span.parent().parent().find('ul');

    if ($span.data('hidden') === '1') {
      try {
        $span.data('hidden', 0);
        let reviews = await fetchReviews($span.data('id'));
        reviews = await Promise.all(reviews.map(async (rev) => {
          const user = await fetchUser(rev.user_id);
          return {
            ...rev,
            user
          };
        }));
        console.log({ reviews });
        $reviewsUl.append(reviews.map(renderReview).join('\n'));
      } catch (e) { console.log({ e }); }
    } else {
      $span.data('hidden', 1);
      $reviewsUl.html('');
    }
  });
});

function onCheckboxValue ($input, filters, $preview, kind) {
  if ($input.prop('checked')) {
    filters[kind][$input.data('id')] = $input.data('name');
  } else {
    delete filters[kind][$input.data('id')];
  }

  let names = [];
  if (kind === 'amenities') {
    names = Object.keys(filters[kind]).map(k => filters[kind][k]);
  } else {
    const okind = kind === 'cities' ? 'states' : 'cities';
    names = [...Object.keys(filters[kind]).map(k => filters[kind][k]), ...Object.keys(filters[okind]).map(k => filters[okind][k])];
  }
  $preview.text(names.join(', '));
}

async function fetchReviews (placeId) {
  const data = await $.get(`http://0.0.0.0:5001/api/v1/places/${placeId}/reviews`);
  return data;
}

async function fetchUser (userId) {
  const data = await $.get(`http://0.0.0.0:5001/api/v1/users/${userId}`);
  return data;
}

function renderReview (review) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const date = new Intl.DateTimeFormat('en-EN', options).format(new Date(review.created_at));
  return (`
    <li>
      <h3>From ${review.user.first_name} ${review.user.last_name} the ${date}</h3>
      <p>${review.text}</p>
    </li>
  `);
}

async function checkApiStatus () {
  const { status } = await $.get('http://0.0.0.0:5001/api/v1/status/');

  if (status.match(/OK/s)) { $('div#api_status').addClass('available'); } else { $('div#api_status').removeClass('available'); }
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
  <div class="reviews">
    <h2>Reviews <span data-id="${place.id}" data-hidden="1">show</span></h2>
    <ul>
    </ul>
  </div>
</article>`);
}
