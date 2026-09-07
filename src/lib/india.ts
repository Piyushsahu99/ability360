/**
 * India-first formatting and location data.
 * Currency is always Indian Rupee, numbers use the lakh/crore grouping and
 * dates use the day-month-year order familiar in India.
 */

export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof indianStates)[number];

export const citiesByState: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kakinada", "Amaravati", "Rajahmundry"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Nagaon"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Ponda"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Hisar", "Ambala", "Karnal", "Rohtak"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala", "Hamirpur"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Manipal", "Davanagere"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kottayam", "Palakkad"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Chhatrapati Sambhajinagar", "Thane", "Kolhapur", "Navi Mumbai"],
  Manipur: ["Imphal", "Thoubal"],
  Meghalaya: ["Shillong", "Tura"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Burla"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Phagwara", "Rupnagar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Pilani"],
  Sikkim: ["Gangtok", "Majitar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Vellore", "Erode", "Tirunelveli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Secunderabad"],
  Tripura: ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Prayagraj", "Agra", "Meerut", "Aligarh", "Jhansi"],
  Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Pantnagar"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kalyani", "Kharagpur"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman"],
  Delhi: ["New Delhi", "Dwarka", "Rohini", "Saket"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  Ladakh: ["Leh", "Kargil"],
  Lakshadweep: ["Kavaratti"],
  Puducherry: ["Puducherry", "Karaikal"],
};

export const majorCities = Array.from(
  new Set(Object.values(citiesByState).flat()),
).sort((a, b) => a.localeCompare(b, "en-IN"));

export function citiesFor(state: string | null | undefined) {
  if (!state || state === "all") return majorCities;
  return citiesByState[state] ?? [];
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹25,000 — Indian digit grouping, no decimals. */
export function formatINR(amount: number) {
  return inr.format(amount);
}

/** 12,50,000 — Indian digit grouping without the symbol. */
export function formatIndianNumber(value: number) {
  return inrNumber.format(value);
}

/** Compact rupee value: ₹4.5 lakh, ₹1.2 crore. */
export function formatRupeesCompact(amount: number) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(amount % 1_00_00_000 === 0 ? 0 : 1)} crore`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(amount % 1_00_000 === 0 ? 0 : 1)} lakh`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  return formatINR(amount);
}

/** ₹6 LPA style annual package. */
export function formatLPA(min: number, max: number) {
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  return min === max ? `₹${fmt(min)} LPA` : `₹${fmt(min)}–${fmt(max)} LPA`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** 10 Oct 2026 (India Standard Time). */
export function formatDateIN(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not set";
  return dateFmt.format(date);
}

/** 10 Oct 2026, 10:00 am IST. */
export function formatDateTimeIN(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not set";
  return `${dateTimeFmt.format(date)} IST`;
}

/**
 * Stipend values are stored as free text by employers. If the text already
 * carries a currency marker we leave it alone; a bare number becomes rupees.
 */
export function formatStipend(value: string | null | undefined) {
  if (!value) return "Not disclosed";
  const trimmed = value.trim();
  if (!trimmed) return "Not disclosed";
  if (/[₹$€£]|inr|rs\.?|lpa|lakh|crore|unpaid|not disclosed/i.test(trimmed)) return trimmed;
  const numeric = Number(trimmed.replace(/[,\s]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) return `${formatINR(numeric)} / month`;
  return trimmed;
}
