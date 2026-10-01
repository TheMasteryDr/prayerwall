const bcrypt = require('bcryptjs');
const { db, initializeSchema } = require('./database');

async function seedDatabase() {
  initializeSchema();

  // Check if categories already exist
  const existingCat = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (existingCat.count > 0) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding database with initial spiritual data and Pastor account...');

  // Default Categories
  const categories = [
    { name: 'Family & Home', slug: 'family', description: 'Prayers for spouses, children, parents, and reconciliation at home', icon: 'home', order: 1 },
    { name: 'Healing & Health', slug: 'health', description: 'Standing in faith for divine physical healing, recovery, and strength', icon: 'heart', order: 2 },
    { name: 'Spiritual Growth', slug: 'spiritual-growth', description: 'Deepening intimacy with God, prayer life, word study, and purity', icon: 'book-open', order: 3 },
    { name: 'Career & Work', slug: 'career', description: 'Job searches, business ventures, workplace favor, and professional guidance', icon: 'briefcase', order: 4 },
    { name: 'Finances & Provision', slug: 'finances', description: 'Believing God for financial breakthrough, debt release, and wisdom', icon: 'shield', order: 5 },
    { name: 'Marriage & Courtship', slug: 'marriage', description: 'Marital peace, godly spouses, wedding preparations, and unity', icon: 'heart-handshake', order: 6 },
    { name: 'Mental & Emotional Peace', slug: 'peace', description: 'Overcoming anxiety, depression, grief, fear, and finding God’s rest', icon: 'sun', order: 7 },
    { name: 'Education & Exams', slug: 'education', description: 'Academic excellence, school admissions, exams, and wisdom', icon: 'graduation-cap', order: 8 },
    { name: 'Ministry & Calling', slug: 'ministry', description: 'Evangelism, church leadership, missionary work, and spiritual gifts', icon: 'flame', order: 9 },
    { name: 'Thanksgiving & Praise', slug: 'thanksgiving', description: 'Celebrating answered prayers and testimonies of God’s goodness', icon: 'sparkles', order: 10 },
    { name: 'Personal & Other', slug: 'other', description: 'Specific confidential burdens, travel mercies, and everyday needs', icon: 'feather', order: 11 }
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (name, slug, description, icon, display_order, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  for (const cat of categories) {
    insertCat.run(cat.name, cat.slug, cat.description, cat.icon, cat.order);
  }

  // Seed Users
  const pastorHash = await bcrypt.hash('pastor123', 10);
  const memberHash = await bcrypt.hash('member123', 10);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar, bio, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. PDaniel Olawande (Pastor / Admin)
  const pastorRes = insertUser.run(
    'PDaniel Olawande',
    'pastor@flamingprayerwall.org',
    pastorHash,
    'pastor',
    '/images/pdaniel.jpg',
    'Lead Pastor, The Envoys & Convener of YMR (Young Ministers Retreat) / The Flaming Network. Walking in the fire of the Holy Ghost and interceding for believers worldwide.',
    now,
    now
  );
  const pastorId = pastorRes.lastInsertRowid;

  // 2. Sister Sarah
  const sarahRes = insertUser.run(
    'Sarah Jenkins',
    'sarah@example.com',
    memberHash,
    'user',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Mother of two, believer trusting God for her family’s breakthrough.',
    now,
    now
  );
  const sarahId = sarahRes.lastInsertRowid;

  // 3. Brother David
  const davidRes = insertUser.run(
    'David Miller',
    'david@example.com',
    memberHash,
    'user',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'Fellow intercessor, grateful for the body of Christ.',
    now,
    now
  );
  const davidId = davidRes.lastInsertRowid;

  // 4. Sister Grace
  const graceRes = insertUser.run(
    'Grace Okafor',
    'grace@example.com',
    memberHash,
    'user',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    'Graduate student leaning completely on God’s grace.',
    now,
    now
  );
  const graceId = graceRes.lastInsertRowid;

  // Initial Seed Platform Settings
  const insertSetting = db.prepare('INSERT INTO platform_settings (key, value) VALUES (?, ?)');
  insertSetting.run('platform_name', 'Flaming Prayer Wall');
  insertSetting.run('pastor_name', 'PDaniel Olawande');
  insertSetting.run('pastor_title', 'Convener of YMR & Lead Pastor, The Envoys');
  insertSetting.run('church_name', 'Flaming Network / The Envoys');
  insertSetting.run('scripture_verse', 'The fire shall ever be burning upon the altar; it shall never go out.');
  insertSetting.run('scripture_ref', 'Leviticus 6:13');
  insertSetting.run('pagination_size', '12');

  // Seed Realistic Prayer Requests
  const samplePrayers = [
    {
      user_id: sarahId,
      author_name: 'Sarah Jenkins',
      is_anonymous: 0,
      title: 'Divine peace and healing for my elderly mother in intensive care',
      content: 'My mother was admitted to the hospital three days ago with severe respiratory distress. The doctors are monitoring her closely, but we know the ultimate Physician is the Lord Jesus. Please stand with our family in prayer for her lungs to clear completely, for pain relief, and for the peace that surpasses all understanding to guard her heart and mind.',
      category_slug: 'health',
      visibility: 'public',
      status: 'active',
      prayer_count: 58,
      hours_ago: 5,
      has_pastor: true,
      pastor_response: 'Sister Sarah, we hold your precious mother up before the throne of grace. Father, You are Jehovah Rapha, the Lord who heals. Breath of Life, enter her lungs right now. Clear every inflammation, strengthen her vital organs, and grant supernatural wisdom to every physician and nurse caring for her. We speak peace and life over her room in Jesus’ name. Amen.'
    },
    {
      user_id: null,
      author_name: 'Anonymous',
      is_anonymous: 1,
      title: 'Restoration of trust and communication in our marriage',
      content: 'My spouse and I have been going through an agonizing season of silence and emotional distance. Hurtful words were spoken months ago, and we are struggling to find our way back to humility and forgiveness. Please pray that God softens our hearts toward each other and removes the spirit of pride.',
      category_slug: 'marriage',
      visibility: 'public',
      status: 'active',
      prayer_count: 42,
      hours_ago: 11,
      has_pastor: true,
      pastor_response: 'Beloved brother/sister, where human patience runs dry, the love of Christ is infinite. We declare Colossians 3:13 over your home today—bearing with each other and forgiving whatever grievances you may have against one another. Lord, heal the wounded memories, tear down every wall of resentment, and rekindle holy tenderness and reconciliation. Stand firm; God is working in the quiet.'
    },
    {
      user_id: davidId,
      author_name: 'David Miller',
      is_anonymous: 0,
      title: 'Guidance and open doors for job interview next Tuesday',
      content: 'After six months of unemployment, I have received an invitation for a final interview for a position that will allow me to provide for my family and also serve in our local church outreach. Please pray for clarity of thought, God’s favor before the interview panel, and that His will prevail.',
      category_slug: 'career',
      visibility: 'public',
      status: 'active',
      prayer_count: 31,
      hours_ago: 18,
      has_pastor: false,
      pastor_prayed_only: true
    },
    {
      user_id: graceId,
      author_name: 'Grace Okafor',
      is_anonymous: 0,
      title: 'Peace of mind against debilitating anxiety during bar exams',
      content: 'Final licensure examinations begin this coming Monday. The academic load has been heavy and fear keeps trying to overwhelm my focus. I am asking the body of Christ to pray that God grants me a sound mind, peaceful sleep, and total recall of everything I have studied according to 2 Timothy 1:7.',
      category_slug: 'education',
      visibility: 'public',
      status: 'active',
      prayer_count: 27,
      hours_ago: 26,
      has_pastor: true,
      pastor_response: 'Grace, 2 Timothy 1:7 says God has not given you a spirit of fear, but of power, love, and a sound mind. We speak divine stillness over your thoughts. Every late-night preparation is sanctified. You shall walk into that exam room clothed in divine composure and come out with a testimony of excellence!'
    },
    {
      user_id: null,
      author_name: 'Brother in Christ',
      is_anonymous: 0,
      title: 'Praise report: The loan was forgiven and mortgage crisis resolved!',
      content: 'Two months ago, I posted here asking for prayer regarding imminent foreclosure on our family house. Today, the bank notified us that an administrative debt restructuring grant went through, wiping out the arrears completely! God answered our collective cry. Thank you all for praying with me!',
      category_slug: 'thanksgiving',
      visibility: 'public',
      status: 'answered',
      prayer_count: 84,
      hours_ago: 36,
      has_pastor: true,
      pastor_response: 'Glory be to God! What a mighty testimony of God’s timely faithfulness. To God alone be all the glory, and may this encourage every brother and sister still waiting on their breakthrough!'
    },
    {
      user_id: sarahId,
      author_name: 'Sarah Jenkins',
      is_anonymous: 0,
      title: 'Salvation and deliverance for my younger brother',
      content: 'Please intercede for my brother Michael. He walked away from faith during college and has been caught in destructive habits. We are praying that the Holy Spirit touches his heart, that God brings godly mentors across his path, and that he returns to the loving arms of the Father like the prodigal son.',
      category_slug: 'family',
      visibility: 'public',
      status: 'active',
      prayer_count: 49,
      hours_ago: 48,
      has_pastor: true,
      pastor_response: 'We stand in agreement with you, Sister Sarah. No prodigal is beyond the reach of God’s redeeming grace. Father, dispatch convicting mercy to Michael wherever he is today. Break every chain of addiction and draw him back home to You.'
    },
    {
      user_id: null,
      author_name: 'Anonymous',
      is_anonymous: 1,
      title: 'Spiritual revival and renewal in personal prayer life',
      content: 'I have felt spiritually dry and fatigued over the past several weeks. Prayer feels like a battle and reading the Word has felt mechanical. Please pray that God rekindles the fresh fire of the Holy Spirit inside my heart.',
      category_slug: 'spiritual-growth',
      visibility: 'public',
      status: 'active',
      prayer_count: 19,
      hours_ago: 54,
      has_pastor: false,
      pastor_prayed_only: false
    },
    {
      user_id: davidId,
      author_name: 'David Miller',
      is_anonymous: 0,
      title: 'Traveling mercies for our mission team to northern villages',
      content: 'Our fellowship outreach team departs on Friday morning to conduct medical screenings and share the Gospel in rural communities. Pray for safety on difficult roads, good health for all volunteers, and hearts receptive to Christ.',
      category_slug: 'ministry',
      visibility: 'public',
      status: 'active',
      prayer_count: 36,
      hours_ago: 72,
      has_pastor: true,
      pastor_response: 'The Lord shall preserve your going out and your coming in from this time forth, even forevermore (Psalm 121:8). Go with boldness, David; every soul appointed for salvation shall be gathered in.'
    },
    {
      user_id: graceId,
      author_name: 'Confidential Member',
      is_anonymous: 1,
      title: 'Private burden: Pastoral counsel and prayer regarding personal grief',
      content: 'Dear Pastor Daniel, I recently experienced a quiet miscarriage that no one else in our circle knows about yet. The grief has been overwhelming. I just need you to pray for my husband and me in secret.',
      category_slug: 'peace',
      visibility: 'private',
      status: 'active',
      prayer_count: 1,
      hours_ago: 8,
      has_pastor: true,
      pastor_response: 'My dear sister and brother, our hearts weep with you in this sacred, tender grief. The Lord is close to the brokenhearted and saves those who are crushed in spirit (Psalm 34:18). Your precious little one is safe in the gentle hands of Jesus. I am praying over your physical recovery, your marriage, and the deep consolation only the Holy Spirit can minister. You are deeply loved.'
    }
  ];

  const catMap = {};
  const allCats = db.prepare('SELECT id, slug FROM categories').all();
  for (const c of allCats) {
    catMap[c.slug] = c.id;
  }

  const insertPrayer = db.prepare(`
    INSERT INTO prayer_requests (
      user_id, title, content, category_id, visibility, status,
      is_anonymous, author_name, prayer_count, has_pastor_prayed,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPastorResp = db.prepare(`
    INSERT INTO pastor_responses (
      prayer_request_id, pastor_id, pastor_name, response_text, prayed_only, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (
      prayer_request_id, user_id, author_name, content, status, created_at
    ) VALUES (?, ?, ?, ?, 'approved', ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (
      user_id, type, prayer_request_id, message, read_at, created_at
    ) VALUES (?, ?, ?, ?, NULL, ?)
  `);

  for (const p of samplePrayers) {
    const createdTime = new Date(Date.now() - p.hours_ago * 3600 * 1000).toISOString();
    const catId = catMap[p.category_slug] || 1;
    const hasPastorPrayed = p.has_pastor || p.pastor_prayed_only ? 1 : 0;

    const res = insertPrayer.run(
      p.user_id,
      p.title,
      p.content,
      catId,
      p.visibility,
      p.status,
      p.is_anonymous,
      p.author_name,
      p.prayer_count,
      hasPastorPrayed,
      createdTime,
      createdTime
    );

    const prayerId = res.lastInsertRowid;

    // Add Pastor response if applicable
    if (p.has_pastor && p.pastor_response) {
      const pastorTime = new Date(Date.now() - (p.hours_ago - 2) * 3600 * 1000).toISOString();
      insertPastorResp.run(
        prayerId,
        pastorId,
        'Pastor Daniel',
        p.pastor_response,
        0,
        pastorTime,
        pastorTime
      );

      // Create notification for user if registered
      if (p.user_id) {
        insertNotif.run(
          p.user_id,
          'pastor_response',
          prayerId,
          'Pastor Daniel has personally prayed and left pastoral encouragement on your request.',
          pastorTime
        );
      }
    } else if (p.pastor_prayed_only) {
      const pastorTime = new Date(Date.now() - (p.hours_ago - 1) * 3600 * 1000).toISOString();
      insertPastorResp.run(
        prayerId,
        pastorId,
        'Pastor Daniel',
        null,
        1,
        pastorTime,
        pastorTime
      );

      if (p.user_id) {
        insertNotif.run(
          p.user_id,
          'pastor_prayed',
          prayerId,
          'Pastor Daniel has stood in prayer for your request.',
          pastorTime
        );
      }
    }

    // Add sample community encouragements on public requests
    if (p.visibility === 'public') {
      const commTime1 = new Date(Date.now() - (p.hours_ago - 1.5) * 3600 * 1000).toISOString();
      insertComment.run(prayerId, sarahId, 'Sarah J.', 'Standing with you in faith. God is able!', commTime1);

      const commTime2 = new Date(Date.now() - (p.hours_ago - 2.5) * 3600 * 1000).toISOString();
      insertComment.run(prayerId, davidId, 'David M.', 'Lifted this up during morning prayer. Stay encouraged!', commTime2);
    }
  }

  console.log('Seeding complete. Initialized realistic prayer wall data with Pastor Daniel.');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seed execution finished.');
    process.exit(0);
  }).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
