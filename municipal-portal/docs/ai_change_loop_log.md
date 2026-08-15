# AI Change-Loop Evidence Log

This log documents the process of generating automated tests with an AI, introducing a deliberate defect, detecting the failure, fixing the defect, and verifying the successful execution, exactly as required by the Tactive Assessment Guidelines (Stage 3).

## 1. Test Case Generation
**Prompt given to AI:**
"Write a test script in `node:test` that hits the `POST /api/complaints` endpoint of my running Next.js application. Ensure there is a test case covering the requirement that 'Empty complaint descriptions must be rejected with a 400 status'."

**AI Response:** 
The AI created a test suite `tests/api.test.mjs` that first registered a test citizen to acquire a JWT token, and then made two test calls to `POST /api/complaints`: one with an empty description, and one with a valid description.

## 2. Introducing the Deliberate Defect
To ensure the test suite is capable of failing (a "red run"), I deliberately introduced a defect in the validation logic inside `src/app/api/complaints/route.ts`.

**Change made:**
```diff
-    if (!category_id || !description || !location_text) {
+    // DELIBERATE DEFECT: Removed `!description` check so empty descriptions are allowed.
+    if (!category_id || !location_text) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
     }
```

## 3. The Red Run (Test Failure)
I ran the test suite against the codebase containing the deliberate defect.

**Command:** `node --test tests/api.test.mjs`

**Test Output:**
```text
TAP version 13
# Subtest: Complaint Submission API Tests
    # Subtest: 1. Setup: Register a test citizen
    ok 1 - 1. Setup: Register a test citizen
    # Subtest: 2. Setup: Fetch categories
    ok 2 - 2. Setup: Fetch categories
    # Subtest: 3. Edge Case (Invalid Input): Reject empty description
    not ok 3 - 3. Edge Case (Invalid Input): Reject empty description
      ---
      duration_ms: 58.3447
      error: |-
        Expected 400 Bad Request for empty description
        
        201 !== 400
        
      code: 'ERR_ASSERTION'
      expected: 400
      actual: 201
      operator: 'strictEqual'
      ...
    # Subtest: 4. Normal Path: Accept valid complaint
    ok 4 - 4. Normal Path: Accept valid complaint
```

**AI Analysis of Failure:**
The AI analyzed the log and noted: "The test expected a 400 Bad Request because the description was empty. However, the API returned 201 Created. This means the API failed to reject the invalid input. The likely defect is missing validation for the `description` field in the POST route."

## 4. The Fix
I instructed the AI to fix the defect based on its analysis.

**Change made:**
```diff
-    // DELIBERATE DEFECT: Removed `!description` check so empty descriptions are allowed.
-    if (!category_id || !location_text) {
+    // FIX: Restored `!description` check
+    if (!category_id || !description || !location_text) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
     }
```

## 5. The Green Run (Test Success)
I reran the test suite against the fixed codebase.

**Command:** `node --test tests/api.test.mjs`

**Test Output:**
```text
TAP version 13
# Subtest: Complaint Submission API Tests
    # Subtest: 1. Setup: Register a test citizen
    ok 1 - 1. Setup: Register a test citizen
    # Subtest: 2. Setup: Fetch categories
    ok 2 - 2. Setup: Fetch categories
    # Subtest: 3. Edge Case (Invalid Input): Reject empty description
    ok 3 - 3. Edge Case (Invalid Input): Reject empty description
    # Subtest: 4. Normal Path: Accept valid complaint
    ok 4 - 4. Normal Path: Accept valid complaint
    1..4
ok 1 - Complaint Submission API Tests
1..1
# pass 5
# fail 0
```

**Conclusion:** The change loop successfully closed end-to-end. The test suite is proven to catch regression defects, and the code correctly implements the business logic.
