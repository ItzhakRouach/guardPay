const {
  sickDayPercent,
  buildSickDocs,
  restreakSickDocs,
  restreakSickUpdates,
} = require("../utils/sickDays");

const DAILY_PAY = 480; // 60 ₪/h × 8h

describe("sickDayPercent", () => {
  test("day 1 → 0%", () => expect(sickDayPercent(1)).toBe(0));
  test("day 2 → 50%", () => expect(sickDayPercent(2)).toBe(0.5));
  test("day 3 → 50%", () => expect(sickDayPercent(3)).toBe(0.5));
  test("day 4 → 100%", () => expect(sickDayPercent(4)).toBe(1));
  test("day 30 → 100%", () => expect(sickDayPercent(30)).toBe(1));
});

describe("buildSickDocs", () => {
  const baseArgs = {
    dailyPay: DAILY_PAY,
    userId: "u1",
    baseRate: 60,
  };

  test("1-day period → 1 doc, total 0", () => {
    const docs = buildSickDocs({
      ...baseArgs,
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].is_sick).toBe(true);
    expect(docs[0].sick_percent).toBe(0);
    expect(docs[0].total_amount).toBe(0);
  });

  test("5-day period → totals: 0 + 0.5 + 0.5 + 1 + 1 = 3 × dailyPay", () => {
    const docs = buildSickDocs({
      ...baseArgs,
      startDate: "2026-03-02",
      endDate: "2026-03-06",
    });
    expect(docs).toHaveLength(5);
    expect(docs.map((d) => d.sick_percent)).toEqual([0, 0.5, 0.5, 1, 1]);
    const sum = docs.reduce((acc, d) => acc + d.total_amount, 0);
    expect(sum).toBeCloseTo(3 * DAILY_PAY, 2);
  });

  test("doc shape: hour buckets are zero, is_sick is true", () => {
    const [d] = buildSickDocs({
      ...baseArgs,
      startDate: "2026-03-02",
      endDate: "2026-03-02",
    });
    expect(d).toMatchObject({
      is_sick: true,
      is_training: false,
      is_vacation: false,
      is_holiday: false,
      user_id: "u1",
      base_rate: 60,
      h100_hours: 0,
      h125_extra_hours: 0,
      h150_extra_hours: 0,
      h175_extra_hours: 0,
      h200_extra_hours: 0,
      h150_shabat: 0,
      h150_holiday: 0,
      h175_holiday: 0,
      h200_holiday: 0,
      reg_pay_amount: 0,
      extra_pay_amount: 0,
      travel_pay_amount: 0,
    });
  });

  test("end before start → empty array", () => {
    expect(
      buildSickDocs({
        ...baseArgs,
        startDate: "2026-03-10",
        endDate: "2026-03-05",
      }),
    ).toEqual([]);
  });

  test("cross-month period produces docs in both months", () => {
    const docs = buildSickDocs({
      ...baseArgs,
      startDate: "2026-03-30",
      endDate: "2026-04-03",
    });
    expect(docs).toHaveLength(5);
    const months = docs.map((d) => new Date(d.start_time).getMonth() + 1);
    expect(months).toEqual([3, 3, 4, 4, 4]);
  });
});

describe("restreakSickDocs", () => {
  const mkDoc = (dateISO, percent = null, id = null) => ({
    $id: id,
    start_time: new Date(dateISO + "T00:00:00").toISOString(),
    end_time: new Date(dateISO + "T23:59:00").toISOString(),
    is_sick: true,
    sick_percent: percent,
    total_amount: percent != null ? DAILY_PAY * percent : 0,
  });

  test("empty input → empty output", () => {
    expect(restreakSickDocs([], DAILY_PAY)).toEqual([]);
    expect(restreakSickDocs(null, DAILY_PAY)).toEqual([]);
  });

  test("3 contiguous days → positions 1,2,3 → percents 0, 0.5, 0.5", () => {
    const docs = [
      mkDoc("2026-03-02"),
      mkDoc("2026-03-03"),
      mkDoc("2026-03-04"),
    ];
    const out = restreakSickDocs(docs, DAILY_PAY);
    expect(out.map((d) => d.sick_percent)).toEqual([0, 0.5, 0.5]);
    expect(out.map((d) => d.total_amount)).toEqual([
      0,
      DAILY_PAY * 0.5,
      DAILY_PAY * 0.5,
    ]);
  });

  test("re-stream after deleting middle of a 5-day streak", () => {
    // Original: 03-02..03-06 (positions 1..5). Suppose user deleted 03-04.
    // Surviving docs: 03-02, 03-03 (still contiguous), then a gap, then 03-05, 03-06.
    // → positions: 1, 2, 1, 2 → percents: 0, 0.5, 0, 0.5
    const surviving = [
      mkDoc("2026-03-02"),
      mkDoc("2026-03-03"),
      mkDoc("2026-03-05"),
      mkDoc("2026-03-06"),
    ];
    const out = restreakSickDocs(surviving, DAILY_PAY);
    expect(out.map((d) => d.sick_percent)).toEqual([0, 0.5, 0, 0.5]);
  });

  test("unsorted input → output sorted by date", () => {
    const out = restreakSickDocs(
      [mkDoc("2026-03-04"), mkDoc("2026-03-02"), mkDoc("2026-03-03")],
      DAILY_PAY,
    );
    const days = out.map((d) => new Date(d.start_time).getDate());
    expect(days).toEqual([2, 3, 4]);
    expect(out.map((d) => d.sick_percent)).toEqual([0, 0.5, 0.5]);
  });

  test("preserves $id and other props via spread", () => {
    const docs = [mkDoc("2026-03-02", null, "doc-A")];
    const [out] = restreakSickDocs(docs, DAILY_PAY);
    expect(out.$id).toBe("doc-A");
    expect(out.is_sick).toBe(true);
  });

  test("preserves docs the helper has never seen ($id is required for diffing)", () => {
    // restreakSickDocs only matches by $id in restreakSickUpdates, so a
    // doc without $id can't be diffed — it should be dropped from the
    // update set, not crash. Covered indirectly by other tests; here we
    // just verify the spread preserves everything else.
    const docs = [
      { ...mkDoc("2026-03-02"), comment: "flu" },
    ];
    const [out] = restreakSickDocs(docs, DAILY_PAY);
    expect(out.comment).toBe("flu");
  });

  test("non-contiguous runs each restart at position 1", () => {
    // Two separate streaks: 03-02..03-04, then 03-10..03-13
    const docs = [
      mkDoc("2026-03-02"),
      mkDoc("2026-03-03"),
      mkDoc("2026-03-04"),
      mkDoc("2026-03-10"),
      mkDoc("2026-03-11"),
      mkDoc("2026-03-12"),
      mkDoc("2026-03-13"),
    ];
    const out = restreakSickDocs(docs, DAILY_PAY);
    expect(out.map((d) => d.sick_percent)).toEqual([
      0,
      0.5,
      0.5, // first streak
      0,
      0.5,
      0.5,
      1, // second streak
    ]);
  });
});

describe("restreakSickUpdates (diff helper)", () => {
  const mkDoc = (dateISO, id, percent) => ({
    $id: id,
    start_time: new Date(dateISO + "T00:00:00").toISOString(),
    end_time: new Date(dateISO + "T23:59:00").toISOString(),
    is_sick: true,
    sick_percent: percent,
    total_amount: DAILY_PAY * percent,
  });

  test("empty input → empty output", () => {
    expect(restreakSickUpdates([], DAILY_PAY)).toEqual([]);
    expect(restreakSickUpdates(null, DAILY_PAY)).toEqual([]);
  });

  test("docs already correctly streaked → no updates", () => {
    // [day 1=0%, day 2=50%, day 3=50%] is already self-consistent
    const docs = [
      mkDoc("2026-03-02", "A", 0),
      mkDoc("2026-03-03", "B", 0.5),
      mkDoc("2026-03-04", "C", 0.5),
    ];
    expect(restreakSickUpdates(docs, DAILY_PAY)).toEqual([]);
  });

  test("after deleting middle of 5-day streak → days 4 and 5 get downgraded", () => {
    // Original was 1..5 at 0/50/50/100/100. User deleted day 3 (position 3).
    // Survivors carry their OLD percents/amounts (the bug we're fixing).
    // After restreak: positions become 1,2,1,2 → percents 0, 0.5, 0, 0.5.
    const surviving = [
      mkDoc("2026-03-02", "A", 0),    // day1 → still pos1 → 0  (no change)
      mkDoc("2026-03-03", "B", 0.5),  // day2 → still pos2 → 0.5 (no change)
      mkDoc("2026-03-05", "D", 1),    // day4 → now pos1 (after gap) → 0   (CHANGE)
      mkDoc("2026-03-06", "E", 1),    // day5 → now pos2 → 0.5   (CHANGE)
    ];
    const updates = restreakSickUpdates(surviving, DAILY_PAY);
    expect(updates).toHaveLength(2);
    const byId = Object.fromEntries(updates.map((u) => [u.$id, u]));
    expect(byId.D.sick_percent).toBe(0);
    expect(byId.D.total_amount).toBe(0);
    expect(byId.E.sick_percent).toBe(0.5);
    expect(byId.E.total_amount).toBe(DAILY_PAY * 0.5);
  });

  test("single sick doc remaining → no updates needed (already correct)", () => {
    const docs = [mkDoc("2026-03-02", "A", 0)];
    expect(restreakSickUpdates(docs, DAILY_PAY)).toEqual([]);
  });
});
