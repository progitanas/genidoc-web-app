(async function () {
  const base = "http://localhost:3000/api";
  try {
    console.log(
      "Creating a superficial admin token by logging in with admin@example"
    );
    // This test expects a user with credentials to exist in DB
    let res = await fetch(base + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "admin" }),
    });
    const j = await res.json();
    if (!j.success)
      console.warn("Admin login failed (for test) - skip admin parts");
    const token = j.success && j.token ? j.token : null;

    // Create a new request (simulate user login tokenless - but reqs require authentication). We'll try with token
    const reqBody = {
      fullname: "Test User",
      uniqueid: "11112222",
      coverageType: "AMO",
      reason: "Test Auto",
    };
    res = await fetch(base + "/social-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify(reqBody),
    });
    console.log("Create request status:", res.status);
    console.log(await res.json());

    console.log("Fetch requests by uniqueid");
    res = await fetch(base + "/social-requests?uniqueid=11112222", {
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
    console.log(await res.json());

    console.log("Tests finished");
  } catch (err) {
    console.error("Test script error", err);
    process.exit(1);
  }
})();
