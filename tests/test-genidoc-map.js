const assert = require("assert");
const helpers = require("../static/js/genidoc-map.cjs");

function runTests() {
  console.log("Running genidoc-map parser tests...");

  // Test phone extraction
  const text1 = "Contact: 06 12 34 56 78 / +212 6 1234 5678";
  const phones = helpers.extractPhones(text1);
  assert(phones.length >= 1, "Should extract at least one phone");
  assert(
    phones.some((p) => p.includes("06") || p.includes("+212")),
    "Phone variants expected"
  );

  // Test email extraction
  const text2 = "Email: test.user@example.com; autre@domain.ma";
  const emails = helpers.extractEmails(text2);
  assert.deepStrictEqual(emails, ["test.user@example.com", "autre@domain.ma"]);

  // Test url extraction
  const text3 = "Site: https://example.com/path?x=1 http://test.local";
  const urls = helpers.extractUrls(text3);
  assert(urls.length === 2, "Should extract two URLs");

  // Test name and specialty guess
  const text4 =
    "Cabinet du Dr Anas Senhaji, Médecin généraliste, 12 Rue Socrate, Casablanca";
  const guess = helpers.guessNameAndSpecialty(text4);
  assert(
    guess.name.toLowerCase().includes("cabinet") ||
      guess.name.toLowerCase().includes("dr"),
    "Name likely contains cabinet or dr"
  );
  assert(
    guess.specialty.toLowerCase().includes("médecin") ||
      guess.specialty.toLowerCase().includes("généraliste"),
    "Should find specialty"
  );

  // Test address extraction
  const addr = helpers.extractAddress(text4);
  assert(
    addr.toLowerCase().includes("rue socrate") ||
      addr.toLowerCase().includes("casablanca"),
    "Address should contain street or city"
  );

  console.log("All tests passed ✅");
}

try {
  runTests();
  process.exit(0);
} catch (e) {
  console.error("Test failed:", e.message);
  process.exit(1);
}
