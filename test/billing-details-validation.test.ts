/**
 * Billing details end up on invoices and in tax records.
 *
 * The form carried `pattern` attributes that constrained only the CHARACTER
 * CLASS, so a customer typed "hskdh" as their city and "jshdh" as an Indian PIN
 * code and both were accepted — they are made of allowed characters. The API
 * checked presence alone, so anything non-empty was stored regardless of what
 * the browser did.
 *
 * The reported case is the first test below.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  validateBillingDetails,
  validateCity,
  validatePostalCode,
} from "@/lib/billing/billing-details";

const good = {
  firstName: "Ayush",
  lastName: "Singh",
  email: "ayush.jmd04@gmail.com",
  address: "42 MG Road, Indiranagar",
  country: "india",
  city: "Bengaluru",
  zipCode: "560038",
};

function fieldsWithErrors(input: Record<string, unknown>) {
  return validateBillingDetails(input).map((error) => error.field).sort();
}

test("the reported submission is now rejected", () => {
  // Exactly what was accepted in production: gibberish city, gibberish PIN, and
  // an email pasted into the address field.
  const errors = fieldsWithErrors({
    ...good,
    address: "ayush.jmd04@gmail.com",
    city: "hskdh",
    zipCode: "jshdh",
  });
  assert.ok(errors.includes("zipCode"), "jshdh is not a 6-digit Indian PIN code");
  assert.ok(errors.includes("address"), "an email address is not a street address");
});

test("a valid submission passes", () => {
  assert.deepEqual(validateBillingDetails(good), []);
});

test("postal codes are checked against the country's real format", () => {
  // This is where a wrong entry is genuinely catchable.
  assert.ok(validatePostalCode("jshdh", "india"), "letters are not a PIN code");
  assert.ok(validatePostalCode("12345", "india"), "5 digits is not a PIN code");
  assert.ok(validatePostalCode("012345", "india"), "an Indian PIN cannot start with 0");
  assert.equal(validatePostalCode("560038", "india"), null);
  assert.equal(validatePostalCode("560038", "IN"), null, "ISO code must match the same rule");
  assert.equal(validatePostalCode("560038", "India"), null, "case must not matter");

  assert.equal(validatePostalCode("94107", "united states"), null);
  assert.equal(validatePostalCode("94107-1234", "us"), null);
  assert.ok(validatePostalCode("9410", "usa"), "4 digits is not a ZIP");

  assert.equal(validatePostalCode("SW1A 1AA", "united kingdom"), null);
  assert.equal(validatePostalCode("K1A 0B1", "canada"), null);
  assert.equal(validatePostalCode("2000", "australia"), null);
});

test("an unmodelled country stays permissive rather than guessing", () => {
  // Inventing a format for a country we have not modelled would reject real
  // customers, which is worse than accepting a loose value.
  assert.equal(validatePostalCode("1234-AB", "Portugal"), null);
  assert.equal(validatePostalCode("4000-007", "Portugal"), null);
  assert.equal(validatePostalCode("100 44", "Sweden"), null, "spaces are legitimate");

  // Permissive is not "anything": it still has to be postal-code shaped.
  assert.ok(validatePostalCode("!!!", "Portugal"), "punctuation is not a postal code");
  assert.ok(validatePostalCode("X", "Portugal"), "no country uses a single character");
  assert.ok(validatePostalCode("", "Portugal"));
});

test("city validation claims only what it can actually check", () => {
  // A city name cannot be verified without a gazetteer. "hskdh" is
  // indistinguishable from a small town's real name by shape, and this
  // deliberately does not pretend otherwise — the postal code is the field that
  // catches that mistake.
  assert.equal(validateCity("hskdh"), null, "shape alone cannot reject this, and we do not claim to");

  assert.ok(validateCity(""), "empty is refused");
  assert.ok(validateCity("a"), "one character is not a name");
  assert.ok(validateCity("1234"), "digits alone are not a name");
  assert.ok(validateCity("aaaaaa"), "a single repeated character is not a name");

  // Real names with unusual shapes must survive.
  for (const city of ["Ur", "Ōsaka", "San José", "Stoke-on-Trent", "L'Aquila", "Bengaluru"]) {
    assert.equal(validateCity(city), null, `${city} is a real city`);
  }
});

test("an address must not be an email pasted from the field above", () => {
  assert.ok(
    validateBillingDetails({ ...good, address: "ayush.jmd04@gmail.com" }).some(
      (error) => error.field === "address",
    ),
  );
  assert.deepEqual(validateBillingDetails({ ...good, address: "12 High Street" }), []);
});

test("every failure is reported, not just the first", () => {
  // One error at a time turns a seven-field form into seven round trips.
  const errors = fieldsWithErrors({
    firstName: "",
    lastName: "",
    email: "nope",
    address: "",
    country: "",
    city: "",
    zipCode: "",
  });
  assert.deepEqual(errors, [
    "address",
    "city",
    "country",
    "email",
    "firstName",
    "lastName",
    "zipCode",
  ]);
});

test("whitespace-only input is not a value", () => {
  assert.ok(validateBillingDetails({ ...good, city: "   " }).some((e) => e.field === "city"));
  assert.ok(validateBillingDetails({ ...good, zipCode: "   " }).some((e) => e.field === "zipCode"));
});

test("non-string input cannot slip past", () => {
  // The API receives parsed JSON, so a number or an object can arrive here.
  const errors = fieldsWithErrors({ ...good, zipCode: 560038, city: { name: "x" } });
  assert.ok(errors.includes("zipCode"));
  assert.ok(errors.includes("city"));
});
