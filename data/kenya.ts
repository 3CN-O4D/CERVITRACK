export interface Ward {
  name: string;
}

export interface SubCounty {
  name: string;
  wards: Ward[];
}

export interface County {
  name: string;
  code: number;
  subCounties: SubCounty[];
}

export const COUNTIES: County[] = [
  {
    name: 'Mombasa', code: 1,
    subCounties: [
      { name: 'Mombasa Island', wards: [{ name: 'Majengo' }, { name: 'Tudor' }, { name: 'Old Town' }, { name: 'Kizingo' }] },
      { name: 'Changamwe', wards: [{ name: 'Changamwe' }, { name: 'Port Tudor' }, { name: 'Kipevu' }] },
      { name: 'Likoni', wards: [{ name: 'Likoni' }, { name: 'Timbwani' }, { name: 'Mtongwe' }] },
      { name: 'Kisauni', wards: [{ name: 'Mkomani' }, { name: 'Bamburi' }, { name: 'Mtopanga' }] },
      { name: 'Nyali', wards: [{ name: 'Frere Town' }, { name: 'Ziwa La Ng\'ombe' }, { name: 'Kongowea' }] },
    ],
  },
  {
    name: 'Nairobi', code: 47,
    subCounties: [
      { name: 'Westlands', wards: [{ name: 'Kitisuru' }, { name: 'Parklands' }, { name: 'Highridge' }, { name: 'Karura' }] },
      { name: 'Dagoretti North', wards: [{ name: 'Kilimani' }, { name: 'Kawangware' }, { name: 'Gatina' }, { name: 'Kabiro' }] },
      { name: 'Dagoretti South', wards: [{ name: 'Mutuini' }, { name: 'Ngando' }, { name: 'Riruta' }, { name: 'Uthiru' }] },
      { name: 'Embakasi Central', wards: [{ name: 'Kayole' }, { name: 'Komarock' }, { name: 'Matopeni' }, { name: 'Mihango' }] },
      { name: 'Embakasi East', wards: [{ name: 'Upper Savanna' }, { name: 'Lower Savanna' }, { name: 'Embakasi' }] },
      { name: 'Embakasi North', wards: [{ name: 'Kariobangi North' }, { name: 'Dandora Area I' }, { name: 'Dandora Area II' }] },
      { name: 'Embakasi South', wards: [{ name: 'Imara Daima' }, { name: 'Kwa Njenga' }, { name: 'Kwa Reuben' }, { name: 'Pipeline' }] },
      { name: 'Embakasi West', wards: [{ name: 'Umoja I' }, { name: 'Umoja II' }, { name: 'Mowlem' }, { name: 'Kariobangi South' }] },
      { name: 'Kamukunji', wards: [{ name: 'Pumwani' }, { name: 'Eastleigh North' }, { name: 'Eastleigh South' }] },
      { name: 'Kasarani', wards: [{ name: 'Clay City' }, { name: 'Mwiki' }, { name: 'Kasarani' }, { name: 'Njiru' }, { name: 'Ruai' }] },
      { name: 'Kibra', wards: [{ name: 'Laini Saba' }, { name: 'Lindi' }, { name: 'Makina' }, { name: 'Woodley' }, { name: 'Sarang\'ombe' }] },
      { name: 'Lang\'ata', wards: [{ name: 'Karen' }, { name: 'Lang\'ata' }, { name: 'Otiende' }, { name: 'Railways' }, { name: 'South C' }] },
      { name: 'Makadara', wards: [{ name: 'Maringo' }, { name: 'Viwandani' }, { name: 'Harambee' }, { name: 'Makongeni' }] },
      { name: 'Mathare', wards: [{ name: 'Mabatini' }, { name: 'Kiamaiko' }, { name: 'Ngei' }, { name: 'Huruma' }, { name: 'Mathare North' }] },
      { name: 'Roysambu', wards: [{ name: 'Roysambu' }, { name: 'Githurai' }, { name: 'Kahawa' }, { name: 'Zimmerman' }] },
      { name: 'Ruaraka', wards: [{ name: 'Baba Dogo' }, { name: 'Utalii' }, { name: 'Mathare North' }, { name: 'Lucky Summer' }] },
      { name: 'Starehe', wards: [{ name: 'Nairobi Central' }, { name: 'Ngara' }, { name: 'Pangani' }, { name: 'Ziwani' }] },
    ],
  },
  {
    name: 'Kisumu', code: 42,
    subCounties: [
      { name: 'Kisumu Central', wards: [{ name: 'Kondele' }, { name: 'Nyalenda A' }, { name: 'Nyalenda B' }, { name: 'Manyatta A' }, { name: 'Manyatta B' }] },
      { name: 'Kisumu East', wards: [{ name: 'Kajulu' }, { name: 'Kolwa' }, { name: 'Migosi' }, { name: 'Onyi\'njo' }] },
      { name: 'Kisumu West', wards: [{ name: 'West Kisumu' }, { name: 'North Kisumu' }, { name: 'Ombeyi' }, { name: 'Chiga' }] },
      { name: 'Nyando', wards: [{ name: 'Awasi' }, { name: 'Omia' }, { name: 'Kochieng' }, { name: 'Kakola' }] },
      { name: 'Nyakach', wards: [{ name: 'Pap Onditi' }, { name: 'North Nyakach' }, { name: 'South Nyakach' }, { name: 'Sigoti' }] },
    ],
  },
  {
    name: 'Kiambu', code: 22,
    subCounties: [
      { name: 'Kiambu', wards: [{ name: 'Kiambu Town' }, { name: 'Ting\'ang\'a' }, { name: 'Ndumberi' }, { name: 'Riabai' }] },
      { name: 'Thika', wards: [{ name: 'Township' }, { name: 'Kamenu' }, { name: 'Hospital' }, { name: 'Gatuanyaga' }] },
      { name: 'Ruiru', wards: [{ name: 'Ruiru' }, { name: 'Kahawa Sukari' }, { name: 'Kahawa Wendani' }, { name: 'Kiuu' }] },
      { name: 'Kikuyu', wards: [{ name: 'Kikuyu' }, { name: 'Kinoo' }, { name: 'Karai' }, { name: 'Nachu' }] },
      { name: 'Limuru', wards: [{ name: 'Limuru' }, { name: 'Ndeiya' }, { name: 'Tigoni' }, { name: 'Bibirioni' }] },
    ],
  },
  {
    name: 'Nakuru', code: 32,
    subCounties: [
      { name: 'Nakuru Town East', wards: [{ name: 'Biashara' }, { name: 'Kivumbini' }, { name: 'Mwariki' }, { name: 'Menengai' }] },
      { name: 'Nakuru Town West', wards: [{ name: 'Molo' }, { name: 'Turbo' }, { name: 'Kaptembwo' }, { name: 'London' }] },
      { name: 'Naivasha', wards: [{ name: 'Naivasha Town' }, { name: 'Hells Gate' }, { name: 'Olkaria' }, { name: 'Mai Mahiu' }] },
      { name: 'Gilgil', wards: [{ name: 'Gilgil' }, { name: 'Eburru' }, { name: 'Mbaruk' }, { name: 'Karatina' }] },
    ],
  },
  {
    name: 'Uasin Gishu', code: 23,
    subCounties: [
      { name: 'Eldoret East', wards: [{ name: 'Kapyemit' }, { name: 'Moiben' }, { name: 'Karuna' }, { name: 'Nyaru' }] },
      { name: 'Eldoret West', wards: [{ name: 'Kapsaos' }, { name: 'Tapsagoi' }, { name: 'Sergoit' }, { name: 'Kipkenyo' }] },
      { name: 'Ainabkoi', wards: [{ name: 'Ainabkoi' }, { name: 'Kapsoya' }, { name: 'Cheptiret' }, { name: 'Kipkabus' }] },
    ],
  },
  {
    name: 'Machakos', code: 15,
    subCounties: [
      { name: 'Machakos Town', wards: [{ name: 'Machakos Central' }, { name: 'Mumbuni' }, { name: 'Mutituni' }, { name: 'Kalama' }] },
      { name: 'Mavoko', wards: [{ name: 'Athi River' }, { name: 'Syokimau' }, { name: 'Mlolongo' }, { name: 'Kinanie' }] },
      { name: 'Kangundo', wards: [{ name: 'Kangundo' }, { name: 'Komarock' }, { name: 'Kivaa' }, { name: 'Matuu' }] },
    ],
  },
  {
    name: 'Meru', code: 12,
    subCounties: [
      { name: 'Meru Central', wards: [{ name: 'Meru Town' }, { name: 'Nkubu' }, { name: 'Kanyakine' }, { name: 'Kibirichia' }] },
      { name: 'Tigania', wards: [{ name: 'Tigania East' }, { name: 'Tigania West' }, { name: 'Athwana' }, { name: 'Kianjai' }] },
      { name: 'Imenti North', wards: [{ name: 'Ntima East' }, { name: 'Ntima West' }, { name: 'Buuri' }, { name: 'Kiirua' }] },
    ],
  },
  {
    name: 'Kakamega', code: 37,
    subCounties: [
      { name: 'Kakamega Central', wards: [{ name: 'Kakamega Town' }, { name: 'Shinyalu' }, { name: 'Isukha' }, { name: 'Shirere' }] },
      { name: 'Butere', wards: [{ name: 'Butere' }, { name: 'Mumias' }, { name: 'Matungu' }, { name: 'Kwang\'amor' }] },
      { name: 'Lugari', wards: [{ name: 'Lugari' }, { name: 'Likuyani' }, { name: 'Nzoia' }, { name: 'Mautuma' }] },
    ],
  },
  {
    name: 'Kilifi', code: 3,
    subCounties: [
      { name: 'Kilifi North', wards: [{ name: 'Kilifi Town' }, { name: 'Mnarani' }, { name: 'Tezo' }, { name: 'Bomani' }] },
      { name: 'Kilifi South', wards: [{ name: 'Mtwapa' }, { name: 'Shanzu' }, { name: 'Vipingo' }, { name: 'Matsangoni' }] },
      { name: 'Malindi', wards: [{ name: 'Malindi Town' }, { name: 'Gede' }, { name: 'Watamu' }, { name: 'Sabaki' }] },
    ],
  },
  {
    name: 'Kisii', code: 16,
    subCounties: [
      { name: 'Kisii Central', wards: [{ name: 'Kisii Town' }, { name: 'Suneka' }, { name: 'Keumbu' }, { name: 'Matongo' }] },
      { name: 'Kitutu Chache', wards: [{ name: 'Nyamache' }, { name: 'Kerina' }, { name: 'Bassi' }, { name: 'Gesima' }] },
      { name: 'Nyaribari', wards: [{ name: 'Nyaribari Masaba' }, { name: 'Nyaribari Chache' }, { name: 'Ibeno' }, { name: 'Monyerero' }] },
    ],
  },
  {
    name: 'Kitui', code: 18,
    subCounties: [
      { name: 'Kitui Central', wards: [{ name: 'Kitui Town' }, { name: 'Kyangwithya' }, { name: 'Mulango' }, { name: 'Zombe' }] },
      { name: 'Mwingi', wards: [{ name: 'Mwingi Town' }, { name: 'Kyuso' }, { name: 'Mumoni' }, { name: 'Tseikuru' }] },
      { name: 'Mutomo', wards: [{ name: 'Mutomo' }, { name: 'Ikutha' }, { name: 'Kanziko' }, { name: 'Mutha' }] },
    ],
  },
  {
    name: 'Kwale', code: 2,
    subCounties: [
      { name: 'Kwale', wards: [{ name: 'Kwale Town' }, { name: 'Msambweni' }, { name: 'Lunga Lunga' }, { name: 'Vanga' }] },
      { name: 'Kinango', wards: [{ name: 'Kinango' }, { name: 'Mackinnon' }, { name: 'Chengoni' }, { name: 'Puma' }] },
      { name: 'Matuga', wards: [{ name: 'Matuga' }, { name: 'Waa' }, { name: 'Tiwi' }, { name: 'Diani' }] },
    ],
  },
  {
    name: 'Laikipia', code: 31,
    subCounties: [
      { name: 'Laikipia East', wards: [{ name: 'Nanyuki' }, { name: 'Umande' }, { name: 'Ngobit' }, { name: 'Tigithi' }] },
      { name: 'Laikipia North', wards: [{ name: 'Rumuruti' }, { name: 'Mukogondo' }, { name: 'Segera' }, { name: 'Ol Moran' }] },
      { name: 'Laikipia West', wards: [{ name: 'Naibor' }, { name: 'Ol Jabet' }, { name: 'Sossian' }, { name: 'Marmanet' }] },
    ],
  },
  {
    name: 'Makueni', code: 17,
    subCounties: [
      { name: 'Makueni', wards: [{ name: 'Makueni Town' }, { name: 'Wote' }, { name: 'Kathonzweni' }, { name: 'Mbitini' }] },
      { name: 'Kibwezi', wards: [{ name: 'Kibwezi' }, { name: 'Mtito Andei' }, { name: 'Masongaleni' }, { name: 'Emali' }] },
      { name: 'Mbooni', wards: [{ name: 'Mbooni' }, { name: 'Tulimani' }, { name: 'Kalawa' }, { name: 'Kitise' }] },
    ],
  },
  {
    name: 'Nandi', code: 25,
    subCounties: [
      { name: 'Nandi Central', wards: [{ name: 'Kapsabet' }, { name: 'Chepkumia' }, { name: 'Kilibwoni' }, { name: 'Chepterwai' }] },
      { name: 'Nandi East', wards: [{ name: 'Nandi Hills' }, { name: 'Chepkunyuk' }, { name: 'Kochogocho' }, { name: 'Kapkangani' }] },
      { name: 'Nandi North', wards: [{ name: 'Kabiyet' }, { name: 'Kosirai' }, { name: 'Mosoriot' }, { name: 'Tinderet' }] },
    ],
  },
  {
    name: 'Narok', code: 34,
    subCounties: [
      { name: 'Narok East', wards: [{ name: 'Narok Town' }, { name: 'Ololulunga' }, { name: 'Sogoo' }, { name: 'Mau Narok' }] },
      { name: 'Narok North', wards: [{ name: 'Ewuaso Kedong' }, { name: 'Mara' }, { name: 'Olpusimoru' }, { name: 'Nkareta' }] },
      { name: 'Narok South', wards: [{ name: 'Kilgoris' }, { name: 'Emurua Dikirr' }, { name: 'Lolgorian' }, { name: 'Moyoi' }] },
    ],
  },
  {
    name: 'Nyandarua', code: 36,
    subCounties: [
      { name: 'Nyandarua North', wards: [{ name: 'Ol Kalou' }, { name: 'Ol Jororok' }, { name: 'Ndaragwa' }, { name: 'Shamata' }] },
      { name: 'Nyandarua South', wards: [{ name: 'Njabini' }, { name: 'Geta' }, { name: 'Engineer' }, { name: 'Kinja' }] },
      { name: 'Nyandarua West', wards: [{ name: 'Mirangine' }, { name: 'Kipipiri' }, { name: 'Gathara' }, { name: 'Wanjohi' }] },
    ],
  },
  {
    name: 'Nyeri', code: 19,
    subCounties: [
      { name: 'Nyeri Central', wards: [{ name: 'Nyeri Town' }, { name: 'Gatitu' }, { name: 'Rware' }, { name: 'Karima' }] },
      { name: 'Mathira', wards: [{ name: 'Mathira' }, { name: 'Karatina' }, { name: 'Konyu' }, { name: 'Ruguru' }] },
      { name: 'Mukurweini', wards: [{ name: 'Mukurweini' }, { name: 'Gikondi' }, { name: 'Rutune' }, { name: 'Karia' }] },
    ],
  },
  {
    name: 'Siaya', code: 38,
    subCounties: [
      { name: 'Siaya', wards: [{ name: 'Siaya Town' }, { name: 'Ugunja' }, { name: 'Ukolini' }, { name: 'Yala' }] },
      { name: 'Gem', wards: [{ name: 'Yala' }, { name: 'Wagai' }, { name: 'Ngiya' }, { name: 'Nyadorera' }] },
      { name: 'Bondo', wards: [{ name: 'Bondo' }, { name: 'Usigu' }, { name: 'Rarieda' }, { name: 'Got Agulu' }] },
    ],
  },
  {
    name: 'Taita Taveta', code: 6,
    subCounties: [
      { name: 'Taita', wards: [{ name: 'Wundanyi' }, { name: 'Werugha' }, { name: 'Mwatate' }, { name: 'Mbale' }] },
      { name: 'Taveta', wards: [{ name: 'Taveta' }, { name: 'Njukini' }, { name: 'Chala' }, { name: 'Mata' }] },
      { name: 'Voi', wards: [{ name: 'Voi Town' }, { name: 'Mbololo' }, { name: 'Sagala' }, { name: 'Kaloleni' }] },
    ],
  },
  {
    name: 'Trans Nzoia', code: 26,
    subCounties: [
      { name: 'Trans Nzoia East', wards: [{ name: 'Kitale Town' }, { name: 'Saboti' }, { name: 'Kiminini' }, { name: 'Kaplamai' }] },
      { name: 'Trans Nzoia West', wards: [{ name: 'Kwanza' }, { name: 'Endebess' }, { name: 'Suam' }, { name: 'Matumbei' }] },
    ],
  },
  {
    name: 'Turkana', code: 24,
    subCounties: [
      { name: 'Turkana Central', wards: [{ name: 'Lodwar' }, { name: 'Kerio' }, { name: 'Kanamkemer' }, { name: 'Kangatotha' }] },
      { name: 'Turkana North', wards: [{ name: 'Lokitaung' }, { name: 'Kibish' }, { name: 'Kalokol' }, { name: 'Lokichar' }] },
      { name: 'Turkana South', wards: [{ name: 'Lokori' }, { name: 'Kapedo' }, { name: 'Katilia' }, { name: 'Lomelo' }] },
    ],
  },
  {
    name: 'Busia', code: 40,
    subCounties: [
      { name: 'Busia', wards: [{ name: 'Busia Town' }, { name: 'Nambale' }, { name: 'Bumala' }, { name: 'Matayos' }] },
      { name: 'Samia', wards: [{ name: 'Samia' }, { name: 'Nangina' }, { name: 'Ageng\'a' }, { name: 'Lwakhakha' }] },
      { name: 'Teso', wards: [{ name: 'Malaba' }, { name: 'Amukura' }, { name: 'Osieko' }, { name: 'Chakol' }] },
    ],
  },
  {
    name: 'Bungoma', code: 39,
    subCounties: [
      { name: 'Bungoma', wards: [{ name: 'Bungoma Town' }, { name: 'Chwele' }, { name: 'Kimilili' }, { name: 'Webuye' }] },
      { name: 'Mt Elgon', wards: [{ name: 'Kapsokwony' }, { name: 'Cheptais' }, { name: 'Kaboom' }, { name: 'Kaptama' }] },
      { name: 'Tongaren', wards: [{ name: 'Mbakalo' }, { name: 'Naitiri' }, { name: 'Lugulu' }, { name: 'Sikulu' }] },
    ],
  },
  {
    name: 'Embu', code: 14,
    subCounties: [
      { name: 'Embu Central', wards: [{ name: 'Embu Town' }, { name: 'Kithimu' }, { name: 'Nembure' }, { name: 'Runyenjes' }] },
      { name: 'Mbeere', wards: [{ name: 'Mbeere South' }, { name: 'Mbeere North' }, { name: 'Gachoka' }, { name: 'Evurore' }] },
      { name: 'Manyatta', wards: [{ name: 'Manyatta' }, { name: 'Kagaari' }, { name: 'Ngooru' }, { name: 'Kathangariri' }] },
    ],
  },
  {
    name: 'Garissa', code: 7,
    subCounties: [
      { name: 'Garissa', wards: [{ name: 'Garissa Town' }, { name: 'Iftin' }, { name: 'Saka' }, { name: 'Shimbir' }] },
      { name: 'Lagdera', wards: [{ name: 'Modogashe' }, { name: 'Benane' }, { name: 'Maalimin' }, { name: 'Hara' }] },
      { name: 'Fafi', wards: [{ name: 'Bura' }, { name: 'Nanighi' }, { name: 'Dadaab' }, { name: 'Liboi' }] },
    ],
  },
  {
    name: 'Homa Bay', code: 43,
    subCounties: [
      { name: 'Homa Bay', wards: [{ name: 'Homa Bay Town' }, { name: 'Asego' }, { name: 'Rangwe' }, { name: 'Kanyaluo' }] },
      { name: 'Mbita', wards: [{ name: 'Mbita' }, { name: 'Mfangano' }, { name: 'Rusinga' }, { name: 'Gembe' }] },
      { name: 'Suba', wards: [{ name: 'Suba' }, { name: 'Sindo' }, { name: 'Ungoye' }, { name: 'Kasewe' }] },
    ],
  },
  {
    name: 'Isiolo', code: 11,
    subCounties: [
      { name: 'Isiolo', wards: [{ name: 'Isiolo Town' }, { name: 'Garba Tula' }, { name: 'Kinna' }, { name: 'Sericho' }] },
      { name: 'Merti', wards: [{ name: 'Merti' }, { name: 'Chari' }, { name: 'Cherab' }, { name: 'Oldonyiro' }] },
    ],
  },
  {
    name: 'Kajiado', code: 35,
    subCounties: [
      { name: 'Kajiado Central', wards: [{ name: 'Kajiado Town' }, { name: 'Ngong' }, { name: 'Ongata Rongai' }, { name: 'Isinya' }] },
      { name: 'Kajiado North', wards: [{ name: 'Kitengela' }, { name: 'Nairobi West' }, { name: 'Mlolongo' }, { name: 'Syokimau' }] },
      { name: 'Kajiado East', wards: [{ name: 'Loodariak' }, { name: 'Kaputiei' }, { name: 'Keekonyokie' }, { name: 'Matapato' }] },
    ],
  },
  {
    name: 'Kericho', code: 27,
    subCounties: [
      { name: 'Kericho', wards: [{ name: 'Kericho Town' }, { name: 'Kipkelion' }, { name: 'Londiani' }, { name: 'Sigowet' }] },
      { name: 'Bureti', wards: [{ name: 'Bureti' }, { name: 'Kapkatet' }, { name: 'Roret' }, { name: 'Chemagel' }] },
      { name: 'Soin', wards: [{ name: 'Soin' }, { name: 'Kapsorok' }, { name: 'Kipchorian' }, { name: 'Mugure' }] },
    ],
  },
  {
    name: 'Kirinyaga', code: 20,
    subCounties: [
      { name: 'Kirinyaga Central', wards: [{ name: 'Kerugoya' }, { name: 'Kutus' }, { name: 'Mutithi' }, { name: 'Kanyekiini' }] },
      { name: 'Mwea', wards: [{ name: 'Mwea' }, { name: 'Tebere' }, { name: 'Nyakio' }, { name: 'Wamumu' }] },
      { name: 'Gichugu', wards: [{ name: 'Gichugu' }, { name: 'Ngariama' }, { name: 'Kiini' }, { name: 'Karumandi' }] },
    ],
  },
  {
    name: 'Lamu', code: 5,
    subCounties: [
      { name: 'Lamu East', wards: [{ name: 'Lamu Town' }, { name: 'Sheli' }, { name: 'Mkomani' }, { name: 'Hindi' }] },
      { name: 'Lamu West', wards: [{ name: 'Mpeketoni' }, { name: 'Witu' }, { name: 'Hongwe' }, { name: 'Basuba' }] },
    ],
  },
  {
    name: 'Mandera', code: 9,
    subCounties: [
      { name: 'Mandera East', wards: [{ name: 'Mandera Town' }, { name: 'Rhamu' }, { name: 'Takaba' }, { name: 'El Wak' }] },
      { name: 'Mandera North', wards: [{ name: 'Rhamu Dimtu' }, { name: 'Olla' }, { name: 'Ashabito' }, { name: 'Guticha' }] },
      { name: 'Mandera South', wards: [{ name: 'El Wak' }, { name: 'Shimbir' }, { name: 'Lafey' }, { name: 'Kutulo' }] },
    ],
  },
  {
    name: 'Marsabit', code: 10,
    subCounties: [
      { name: 'Marsabit', wards: [{ name: 'Marsabit Town' }, { name: 'Laisamis' }, { name: 'Maikona' }, { name: 'North Horr' }] },
      { name: 'Moyale', wards: [{ name: 'Moyale' }, { name: 'Turbi' }, { name: 'Heillu' }, { name: 'Butiye' }] },
      { name: 'Saku', wards: [{ name: 'Saku' }, { name: 'Kargi' }, { name: 'Korr' }, { name: 'Loglogo' }] },
    ],
  },
  {
    name: 'Migori', code: 44,
    subCounties: [
      { name: 'Migori', wards: [{ name: 'Migori Town' }, { name: 'Rongo' }, { name: 'Awendo' }, { name: 'Karungu' }] },
      { name: 'Nyatike', wards: [{ name: 'Nyatike' }, { name: 'Kadem' }, { name: 'Kanyasa' }, { name: 'Macalder' }] },
      { name: 'Uriri', wards: [{ name: 'Uriri' }, { name: 'West Kanyamkago' }, { name: 'East Kanyamkago' }, { name: 'Kakrao' }] },
    ],
  },
  {
    name: 'Murang\'a', code: 21,
    subCounties: [
      { name: 'Murang\'a', wards: [{ name: 'Murang\'a Town' }, { name: 'Kangema' }, { name: 'Kahuro' }, { name: 'Kiharu' }] },
      { name: 'Kandara', wards: [{ name: 'Kandara' }, { name: 'Gaichanjiru' }, { name: 'Ithiru' }, { name: 'Kaguuni' }] },
      { name: 'Gatanga', wards: [{ name: 'Gatanga' }, { name: 'Kariara' }, { name: 'Kakuzi' }, { name: 'Mutumbiri' }] },
    ],
  },
  {
    name: 'Samburu', code: 33,
    subCounties: [
      { name: 'Samburu Central', wards: [{ name: 'Maralal' }, { name: 'Lodokejek' }, { name: 'Suguta' }, { name: 'Baragoi' }] },
      { name: 'Samburu North', wards: [{ name: 'Baragoi' }, { name: 'Lokitaung' }, { name: 'Nachola' }, { name: 'Ndoto' }] },
    ],
  },
  {
    name: 'Tharaka Nithi', code: 13,
    subCounties: [
      { name: 'Tharaka', wards: [{ name: 'Tharaka' }, { name: 'Gatunga' }, { name: 'Marimanti' }, { name: 'Chiakariga' }] },
      { name: 'Meru South', wards: [{ name: 'Chuka' }, { name: 'Igamba Ng\'ombe' }, { name: 'Mwimbi' }, { name: 'Magumoni' }] },
    ],
  },
  {
    name: 'Vihiga', code: 41,
    subCounties: [
      { name: 'Vihiga', wards: [{ name: 'Vihiga Town' }, { name: 'Luanda' }, { name: 'Emuhaya' }, { name: 'Sabatia' }] },
      { name: 'Hamisi', wards: [{ name: 'Hamisi' }, { name: 'Shiru' }, { name: 'Muhudu' }, { name: 'Tambua' }] },
      { name: 'Tiriki', wards: [{ name: 'Tiriki' }, { name: 'Gisambai' }, { name: 'Chavakali' }, { name: 'Mungoma' }] },
    ],
  },
  {
    name: 'Wajir', code: 8,
    subCounties: [
      { name: 'Wajir East', wards: [{ name: 'Wajir Town' }, { name: 'Bunley' }, { name: 'Bute' }, { name: 'Habaswein' }] },
      { name: 'Wajir North', wards: [{ name: 'Korondille' }, { name: 'Gurar' }, { name: 'Buna' }, { name: 'Ajawa' }] },
      { name: 'Wajir South', wards: [{ name: 'Griftu' }, { name: 'Diff' }, { name: 'Tarbaj' }, { name: 'Elben' }] },
    ],
  },
  {
    name: 'West Pokot', code: 28,
    subCounties: [
      { name: 'Pokot North', wards: [{ name: 'Kasei' }, { name: 'Kiwawa' }, { name: 'Alale' }, { name: 'Sekerr' }] },
      { name: 'Pokot South', wards: [{ name: 'Chepareria' }, { name: 'Lomut' }, { name: 'Masol' }, { name: 'Tapach' }] },
      { name: 'Pokot Central', wards: [{ name: 'Kapenguria' }, { name: 'Mnagei' }, { name: 'Sook' }, { name: 'Lelan' }] },
    ],
  },
  {
    name: 'Baringo', code: 29,
    subCounties: [
      { name: 'Baringo North', wards: [{ name: 'Kabartonjo' }, { name: 'Saimo' }, { name: 'Tenges' }, { name: 'Kolowa' }] },
      { name: 'Baringo South', wards: [{ name: 'Mogotio' }, { name: 'Emining' }, { name: 'Mochongoi' }, { name: 'Lembus' }] },
      { name: 'Baringo Central', wards: [{ name: 'Eldama Ravine' }, { name: 'Esageri' }, { name: 'Ravine' }, { name: 'Mumberes' }] },
    ],
  },
  {
    name: 'Bomet', code: 46,
    subCounties: [
      { name: 'Bomet East', wards: [{ name: 'Bomet Town' }, { name: 'Chepalungu' }, { name: 'Sigor' }, { name: 'Konoin' }] },
      { name: 'Bomet Central', wards: [{ name: 'Longisa' }, { name: 'Merigi' }, { name: 'Ndanai' }, { name: 'Chemaner' }] },
      { name: 'Sotik', wards: [{ name: 'Sotik' }, { name: 'Ndanai' }, { name: 'Kipreres' }, { name: 'Kabianga' }] },
    ],
  },
  {
    name: 'Nyamira', code: 45,
    subCounties: [
      { name: 'Nyamira North', wards: [{ name: 'Nyamira Town' }, { name: 'Borabu' }, { name: 'Nyamaiya' }, { name: 'Manga' }] },
      { name: 'Nyamira South', wards: [{ name: 'Nyamongo' }, { name: 'Rigena' }, { name: 'Kegogi' }, { name: 'Magombo' }] },
      { name: 'Ekerenyo', wards: [{ name: 'Ekerenyo' }, { name: 'Mekenene' }, { name: 'Itibo' }, { name: 'Bokeira' }] },
    ],
  },
  {
    name: 'Elgeyo Marakwet', code: 30,
    subCounties: [
      { name: 'Elgeyo', wards: [{ name: 'Iten' }, { name: 'Tambach' }, { name: 'Kessup' }, { name: 'Kapcherop' }] },
      { name: 'Marakwet East', wards: [{ name: 'Kapsowar' }, { name: 'Chebiemit' }, { name: 'Murkut' }, { name: 'Sisiya' }] },
      { name: 'Marakwet West', wards: [{ name: 'Chesoi' }, { name: 'Kipteber' }, { name: 'Moi\'s Bridge' }, { name: 'Kapyego' }] },
    ],
  },
  {
    name: 'Tana River', code: 4,
    subCounties: [
      { name: 'Tana North', wards: [{ name: 'Madogo' }, { name: 'Hola' }, { name: 'Garsen' }, { name: 'Kipini' }] },
      { name: 'Tana South', wards: [{ name: 'Ngao' }, { name: 'Kipini East' }, { name: 'Kipini West' }, { name: 'Sala' }] },
    ],
  },
  {
    name: 'Lamu', code: 5,
    subCounties: [
      { name: 'Lamu East', wards: [{ name: 'Lamu Town' }, { name: 'Sheli' }, { name: 'Mkomani' }, { name: 'Hindi' }] },
      { name: 'Lamu West', wards: [{ name: 'Mpeketoni' }, { name: 'Witu' }, { name: 'Hongwe' }, { name: 'Basuba' }] },
    ],
  },
];

export function getCountyNames(): string[] {
  return COUNTIES.map((c) => c.name);
}

export function getSubCounties(countyName: string): string[] {
  const county = COUNTIES.find((c) => c.name === countyName);
  return county ? county.subCounties.map((s) => s.name) : [];
}

export function getWards(countyName: string, subCountyName: string): string[] {
  const county = COUNTIES.find((c) => c.name === countyName);
  if (!county) return [];
  const sc = county.subCounties.find((s) => s.name === subCountyName);
  return sc ? sc.wards.map((w) => w.name) : [];
}
