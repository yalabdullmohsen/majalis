# مراجعة إحصاءات القرآن — معتمدة للعرض

**المراجع:** وكيل المحتوى — مراجعة أولية على المصادر المطبوعة المعتمدة  
**التاريخ:** ٢٠٢٦-٠٨-١٧

## ما تم التحقق منه

- كل بطاقة لها `source.book` و`source.author` و`source.ref` غير فارغة.
- الأرقام من مصادر مطبوعة كلاسيكية (مصحف المدينة، الداني، السيوطي، عبد الباقي) دون حساب آلي.
- لا توجد قيم صفرية؛ ولا أرقام لاتينية في `label` أو `note` أو `detail`.
- المداخل `disputed` تحتوي `variants` ≥ ٢؛ ومداخل `mawdoo` تحتوي `evidence` ≥ ١.
- لا تكرار لـ`topicKey` بقيم مختلفة.

## المعرفات المعتمدة للعرض

### bunya.json (١٢)

| id | topicKey |
|---|---|
| surahs | surahs-count |
| ajza | ajza-count |
| ahzab | ahzab-count |
| arba | arba-count |
| ayat-kufi | ayat-kufi-count |
| words-disputed | words-count |
| letters-disputed | letters-count |
| pages-madinah | pages-madinah |
| sajda | sajda-count |
| makki-count | makki-surahs |
| madani-count | madani-surahs |
| nuzul-span | nuzul-years |

### alfaz.json (٣١)

| id | topicKey |
|---|---|
| allah-lafz | allah |
| rahman-lafz | rahman |
| wahd-madda | wahd |
| shirk-madda | shirk |
| iman-madda | iman |
| kufr-madda | kufr |
| nifaq-madda | nifaq |
| islam-madda | islam |
| salah-madda | salah |
| zakah-madda | zakah |
| sawm-madda | sawm |
| hajj-madda | hajj |
| dhikr-madda | dhikr |
| dua-madda | dua |
| tawba-madda | tawba |
| istighfar-madda | istighfar |
| jihad-madda | jihad |
| sabr-madda | sabr |
| taqwa-madda | taqwa |
| ihsan-madda | ihsan |
| adl-madda | adl |
| zulm-madda | zulm |
| rahma-madda | rahma |
| ilm-madda | ilm |
| hikma-madda | hikma |
| malaika-madda | malaika |
| shaitan-lafz | shaitan |
| iblis-lafz | iblis |
| jinn-madda | jinn |
| asma-husna | asma-husna |
| longest-word | longest-word |

### mawdoo.json (١٤)

| id | topicKey |
|---|---|
| jannah-lafz | jannah |
| jannah-names | jannah-names |
| nar-lafz | nar |
| nar-names | nar-names |
| akhira-lafz | akhira |
| qiyama-madda | qiyama |
| bath-madda | bath |
| hisab-mawdoo | hisab |
| mizan-mawdoo | mizan |
| sirat-mawdoo | sirat |
| barzakh-mawdoo | barzakh |
| adhab-qabr-mawdoo | adhab-qabr |
| tawhid-mawdoo | tawhid |
| dunya-lafz | dunya |

### suwar.json (١٠)

| id | topicKey |
|---|---|
| baqara-ayahs | baqara |
| kawthar-ayahs | kawthar |
| ikhlas-ayahs | ikhlas |
| fatiha-ayahs | fatiha |
| yasin-ayahs | yasin |
| longest-surah-ayahs | longest-surah |
| shortest-surah-ayahs | shortest-surah |
| longest-ayah | longest-ayah |
| shortest-ayah | shortest-ayah |
| naml-ayahs | naml |

### ajaib.json (٨)

| id | topicKey |
|---|---|
| classification | surah-divisions |
| huruf-muqatta | muqattaat |
| seven-tiwal | sab-tiwal |
| prophet-named-surahs | prophet-surahs |
| basmala-twice | basmala-naml |
| basmala-count | basmala-opening |
| sajda-surahs-count | sajda-surahs |
| fatiha-names | fatiha-aliases |

## المجموع

**٧٥** بطاقة معتمدة عبر المجموعات الخمس.
