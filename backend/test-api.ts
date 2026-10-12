import axios from "axios";

const API_BASE = "http://localhost:4000/api";

async function runTests() {
  console.log("🚀 Starting Phase 4 Backend Security & Multi-tenancy Verification Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  try {
    // Test 1: Healthcheck
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 && healthRes.data.services.database === "healthy",
      "1. Healthcheck returns healthy database connection",
    );

    // Test 2: Invalid Login
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: "murat@ustateknik.com",
        password: "WrongPassword999!",
      });
      assert(false, "2. Invalid password must be rejected");
    } catch (err: any) {
      assert(
        err.response?.status === 401,
        "2. Invalid password is properly rejected with 401 Unauthorized",
      );
    }

    // Test 3: Valid Login Org 1 (Murat Usta)
    const loginOrg1 = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: "murat@ustateknik.com",
        password: "Parola123!",
      },
      { withCredentials: true },
    );

    const org1Cookie = loginOrg1.headers["set-cookie"]?.[0]?.split(";")[0];
    assert(
      loginOrg1.status === 200 &&
        loginOrg1.data.data.organization.name === "Usta Teknik Servis" &&
        Boolean(org1Cookie),
      "3. Murat Usta logs in successfully to 'Usta Teknik Servis' with HttpOnly session cookie",
    );

    const clientOrg1 = axios.create({
      baseURL: API_BASE,
      headers: { Cookie: org1Cookie },
    });

    // Test 4: Current User Me
    const meOrg1 = await clientOrg1.get("/auth/me");
    assert(
      meOrg1.status === 200 && meOrg1.data.data.user.email === "murat@ustateknik.com",
      "4. GET /api/auth/me returns authenticated user context",
    );

    // Test 5: List Work Orders Org 1
    const ordersOrg1 = await clientOrg1.get("/work-orders");
    const orderNumbers1 = ordersOrg1.data.data.map((o: any) => o.orderNumber);
    assert(
      ordersOrg1.status === 200 &&
        orderNumbers1.includes("İE-1042") &&
        !orderNumbers1.includes("İE-2001"),
      "5. Org 1 orders list contains İE-1042 and strictly excludes Org 2's İE-2001",
    );

    // Test 6: Valid Login Org 2 (Ahmet Tekin)
    const loginOrg2 = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: "ahmet@kadikoybilisim.com",
        password: "Parola123!",
      },
      { withCredentials: true },
    );
    const org2Cookie = loginOrg2.headers["set-cookie"]?.[0]?.split(";")[0];
    const clientOrg2 = axios.create({
      baseURL: API_BASE,
      headers: { Cookie: org2Cookie },
    });

    const ordersOrg2 = await clientOrg2.get("/work-orders");
    const orderNumbers2 = ordersOrg2.data.data.map((o: any) => o.orderNumber);
    assert(
      ordersOrg2.status === 200 &&
        orderNumbers2.includes("İE-2001") &&
        !orderNumbers2.includes("İE-1042"),
      "6. Org 2 orders list contains İE-2001 and strictly excludes Org 1's orders",
    );

    // Find IDs for IDOR tests
    const org1OrderId = ordersOrg1.data.data.find((o: any) => o.orderNumber === "İE-1042").id;
    const org2OrderId = ordersOrg2.data.data.find((o: any) => o.orderNumber === "İE-2001").id;

    // Test 7: IDOR Attack - Org 1 user tries to read Org 2's work order by ID
    try {
      await clientOrg1.get(`/work-orders/${org2OrderId}`);
      assert(false, "7. IDOR: Org 1 user must NOT access Org 2's order");
    } catch (err: any) {
      assert(
        err.response?.status === 404,
        "7. IDOR: Org 1 user querying Org 2 order ID is rejected with 404 Not Found (zero info leak)",
      );
    }

    // Test 8: IDOR Attack - Org 2 user tries to update Org 1's work order status
    try {
      await clientOrg2.patch(`/work-orders/${org1OrderId}/status`, {
        status: "hazir",
        note: "Yetkisiz durum değiştirme girişimi",
      });
      assert(false, "8. IDOR: Org 2 user must NOT modify Org 1's order");
    } catch (err: any) {
      assert(
        err.response?.status === 404,
        "8. IDOR: Org 2 user modifying Org 1 order is rejected with 404 Not Found",
      );
    }

    // Test 9: Cross-tenant Customer association attack
    const org2Customers = await clientOrg2.get("/customers");
    const org2CustomerId = org2Customers.data.data[0].id;
    try {
      await clientOrg1.post("/work-orders", {
        customerId: org2CustomerId, // Passing another tenant's customer ID!
        customerName: "Saldırgan",
        customerPhone: "05554443322",
        deviceType: "Telefon",
        deviceModel: "Test Cihaz",
        issueSummary: "Yetkisiz müşteri ilişkilendirme denemesi",
      });
      assert(false, "9. Cross-tenant customer linking must fail");
    } catch (err: any) {
      assert(
        err.response?.status === 400,
        "9. Cross-tenant customer linking rejected with 400 Bad Request",
      );
    }

    // Test 10: Atomic status transition and timeline event
    const statusUpdateRes = await clientOrg1.patch(`/work-orders/${org1OrderId}/status`, {
      status: "hazir",
      note: "Son kontroller yapıldı, teslime hazır.",
    });
    const updatedOrder = statusUpdateRes.data.data;
    const latestTimeline = updatedOrder.timeline?.[0];
    assert(
      updatedOrder.status === "hazir" &&
        latestTimeline?.action === "status_change" &&
        latestTimeline?.newStatus === "hazir",
      "10. Status change and TimelineEvent are atomically updated",
    );

    // Test 11: Create new work order for Org 1
    const createRes = await clientOrg1.post("/work-orders", {
      customerName: "Kadir Demir",
      customerPhone: "0 (532) 111 22 33",
      deviceType: "Bilgisayar",
      deviceModel: "Dell XPS 15 9520",
      deviceSerial: "DELLXPS9988",
      issueSummary: "Aşırı ısınıyor ve fanlar yüksek sesle dönüyor.",
      priority: "yuksek",
      estimatedPrice: 2500,
      paidAmount: 500,
      estimatedCompletion: "Yarın 15:00",
    });
    assert(
      (createRes.status === 200 || createRes.status === 201) &&
        createRes.data.data.orderNumber.startsWith("İE-") &&
        createRes.data.data.deviceModel === "Dell XPS 15 9520",
      "11. New work order created with auto-generated orderNumber and customer link",
    );

    // Test 12: Logout
    const logoutRes = await clientOrg1.post("/auth/logout");
    assert(
      logoutRes.status === 200,
      "12. Logout revokes session successfully",
    );

    // Test 13: Request after logout must be unauthorized
    try {
      await clientOrg1.get("/work-orders");
      assert(false, "13. Revoked session must not be allowed to access API");
    } catch (err: any) {
      assert(
        err.response?.status === 401,
        "13. Request after logout is properly rejected with 401 Unauthorized",
      );
    }

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Fatal Test Error:", error.message, error.response?.data);
    process.exit(1);
  }
}

runTests();
