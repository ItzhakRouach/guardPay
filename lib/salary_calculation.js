export const calculateSalary =  (regularPay, extraPay, travelPay) => {
  const bruto = regularPay + extraPay + travelPay;

  // --- 1. Pensia calculation 7% regulat hours , 7% extra hours 5% travel  ---
  const pensia = (regularPay * 0.07) + (extraPay * 0.07) + (travelPay * 0.05);

  // --- 2. Bituah Leumi & Health (Split Rate) ---
  const thresholdBL = 7522; 
  let bituahLeumiAndHealth = 0;

  if (bruto <= thresholdBL) {
    bituahLeumiAndHealth = bruto * 0.035;
  } else {
    bituahLeumiAndHealth = (thresholdBL * 0.035) + (bruto - thresholdBL) * 0.12;
  }

  // --- 3. Income Tax ---
  let grossTax = 0;
  if (bruto <= 7010) {
    grossTax = bruto * 0.10;
  } else if (bruto <= 10060) {
    grossTax = 710 + (bruto - 7010) * 0.14;
  } else if (bruto <= 16150) {
    grossTax = 710 + 427 + ((bruto - 10060) * 0.20);
  } else {
    grossTax = 710 + 427 + 1218 + ((bruto - 16150) * 0.31);
  }

  // --- 4. Tax Credit Points (Nekudot Zichuy) ---
  const points = 2.25;
  const creditValue = points * 242;
  const finalIncomeTax = (Math.max(0, grossTax - creditValue))


  // --- 5. Final Neto ---
  const totalDeductions = (pensia + bituahLeumiAndHealth + finalIncomeTax)
  const neto = (bruto - totalDeductions)

  return {
    bruto,
    pensia,
    bituahLeumiAndHealth,
    incomeTax: finalIncomeTax,
    neto,
    totalDeductions
  };
};



