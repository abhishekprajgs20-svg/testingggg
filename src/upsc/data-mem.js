// Memorisation Lab datasets. STARTER datasets compiled from standard public references (MoEFCC/NTCA/Ramsar/UNESCO listings,
// the Constitution of India, standard UPSC texts). They are intentionally conservative: totals change over time (new parks, Ramsar
// sites, tiger reserves are notified every year), so each category shows how many entries it holds and offers JSON import to extend/correct it.
// Coordinates are approximate park centroids (±0.2°). Always verify against the official source before relying on any fact.
const P = (cols, text) => text.trim().split('\n').map((l, i) => { const v = l.split('|').map(s => s.trim()); const o = {}; cols.forEach((c, j) => { o[c] = v[j] ?? ''; }); o.id = ''; return o; });
export const MEM_VERSION = 1;
export const SOURCES = {
  env: 'MoEFCC / ENVIS, NTCA, Ramsar Sites Information Service, UNESCO World Heritage listing',
  geo: 'Survey of India, standard atlas, CWC (Central Water Commission) and standard UPSC geography texts',
  polity: 'Constitution of India (Legislative Department, indiacode.nic.in)',
  admin: 'Standard UPSC polity/economy references (e.g. Laxmikanth; Mrunal.org notes)',
};
const NP_COLS = ['name', 'state', 'region', 'lat', 'lon', 'rivers', 'geo', 'flora', 'species', 'eco', 'assoc'];
const NP = P(NP_COLS, `
Jim Corbett National Park|Uttarakhand|North|29.53|78.77|Ramganga|Shivalik foothills, Patli Dun valley|Sal, haldu, khair, sheesham, grassland|Bengal tiger, Asian elephant, gharial, mahseer|India's oldest national park (1936, as Hailey NP); Project Tiger was launched here in 1973|Corbett Tiger Reserve; Sonanadi Wildlife Sanctuary
Kaziranga National Park|Assam|North-East|26.58|93.17|Brahmaputra|Brahmaputra floodplain; tall grassland, beels (wetlands)|Elephant grass, swamp forest|One-horned rhinoceros, wild water buffalo, swamp deer, tiger|UNESCO World Heritage Site (1985); largest population of the Indian one-horned rhino|Kaziranga Tiger Reserve
Manas National Park|Assam|North-East|26.70|91.00|Manas, Beki|Himalayan foothills on the Bhutan border|Moist deciduous forest, grassland|Golden langur, pygmy hog, wild water buffalo, rhino|UNESCO World Heritage Site, Tiger Reserve, Biosphere Reserve and Elephant Reserve|Royal Manas NP (Bhutan) adjoins
Orang National Park|Assam|North-East|26.60|92.30|Brahmaputra|Brahmaputra floodplain|Grassland, riverine forest|One-horned rhinoceros, tiger|Called the 'mini Kaziranga'|Orang Tiger Reserve
Dibru-Saikhowa National Park|Assam|North-East|27.70|95.30|Brahmaputra, Dibru, Lohit|Riverine island forest and wetlands|Semi-evergreen and moist deciduous forest|White-winged wood duck, feral horses, river dolphin|Biosphere Reserve; important bird area|Dibru-Saikhowa Biosphere Reserve
Namdapha National Park|Arunachal Pradesh|North-East|27.50|96.50|Noa-Dihing|Patkai hills on the India–Myanmar border|Tropical to alpine vegetation|Tiger, leopard, snow leopard and clouded leopard (all four big cats), hoolock gibbon|Wide altitude range; high biodiversity|Namdapha Tiger Reserve
Keibul Lamjao National Park|Manipur|North-East|24.50|93.80|Loktak lake|Floating swamp (phumdi) on Loktak lake|Phumdis (floating biomass), Zizania latifolia|Sangai (brow-antlered deer)|World's only floating national park; last natural habitat of Sangai|Loktak Ramsar site
Nokrek National Park|Meghalaya|North-East|25.47|90.33|Simsang (Someshwari)|Garo Hills|Citrus indica (Memang Narang), orchids|Red panda, hoolock gibbon|Gene bank of wild citrus; Nokrek Biosphere Reserve core|Nokrek Biosphere Reserve
Khangchendzonga National Park|Sikkim|North-East|27.70|88.20|Teesta tributaries (Rathong, Lhonak)|Himalayan region around Kangchenjunga (8,586 m) with large glaciers|Alpine meadows, rhododendrons|Snow leopard, red panda, Himalayan tahr|UNESCO mixed World Heritage Site (2016)|Khangchendzonga Biosphere Reserve
Sundarbans National Park|West Bengal|East|21.95|88.90|Ganga–Brahmaputra delta; Matla, Raimangal|Largest mangrove delta with tidal creeks|Sundari (Heritiera fomes), mangroves|Royal Bengal tiger, estuarine crocodile, Irrawaddy dolphin|UNESCO World Heritage Site (1987), Biosphere Reserve and Ramsar site|Sundarbans Tiger Reserve
Simlipal National Park|Odisha|East|21.80|86.35|Budhabalanga, Khairi, Sanjo|Mayurbhanj hills|Sal forest, orchids|Tiger (including pseudo-melanistic tigers), elephant|Biosphere Reserve and Tiger Reserve|Simlipal Biosphere Reserve
Bhitarkanika National Park|Odisha|East|20.70|86.90|Brahmani, Baitarani, Dhamra|Mangrove delta and Gahirmatha beach|Mangroves|Saltwater crocodile, olive ridley turtle, king cobra|Ramsar site; Gahirmatha is a major olive ridley nesting beach|Bhitarkanika Wildlife Sanctuary; Gahirmatha Marine Sanctuary
Betla National Park|Jharkhand|East|23.88|84.19|Koel, Auranga|Chotanagpur plateau|Sal, bamboo|Tiger, elephant, gaur|Core of Palamau Tiger Reserve (one of the first nine, 1973)|Palamau Tiger Reserve
Dudhwa National Park|Uttar Pradesh|North|28.50|80.65|Suheli, Mohana, Sharda|Terai grassland on the India–Nepal border|Sal, tall grasses|Swamp deer (barasingha), tiger, Indian rhino (reintroduced)|Terai ecosystem|Dudhwa Tiger Reserve with Kishanpur and Katarniaghat sanctuaries
Rajaji National Park|Uttarakhand|North|30.00|78.20|Ganga, Song|Shivalik range; Haridwar–Dehradun–Pauri|Sal, shisham|Asian elephant, tiger|Elephant habitat; Rajaji Tiger Reserve|Rajaji Tiger Reserve
Nanda Devi National Park|Uttarakhand|North|30.37|79.97|Rishi Ganga|Glacial basin surrounding Nanda Devi (7,816 m), the highest peak wholly within India|Alpine meadows, birch|Snow leopard, Himalayan musk deer, bharal|UNESCO World Heritage Site (1988; extended 2005)|Nanda Devi Biosphere Reserve
Valley of Flowers National Park|Uttarakhand|North|30.73|79.60|Pushpawati|Alpine meadows in the Zanskar range|Alpine flowers, blue poppy|Snow leopard, Himalayan black bear, musk deer|UNESCO World Heritage Site (part of Nanda Devi & Valley of Flowers)|Nanda Devi Biosphere Reserve
Great Himalayan National Park|Himachal Pradesh|North|31.73|77.45|Tirthan, Sainj, Jiwa Nal, Parvati|Kullu, western Himalaya|Alpine and temperate forest|Western tragopan, snow leopard, musk deer|UNESCO World Heritage Site (2014)|GHNP Conservation Area
Pin Valley National Park|Himachal Pradesh|North|32.00|78.00|Pin|Cold desert of Spiti|Alpine scrub|Snow leopard, Siberian ibex|Part of Cold Desert Biosphere Reserve|Cold Desert Biosphere Reserve
Hemis National Park|Ladakh|North|33.90|77.35|Indus tributaries (Markha)|Trans-Himalayan cold desert|Alpine scrub|Snow leopard, Tibetan wolf, Ladakh urial|Largest national park in India; high snow leopard density|Hemis High Altitude Park
Dachigam National Park|Jammu & Kashmir|North|34.10|75.00|Dagwan|Zabarwan range near Srinagar|Conifers, temperate forest|Hangul (Kashmir stag)|Only home of the Hangul|Dachigam National Park
Sultanpur National Park|Haryana|North|28.46|76.89|—|Wetland near Gurugram|Acacia, wetland vegetation|Migratory birds|Bird-watching site|Sultanpur NP
Ranthambore National Park|Rajasthan|North-West|26.02|76.50|Banas, Chambal (nearby)|Meeting of the Aravalli and Vindhyan ranges; dry deciduous|Dhok|Bengal tiger, sloth bear, leopard|Famous for tigers and the Ranthambhore fort; Project Tiger reserve (1973)|Ranthambore Tiger Reserve; Sawai Man Singh and Keladevi sanctuaries
Keoladeo National Park|Rajasthan|North-West|27.16|77.52|Gambhir, Banganga (water supply)|Man-made freshwater wetland (Bharatpur)|Babool, kadamb, wetland grasses|Painted stork, Siberian crane (historic visitor), water birds|UNESCO World Heritage Site (1985) and Ramsar site|Bharatpur Bird Sanctuary
Desert National Park|Rajasthan|North-West|26.80|70.60|—|Thar desert (Jaisalmer & Barmer); sand dunes|Xerophytic scrub, sewan grass|Great Indian Bustard, chinkara|Stronghold of the Great Indian Bustard; Aeolian landforms and fossils|Desert National Park
Gir National Park|Gujarat|West|21.13|70.79|Hiran, Shetrunji, Datardi|Dry deciduous forest of Saurashtra|Teak, acacia, dhak|Asiatic lion, leopard, chital|Only wild home of the Asiatic lion|Gir Wildlife Sanctuary; Paniya and Mitiyala sanctuaries
Velavadar Blackbuck National Park|Gujarat|West|22.03|72.00|—|Grassland on the Gulf of Khambhat coast|Grasses, Prosopis|Blackbuck, wolf, harriers|Blackbuck sanctuary and harrier roost|Velavadar NP
Marine National Park (Gulf of Kachchh)|Gujarat|West|22.40|69.90|—|Coral reefs, mangroves and mudflats near Jamnagar; Pirotan island|Mangroves, seagrass|Corals, sea turtles, dolphins|India's first marine national park (1982)|Marine Wildlife Sanctuary
Sanjay Gandhi National Park|Maharashtra|West|19.22|72.91|Dahisar, Poisar|Inside Mumbai (Borivali); Kanheri caves|Moist deciduous forest|Leopard, spotted deer|One of the most visited urban national parks|Borivali NP
Tadoba National Park|Maharashtra|West|20.25|79.40|Andhari, Irai|Teak forest with Tadoba lake|Teak, tendu|Tiger, sloth bear, gaur|Oldest and largest national park in Maharashtra|Tadoba-Andhari Tiger Reserve
Mollem National Park|Goa|West|15.38|74.24|Mandovi (Mhadei)|Western Ghats; Dudhsagar falls|Evergreen forest|Leopard, Malabar giant squirrel|Western Ghats biodiversity|Bhagwan Mahavir Wildlife Sanctuary
Kanha National Park|Madhya Pradesh|Central|22.33|80.63|Banjar, Halon|Maikal range; sal forest and grassy meadows|Sal, bamboo|Barasingha (hard-ground swamp deer), tiger|Saved the barasingha from extinction|Kanha Tiger Reserve
Bandhavgarh National Park|Madhya Pradesh|Central|23.72|81.03|Charanganga, Johila|Vindhyan hills with Bandhavgarh fort|Sal, bamboo|Bengal tiger|High density of tigers; white tiger 'Mohan' was found in this region|Bandhavgarh Tiger Reserve
Pench National Park|Madhya Pradesh|Central|21.67|79.30|Pench|Satpura range; teak forest|Teak|Tiger, wild dog (dhole)|Associated with Kipling's Jungle Book setting|Pench Tiger Reserve (MP and Maharashtra)
Satpura National Park|Madhya Pradesh|Central|22.50|78.20|Denwa, Tawa|Satpura plateau; Pachmarhi|Sal, teak|Indian giant squirrel, tiger, leopard|Core of Satpura Tiger Reserve and Pachmarhi Biosphere Reserve|Bori and Pachmarhi sanctuaries
Panna National Park|Madhya Pradesh|Central|24.72|80.03|Ken|Vindhyan plateau with gorges|Teak, kardhai|Tiger|Tiger reintroduction success story (from 2009)|Panna Tiger Reserve; Panna Biosphere Reserve
Indravati National Park|Chhattisgarh|Central|19.20|80.70|Indravati|Bastar region|Moist deciduous forest|Wild water buffalo (Asiatic)|Core of Indravati Tiger Reserve|Indravati Tiger Reserve
Kanger Ghati National Park|Chhattisgarh|Central|18.90|82.05|Kanger|Bastar; Kotumsar caves, Tirathgarh falls|Moist deciduous|Bastar hill myna|Home of the Bastar hill myna|Kanger Valley
Bandipur National Park|Karnataka|South|11.67|76.63|Nugu, Moyar|Deccan plateau where Western and Eastern Ghats meet|Teak, rosewood|Tiger, Asian elephant, gaur|Part of Nilgiri Biosphere Reserve|Bandipur Tiger Reserve; adjoins Mudumalai, Wayanad and Nagarhole
Nagarhole National Park|Karnataka|South|12.05|76.15|Kabini|Western Ghats foothills|Rosewood, teak|Tiger, elephant, gaur|Important elephant habitat; Nilgiri Biosphere Reserve|Nagarhole Tiger Reserve
Kudremukh National Park|Karnataka|South|13.20|75.25|Tunga, Bhadra, Netravati|Western Ghats; shola-grassland|Shola forest|Lion-tailed macaque, tiger|Origin of the Tunga, Bhadra and Netravati rivers|Kudremukh NP
Periyar National Park|Kerala|South|9.46|77.23|Periyar|Cardamom hills around Periyar lake (Mullaperiyar dam)|Tropical evergreen and semi-evergreen forest|Asian elephant, tiger, Nilgiri tahr|Boat safaris on the lake; Tiger Reserve|Periyar Tiger Reserve
Eravikulam National Park|Kerala|South|10.20|77.05|Pambar|Rajamalai plateau near Anamudi (2,695 m), the highest peak of peninsular India|Shola forest, Neelakurinji|Nilgiri tahr|Largest population of Nilgiri tahr; Neelakurinji blooms every ~12 years|Anamudi Shola NP nearby
Silent Valley National Park|Kerala|South|11.08|76.43|Kunthipuzha|Evergreen forest in the Nilgiri hills|Tropical evergreen forest|Lion-tailed macaque|Save Silent Valley movement stopped a hydroelectric project|Nilgiri Biosphere Reserve
Mukurthi National Park|Tamil Nadu|South|11.30|76.55|—|High-altitude shola-grassland, Nilgiris|Shola grassland|Nilgiri tahr|Formerly Nilgiri Tahr NP; part of the Western Ghats World Heritage Site|Nilgiri Biosphere Reserve
Guindy National Park|Tamil Nadu|South|13.00|80.23|—|Inside Chennai city|Tropical dry evergreen forest|Blackbuck|One of the smallest national parks, located in a city|Guindy NP
Gulf of Mannar Marine National Park|Tamil Nadu|South|9.20|79.10|—|Coral reefs, seagrass beds, islands|Seagrass, mangroves|Dugong, corals|Core of the Gulf of Mannar Biosphere Reserve|Gulf of Mannar Biosphere Reserve
Mahatma Gandhi Marine National Park|Andaman & Nicobar Islands|Islands|11.58|92.60|—|Wandoor, South Andaman; coral reefs|Mangroves, coral|Corals, sea turtles|Marine biodiversity of the Andamans|Marine NP
Campbell Bay National Park|Andaman & Nicobar Islands|Islands|7.00|93.90|—|Great Nicobar Island|Tropical rainforest|Nicobar megapode, saltwater crocodile|Part of Great Nicobar Biosphere Reserve|Great Nicobar Biosphere Reserve
`);
const mark = (arr, pre) => arr.map((r, i) => ({ ...r, id: `${pre}${i + 1}` }));
const text2 = (n, cols) => n;
export const CATS = [];
const add = c => { c.rows = mark(c.rows, c.id + ':'); CATS.push(c); };
const rowsOf = (cols, t) => P(cols, t);
const ask = (key, ans, tpl) => ({ key, ans, tpl });
add({ id: 'np', name: 'National Parks', icon: '🌲', singular: 'National Park', src: 'env', map: true, rows: NP, fields: [['state', 'State / UT'], ['region', 'Region'], ['rivers', 'Important rivers'], ['geo', 'Geographical characteristics'], ['flora', 'Flora'], ['species', 'Important species'], ['eco', 'Ecological importance'], ['assoc', 'Associated protected areas']],
  qs: [ask('name', 'state', 'In which state or UT is {name} located?'), ask('species', 'name', 'Which National Park is associated with: {species}?'), ask('eco', 'name', 'Identify the National Park: {eco}'), ask('geo', 'name', 'Identify the protected area from its geographical clue: {geo}'), ask('name', 'rivers', 'Which river(s) are associated with {name}?')],
  card: f => ({ front: `Which state is ${f.name} in? What is it known for?`, back: `${f.state}\n${f.eco}`, extra: `Species: ${f.species}\nRivers: ${f.rivers}\nGeography: ${f.geo}\nAssociated: ${f.assoc}`, rel: f.assoc }) });
add({ id: 'wls', name: 'Wildlife Sanctuaries', icon: '🦌', singular: 'Wildlife Sanctuary', src: 'env', rows: rowsOf(['name', 'state', 'species', 'eco'], `
Mudumalai Wildlife Sanctuary|Tamil Nadu|Tiger, elephant, gaur|Part of Nilgiri Biosphere Reserve; Tiger Reserve on the Moyar river
Wayanad Wildlife Sanctuary|Kerala|Elephant, tiger|Part of the Nilgiri Biosphere Reserve; contiguous with Bandipur and Mudumalai
Thattekad Bird Sanctuary|Kerala|Birds (Salim Ali visited here)|On the Periyar river; Kerala's first bird sanctuary
Vedanthangal Bird Sanctuary|Tamil Nadu|Migratory water birds|One of the oldest bird sanctuaries in India
Point Calimere Wildlife Sanctuary|Tamil Nadu|Blackbuck, flamingo|Ramsar site on the Coromandel coast
Ranganathittu Bird Sanctuary|Karnataka|Water birds, mugger crocodile|On the Kaveri river near Srirangapatna
Bhadra Wildlife Sanctuary|Karnataka|Tiger, elephant|Bhadra river; Tiger Reserve
Cotigao Wildlife Sanctuary|Goa|Leopard, bison|Southern Goa, Western Ghats
Sariska Tiger Reserve and Sanctuary|Rajasthan|Tiger|Aravalli hills; tigers reintroduced from 2008
Mount Abu Wildlife Sanctuary|Rajasthan|Sloth bear, leopard|Aravalli; Guru Shikhar is the highest Aravalli peak
Kumbhalgarh Wildlife Sanctuary|Rajasthan|Wolf, leopard|Aravalli hills
National Chambal Sanctuary|Uttar Pradesh / Madhya Pradesh / Rajasthan|Gharial, Gangetic river dolphin|Protects gharial and the Chambal river ravines
Indian Wild Ass Sanctuary (Little Rann of Kutch)|Gujarat|Indian wild ass (khur)|Only home of the Indian wild ass
Narayan Sarovar Sanctuary|Gujarat|Chinkara|Kachchh district
Nal Sarovar Bird Sanctuary|Gujarat|Migratory birds|Ramsar site near Ahmedabad
Jaldapara Wildlife Sanctuary|West Bengal|One-horned rhinoceros|Terai–Dooars of North Bengal
Pakke Wildlife Sanctuary|Arunachal Pradesh|Hornbills, tiger|Tiger Reserve, Kameng river
Dampa Wildlife Sanctuary|Mizoram|Tiger, hoolock gibbon|Mizoram's only tiger reserve
Chilika (Nalaban) Bird Sanctuary|Odisha|Migratory waterfowl|Within Chilika lagoon, a Ramsar site
Gahirmatha Marine Wildlife Sanctuary|Odisha|Olive ridley turtle|World's largest rookery of olive ridleys
Kolleru Wildlife Sanctuary|Andhra Pradesh|Pelicans, water birds|Freshwater lake between Krishna and Godavari deltas; Ramsar site
Pulicat Lake Bird Sanctuary|Andhra Pradesh / Tamil Nadu|Flamingos|Second-largest brackish water lagoon in India
`) , fields: [['state', 'State / UT'], ['species', 'Important species'], ['eco', 'Ecological importance']],
  qs: [ask('name', 'state', 'In which state is {name} located?'), ask('species', 'name', 'Which sanctuary is associated with: {species}?'), ask('eco', 'name', 'Identify the sanctuary: {eco}')],
  card: f => ({ front: `${f.name} — state and significance?`, back: f.state, extra: `${f.species}\n${f.eco}` }) });
add({ id: 'br', name: 'Biosphere Reserves', icon: '🌐', singular: 'Biosphere Reserve', src: 'env', rows: rowsOf(['name', 'state', 'year', 'eco'], `
Nilgiri|Tamil Nadu, Kerala, Karnataka|1986|India's first biosphere reserve; includes Mudumalai, Bandipur, Nagarhole, Silent Valley and Mukurthi
Nanda Devi|Uttarakhand|1988|Himalayan; Nanda Devi NP and Valley of Flowers NP
Nokrek|Meghalaya|1988|Garo Hills; wild citrus gene pool and red panda
Manas|Assam|1989|Brahmaputra floodplain; golden langur, pygmy hog
Sundarbans|West Bengal|1989|Largest mangrove delta; Royal Bengal tiger
Gulf of Mannar|Tamil Nadu|1989|Marine biosphere reserve; dugong, coral reefs
Great Nicobar|Andaman & Nicobar Islands|1989|Tropical rainforest; Nicobar megapode
Simlipal|Odisha|1994|Mayurbhanj; tiger and elephant
Dibru-Saikhowa|Assam|1997|Riverine forest; white-winged wood duck
Dehang-Debang|Arunachal Pradesh|1998|Siang valley
Pachmarhi|Madhya Pradesh|1999|Satpura range; Satpura NP; Dhupgarh peak
Khangchendzonga|Sikkim|2000|Himalayan; snow leopard and red panda
Agasthyamala|Kerala and Tamil Nadu|2001|Western Ghats; high endemism
Achanakmar-Amarkantak|Chhattisgarh and Madhya Pradesh|2005|Source of the Narmada, Son and Johilla
Kachchh|Gujarat|2008|Great Rann of Kachchh; Indian wild ass
Cold Desert|Himachal Pradesh|2009|Pin Valley NP, Chandratal and Sarchu; snow leopard
Seshachalam|Andhra Pradesh|2010|Tirumala hills; red sanders
Panna|Madhya Pradesh|2011|Vindhyan region; Ken river; tigers
`), fields: [['state', 'State / UT'], ['year', 'Year designated in India'], ['eco', 'Key features']],
  qs: [ask('name', 'state', 'In which state/UT is the {name} Biosphere Reserve?'), ask('eco', 'name', 'Which Biosphere Reserve: {eco}?'), ask('name', 'year', 'In which year was the {name} Biosphere Reserve designated?')],
  card: f => ({ front: `${f.name} Biosphere Reserve — where and when?`, back: `${f.state} · ${f.year}`, extra: f.eco }) });
add({ id: 'ramsar', name: 'Ramsar Sites', icon: '💧', singular: 'Ramsar site', src: 'env', rows: rowsOf(['name', 'state', 'eco'], `
Chilika Lake|Odisha|India's largest coastal lagoon; one of the first two Ramsar sites of India (1981); Irrawaddy dolphins
Keoladeo Ghana National Park|Rajasthan|One of the first two Ramsar sites of India (1981); Bharatpur
Loktak Lake|Manipur|Largest freshwater lake in North-East India; Keibul Lamjao NP; on the Montreux Record
Wular Lake|Jammu & Kashmir|One of the largest freshwater lakes in Asia; fed by the Jhelum
Sambhar Lake|Rajasthan|Largest inland saline lake in India
Harike Lake|Punjab|Confluence of the Beas and Sutlej rivers
Vembanad-Kol Wetland|Kerala|Largest lake and wetland system of Kerala; backwaters
Ashtamudi Wetland|Kerala|Palm-shaped estuarine backwater at Kollam
Sasthamkotta Lake|Kerala|Largest freshwater lake in Kerala
Bhitarkanika Mangroves|Odisha|Mangrove delta; saltwater crocodile
Sundarbans Wetland|West Bengal|Largest mangrove forest; tiger
East Kolkata Wetlands|West Bengal|Wise-use wetland that treats the city's sewage
Deepor Beel|Assam|Freshwater lake on the Brahmaputra floodplain, Guwahati
Rudrasagar Lake|Tripura|Lake with Neermahal palace
Tso Moriri|Ladakh|High-altitude brackish lake; Changthang
Renuka Wetland|Himachal Pradesh|Largest lake in Himachal
Pong Dam Lake|Himachal Pradesh|Reservoir on the Beas river
Chandertal Wetland|Himachal Pradesh|High-altitude lake in Lahaul-Spiti
Nal Sarovar Bird Sanctuary|Gujarat|Largest wetland bird sanctuary in the Thar Desert region of Gujarat
Kolleru Lake|Andhra Pradesh|Between the Krishna and Godavari deltas
Point Calimere Wildlife and Bird Sanctuary|Tamil Nadu|Blackbuck and flamingos
Nandur Madhameshwar|Maharashtra|First Ramsar site of Maharashtra; Godavari
Lonar Lake|Maharashtra|Meteor-impact crater lake
Bhoj Wetland|Madhya Pradesh|Upper and Lower Lakes of Bhopal
Upper Ganga River (Brijghat to Narora)|Uttar Pradesh|Gangetic river dolphin, gharial habitat
`), fields: [['state', 'State / UT'], ['eco', 'Key feature']],
  qs: [ask('name', 'state', 'In which state/UT is the Ramsar site {name}?'), ask('eco', 'name', 'Identify the Ramsar site: {eco}')],
  card: f => ({ front: `Ramsar site: ${f.name} — which state?`, back: f.state, extra: f.eco }) });
add({ id: 'tr', name: 'Tiger Reserves', icon: '🐅', singular: 'Tiger Reserve', src: 'env', rows: rowsOf(['name', 'state', 'year', 'eco'], `
Bandipur|Karnataka|1973|One of the first nine Project Tiger reserves
Corbett|Uttarakhand|1973|One of the first nine; first national park of India
Kanha|Madhya Pradesh|1973|One of the first nine; barasingha habitat
Manas|Assam|1973|One of the first nine; UNESCO World Heritage Site
Melghat|Maharashtra|1973|One of the first nine; Satpura range
Palamau|Jharkhand|1973|One of the first nine; Betla National Park
Ranthambore|Rajasthan|1973|One of the first nine; Aravalli-Vindhyan meeting
Similipal|Odisha|1973|One of the first nine; Mayurbhanj
Sundarbans|West Bengal|1973|One of the first nine; mangrove tigers
Periyar|Kerala||Cardamom hills; Periyar lake
Sariska|Rajasthan||Aravalli; tigers reintroduced from 2008
Buxa|West Bengal||Dooars, on the Bhutan border
Indravati|Chhattisgarh||Bastar; wild water buffalo
Nagarjunsagar-Srisailam|Andhra Pradesh and Telangana||Largest tiger reserve in India by area
Namdapha|Arunachal Pradesh||Four big cats
Dudhwa|Uttar Pradesh||Terai grassland; swamp deer
Kalakad-Mundanthurai|Tamil Nadu||Tamil Nadu's first tiger reserve; Agasthyamala
Valmiki|Bihar||Only tiger reserve in Bihar
Pench|Madhya Pradesh and Maharashtra||Mowgli country; Pench river
Tadoba-Andhari|Maharashtra||Oldest and largest NP in Maharashtra
Bandhavgarh|Madhya Pradesh||High tiger density
Panna|Madhya Pradesh||Tigers reintroduced from 2009; Ken river
Dampa|Mizoram||Only tiger reserve in Mizoram
Satpura|Madhya Pradesh||Pachmarhi Biosphere Reserve core
`), fields: [['state', 'State'], ['year', 'Year notified (first nine)'], ['eco', 'Key feature']],
  qs: [ask('name', 'state', 'In which state is {name} Tiger Reserve?'), ask('eco', 'name', 'Which Tiger Reserve: {eco}?')],
  card: f => ({ front: `${f.name} Tiger Reserve — state?`, back: f.state, extra: `${f.eco}${f.year ? '\nNotified in ' + f.year : ''}` }) });
add({ id: 'er', name: 'Elephant Reserves', icon: '🐘', singular: 'Elephant Reserve', src: 'env', rows: rowsOf(['name', 'state', 'eco'], `
Mayurbhanj Elephant Reserve|Odisha|Includes Simlipal
Singhbhum Elephant Reserve|Jharkhand|Dalma and Saranda forests
Sonitpur Elephant Reserve|Assam|North bank of the Brahmaputra
Kameng Elephant Reserve|Arunachal Pradesh|Pakke and Sessa areas
Dihing-Patkai Elephant Reserve|Assam|Upper Assam, Patkai foothills
Chirang-Ripu Elephant Reserve|Assam|Manas area, Bhutan border
Eastern Dooars Elephant Reserve|West Bengal|Buxa and Jaldapara landscape
Shivalik Elephant Reserve|Uttarakhand|Rajaji landscape
Terai Elephant Reserve|Uttar Pradesh|Dudhwa landscape
Wayanad Elephant Reserve|Kerala|Western Ghats; adjoins Bandipur and Mudumalai
Anamudi Elephant Reserve|Kerala|Munnar–Idukki region
Periyar Elephant Reserve|Kerala|Cardamom hills
Nilgiri Elephant Reserve|Tamil Nadu|Nilgiri hills
Mysore Elephant Reserve|Karnataka|Bandipur and Nagarhole area
Rayala Elephant Reserve|Andhra Pradesh|Rayalaseema region
`), fields: [['state', 'State'], ['eco', 'Location / features']],
  qs: [ask('name', 'state', 'In which state is the {name}?'), ask('eco', 'name', 'Which Elephant Reserve: {eco}?')],
  card: f => ({ front: `${f.name} — which state?`, back: f.state, extra: f.eco }) });
add({ id: 'river', name: 'Important Rivers', icon: '🌊', singular: 'river', src: 'geo', rows: rowsOf(['name', 'origin', 'mouth', 'trib', 'states'], `
Ganga|Gangotri glacier (Gaumukh) as Bhagirathi; joins Alaknanda at Devprayag|Bay of Bengal (Sundarbans delta)|Yamuna, Ghaghara, Gandak, Kosi, Son, Ramganga|Uttarakhand, Uttar Pradesh, Bihar, Jharkhand, West Bengal
Yamuna|Yamunotri glacier|Meets the Ganga at Prayagraj (Sangam)|Chambal, Betwa, Ken, Sindh, Tons|Uttarakhand, Himachal, Haryana, Delhi, Uttar Pradesh
Brahmaputra|Chemayungdung glacier, Tibet (as Yarlung Tsangpo); Siang/Dihang in Arunachal|Bay of Bengal (with the Ganga/Padma, Meghna)|Subansiri, Lohit, Dibang, Manas, Teesta|Arunachal Pradesh, Assam
Indus|Near Mansarovar lake, Tibet|Arabian Sea (Pakistan)|Jhelum, Chenab, Ravi, Beas, Sutlej|Ladakh (in India)
Godavari|Trimbakeshwar near Nashik|Bay of Bengal|Pranhita, Indravati, Manjra, Penganga|Maharashtra, Telangana, Andhra Pradesh, Chhattisgarh, Odisha
Krishna|Mahabaleshwar (Western Ghats)|Bay of Bengal|Bhima, Tungabhadra, Koyna, Musi|Maharashtra, Karnataka, Telangana, Andhra Pradesh
Kaveri|Talakaveri, Brahmagiri hills, Kodagu|Bay of Bengal|Hemavati, Kabini, Bhavani, Amaravati|Karnataka, Tamil Nadu
Narmada|Amarkantak plateau|Arabian Sea (Gulf of Khambhat); flows west in a rift valley|Tawa, Hiran|Madhya Pradesh, Maharashtra, Gujarat
Tapi|Multai, Betul district (Madhya Pradesh)|Arabian Sea (Gulf of Khambhat)|Purna|Madhya Pradesh, Maharashtra, Gujarat
Mahanadi|Sihawa near Dhamtari (Chhattisgarh)|Bay of Bengal|Seonath, Ib, Tel|Chhattisgarh, Odisha
Sutlej|Rakas Tal, Tibet|Joins Beas at Harike; then Chenab|Spiti, Beas|Himachal Pradesh, Punjab (enters India at Shipki La)
Beas|Beas Kund near Rohtang pass|Joins the Sutlej at Harike|—|Himachal Pradesh, Punjab
Chenab|Chandra and Bhaga meet at Tandi (Baralacha La)|Joins the Indus system|Chandra, Bhaga|Himachal Pradesh, Jammu & Kashmir
Jhelum|Verinag spring, Kashmir Valley|Joins the Chenab|Kishanganga, Lidder|Jammu & Kashmir (flows through Wular lake)
Ravi|Himalaya near Rohtang, Himachal|Joins the Chenab|Budhil, Tantari|Himachal Pradesh, Punjab
Luni|Aravalli hills near Ajmer|Lost in the Rann of Kachchh|Jawai, Sukri|Rajasthan, Gujarat
Sabarmati|Aravalli hills, Rajasthan|Gulf of Khambhat|Wakal, Hathmati|Rajasthan, Gujarat
Damodar|Chota Nagpur plateau (Jharkhand)|Hooghly|Barakar, Konar|Jharkhand, West Bengal
Kosi|Tibet/Nepal (Sapta Kosi)|Joins the Ganga near Kursela|Arun, Tamur|Bihar (known as the 'Sorrow of Bihar')
Gandak|Tibet/Nepal (Kali Gandaki)|Joins the Ganga opposite Patna|Trishuli|Bihar, Uttar Pradesh
Ghaghara|Mapchachungo glacier, Tibet|Joins the Ganga near Chhapra|Sharda, Rapti|Uttar Pradesh, Bihar
Son|Amarkantak|Joins the Ganga near Patna|Rihand, North Koel|Madhya Pradesh, Uttar Pradesh, Bihar
Tungabhadra|Tunga and Bhadra from the Western Ghats (Varaha parvata)|Joins the Krishna|Tunga, Bhadra|Karnataka, Andhra Pradesh
Periyar|Sivagiri hills, Western Ghats|Vembanad lake / Arabian Sea|Mullaiyar|Kerala (longest river of Kerala)
Teesta|Pahunri glacier / Tso Lhamo, Sikkim|Joins the Brahmaputra (Bangladesh)|Rangeet|Sikkim, West Bengal
`), fields: [['origin', 'Origin'], ['mouth', 'Mouth / confluence'], ['trib', 'Important tributaries'], ['states', 'States']],
  qs: [ask('name', 'origin', 'Where does the {name} river originate?'), ask('origin', 'name', 'Which river originates at: {origin}?'), ask('name', 'mouth', 'Where does the {name} river end / merge?')],
  card: f => ({ front: `Origin and mouth of the ${f.name}?`, back: `${f.origin}\n→ ${f.mouth}`, extra: `Tributaries: ${f.trib}\nStates: ${f.states}` }) });
add({ id: 'range', name: 'Mountain Ranges', icon: '⛰️', singular: 'mountain range', src: 'geo', rows: rowsOf(['name', 'where', 'note'], `
Great Himalaya (Himadri)|Northernmost Himalayan range|Highest peaks, including Kanchenjunga (8,586 m, highest in India) and Everest
Lesser Himalaya (Himachal)|South of the Himadri|Pir Panjal, Dhauladhar and Mussoorie ranges; hill stations
Shivalik|Outer Himalaya|Youngest and lowest range; Dun valleys
Karakoram|North of Ladakh|Includes K2 and the Siachen glacier region
Zanskar|Ladakh and Lahaul-Spiti|Separates the Zanskar valley from Ladakh
Pir Panjal|Jammu & Kashmir and Himachal|Banihal and Rohtang passes cross it; largest range of the Lesser Himalaya
Dhauladhar|Himachal Pradesh|Dharamshala lies at its foot
Aravalli|Gujarat–Rajasthan–Haryana–Delhi|One of the oldest fold mountains; Guru Shikhar (Mount Abu, 1,722 m) is the highest peak
Vindhya|Central India|Northern side of the Narmada rift valley
Satpura|Madhya Pradesh–Maharashtra|Between the Narmada and the Tapi; Dhupgarh (1,350 m) is the highest peak
Maikal|Chhattisgarh–Madhya Pradesh|Amarkantak, source of the Narmada and Son
Western Ghats (Sahyadri)|West coast of the peninsula|Anamudi (2,695 m) is the highest peak of peninsular India; UNESCO World Heritage biodiversity hotspot
Eastern Ghats|East coast of the peninsula|Discontinuous hills from Odisha to Tamil Nadu; Mahendragiri
Nilgiri|Tamil Nadu–Kerala–Karnataka|Meeting point of the Western and Eastern Ghats; Doddabetta (2,637 m)
Cardamom Hills|Kerala–Tamil Nadu|Southern Western Ghats; cardamom plantations
Patkai|India–Myanmar border (Arunachal, Nagaland, Mizoram)|Includes Patkai Bum, the Naga and Mizo hills
Garo-Khasi-Jaintia|Meghalaya|Plateau hills; Cherrapunji and Mawsynram
Rajmahal Hills|Jharkhand|Basalt hills on the Ganga's southern bank
`), fields: [['where', 'Location'], ['note', 'Key facts']],
  qs: [ask('name', 'where', 'Where are the {name} ranges located?'), ask('note', 'name', 'Which range: {note}?')],
  card: f => ({ front: `${f.name}: location and key fact?`, back: f.where, extra: f.note }) });
add({ id: 'pass', name: 'Mountain Passes', icon: '🏔️', singular: 'mountain pass', src: 'geo', rows: rowsOf(['name', 'region', 'note'], `
Khardung La|Ladakh|Connects Leh to the Nubra valley; among the highest motorable roads in the world (~5,300 m)
Zoji La|Jammu & Kashmir / Ladakh|Connects Srinagar and Leh; Great Himalayan range; a tunnel is being built beneath it
Banihal Pass|Jammu & Kashmir|Pir Panjal range; connects Jammu with the Kashmir Valley
Rohtang Pass|Himachal Pradesh|Pir Panjal; connects Kullu–Manali with Lahaul-Spiti; Atal Tunnel runs beneath it
Baralacha La|Himachal Pradesh / Ladakh|Manali–Leh highway; source region of the Chandra, Bhaga and Yunam rivers
Shipki La|Himachal Pradesh|Sutlej enters India here; India–Tibet border pass
Lipulekh Pass|Uttarakhand|Route for the Kailash Mansarovar Yatra; near the India–Nepal–China tri-junction
Mana Pass|Uttarakhand|Near Badrinath; India–Tibet pass
Niti Pass|Uttarakhand|Chamoli district; India–Tibet pass
Nathu La|Sikkim|India–China border pass on the old Silk Route (~4,310 m); border trade resumed in 2006
Jelep La|Sikkim|Connects Sikkim with Tibet (Lhasa)
Bomdi La|Arunachal Pradesh|Near Bomdila; connects the Tawang region
Sela Pass|Arunachal Pradesh|Connects Tawang with Bomdila; Sela tunnel
Diphu Pass|Arunachal Pradesh|Near the India–China–Myanmar tri-junction
Palghat (Palakkad) Gap|Kerala–Tamil Nadu|Break in the Western Ghats between the Nilgiris and the Anamalai
Thal Ghat|Maharashtra|Nashik–Mumbai route through the Western Ghats
Bhor Ghat|Maharashtra|Mumbai–Pune route through the Western Ghats
Shencottah Gap|Kerala–Tamil Nadu|Gap in the southern Western Ghats
`), fields: [['region', 'State / region'], ['note', 'Connects / key facts']],
  qs: [ask('name', 'region', 'In which state/UT is {name}?'), ask('note', 'name', 'Which pass: {note}?')],
  card: f => ({ front: `${f.name} — where and what does it connect?`, back: f.region, extra: f.note }) });
add({ id: 'dam', name: 'Dams & Multipurpose Projects', icon: '🏗️', singular: 'dam / project', src: 'geo', rows: rowsOf(['name', 'river', 'state', 'note'], `
Bhakra-Nangal Dam (Gobind Sagar)|Sutlej|Himachal Pradesh / Punjab|One of the highest gravity dams in the world; reservoir is Gobind Sagar
Tehri Dam|Bhagirathi|Uttarakhand|Highest dam in India (about 260 m)
Hirakud Dam|Mahanadi|Odisha|One of the longest earthen dams in the world
Nagarjuna Sagar Dam|Krishna|Telangana / Andhra Pradesh|Large masonry dam; Nagarjunsagar–Srisailam Tiger Reserve nearby
Srisailam Dam|Krishna|Andhra Pradesh / Telangana|Hydroelectric project in the Nallamala hills
Sardar Sarovar Dam|Narmada|Gujarat|Major Narmada project; subject of the Narmada Bachao Andolan
Indira Sagar Dam|Narmada|Madhya Pradesh|Large reservoir at Punasa
Mettur Dam (Stanley Reservoir)|Kaveri|Tamil Nadu|Major irrigation reservoir of the Kaveri delta
Krishnaraja Sagara (KRS) Dam|Kaveri|Karnataka|Near Mysuru; Brindavan Gardens
Tungabhadra Dam|Tungabhadra|Karnataka|Near Hosapete
Idukki Arch Dam|Periyar|Kerala|Double-curvature arch dam
Mullaperiyar Dam|Periyar|Kerala (operated by Tamil Nadu)|Built in 1895; Kerala–Tamil Nadu dispute
Koyna Dam|Koyna|Maharashtra|Called the lifeline of Maharashtra for hydropower
Ukai Dam|Tapi|Gujarat|Main multipurpose project on the Tapi
Jayakwadi Dam|Godavari|Maharashtra|Near Paithan
Govind Ballabh Pant Sagar (Rihand Dam)|Rihand|Uttar Pradesh|Largest artificial lake of India by volume (commonly cited)
Salal Hydroelectric Project|Chenab|Jammu & Kashmir|Run-of-river project; Indus Waters Treaty context
Baglihar Dam|Chenab|Jammu & Kashmir|Subject of a neutral-expert decision under the Indus Waters Treaty
Pong Dam (Maharana Pratap Sagar)|Beas|Himachal Pradesh|Ramsar site (Pong Dam Lake)
Ranjit Sagar (Thein) Dam|Ravi|Punjab|Hydropower and irrigation
Nathpa Jhakri Project|Sutlej|Himachal Pradesh|Large hydroelectric project (1,500 MW)
Farakka Barrage|Ganga|West Bengal|Diverts water to the Hooghly; Ganga water-sharing treaty with Bangladesh
Damodar Valley Corporation|Damodar|Jharkhand / West Bengal|First multipurpose river valley project of independent India (1948); Tilaiya, Konar, Maithon, Panchet
Polavaram Project|Godavari|Andhra Pradesh|National project for irrigation and power
`), fields: [['river', 'River'], ['state', 'State'], ['note', 'Key facts']],
  qs: [ask('name', 'river', 'On which river is the {name}?'), ask('name', 'state', 'In which state is the {name} located?'), ask('note', 'name', 'Which project: {note}?')],
  card: f => ({ front: `${f.name}: which river and state?`, back: `${f.river} · ${f.state}`, extra: f.note }) });
add({ id: 'art', name: 'Constitutional Articles', icon: '📜', singular: 'Article', src: 'polity', rows: rowsOf(['name', 'title'], `
Article 1|Name and territory of the Union — India, that is Bharat, is a Union of States
Article 3|Parliament's power to form new States and alter areas, boundaries or names
Article 12|Definition of 'State' for Part III (Fundamental Rights)
Article 13|Laws inconsistent with or in derogation of the Fundamental Rights
Article 14|Equality before law and equal protection of the laws
Article 15|Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth
Article 16|Equality of opportunity in public employment
Article 17|Abolition of untouchability
Article 18|Abolition of titles
Article 19|Protection of six freedoms (speech, assembly, association, movement, residence, profession)
Article 20|Protection in respect of conviction for offences
Article 21|Protection of life and personal liberty
Article 21A|Right to education for children aged 6–14 years
Article 22|Protection against arrest and detention in certain cases
Article 23|Prohibition of traffic in human beings and forced labour
Article 24|Prohibition of employment of children in factories and hazardous work (below 14)
Article 25|Freedom of conscience and free profession, practice and propagation of religion
Article 29|Protection of interests of minorities (language, script, culture)
Article 30|Right of minorities to establish and administer educational institutions
Article 32|Right to constitutional remedies (writs from the Supreme Court)
Article 39A|Equal justice and free legal aid
Article 40|Organisation of village panchayats
Article 44|Uniform civil code for citizens
Article 48A|Protection and improvement of the environment and safeguarding of forests and wildlife
Article 50|Separation of judiciary from the executive
Article 51A|Fundamental Duties
Article 52|There shall be a President of India
Article 61|Procedure for impeachment of the President
Article 72|President's power to grant pardons, reprieves, suspensions, remissions or commutations
Article 74|Council of Ministers to aid and advise the President
Article 76|Attorney-General for India
Article 79|Constitution of Parliament
Article 80|Composition of the Council of States (Rajya Sabha)
Article 81|Composition of the House of the People (Lok Sabha)
Article 108|Joint sitting of both Houses in certain cases
Article 110|Definition of 'Money Bills'
Article 112|Annual Financial Statement (Budget)
Article 123|President's power to promulgate Ordinances during recess of Parliament
Article 124|Establishment and constitution of the Supreme Court
Article 129|Supreme Court to be a court of record
Article 136|Special leave to appeal by the Supreme Court
Article 141|Law declared by the Supreme Court is binding on all courts
Article 143|President's power to consult the Supreme Court (advisory jurisdiction)
Article 148|Comptroller and Auditor-General of India
Article 153|Governors of States
Article 161|Governor's power to grant pardons
Article 169|Abolition or creation of Legislative Councils in States
Article 213|Governor's power to promulgate Ordinances
Article 214|High Courts for States
Article 226|Power of High Courts to issue writs
Article 243|Definitions in Part IX — The Panchayats
Article 243K|Elections to the Panchayats (State Election Commission)
Article 246|Subject-matter of laws made by Parliament and State Legislatures (Seventh Schedule)
Article 248|Residuary powers of legislation
Article 249|Power of Parliament to legislate on a State List matter in the national interest (Rajya Sabha resolution)
Article 262|Adjudication of disputes relating to waters of inter-State rivers
Article 263|Provisions with respect to an Inter-State Council
Article 266|Consolidated Funds and Public Accounts of India and States
Article 267|Contingency Fund of India
Article 280|Finance Commission
Article 300A|Persons not to be deprived of property save by authority of law
Article 315|Public Service Commissions for the Union and the States
Article 324|Superintendence, direction and control of elections vested in the Election Commission
Article 326|Elections to the House of the People and Assemblies on the basis of adult suffrage
Article 330|Reservation of seats for SCs and STs in the House of the People
Article 338|National Commission for Scheduled Castes
Article 340|Appointment of a Commission to investigate the conditions of backward classes
Article 343|Official language of the Union
Article 352|Proclamation of National Emergency
Article 356|Failure of constitutional machinery in States (President's Rule)
Article 360|Financial Emergency
Article 368|Power of Parliament to amend the Constitution and procedure for it
`), fields: [['title', 'What it says']],
  qs: [ask('title', 'name', 'Which Article deals with: {title}?'), ask('name', 'title', 'What is {name} about?')],
  card: f => ({ front: `${f.name} — what does it provide?`, back: f.title, extra: '' }) });
add({ id: 'amend', name: 'Constitutional Amendments', icon: '✍️', singular: 'Amendment', src: 'polity', rows: rowsOf(['name', 'year', 'title'], `
1st Amendment|1951|Added the Ninth Schedule; imposed reasonable restrictions on freedom of speech and expression
7th Amendment|1956|Reorganisation of States on a linguistic basis; abolished Part A/B/C/D State categories
10th Amendment|1961|Incorporated Dadra and Nagar Haveli as a Union Territory
12th Amendment|1962|Incorporated Goa, Daman and Diu into India as a Union Territory
13th Amendment|1962|Created Nagaland as a State (Article 371A)
14th Amendment|1962|Incorporated Puducherry as a Union Territory
21st Amendment|1967|Added Sindhi to the Eighth Schedule
24th Amendment|1971|Affirmed Parliament's power to amend Fundamental Rights; President must assent to amendment bills
25th Amendment|1971|Curtailed the right to property; added Article 31C
26th Amendment|1971|Abolished privy purses of former rulers
31st Amendment|1973|Increased Lok Sabha strength from 525 to 545
36th Amendment|1975|Made Sikkim a full State of the Union
38th Amendment|1975|Barred judicial review of the declaration of Emergency
39th Amendment|1975|Placed election disputes of the President, Vice-President, PM and Speaker beyond ordinary courts
42nd Amendment|1976|'Mini-Constitution': added Socialist, Secular and Integrity to the Preamble; Fundamental Duties (Part IVA)
44th Amendment|1978|Removed property from Fundamental Rights (Article 300A); safeguards against misuse of Emergency
52nd Amendment|1985|Anti-defection law; added the Tenth Schedule
56th Amendment|1987|Made Goa a State
61st Amendment|1988|Lowered the voting age from 21 to 18 years
69th Amendment|1991|Gave Delhi the status of National Capital Territory (Article 239AA)
71st Amendment|1992|Added Konkani, Manipuri and Nepali to the Eighth Schedule
73rd Amendment|1992|Panchayati Raj — Part IX and the Eleventh Schedule
74th Amendment|1992|Municipalities — Part IXA and the Twelfth Schedule
86th Amendment|2002|Right to education (Article 21A); Article 51A(k)
91st Amendment|2003|Council of Ministers capped at 15% of the House; stricter anti-defection rules
92nd Amendment|2003|Added Bodo, Dogri, Maithili and Santhali to the Eighth Schedule
97th Amendment|2011|Cooperative societies — right to form cooperatives; Part IXB
99th Amendment|2014|National Judicial Appointments Commission (struck down by the Supreme Court in 2015)
100th Amendment|2015|Land boundary agreement with Bangladesh
101st Amendment|2016|Goods and Services Tax; GST Council (Article 279A)
102nd Amendment|2018|Constitutional status to the National Commission for Backward Classes (Article 338B)
103rd Amendment|2019|10% reservation for Economically Weaker Sections (Articles 15(6), 16(6))
104th Amendment|2020|Extended SC/ST reservation in legislatures by 10 years; ended Anglo-Indian nomination
105th Amendment|2021|Restored the power of States to identify Socially and Educationally Backward Classes
106th Amendment|2023|Women's reservation: one-third of seats in Lok Sabha and State Assemblies (Nari Shakti Vandan Adhiniyam)
`), fields: [['year', 'Year'], ['title', 'Subject']],
  qs: [ask('title', 'name', 'Which Constitutional Amendment: {title}?'), ask('name', 'title', 'What did the {name} provide?'), ask('name', 'year', 'In which year was the {name} enacted?')],
  card: f => ({ front: `${f.name} (${f.year}) — what did it do?`, back: f.title, extra: '' }) });
const GOV = `
Balwant Rai Mehta Committee|Committee|1957|Recommended a three-tier Panchayati Raj system
Ashok Mehta Committee|Committee|1977|Recommended a two-tier Panchayati Raj system (Zilla Parishad and Mandal Panchayat)
G.V.K. Rao Committee|Committee|1985|Panchayati Raj: 'grass without roots'; strengthen district-level planning
L.M. Singhvi Committee|Committee|1986|Recommended constitutional status for Panchayati Raj institutions
Swaran Singh Committee|Committee|1976|Recommended Fundamental Duties (added by the 42nd Amendment)
Dinesh Goswami Committee|Committee|1990|Electoral reforms
Vohra Committee|Committee|1993|Nexus between politicians, criminals and bureaucracy
Indrajit Gupta Committee|Committee|1998|State funding of elections
Santhanam Committee|Committee|1962|Prevention of corruption; led to the Central Vigilance Commission
Kothari Committee (civil services)|Committee|1974|Recommended the three-stage civil services examination (Prelims, Mains, Interview)
Malimath Committee|Committee|2000|Reforms in the criminal justice system
Narasimham Committee I|Committee|1991|Financial sector / banking reforms (SLR, CRR reduction)
Narasimham Committee II|Committee|1998|Banking sector reforms; capital adequacy
Chelliah Committee|Committee|1991|Tax reforms
Tendulkar Committee|Committee|2009|Methodology for estimating poverty
Rangarajan Committee (poverty)|Committee|2014|Review of the poverty estimation methodology
Nachiket Mor Committee|Committee|2013|Comprehensive financial services for small businesses and low-income households
Urjit Patel Committee|Committee|2014|Revised monetary policy framework (flexible inflation targeting)
Shanta Kumar Committee|Committee|2015|Restructuring of the Food Corporation of India
Gadgil Committee (WGEEP)|Committee|2011|Western Ghats Ecology Expert Panel
Kasturirangan Committee (Western Ghats)|Committee|2013|High-Level Working Group on the Western Ghats
Justice Verma Committee|Committee|2013|Amendments to criminal law on sexual offences
Sachar Committee|Committee|2005|Socio-economic and educational status of Muslims
Sarkaria Commission|Commission|1983|Centre–State relations
Punchhi Commission|Commission|2007|Centre–State relations (revisited)
Rajamannar Committee|Committee|1969|State autonomy and Centre–State relations (Tamil Nadu)
First Administrative Reforms Commission|Commission|1966|Administrative reforms; first chaired by Morarji Desai, later K. Hanumanthaiah
Second Administrative Reforms Commission|Commission|2005|Chaired by Veerappa Moily; reforms in public administration
Kaka Kalelkar Commission|Commission|1953|First Backward Classes Commission
Mandal Commission|Commission|1979|Second Backward Classes Commission chaired by B.P. Mandal; recommended 27% OBC reservation
Shah Commission|Commission|1977|Inquiry into Emergency-era excesses
Liberhan Commission|Commission|1992|Inquiry into the demolition of the Babri Masjid
Ranganath Misra Commission|Commission|2004|National Commission for Religious and Linguistic Minorities
Kothari Commission (education)|Commission|1964|Education Commission recommending the 10+2+3 structure
Hunter Commission|Commission|1919|Inquiry into the Jallianwala Bagh massacre
Simon Commission|Commission|1927|Statutory commission on constitutional reform with no Indian member
Swaminathan Commission|Commission|2004|National Commission on Farmers; recommended MSP at C2 + 50%
`;
const gov = rowsOf(['name', 'type', 'year', 'title'], GOV);
const gcommon = { fields: [['year', 'Year'], ['title', 'Recommendation / purpose']], src: 'admin' };
add({ ...gcommon, id: 'cmte', name: 'Important Committees', icon: '👥', singular: 'Committee', rows: gov.filter(g => g.type === 'Committee'),
  qs: [ask('title', 'name', 'Which committee: {title}?'), ask('name', 'year', 'In which year was the {name} set up/reported?'), ask('name', 'title', 'What was the {name} about?')],
  card: f => ({ front: `${f.name} (${f.year}) — purpose?`, back: f.title, extra: '' }) });
add({ ...gcommon, id: 'cmsn', name: 'Important Commissions', icon: '🏛', singular: 'Commission', rows: gov.filter(g => g.type === 'Commission'),
  qs: [ask('title', 'name', 'Which commission: {title}?'), ask('name', 'year', 'In which year was the {name} set up?'), ask('name', 'title', 'What was the {name} about?')],
  card: f => ({ front: `${f.name} (${f.year}) — purpose?`, back: f.title, extra: '' }) });
// India outline (lon, lat): simplified silhouette, NOT survey-accurate. Pins use real coordinates.
export const INDIA_OUTLINE = [[74.0,37.0],[77.0,35.8],[79.0,35.5],[80.2,35.2],[79.4,33.0],[78.8,32.3],[79.0,31.0],[80.0,30.3],[81.0,30.2],[80.1,28.8],[81.5,28.3],[83.0,27.4],[84.7,27.1],[86.0,26.6],[88.1,26.4],[88.1,27.3],[88.1,27.9],[88.9,28.1],[88.9,27.3],[89.0,26.9],[89.8,26.7],[92.0,26.9],[92.1,27.8],[91.7,27.8],[92.7,28.2],[93.5,28.6],[95.2,29.3],[96.2,29.4],[97.4,28.3],[96.9,27.3],[97.1,27.1],[96.0,26.6],[95.2,26.0],[94.7,25.4],[94.5,24.5],[94.3,23.9],[93.4,24.0],[93.4,22.9],[93.0,22.2],[93.1,21.9],[92.4,22.4],[92.3,23.7],[91.9,23.0],[91.4,23.1],[91.2,23.7],[91.3,24.4],[92.0,24.4],[92.3,24.9],[92.0,25.1],[90.7,25.15],[89.9,25.3],[89.8,26.0],[89.6,26.2],[88.4,26.2],[88.1,25.3],[88.0,24.5],[88.4,24.2],[88.7,23.9],[88.9,23.2],[89.0,22.2],[89.0,21.7],[88.0,21.6],[87.0,21.5],[86.9,20.7],[86.5,20.2],[85.8,19.8],[85.4,19.4],[84.8,19.0],[84.1,18.3],[83.3,17.7],[82.3,16.9],[81.3,16.2],[80.2,15.5],[80.1,14.4],[80.3,13.5],[80.3,13.0],[79.9,12.2],[79.85,11.4],[79.9,10.8],[79.85,10.3],[79.3,10.3],[79.1,9.3],[78.2,8.9],[77.5,8.1],[76.9,8.4],[76.3,9.5],[75.8,11.2],[74.9,12.8],[74.4,14.0],[74.1,14.9],[73.7,15.9],[73.1,17.5],[72.8,19.0],[72.7,20.3],[72.8,21.1],[72.6,21.7],[72.2,21.8],[72.2,21.0],[71.0,20.7],[70.4,20.9],[69.8,21.5],[69.0,22.25],[69.3,22.8],[70.1,23.0],[68.9,23.5],[68.2,23.6],[68.2,23.9],[69.6,24.3],[70.1,24.9],[70.0,26.5],[70.3,27.8],[71.0,27.8],[72.9,28.9],[73.9,29.9],[74.7,31.0],[74.5,31.7],[74.6,32.5],[74.0,33.1],[73.7,34.4],[74.0,34.8],[73.5,36.2]];
export const ISLANDS = [[[92.6,13.6],[93.0,13.2],[93.1,12.0],[92.8,11.5],[92.6,12.5],[92.5,13.2]], [[93.5,8.1],[93.9,7.4],[93.8,6.8],[93.6,7.3]], [[72.7,11.2],[73.1,10.8],[72.9,10.1],[72.6,10.6]]];
export const STATES_OF = rows => [...new Set(rows.flatMap(r => String(r.state || '').split(/,| and | \/ /).map(s => s.trim()).filter(Boolean)))].sort();
