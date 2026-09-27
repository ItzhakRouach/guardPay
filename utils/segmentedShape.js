// Corner radii for one react-native-paper SegmentedButtons item.
//
// Paper decides a segmented row's shape from each button's INDEX and applies
// it with PHYSICAL corners: the item at index 0 gets `borderTopRightRadius:
// 0`, the last item `borderTopLeftRadius: 0`. Its border widths, by contrast,
// use the logical `borderEndWidth`, which does mirror correctly.
//
// Under the app-wide RTL layout direction the row itself mirrors, so index 0
// is DRAWN on the right. Paper then squares the corners on the outer edge and
// rounds the ones facing the neighbour, which is what makes the row read as a
// set of mis-cropped boxes rather than one grouped control.
//
// React Native resolves a physical corner ahead of a logical one
// (`CascadedRectangleCorners::resolve` takes `topLeft.value_or(topLeading…)`),
// so a logical override cannot win against what Paper already set. The fix is
// to restate all four physical corners from the button's VISUAL position.
//
// CommonJS so Jest can require it; app code imports lib/segmentedShape.js.

/**
 * @param {number} index    the button's index in the `buttons` array
 * @param {number} count    how many buttons the row has
 * @param {boolean} isRTL   whether the row is mirrored
 * @param {number} r        the outer corner radius
 * @returns {object|undefined} a style to pass as the item's `style`, or
 *   undefined when Paper's own shape is already correct.
 */
function segmentedItemShape(index, count, isRTL, r) {
  const lone = count <= 1;
  // Paper squares the right corners of a lone button, because index 0 is
  // always treated as "first". Correct that in both directions.
  if (lone) {
    return {
      borderTopLeftRadius: r,
      borderBottomLeftRadius: r,
      borderTopRightRadius: r,
      borderBottomRightRadius: r,
    };
  }
  if (!isRTL) return undefined;

  const atStart = index === 0; // drawn on the right when mirrored
  const atEnd = index === count - 1; // drawn on the left when mirrored
  const left = atEnd ? r : 0;
  const right = atStart ? r : 0;
  return {
    borderTopLeftRadius: left,
    borderBottomLeftRadius: left,
    borderTopRightRadius: right,
    borderBottomRightRadius: right,
  };
}

/** Apply the shape to a whole `buttons` array, preserving each item's style. */
function shapeSegmentedButtons(buttons, isRTL, r) {
  const n = buttons.length;
  return buttons.map((b, i) => {
    const shape = segmentedItemShape(i, n, isRTL, r);
    return shape ? { ...b, style: [b.style, shape] } : b;
  });
}

module.exports = { segmentedItemShape, shapeSegmentedButtons };
