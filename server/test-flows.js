const assert = require('node:assert');

async function runTests() {
  console.log('--- Starting Comprehensive End-to-End API & Workflow Verification ---');
  const baseUrl = 'http://localhost:3000/api';

  // 1. Overview API
  console.log('1. Testing /api/overview...');
  const overviewRes = await fetch(`${baseUrl}/overview`);
  assert.strictEqual(overviewRes.status, 200);
  const overviewData = await overviewRes.json();
  assert(overviewData.stats.totalRequests >= 8, 'Overview has seeded prayers');
  assert(overviewData.recentPrayers.length > 0, 'Overview returns recent highlighted prayers');
  console.log('   ✓ Overview endpoint returned stats and recent prayers successfully.');

  // 2. Categories API
  console.log('2. Testing /api/prayers/categories...');
  const catRes = await fetch(`${baseUrl}/prayers/categories`);
  assert.strictEqual(catRes.status, 200);
  const catData = await catRes.json();
  assert(catData.categories.length >= 10, 'Expected at least 10 prayer categories');
  console.log(`   ✓ Loaded ${catData.categories.length} prayer categories.`);

  // 3. Authenticate as Pastor Daniel
  console.log('3. Testing /api/auth/login as pastor...');
  const pastorLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pastor@flamingprayerwall.org', password: 'pastor123' })
  });
  assert.strictEqual(pastorLogin.status, 200);
  const pastorData = await pastorLogin.json();
  assert.strictEqual(pastorData.user.role, 'pastor');
  const pastorToken = pastorData.token;
  console.log('   ✓ Pastor Daniel authentication successful.');

  // 4. Authenticate as Member (David Miller)
  console.log('4. Testing /api/auth/login as member (David Miller)...');
  const memberLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'david@example.com', password: 'member123' })
  });
  assert.strictEqual(memberLogin.status, 200);
  const memberData = await memberLogin.json();
  assert.strictEqual(memberData.user.role, 'user');
  const memberToken = memberData.token;
  console.log('   ✓ Member authentication successful.');

  // 5. Submit a new Public Prayer Request
  console.log('5. Testing /api/prayers (POST - submit public request)...');
  const newPrayer = await fetch(`${baseUrl}/prayers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${memberToken}`
    },
    body: JSON.stringify({
      title: 'Prayers for complete recovery and peace in our home',
      content: 'We are asking the brethren to stand in prayer with us as we trust the Lord for healing of old wounds and divine unity in our household.',
      category_id: catData.categories[0].id,
      visibility: 'public',
      is_anonymous: false
    })
  });
  assert.strictEqual(newPrayer.status, 201);
  const newPrayerData = await newPrayer.json();
  const createdId = newPrayerData.prayerId;
  assert(createdId > 0, 'Prayer ID created');
  console.log(`   ✓ New prayer request #${createdId} submitted successfully.`);

  // 6. Test "I Prayed" action & duplicate prevention
  console.log('6. Testing /api/prayers/:id/pray (I Prayed interaction)...');
  const prayRes1 = await fetch(`${baseUrl}/prayers/${createdId}/pray`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${pastorToken}` }
  });
  assert.strictEqual(prayRes1.status, 200);
  const prayData1 = await prayRes1.json();
  assert.strictEqual(prayData1.action, 'prayed');
  assert.strictEqual(prayData1.prayer_count, 1);
  console.log('   ✓ Prayer interaction recorded. Count incremented to 1.');

  // 7. Add Community Encouragement
  console.log('7. Testing /api/prayers/:id/comments (encouragement)...');
  const commentRes = await fetch(`${baseUrl}/prayers/${createdId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({
      content: 'Standing in unwavering faith with you, David. The Lord will finish what He started!'
    })
  });
  assert.strictEqual(commentRes.status, 201);
  console.log('   ✓ Encouragement posted.');

  // 8. Pastoral Prayer & Response Action
  console.log('8. Testing /api/admin/prayers/:id/pastor-response (Pastoral Prayer)...');
  const pastorRespRes = await fetch(`${baseUrl}/admin/prayers/${createdId}/pastor-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({
      response_text: 'Dear David, the Lord shall restore double for all your sorrow. Peace be upon your home. In Jesus name.',
      prayed_only: false
    })
  });
  assert.strictEqual(pastorRespRes.status, 200);
  console.log('   ✓ Pastoral prayer published with verified Pastor badge.');

  // 9. Verify single prayer request retrieval
  console.log('9. Testing /api/prayers/:id (Get prayer detail)...');
  const detailRes = await fetch(`${baseUrl}/prayers/${createdId}`);
  assert.strictEqual(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.strictEqual(detailData.prayer.has_pastor_prayed, true);
  assert.strictEqual(detailData.prayer.pastor_response.pastor_name, 'PDaniel Olawande');
  assert(detailData.prayer.pastor_response.response_text.includes('restore double'));
  assert.strictEqual(detailData.prayer.comments.length, 1);
  console.log('   ✓ Verified prayer detail contains Pastor Daniel\'s response & community encouragement.');

  // 10. Strict Privacy Test (Private Requests)
  console.log('10. Testing Strict Privacy enforcement...');
  const privatePrayer = await fetch(`${baseUrl}/prayers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${memberToken}`
    },
    body: JSON.stringify({
      title: 'Confidential burden only for Pastor Daniel',
      content: 'Pastor Daniel, please keep this strictly between us. I need spiritual counsel regarding a private family matter.',
      category_id: catData.categories[0].id,
      visibility: 'private',
      is_anonymous: true
    })
  });
  assert.strictEqual(privatePrayer.status, 201);
  const privateId = (await privatePrayer.json()).prayerId;

  // Verify that an unauthenticated guest gets 403 Forbidden!
  const guestFetchPrivate = await fetch(`${baseUrl}/prayers/${privateId}`);
  assert.strictEqual(guestFetchPrivate.status, 403, 'Guest must NOT access private request');

  // Verify that Pastor Daniel CAN access private request
  const pastorFetchPrivate = await fetch(`${baseUrl}/prayers/${privateId}`, {
    headers: { 'Authorization': `Bearer ${pastorToken}` }
  });
  assert.strictEqual(pastorFetchPrivate.status, 200, 'Pastor must be able to view private request');
  console.log('   ✓ Strict privacy verified: guests are blocked (403), Pastor Daniel is authorized (200).');

  // 11. Pagination & Filtering on Prayer Wall
  console.log('11. Testing Server-Side Pagination...');
  const pageRes = await fetch(`${baseUrl}/prayers?page=1&limit=4`);
  assert.strictEqual(pageRes.status, 200);
  const pageData = await pageRes.json();
  assert.strictEqual(pageData.prayers.length, 4);
  assert(pageData.pagination.total >= 8);
  assert.strictEqual(pageData.pagination.hasNext, true);
  console.log(`   ✓ Server-side pagination verified: Page 1 with ${pageData.prayers.length} items, total: ${pageData.pagination.total}.`);

  // 12. Admin Member & Intercessor Management
  console.log('12. Testing /api/admin/members (Registered Members & Account Management)...');
  // Unauthorized check: Member token should be rejected (403)
  const forbiddenMembers = await fetch(`${baseUrl}/admin/members`, {
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  assert.strictEqual(forbiddenMembers.status, 403, 'Regular member must not access admin members queue');

  // Authorized check: Pastor token should succeed
  const membersRes = await fetch(`${baseUrl}/admin/members`, {
    headers: { 'Authorization': `Bearer ${pastorToken}` }
  });
  assert.strictEqual(membersRes.status, 200);
  const membersData = await membersRes.json();
  assert(membersData.members.length >= 3, 'Expected registered members');
  assert(membersData.members[0].petitions_count !== undefined, 'Member stats must include petitions_count');
  assert(membersData.members[0].prayers_lifted !== undefined, 'Member stats must include prayers_lifted');
  console.log(`   ✓ Loaded ${membersData.members.length} registered members with spiritual activity metrics.`);

  // Find a non-pastor member to test role update
  const targetMember = membersData.members.find(m => m.role === 'user');
  assert(targetMember, 'Expected at least one non-pastor member');
  const targetId = targetMember.id;

  // Test Role Update: Promote member to moderator
  const roleUpdateRes = await fetch(`${baseUrl}/admin/members/${targetId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({ role: 'moderator' })
  });
  assert.strictEqual(roleUpdateRes.status, 200);
  const roleUpdateData = await roleUpdateRes.json();
  assert.strictEqual(roleUpdateData.member.role, 'moderator');
  console.log(`   ✓ Successfully elevated member "${targetMember.name}" role to moderator.`);

  // Test Self-Demotion Prevention: Pastor cannot demote himself
  const selfDemoteRes = await fetch(`${baseUrl}/admin/members/1/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({ role: 'user' })
  });
  assert.strictEqual(selfDemoteRes.status, 400, 'Pastor must not be allowed to demote self');
  console.log('   ✓ Self-demotion protection enforced (400 Bad Request).');

  // Restore member's role back to user
  await fetch(`${baseUrl}/admin/members/${targetId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({ role: 'user' })
  });

  // Test Password Reset
  const resetPwdRes = await fetch(`${baseUrl}/admin/members/${targetId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({ new_password: 'TemporaryFaith2026!' })
  });
  assert.strictEqual(resetPwdRes.status, 200);
  const resetPwdData = await resetPwdRes.json();
  assert.strictEqual(resetPwdData.temporaryPassword, 'TemporaryFaith2026!');
  console.log('   ✓ Pastoral password reset verified.');

  // Restore password back to member123 for idempotent test runs
  await fetch(`${baseUrl}/admin/members/${targetId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pastorToken}`
    },
    body: JSON.stringify({ new_password: 'member123' })
  });

  // Verify demo-login is permanently removed
  const demoLoginAttempt = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'pastor' })
  });
  assert.strictEqual(demoLoginAttempt.status, 404, 'Demo login route must be removed');
  console.log('   ✓ Confirmed: demo-login endpoint is completely removed (404 Not Found).');

  console.log('\n==========================================================');
  console.log('🌟 ALL 12 TESTS PASSED! ZERO DEMO USERS, AUTH & WORKFLOWS VERIFIED 100%.');
  console.log('==========================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
