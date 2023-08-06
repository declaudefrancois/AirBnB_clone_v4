$(function () {
  const amenities = {};
  const $amenitiesPreview = $('.amenities h4');

  // Setup initial value0s.
  $('.amenities input').each(function () {
    onCheckboxValue($(this), amenities, $amenitiesPreview);
  });

  // Listen for changes.
  $('.amenities input').on('change', (e) => onCheckboxValue($(e.currentTarget), amenities, $amenitiesPreview));
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

function updateAmenitiesPreview ($amenitiesPreview, amenities) {
  const names = [];
  for (const id in amenities) {
    names.push(amenities[id].name);
  }
  $amenitiesPreview.text(names.join(', '));
}
