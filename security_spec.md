# Security Design Specification - StitchMatch LocalStitch

This document outlines the security architecture and rules validating consumer registrations to prevent database poisoning or PII disclosures.

## 1. Data Invariants
- A registration must possess a valid, non-empty, and realistic numeric age (e.g., between 12 and 120).
- Standard PII fields (email, phone, name) must be robustly type-checked as strings within strict size limits.
- The `photo` field must contain base64 image data or a valid URL, enforced dynamically.
- Client profiles can only be read or written by owners, or explicitly queried securely without blanket permissions.

## 2. Dirty Dozen payloads that must be rejected
1. **Empty Name**: `{ "name": "", "email": "johndoe@test.com", "phone": "123456", "age": 25, "photo": "base64...r" }`
2. **Negative Age**: `{ "name": "John Doe", "email": "johndoe@test.com", "phone": "123456", "age": -5, "photo": "base64" }`
3. **Invalid Age Type**: `{ "name": "John Doe", "email": "johndoe@test.com", "phone": "123456", "age": "twenty", "photo": "base64" }`
4. **Giant Email Payload**: `{ "name": "John", "email": "a".repeat(1000) + "@test.com", "phone": "123", "age": 20, "photo": "base64" }`
5. **No Photo Field**: `{ "name": "John", "email": "john@test.com", "phone": "1234", "age": 20 }`
6. **Underage profile**: `{ "name": "Underage", "email": "child@test.com", "phone": "12345", "age": 5, "photo": "base64" }`
7. **Spoof User ID**: Trying to write a document under another user's authenticated ID.
8. **Shadow Field Injection**: Writing `{ "role": "admin" }` or extra metadata to escalation points.
9. **Blanket non-authenticated reads**: Attempting to scan the whole registry.
10. **Orphan write validation**: Empty IDs.
11. **Client-side timestamps**: Sending historical or future dates representing creation.
12. **Malformed base64 block**: Giant payloads exceeding 1MB on text fields.

## 3. Security Rules
We will deploy corresponding rules to `firestore.rules`.
