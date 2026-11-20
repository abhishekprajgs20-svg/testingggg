// UPSC CSE syllabus outline: Exam > Paper > Subject > Unit > Topic > Subtopic > Micro-topic.
// Paper / subject headings follow the official UPSC syllabus; the finer breakdown (unit→micro-topic) is a study breakdown prepared for QUIZINOX.
// Format: one node per line, depth = number of leading spaces. A "Subtopic: a | b | c" line lists its micro-topics.
// A Topic line that has ":" lists micro-topics directly (grouped under "Key areas"). Edit freely — progress is keyed by stable ids.
export const SYLLABUS_TEXT = `
Prelims
 GS Paper I
  Indian Polity & Governance
   Constitution: Evolution & Features
    Historical underpinnings
     Pre-1947: Regulating Act 1773 | Pitt's India Act 1784 | Charter Acts 1813-1853 | GoI Acts 1858, 1909, 1919, 1935 | Cabinet Mission 1946 | Indian Independence Act 1947
     Making of the Constitution: Constituent Assembly | Objectives Resolution | Drafting Committee | Adoption and enactment
    Salient features: Preamble | Sources of the Constitution | Parts and Schedules | Basic structure doctrine | Amendment procedure (Art 368)
    Union & its territory: Art 1-4 | Reorganisation of states | Citizenship (Art 5-11) | Citizenship Act 1955
   Rights, Duties & Directive Principles
    Fundamental Rights (Art 12-35): Definition of State & law (Art 12-13) | Equality (14-18) | Freedoms (19-22) | Exploitation (23-24) | Religion (25-28) | Cultural & educational (29-30) | Constitutional remedies (32) | Writs
    Directive Principles (Art 36-51): Socialistic | Gandhian | Liberal-intellectual | FR vs DPSP | Art 31C
    Fundamental Duties (Art 51A): List of duties | Swaran Singh Committee
   Union Government
    Executive: President (election, powers, ordinances) | Vice-President | Prime Minister & Council of Ministers | Attorney General | Cabinet committees
    Parliament: Lok Sabha & Rajya Sabha | Legislative procedure | Money & Financial bills | Parliamentary committees | Parliamentary privileges | Sessions & motions
    Judiciary: Supreme Court (jurisdiction, judges, PIL) | High Courts | Subordinate courts | Judicial review & activism | Tribunals | Collegium
   State Government
    Governor | Chief Minister & Council | State Legislature | Legislative Council | Special provisions (Art 370 history, Art 371 series)
   Federalism & Centre-State Relations
    Distribution of powers: Seventh Schedule lists | Residuary powers | Legislative, administrative & financial relations | Inter-State Council | Finance Commission | GST Council | Sarkaria & Punchhi Commissions
    Emergency provisions: National (352) | State (356) | Financial (360) | 44th Amendment safeguards
   Local Government
    Panchayati Raj (Part IX): 73rd Amendment | Gram Sabha | Three-tier structure | State Election/Finance Commissions | PESA
    Municipalities (Part IX-A): 74th Amendment | Types of urban bodies | 12th Schedule
   Constitutional & Non-Constitutional Bodies
    Constitutional bodies: Election Commission | UPSC & SPSC | Finance Commission | CAG | Attorney General | NCSC & NCST | Special officer for linguistic minorities
    Statutory & other bodies: NHRC | CIC | CVC | Lokpal | NITI Aayog | NGT | SEBI | TRAI
   Governance
    Elections & representation: RPA 1950 & 1951 | Anti-defection (Tenth Schedule) | Electoral reforms | Political parties | Voting behaviour
    E-governance & accountability: RTI Act | Citizen's Charter | Social audit | Good governance | Government schemes delivery
  Indian History & National Movement
   Ancient India
    Prehistoric & Indus Valley: Palaeolithic-Neolithic | Harappan sites | Society & economy | Decline
    Vedic & Later Vedic: Society | Polity | Economy | Religion | Philosophy
    Mahajanapadas to Mauryas: Buddhism & Jainism | Magadha rise | Mauryan administration | Ashoka's Dhamma | Edicts
    Post-Mauryan & Gupta age: Shungas | Kushanas | Satavahanas | Sangam age | Gupta administration | Science and literature
    Early medieval India: Harsha | Rajputs | Cholas | Pallavas | Chalukyas | Tripartite struggle
   Medieval India
    Delhi Sultanate: Dynasties | Administration | Economy | Architecture | Sufism
    Mughal Empire: Babur to Aurangzeb | Mansabdari | Land revenue | Architecture & painting | Decline
    Regional kingdoms & Bhakti: Vijayanagara | Bahmani | Marathas | Bhakti saints | Sufi orders
   Modern India
    Advent of Europeans & Company rule: Battles (Plassey, Buxar) | Subsidiary Alliance | Doctrine of Lapse | Land revenue systems | Economic drain
    1857 and after: Causes | Course | Consequences | Crown rule | Reforms
    Socio-religious reform movements: Brahmo Samaj | Arya Samaj | Aligarh | Ramakrishna Mission | Women & caste reform
    Freedom struggle: Early nationalists & Moderates | Extremists & Swadeshi | Home Rule | Gandhian era (Champaran-Quit India) | Revolutionaries | INA & Subhas Chandra Bose | Peasant & tribal movements | Partition & Independence
    Post-independence consolidation: Integration of princely states | Reorganisation of states | Language issue | Planning & Green Revolution
   Art & Culture
    Architecture & sculpture: Temple styles | Indo-Islamic | Stupas & caves | Colonial | Sculpture schools
    Painting, music & dance: Mural & miniature | Folk art | Hindustani vs Carnatic | Classical dances | Theatre
    Heritage & institutions: UNESCO sites | Intangible heritage | Languages & literature | Festivals | Cultural institutions
  Geography
   Physical Geography
    Geomorphology: Earth's interior | Plate tectonics | Rocks & minerals | Landforms | Weathering & erosion
    Climatology: Atmosphere layers | Pressure & winds | Monsoon & jet streams | Cyclones | El Nino & La Nina | Climate classification
    Oceanography: Ocean relief | Salinity & temperature | Currents | Tides | Marine resources
   Indian Geography
    Physiography & drainage: Himalayas | Northern plains | Peninsular plateau | Coasts & islands | Himalayan rivers | Peninsular rivers
    Climate, soils & vegetation: Seasons | Rainfall distribution | Soil types | Natural vegetation | Biosphere & wildlife regions
    Resources & economy: Agriculture & crops | Irrigation | Minerals & energy | Industries | Transport | Population & urbanisation
   World Geography
    Continents & regions: Major mountains | Rivers & lakes | Deserts | Straits & canals | Map-based facts
    Human & economic geography: Resources | Industrial regions | Agriculture belts | Migration & settlements
  Indian Economy
   Basics & National Income
    Concepts: GDP, GNP, NNP | Inflation (CPI, WPI) | Business cycles | Unemployment types | Poverty measures
    Planning & NITI Aayog: Five-Year Plans | Planning Commission to NITI Aayog | Economic reforms 1991
   Money, Banking & Markets
    Banking: RBI functions | Monetary policy tools | Commercial & cooperative banks | NBFCs | Payment systems & UPI | Banking reforms
    Financial markets: Capital market | SEBI | Insurance & pension | Financial inclusion | Digital currency
   Fiscal Policy & Taxation
    Budget & fiscal: Union Budget | Revenue & capital receipts | Deficits | FRBM Act | Finance Commission | Subsidies
    Taxation: Direct taxes | GST | Black money | Tax reforms
   External Sector
    Trade & payments: BoP, CAD | Exchange rate | FDI & FPI | Trade policy | WTO | IMF, World Bank, ADB, AIIB
   Sectors
    Agriculture: Cropping patterns | MSP & procurement | Agri-markets | Land reforms | Food security & PDS | Allied sectors
    Industry & services: Industrial policy | MSMEs | Infrastructure | Energy | Start-ups | Services sector
   Inclusive Growth & Schemes
    Welfare: Major flagship schemes | Social sector (health, education) | Demographic dividend | Economic Survey & reports
  Environment & Ecology
   Ecology & Biodiversity
    Ecology basics: Ecosystem types | Food chains & energy flow | Biogeochemical cycles | Ecological succession
    Biodiversity: Hotspots | Endemism | Threats | In-situ & ex-situ conservation
    Protected areas & species: National Parks | Sanctuaries | Biosphere reserves | Tiger & Elephant reserves | Ramsar sites | IUCN Red List | Species in news
   Climate & Pollution
    Climate change: Greenhouse effect | UNFCCC & Paris Agreement | India's NDCs | Carbon markets | Adaptation & mitigation
    Pollution & waste: Air | Water | Soil | Noise | Solid & plastic waste | E-waste
   Laws, Institutions & Conventions
    Indian framework: Environment Protection Act 1986 | Wildlife Protection Act 1972 | Forest Conservation Act | EIA | NGT | Biodiversity Act 2002
    Global framework: CBD | CITES | CMS | Ramsar | Montreal Protocol | UNCCD
  Science & Technology
   Core science & applications
    Physics & chemistry basics | Biology & health | Space technology (ISRO missions) | Defence technology | Nuclear technology | IT, AI & quantum | Biotechnology | Energy & new materials | Nanotechnology | Robotics & drones
  General Issues & Current Events
   International & National Events
    Government schemes | Reports & indices | Awards | Summits & groupings | Sports & places in news
 CSAT (GS Paper II)
  Comprehension & Reasoning
   Reading Comprehension
    Passage-based questions: Main idea | Inference | Tone & author's view | Vocabulary in context
   Logical Reasoning & Analytical Ability
    Reasoning: Syllogism | Statement & assumptions | Blood relations | Direction sense | Seating arrangement | Coding-decoding | Series
   Decision Making & Problem Solving
    Case-based decisions | Interpersonal skills & communication
  Quantitative Aptitude
   Basic Numeracy
    Arithmetic: Number system | Percentage | Ratio & proportion | Average | Profit & loss | Time-work-speed | Interest | Mixtures
    Mensuration & algebra: Geometry basics | Mensuration | Permutation & combination | Probability | Equations
   Data Interpretation
    Tables | Bar & line graphs | Pie charts | Data sufficiency
Mains
 Essay
  Essay Writing
   Preparation
    Content & themes: Social | Political | Economic | Philosophical | Ethical | Science & tech | Environment
    Technique: Planning & structure | Introduction & conclusion | Quotes & examples | Language & flow | Timed practice
 GS Paper I (Heritage, History, Geography, Society)
  Indian Heritage & Culture
   Art & Culture
    Salient aspects of Art Forms, Literature and Architecture from ancient to modern times
  Modern Indian History & the World
   Modern India
    Significant events, personalities, issues | Freedom struggle: stages and contributors | Post-independence consolidation & reorganisation
    World history: Industrial revolution | World wars | Redrawal of boundaries | Colonisation & decolonisation | Political philosophies (communism, capitalism, socialism)
  Society
   Indian Society
    Diversity & social empowerment: Salient features | Role of women & women's organisations | Population & associated issues | Poverty & developmental issues | Urbanisation | Globalisation & its effects | Communalism, regionalism & secularism
  Geography
   Physical & Resource Geography
    Geophysical phenomena: Earthquakes, tsunami, volcanic activity, cyclones | Geographical features & their location | Changes in critical geographical features (water bodies, ice-caps) & flora-fauna
    Resources & distribution: Distribution of key natural resources | Factors for location of industries | Salient features of world's physical geography | Oceanic & atmospheric circulation | Agro-climatic regions
 GS Paper II (Governance, Constitution, Polity, Social Justice & IR)
  Polity & Constitution
   Constitutional Framework
    Indian Constitution: Historical underpinnings, evolution, features, amendments, significant provisions & basic structure | Comparison with other countries | Functions & responsibilities of Union & States, federal issues | Separation of powers & dispute redressal
   Institutions & Representation
    Parliament & State Legislatures: Structure, functioning, conduct of business, powers & privileges | Executive & Judiciary: Ministries & Departments | Pressure groups | RPA | Appointments to constitutional posts
  Governance
   Policies & Accountability
    Government policies & interventions | Development processes & the role of NGOs, SHGs | Welfare schemes for vulnerable sections | Health, education & human resources | Poverty & hunger | E-governance | Citizen's charters, transparency & accountability | Role of civil services in a democracy
  International Relations
   India & the World
    India and its neighbourhood relations | Bilateral, regional & global groupings and agreements | Effect of policies of developed & developing countries on India | Indian diaspora | International institutions & forums
 GS Paper III (Technology, Economic Development, Bio-diversity, Environment, Security & Disaster Management)
  Economy
   Economic Development
    Planning & resource mobilisation | Inclusive growth | Budgeting | Major crops & cropping patterns, irrigation, storage, e-technology in agriculture | Farm subsidies & MSP, PDS, food security | Land reforms | Liberalisation effects | Infrastructure | Investment models
  Science & Technology
   S&T Developments
    Achievements of Indians in S&T | Indigenisation of technology | IT, space, computers, robotics, nano-tech, biotech, IPR
  Environment & Disaster Management
   Conservation & Disasters
    Conservation, environmental pollution & degradation, EIA | Disaster & disaster management
  Internal Security
   Security Challenges
    Linkages between development & extremism | Role of external state & non-state actors | Communication networks, media & social networking sites | Cyber security | Money-laundering | Border management | Organised crime & terrorism | Security forces & agencies
 GS Paper IV (Ethics, Integrity & Aptitude)
  Ethics & Human Interface
   Theory
    Ethics & human interface: Essence, determinants & consequences of ethics | Dimensions of ethics | Ethics in private & public relationships | Human values: lessons from leaders, reformers & administrators | Role of family, society & educational institutions in inculcating values
   Attitude & aptitude
    Attitude: content, structure, function, influence on thought & behaviour | Moral & political attitudes | Social influence & persuasion | Aptitude & foundational values for civil service | Integrity, impartiality, objectivity, dedication, empathy, tolerance | Emotional intelligence | Contributions of moral thinkers (Indian & world)
  Public Administration Ethics
   Probity in Governance
    Ethics in public administration: Status & problems | Ethical concerns & dilemmas in government | Laws, rules, regulations & conscience as sources of ethical guidance | Accountability & ethical governance | Strengthening ethical & moral values | International ethics | Corporate governance | Philosophical basis of governance | Probity: Citizen's Charter, work culture, quality of service delivery, public funds utilisation, challenges of corruption | Case studies
Optional Subject
 Optional Paper I
  Your optional subject — Paper I
   Add your own topics
    Use "Add custom topic" to build this branch from your optional's official syllabus
 Optional Paper II
  Your optional subject — Paper II
   Add your own topics
    Use "Add custom topic" to build this branch from your optional's official syllabus
`;
