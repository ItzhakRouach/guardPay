/* global describe, test, expect */
import { calculateSalary, calculateShiftPay } from "../lib/salaryLogic";

describe("Shift Calculation Logic Noraml Weekday 8 Hours Tests", () => {
  //case 1
  test("Weekday morning shift - 8 Hours", () => {
    // Data arrange
    const start = "2026-01-27T07:00:00";
    const end = "2026-01-27T15:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    //Asert (result exeptions)
    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(0);
    expect(result.extra_pay_amount).toBe(0);
    expect(result.reg_pay_amount).toBe(400); //50 * 8
    expect(result.travel_pay_amount).toBe(0);
    expect(result.total_amount).toBe(400);
  });

  //case 2
  test("Weekday evening shift - 8 Hours", () => {
    // Data arrange
    const start = "2026-01-27T15:00:00";
    const end = "2026-01-27T23:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    //Asert (result exeptions)
    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(0);
    expect(result.extra_pay_amount).toBe(0);
    expect(result.reg_pay_amount).toBe(400); //50 * 8
    expect(result.travel_pay_amount).toBe(0);
    expect(result.total_amount).toBe(400);
  });

  //case 3
  test("Weekday night shift - 8 Hours", () => {
    // Data arrange
    const start = "2026-01-27T23:00:00";
    const end = "2026-01-28T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    //Asert (result exeptions)
    expect(result.reg_hours).toBe(7);
    expect(result.extra_hours).toBe(1);
    expect(result.extra_pay_amount).toBe(62.5); // 50 * 1.25
    expect(result.reg_pay_amount).toBe(350); //50 * 7 + (50 * 1.25)
    expect(result.travel_pay_amount).toBe(0);
    expect(result.total_amount).toBe(412.5);
  });
});

describe("Shift Calculation Logic Weekend 8 Hours - Saturday/Friday Tests", () => {
  test("Friday Morning - 8 Hours", () => {
    const start = "2026-01-30T07:00:00";
    const end = "2026-01-30T15:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(0);
    expect(result.extra_pay_amount).toBe(0);
    expect(result.reg_pay_amount).toBe(400); //50 * 8
    expect(result.travel_pay_amount).toBe(0);
    expect(result.total_amount).toBe(400);
  });

  test("Friday Evening - 8 Hours", () => {
    const start = "2026-01-30T15:00:00";
    const end = "2026-01-30T23:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.h150_shabat).toBe(7);
    expect(result.reg_pay_amount).toBe(575);
    expect(result.total_amount).toBe(575);
  });

  test("Friday Night - 8 Hours", () => {
    const start = "2026-01-30T23:00:00";
    const end = "2026-01-31T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(7);
    expect(result.h175_extra_hours).toBe(1);
    expect(result.extra_pay_amount).toBe(87.5);
    expect(result.total_amount).toBe(612.5);
  });
  test("Saturday Morning - 8 Hours", () => {
    const start = "2026-01-31T07:00:00";
    const end = "2026-01-31T15:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.h150_shabat).toBe(8);
    expect(result.total_amount).toBe(600);
  });
  test("Saturday Evening - 8 Hours", () => {
    const start = "2026-01-31T15:00:00";
    const end = "2026-01-31T23:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.h150_shabat).toBe(8);
    expect(result.total_amount).toBe(600);
  });
  test("Saturday Night - 8 Hours", () => {
    const start = "2026-01-31T23:00:00";
    const end = "2026-02-01T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(7);
    expect(result.h100_hours).toBe(2);
    expect(result.h150_shabat).toBe(5);
    expect(result.h125_extra_hours).toBe(1);
    expect(result.total_amount).toBe(537.5);
  });
});

describe("Shifts Calculation Logic Noraml Weekday 12 Hours Tests", () => {
  test("Weekday morning shift - 12 Hours", () => {
    const start = "2026-01-27T07:00:00";
    const end = "2026-01-27T19:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(4);
    expect(result.h125_extra_hours).toBe(2);
    expect(result.h150_extra_hours).toBe(2);
    expect(result.travel_pay_amount).toBe(0);
    expect(result.reg_pay_amount).toBe(400);
    expect(result.extra_pay_amount).toBe(275);
    expect(result.total_amount).toBe(675);
  });

  test("Weekday night shift - 12 Hours", () => {
    const start = "2026-01-27T19:00:00";
    const end = "2026-01-28T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(7);
    expect(result.extra_hours).toBe(5);
    expect(result.h125_extra_hours).toBe(2);
    expect(result.h150_extra_hours).toBe(3);
    expect(result.extra_pay_amount).toBe(350);
    expect(result.total_amount).toBe(700);
  });
});

describe("Shift Calculation Logic Weekend 12 Hours - Saturday/Friday Tests", () => {
  test("Friday Morning 12 Hours Shift", () => {
    const start = "2026-01-30T07:00:00";
    const end = "2026-01-30T19:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(4);
    expect(result.h125_extra_hours).toBe(1);
    expect(result.h175_extra_hours).toBe(1);
    expect(result.h200_extra_hours).toBe(2);
    expect(result.total_amount).toBe(750); // 50 * 8 + 50 * 1.25 + 50 * 1.75 + 2*(50*2)
  });

  test("Friday Night 12 Hours Shift", () => {
    const start = "2026-01-30T19:00:00";
    const end = "2026-01-31T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(7);
    expect(result.extra_hours).toBe(5);
    expect(result.h150_shabat).toBe(7);
    expect(result.h175_extra_hours).toBe(2);
    expect(result.h200_extra_hours).toBe(3);
    expect(result.total_amount).toBe(1000); // 7(50*1.5) + 2(50*1.75) + 3(50*2)
  });

  test("Saturday Morning 12 Hours Shift", () => {
    const start = "2026-01-31T07:00:00";
    const end = "2026-01-31T19:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(8);
    expect(result.extra_hours).toBe(4);
    expect(result.h150_shabat).toBe(8);
    expect(result.h175_extra_hours).toBe(2);
    expect(result.h200_extra_hours).toBe(2);
    expect(result.total_amount).toBe(975); // 8(50*1.5) + 2(50*1.75) + 2(50*2)
  });

  test("Saturday Night 12 Hours Shift", () => {
    const start = "2026-01-31T19:00:00";
    const end = "2026-02-01T07:00:00";
    const rate = 50;
    const result = calculateShiftPay(start, end, rate, 0);

    expect(result.reg_hours).toBe(7);
    expect(result.extra_hours).toBe(5);
    expect(result.h150_shabat).toBe(7);
    expect(result.h175_extra_hours).toBe(2);
    expect(result.h150_extra_hours).toBe(3);
    expect(result.total_amount).toBe(925); // 7(50*1.5) + 2(50*1.75) + 3(50*1.5)
  });
});

describe("Monthly Salary Calculation - Neto/Bruto Tests", () => {
  test("Low Salary - Below Tax Threshold", () => {
    const result = calculateSalary(5000, 0, 0);
    expect(result.bruto).toBe(5000);
    expect(result.incomeTax).toBe(0);
    expect(result.pensia).toBeCloseTo(350); // 5000 * 0.07 7%
    expect(result.bituahLeumiAndHealth).toBeCloseTo(175, 1); // 5000 * 0.03
    expect(result.neto).toBe(5000 - 350 - 175);
  });

  test("Average Salary - Crossing Bituah Leumi Threshold", () => {
    const result = calculateSalary(10000, 0, 0);
    expect(result.bruto).toBe(10000);
    expect(result.incomeTax).toBeCloseTo(584.1, 1); //(710 + (10000 - 7010) * 0.14) - 544.5
    expect(result.bituahLeumiAndHealth).toBeCloseTo(560.63, 1); //(7522 * 0.035) + (2478 * 0.12) = 263.27 + 297.36 = 560.63
    expect(result.pensia).toBeCloseTo(700);
    expect(result.neto).toBeCloseTo(10000 - 584.1 - 700 - 560.63);
  });

  test("High Salary - Crossing Bituah Leumi and Taxes Threshold", () => {
    const result = calculateSalary(15000, 0, 0);
    expect(result.bruto).toBe(15000);
    expect(result.incomeTax).toBeCloseTo(1580.5, 1); // (710 + 427 + (15000 - 10060) * 0.2 ) - 544.5
    expect(result.bituahLeumiAndHealth).toBeCloseTo(1160.63, 1); // (7522 * 0.035) + (7478 * 0.12) = 263.27 + 897.36 = 1160.63
    expect(result.pensia).toBeCloseTo(1050); // regular pay * 0.07 = 15000 * 0.07
    expect(result.neto).toBeCloseTo(15000 - 1580.5 - 1160.63 - 1050);
  });

  test("Average Salary With Regular , Extra and Travel Pay ", () => {
    const result = calculateSalary(10000, 2000, 500);
    expect(result.bruto).toBe(12500);
    expect(result.bituahLeumiAndHealth).toBeCloseTo(860.63, 1); // (7522 * 0.035) + (4978 * 0.12) = 263.27 + 597.36 = 860.63
    expect(result.incomeTax).toBeCloseTo(1080.5, 1); // (710 + 427 + (12500 - 10060) * 0.2 ) - 544.5
    expect(result.pensia).toBeCloseTo(865, 1); // regular pay * 0.07 + extra Pay * 0.07 + travel Pay * 0.05;
    expect(result.neto).toBeCloseTo(9693.87, 1);
  });
});
