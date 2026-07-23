// =====================================================
// Ranking Pro — Seed de dados (200 profissionais + estabelecimentos)
// Uso: node seed.js
// Preserva: usuário "Leandro Rocha"
// =====================================================

const SUPABASE_URL = 'https://pyywdhjstvhmarvzijji.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg';
const API = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// =====================================================
// GENERATORS
// =====================================================

const firstNamesM = ['João','Pedro','Carlos','Lucas','Gabriel','Rafael','Felipe','Marcos','Thiago','Diego','Bruno','Paulo','Vinicius','André','Ricardo','Eduardo','Gustavo','Rodrigo','Fernando','Luis','Marcelo','Leandro','Daniel','José','Antonio','Francisco','Roberto','Alexandre','William','Matheus','Igor','Caio','Renato','Sergio','Jorge','Alan','Leonardo','Fábio','Ramon','Hugo'];
const firstNamesF = ['Maria','Ana','Juliana','Patrícia','Camila','Amanda','Fernanda','Bruna','Larissa','Letícia','Beatriz','Carolina','Vanessa','Marina','Gabriela','Tatiane','Renata','Cristina','Aline','Débora','Jéssica','Priscila','Raquel','Cláudia','Viviane','Luciana','Elaine','Mônica','Daniela','Sabrina','Natália','Isabela','Thaís','Adriana','Rita','Sandra','Márcia','Michele','Luana','Tânia'];
const lastNames = ['Silva','Santos','Oliveira','Souza','Lima','Costa','Pereira','Carvalho','Almeida','Ferreira','Rodrigues','Martins','Barbosa','Araújo','Ribeiro','Gomes','Melo','Cavalcanti','Dias','Moreira','Teixeira','Nunes','Monteiro','Vieira','Cardoso','Correia','Castro','Mendes','Barros','Freitas','Rocha','Pinto','Machado','Cunha','Magalhães','Campos','Peixoto','Brito','Assis','Xavier'];

const specialties = ['Cabeleireiro','Barbeiro','Maquiador','Manicure','Pedicure','Designer de Sobrancelhas','Depilador','Massoterapeuta','Esteticista','Alongamento de Cílios','Micropigmentador','Tatuador','Piercer','Podólogo','Bronzeador','Dermatologista','Nutricionista','Personal Trainer','Fisioterapeuta','Terapeuta Ocupacional','Psicólogo','Maquiador Artístico','Nail Designer','Cabeleireiro Infantil','Tricologista','Penteadeira','Visagista','Barbeiro Infantil','Lash Designer','Brow Designer'];

const estTypes = ['Salão de Beleza','Barbearia','Clínica de Estética','Studio de Maquiagem','Spa','Centro de Bem-Estar','Studio de Tatuagem','Clínica Capilar','Estúdio de Beleza','Espaço Plus Size','Salão Afro','Clínica Dermatológica'];
const estNames = ['Beleza & Estilo','Corte & Arte','Studio Vip','Espaço Unique','Casa da Beleza','Salão Premium','Barbearia Clássica','Studio Beauty','Conceito Arte','Ateliê da Beleza','Espaço Mulher','Barbearia do Zé','Studio Hair','Clínica Estética','Bem Estar Total','Studio Glamour','Salão Elite','Beleza Rara','Canto do Barbeiro','Espaço Saúde & Beleza'];

const brazilianCities = [
  { city: 'São Paulo', state: 'SP', zip: '01310-000', streets: ['Av Paulista','Rua Augusta','Av Brigadeiro Faria Lima','Rua Oscar Freire','Av Rebouças'] },
  { city: 'Rio de Janeiro', state: 'RJ', zip: '20040-020', streets: ['Av Atlântica','Rua Visconde de Pirajá','Av Nossa Senhora de Copacabana','Rua Dias Ferreira'] },
  { city: 'Belo Horizonte', state: 'MG', zip: '30140-060', streets: ['Av Afonso Pena','Rua Rio de Janeiro','Av do Contorno','Rua Pernambuco'] },
  { city: 'Curitiba', state: 'PR', zip: '80020-010', streets: ['Av Batel','Rua XV de Novembro','Av Sete de Setembro','Rua Comendador Araújo'] },
  { city: 'Porto Alegre', state: 'RS', zip: '90010-000', streets: ['Av Ipiranga','Rua da Praia','Av Borges de Medeiros','Rua Padre Chagas'] },
  { city: 'Salvador', state: 'BA', zip: '40020-010', streets: ['Av Oceânica','Rua Carlos Gomes','Av Sete de Setembro','Rua da Fonte'] },
  { city: 'Fortaleza', state: 'CE', zip: '60020-010', streets: ['Av Beira Mar','Rua Monsenhor Tabosa','Av Santos Dumont','Rua Canuto de Aguiar'] },
  { city: 'Recife', state: 'PE', zip: '50010-000', streets: ['Av Boa Viagem','Rua do Imperador','Av Conde da Boa Vista','Rua Setúbal'] },
  { city: 'Brasília', state: 'DF', zip: '70040-010', streets: ['Av W3','Setor Comercial Sul','Av L2 Sul','CLS 302'] },
  { city: 'Florianópolis', state: 'SC', zip: '88010-010', streets: ['Av Beira Mar Norte','Rua Felipe Schmidt','Av Rio Branco','Rua Bocaiúva'] },
  { city: 'Campinas', state: 'SP', zip: '13010-000', streets: ['Av Francisco Glicério','Rua 13 de Maio','Av Andrade Neves','Rua Dr Quirino'] },
  { city: 'Niterói', state: 'RJ', zip: '24020-010', streets: ['Av Amaral Peixoto','Rua da Conceição','Av Visconde do Rio Branco','Rua Presidente Backer'] },
  { city: 'Manaus', state: 'AM', zip: '69010-010', streets: ['Av Djalma Batista','Av Eduardo Ribeiro','Rua 10 de Julho','Av Constantino Nery'] },
  { city: 'Goiânia', state: 'GO', zip: '74015-010', streets: ['Av Goiás','Rua 4','Av Anhangüera','Rua 15'] },
  { city: 'Vitória', state: 'ES', zip: '29010-010', streets: ['Av Jerônimo Monteiro','Av Nossa Senhora da Penha','Rua 7 de Setembro','Av Marechal Mascarenhas de Moraes'] },
];

const phonePrefixes = ['11','21','31','41','51','71','85','81','61','48','19','22','92','62','27'];

const musicTags = ['Hip Hop','Rock','Sertanejo','Pop','MPB','Eletrônico','Jazz','Reggae','Blues'];
const visualTags = ['Streetwear','Clássico','Moderno','Tradicional','Casual','Elegante','Despojado'];
const personalityTags = ['Comunicativo','Reservado','Extrovertido','Detalhista','Rápido','Perfeccionista','Criativo'];
const lifestyleTags = ['Não bebe','Bebe socialmente','Não fuma','Vegano','Esportista','Noturno'];
const workTags = ['Especialista','Generalista','Experiente','Premium','Popular'];
const vibeTags = ['Descontraído','Sério','Animado','Calmo','Intimista','Acolhedor'];
const infraTags = ['Wi-Fi','Café','Bar','Ar Condicionado','Estacionamento','Pet Friendly','Acessibilidade','TV'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function picks(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function generateCpf() {
  const n = Array.from({ length: 9 }, () => randInt(0, 9));
  const d1 = n.reduce((s, v, i) => s + v * (10 - i), 0) * 10 % 11 % 10;
  const d2 = [...n, d1].reduce((s, v, i) => s + v * (11 - i), 0) * 10 % 11 % 10;
  return n.join('') + d1 + d2;
}

function generatePhone() { return pick(phonePrefixes) + '9' + randInt(10000000, 99999999); }

function randomBirthDate() {
  const now = new Date();
  const year = now.getFullYear() - randInt(18, 65);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slugify(name) { return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generatePerson(index) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale ? pick(firstNamesM) : pick(firstNamesF);
  const lastName = pick(lastNames);
  const name = `${firstName} ${lastName}`;
  const email = `${slugify(firstName)}.${slugify(lastName)}${index}@email.com`;
  const specialty = pick(specialties);
  const cityData = pick(brazilianCities);
  const street = pick(cityData.streets);
  const num = String(randInt(10, 999));
  const cpf = generateCpf();
  const phone = generatePhone();
  return { name, email, specialty, cityData, street, num, cpf, phone, isMale, firstName };
}

function profilePhotoUrl(name) { return `https://picsum.photos/seed/${slugify(name)}/300/300`; }
function galleryUrls(name) {
  const count = randInt(0, 6);
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${slugify(name)}-g-${i+1}/400/400`);
}

// =====================================================
// SUPABASE API HELPERS
// =====================================================

async function supabaseFetch(method, table, body) {
  const url = `${API}/${table}`;
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table}: ${res.status} ${text}`);
  }
  return res;
}

async function supabaseSelect(table, query) {
  const url = `${API}/${table}?${query || ''}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`SELECT ${table}: ${res.status}`);
  return res.json();
}

async function batchInsert(table, rows) {
  if (!rows.length) return;
  console.log(`  Inserindo ${rows.length} registros em ${table}...`);
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    await supabaseFetch('POST', table, batch);
  }
}

async function del(table) {
  // Delete all rows by using a filter that matches all UUIDs:
  // id >= nil UUID (which is the minimum possible UUID)
  const url = `${API}/${table}?id=gte.00000000-0000-0000-0000-000000000000`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    if (!text.includes('PGRST116')) throw new Error(`DELETE ${table}: ${res.status} ${text}`);
  }
}

// =====================================================
// MAIN
// =====================================================

(async () => {
  console.log('\n=== SEED: 200 profissionais + estabelecimentos ===\n');

  // 1. Find Leandro Rocha to preserve
  console.log('1. Localizando Leandro Rocha...');
  const users_existing = await supabaseSelect('users', 'name=eq.Leandro%20Rocha&select=id');
  const leandroId = users_existing?.[0]?.id;
  if (leandroId) console.log(`   Leandro Rocha encontrado: ${leandroId}`);
  else console.log('   Leandro Rocha não encontrado');

  // 2. Clear all data (FK-safe order)
  console.log('\n2. Deletando dados existentes (exceto Leandro)...');

  // Nullify Leandro's FKs first so they don't block
  if (leandroId) {
    await supabaseFetch('PATCH', `users?id=eq.${leandroId}`, {
      professional_id: null,
      establishment_id: null,
      client_id: null
    });
    // Clear his links to establishment ownership too
    await supabaseFetch('PATCH', `establishments?owner_user_id=eq.${leandroId}`, {
      owner_user_id: null
    });
  }

  // Tables with FKs to others (delete first, FK-safe)
  const leafTables = [
    'reviews', 'qr_codes', 'professional_establishments',
    'professional_tags', 'establishment_tags',
    'professional_private_data', 'professional_profiles',
    'user_profiles'
  ];
  for (const tbl of leafTables) {
    try { await del(tbl); } catch (e) { console.warn(`   ⚠️  ${tbl}: ${e.message}`); }
  }

  if (leandroId) {
    // Delete todos exceto Leandro
    await supabaseFetch('DELETE', `users?id=neq.${leandroId}`, null);
    await del('professionals');
    await del('establishments');
    await del('client_profiles');
  } else {
    for (const tbl of ['professionals', 'establishments', 'users', 'client_profiles']) {
      try { await del(tbl); } catch (e) { console.warn(`   ⚠️  ${tbl}: ${e.message}`); }
    }
  }
  console.log('   Delete concluído');

  // 3. Generate data
  console.log('\n3. Gerando dados...');
  const TOTAL = 200;
  const OWNER_COUNT = Math.round(TOTAL * 0.03);
  const EST_COUNT = OWNER_COUNT + 10;

  const people = Array.from({ length: TOTAL }, (_, i) => generatePerson(i));

  // Establishments
  const establishments = Array.from({ length: EST_COUNT }, (_, i) => {
    const cityData = pick(brazilianCities);
    const isOwner = i < OWNER_COUNT;
    return {
      id: uuid(),
      name: `${pick(estNames)} ${pick(estTypes)}`,
      type: pick(estTypes),
      description: `Referência em ${pick(specialties).toLowerCase()} na região. Ambiente acolhedor e profissionais qualificados.`,
      specialty: pick(specialties),
      avatar_url: profilePhotoUrl(`est-${i}`),
      gallery_urls: galleryUrls(`est-${i}`),
      phone: generatePhone(),
      whatsapp: generatePhone(),
      email: `contato@estabelecimento${i}.com.br`,
      zip_code: cityData.zip,
      street: pick(cityData.streets),
      number: String(randInt(10, 999)),
      neighborhood: pick(['Centro','Jardins','Boa Viagem','Barra','Savassi','Batel','Moinhos de Vento','Vila Olímpia','Copacabana','Itaim Bibi','Asa Sul','Liberdade','Cambuí','Pituba']),
      city: cityData.city,
      state: cityData.state,
      country: 'Brasil',
      infra_tags: picks(infraTags, 2, 5),
      music_tags: picks(musicTags, 1, 3),
      positioning_tags: picks(['Premium','Popular','Tradicional','Moderno','Luxo','Despojado'], 1, 2),
      audience_tags: picks(['Família','Adulto','LGBTQIA+','Empresarial','Infantil','Terceira idade','Todos'], 1, 3),
      vibe_tags: picks(vibeTags, 1, 3),
      avg_rating: Math.round((3 + Math.random() * 2) * 100) / 100,
      total_reviews: randInt(1, 50),
      years_active: randInt(1, 25),
      target_audience: pick(['Todos os públicos','Público feminino','Público masculino','Jovens','Adultos','Profissionais']),
      owner_user_id: null,
      created_at: new Date().toISOString()
    };
  });

  const ownerEstIds = establishments.slice(0, OWNER_COUNT).map(e => e.id);
  const regularEstIds = establishments.slice(OWNER_COUNT).map(e => e.id);

  // Professionals
  const professionals = people.map((p, i) => {
    const id = uuid();
    const isOwner = i < OWNER_COUNT;
    const estId = isOwner
      ? ownerEstIds[i]
      : (regularEstIds.length ? pick(regularEstIds) : establishments[0].id);

    return {
      id,
      name: p.name,
      specialty: p.specialty,
      bio: `${p.name} é ${p.specialty?.toLowerCase() || 'profissional'} com ampla experiência em atendimento personalizado. Especialista em tendências e técnicas modernas do mercado.`,
      phone: p.phone,
      email: p.email,
      avatar_url: profilePhotoUrl(p.name),
      gallery_urls: galleryUrls(p.name),
      music_tags: picks(musicTags, 0, 3),
      visual_tags: picks(visualTags, 0, 3),
      personality_tags: picks(personalityTags, 0, 3),
      lifestyle_tags: picks(lifestyleTags, 0, 3),
      work_tags: picks(workTags, 0, 3),
      price_range: pick(['$$','$$$','$$$$','$','$$$$$']),
      availability: picks(['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'], 3, 6),
      salary_expectation: pick(['A combinar','R$ 2.000-3.000','R$ 3.000-5.000','R$ 5.000-8.000','R$ 8.000+']),
      average_job_duration_months: randInt(3, 48),
      work_style_tags: picks(workTags, 1, 3),
      available_now: Math.random() > 0.5,
      seeking_work: !isOwner,
      client_portfolio_count: randInt(5, 200),
      igv_score: Math.round((50 + Math.random() * 50) * 100) / 100,
      previous_workplaces: `${pick(estNames)} (${randInt(1,5)} anos), ${pick(estNames)} (${randInt(1,3)} anos)`,
      current_establishment_id: estId,
      tags: picks(['Premium','Verificado','Destaque','Novo','Top'], 0, 2),
      style_tags: picks(['Clássico','Moderno','Trendy','Tradicional','Exótico'], 1, 3),
      avg_rating: Math.round((3 + Math.random() * 2) * 100) / 100,
      total_reviews: randInt(1, 80),
      is_active: true,
      created_at: new Date().toISOString()
    };
  });

  // Professional profiles (1:1)
  const profProfiles = professionals.map(prof => ({
    id: uuid(),
    professional_id: prof.id,
    bio: prof.bio,
    specialty: prof.specialty,
    years_experience: randInt(1, 30),
    instagram: `@${slugify(prof.name)}`,
    created_at: new Date().toISOString()
  }));

  // Professional private data (1:1)
  const profPrivateData = professionals.map((prof, i) => {
    const p = people[i];
    return {
      id: uuid(),
      professional_id: prof.id,
      full_name: prof.name,
      cpf: p.cpf,
      birth_date: randomBirthDate(),
      email: prof.email,
      phone: prof.phone,
      zip_code: p.cityData.zip,
      street: p.street,
      number: p.num,
      neighborhood: pick(['Centro','Jardins','Vila Nova','Boa Vista','Barra','Savassi','Pituba','Asa Norte']),
      city: p.cityData.city,
      state: p.cityData.state,
      country: 'Brasil',
      created_at: new Date().toISOString()
    };
  });

  // Users for each professional
  const profUsers = professionals.map((prof, i) => {
    const p = people[i];
    const isOwner = i < OWNER_COUNT;
    return {
      id: uuid(),
      name: prof.name,
      email: prof.email,
      provider: 'seed',
      role: isOwner ? 'estabelecimento' : 'profissional',
      professional_id: prof.id,
      establishment_id: isOwner ? establishments[i].id : null,
      client_id: null,
      is_admin: false,
      created_at: new Date().toISOString()
    };
  });

  // Update establishment owner_user_id for owner establishments
  for (let i = 0; i < OWNER_COUNT; i++) {
    establishments[i].owner_user_id = profUsers[i].id;
  }

  // Professional_establishments (link)
  const profEstLinks = professionals.map(prof => ({
    id: uuid(),
    professional_id: prof.id,
    establishment_id: prof.current_establishment_id,
    is_current: true,
    started_at: new Date(Date.now() - randInt(30, 365) * 86400000).toISOString(),
    created_at: new Date().toISOString()
  }));

  // QR codes for each professional
  const APP_BASE = 'https://leandrogrochamedia.github.io/rankingprobeta2';
  const qrCodes = professionals.map(prof => {
    const token = uuid();
    return {
      id: uuid(),
      professional_id: prof.id,
      token,
      url: `${APP_BASE}/scan/?token=${token}`,
      expires_at: new Date(Date.now() + 365 * 86400000 * 2).toISOString(),
      created_at: new Date().toISOString()
    };
  });

  // 4. Insert data (FK-safe order)
  console.log('\n4. Inserindo dados no Supabase...');

  // 4a. Establishments WITHOUT owner_user_id
  const estNoOwner = establishments.map(({ owner_user_id, ...rest }) => ({ ...rest, owner_user_id: null }));
  await batchInsert('establishments', estNoOwner);

  // 4b. Professionals (FK to establishments via current_establishment_id)
  await batchInsert('professionals', professionals);

  // 4c. Professional profiles & private data (FK to professionals)
  await batchInsert('professional_profiles', profProfiles);
  await batchInsert('professional_private_data', profPrivateData);

  // 4d. Users (FK to professionals & establishments)
  await batchInsert('users', profUsers);

  // 4e. Update establishment owner_user_id
  for (let i = 0; i < OWNER_COUNT; i++) {
    await supabaseFetch('PATCH', `establishments?id=eq.${establishments[i].id}`, {
      owner_user_id: profUsers[i].id
    });
  }
  console.log('   Owner links atualizados');

  await batchInsert('professional_establishments', profEstLinks);
  await batchInsert('qr_codes', qrCodes);

  // 5. Summary
  console.log('\n=== SEED CONCLUÍDO ===');
  console.log(`   Profissionais: ${TOTAL}`);
  console.log(`   Donos (3%): ${OWNER_COUNT}`);
  console.log(`   Estabelecimentos: ${EST_COUNT}`);
  console.log(`   QR codes gerados: ${qrCodes.length}`);
  console.log(`   Leandro Rocha: ${leandroId ? '✅ Preservado' : '⚠️  Não encontrado'}`);
  console.log('');
})().catch(err => {
  console.error('\n❌ ERRO:', err.message);
  process.exit(1);
});