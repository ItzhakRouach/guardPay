/* global describe, test, expect */
const { segmentedItemShape } = require("../utils/segmentedShape");

// react-native-paper rounds a segmented row's outer corners with PHYSICAL
// borderTopLeftRadius / borderTopRightRadius, chosen from the button's index
// in the array. Under the app's mirrored layout the first button is drawn on
// the right, so Paper rounds the wrong side and the row reads as a set of
// mis-cropped boxes. This helper restates the corners by visual position.
describe("segmentedItemShape", () => {
  const R = 11;

  test("left to right: Paper is already correct, so nothing is overridden", () => {
    expect(segmentedItemShape(0, 3, false, R)).toBeUndefined();
    expect(segmentedItemShape(1, 3, false, R)).toBeUndefined();
    expect(segmentedItemShape(2, 3, false, R)).toBeUndefined();
  });

  test("right to left: the first button is drawn last, so it rounds on the right", () => {
    expect(segmentedItemShape(0, 3, true, R)).toEqual({
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: R,
      borderBottomRightRadius: R,
    });
  });

  test("right to left: the last button is drawn first, so it rounds on the left", () => {
    expect(segmentedItemShape(2, 3, true, R)).toEqual({
      borderTopLeftRadius: R,
      borderBottomLeftRadius: R,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  test("right to left: a middle button is square on both sides", () => {
    expect(segmentedItemShape(1, 3, true, R)).toEqual({
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  test("a two-button row has no middle: both ends are outer edges", () => {
    expect(segmentedItemShape(0, 2, true, R)).toEqual({
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: R,
      borderBottomRightRadius: R,
    });
    expect(segmentedItemShape(1, 2, true, R)).toEqual({
      borderTopLeftRadius: R,
      borderBottomLeftRadius: R,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  test("a lone button is rounded on both sides, which Paper gets wrong even in LTR", () => {
    const both = {
      borderTopLeftRadius: R,
      borderBottomLeftRadius: R,
      borderTopRightRadius: R,
      borderBottomRightRadius: R,
    };
    expect(segmentedItemShape(0, 1, true, R)).toEqual(both);
    expect(segmentedItemShape(0, 1, false, R)).toEqual(both);
  });

  test("every button in a row is accounted for, and only the ends are rounded", () => {
    for (const n of [2, 3, 4, 5, 7]) {
      const shapes = Array.from({ length: n }, (_, i) =>
        segmentedItemShape(i, n, true, R),
      );
      const rounded = shapes.filter(
        (s) => s.borderTopLeftRadius === R || s.borderTopRightRadius === R,
      );
      expect(rounded).toHaveLength(2);
      // The visually-leftmost is the last index, the rightmost the first.
      expect(shapes[n - 1].borderTopLeftRadius).toBe(R);
      expect(shapes[0].borderTopRightRadius).toBe(R);
    }
  });
});
