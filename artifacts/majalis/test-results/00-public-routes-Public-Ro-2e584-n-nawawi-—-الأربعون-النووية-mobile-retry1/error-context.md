# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 00-public-routes.spec.ts >> Public Routes — المسارات العامة >> [عام] /arbaeen-nawawi — الأربعون النووية
- Location: tests/00-public-routes.spec.ts:71:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "تخطّي إلى المحتوى" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button "القائمة" [ref=e8] [cursor=pointer]:
          - img [ref=e9]
          - generic [ref=e11]: القائمة
        - link "المجلس العلمي" [ref=e12] [cursor=pointer]:
          - /url: /
          - generic [ref=e13]: المجلس العلمي
      - button "البحث الشامل (⌘K)" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
        - generic [ref=e19]: ⌘K
  - main [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - paragraph [ref=e23]: السنة
        - heading "الأربعون النووية" [level=1] [ref=e24]
        - paragraph [ref=e25]: أحاديث مختصرة مع شرح موجز وفوائد ومصدر.
      - generic [ref=e26]:
        - article [ref=e27]:
          - generic [ref=e30]: "1"
          - generic [ref=e31]:
            - generic [ref=e32]:
              - generic [ref=e33]: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى
              - generic [ref=e34]: الأعمال تُنسب إلى النيات.
            - generic [ref=e35]:
              - generic [ref=e36]:
                - term [ref=e37]: المصدر
                - definition [ref=e38]: متفق عليه — البخاري ومسلم
              - generic [ref=e39]:
                - term [ref=e40]: الفوائد
                - definition [ref=e41]: مراجعة النية قبل كل عمل.
            - toolbar "إجراءات المحتوى" [ref=e42]:
              - button "نسخ" [ref=e43] [cursor=pointer]
              - button "مشاركة" [ref=e44] [cursor=pointer]
              - button "وضع القراءة" [ref=e45] [cursor=pointer]
              - link "إعدادات" [ref=e46] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e47] [cursor=pointer]
        - article [ref=e48]:
          - generic [ref=e51]: "2"
          - generic [ref=e52]:
            - generic [ref=e53]:
              - generic [ref=e54]: الإسلام أن تشهد أن لا إله إلا الله وأن محمداً رسول الله، وتقيم الصلاة، وتؤتي الزكاة، وتصوم رمضان، وتحج البيت إن استطعت. والإيمان أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر، وتؤمن بالقدر خيره وشره. والإحسان أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك.
              - generic [ref=e55]: حديث جبريل يبين الإسلام والإيمان والإحسان.
            - generic [ref=e56]:
              - generic [ref=e57]:
                - term [ref=e58]: المصدر
                - definition [ref=e59]: رواه مسلم
              - generic [ref=e60]:
                - term [ref=e61]: الفوائد
                - definition [ref=e62]: معرفة مراتب الدين.
            - toolbar "إجراءات المحتوى" [ref=e63]:
              - button "نسخ" [ref=e64] [cursor=pointer]
              - button "مشاركة" [ref=e65] [cursor=pointer]
              - button "وضع القراءة" [ref=e66] [cursor=pointer]
              - link "إعدادات" [ref=e67] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e68] [cursor=pointer]
        - article [ref=e69]:
          - generic [ref=e72]: "3"
          - generic [ref=e73]:
            - generic [ref=e74]:
              - generic [ref=e75]: "بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ"
              - generic [ref=e76]: أركان الإسلام الخمسة.
            - generic [ref=e77]:
              - generic [ref=e78]:
                - term [ref=e79]: المصدر
                - definition [ref=e80]: متفق عليه — البخاري ومسلم
              - generic [ref=e81]:
                - term [ref=e82]: الفوائد
                - definition [ref=e83]: معرفة أصول الدين.
            - toolbar "إجراءات المحتوى" [ref=e84]:
              - button "نسخ" [ref=e85] [cursor=pointer]
              - button "مشاركة" [ref=e86] [cursor=pointer]
              - button "وضع القراءة" [ref=e87] [cursor=pointer]
              - link "إعدادات" [ref=e88] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e89] [cursor=pointer]
        - article [ref=e90]:
          - generic [ref=e93]: "4"
          - generic [ref=e94]:
            - generic [ref=e95]:
              - generic [ref=e96]: "إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا نُطْفَةً، ثُمَّ عَلَقَةً، ثُمَّ مُضْغَةً، ثُمَّ يُرْسَلُ الْمَلَكُ فَيَنْفُخُ فِيهِ الرُّوحَ، وَيُؤْمَرُ بِأَرْبَعِ كَلِمَاتٍ: بِكَتْبِ رِزْقِهِ وَأَجَلِهِ وَعَمَلِهِ وَشَقِيٍّ أَوْ سَعِيدٍ"
              - generic [ref=e97]: مراحل خلق الإنسان وكتب القدر.
            - generic [ref=e98]:
              - generic [ref=e99]:
                - term [ref=e100]: المصدر
                - definition [ref=e101]: متفق عليه — البخاري ومسلم
              - generic [ref=e102]:
                - term [ref=e103]: الفوائد
                - definition [ref=e104]: التواضع ومعرفة قدرة الله.
            - toolbar "إجراءات المحتوى" [ref=e105]:
              - button "نسخ" [ref=e106] [cursor=pointer]
              - button "مشاركة" [ref=e107] [cursor=pointer]
              - button "وضع القراءة" [ref=e108] [cursor=pointer]
              - link "إعدادات" [ref=e109] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e110] [cursor=pointer]
        - article [ref=e111]:
          - generic [ref=e114]: "5"
          - generic [ref=e115]:
            - generic [ref=e116]:
              - generic [ref=e117]: مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ
              - generic [ref=e118]: كل محدثة في الدين مردودة.
            - generic [ref=e119]:
              - generic [ref=e120]:
                - term [ref=e121]: المصدر
                - definition [ref=e122]: متفق عليه — البخاري ومسلم
              - generic [ref=e123]:
                - term [ref=e124]: الفوائد
                - definition [ref=e125]: التمسك بالسنة.
            - toolbar "إجراءات المحتوى" [ref=e126]:
              - button "نسخ" [ref=e127] [cursor=pointer]
              - button "مشاركة" [ref=e128] [cursor=pointer]
              - button "وضع القراءة" [ref=e129] [cursor=pointer]
              - link "إعدادات" [ref=e130] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e131] [cursor=pointer]
        - article [ref=e132]:
          - generic [ref=e135]: "6"
          - generic [ref=e136]:
            - generic [ref=e137]:
              - generic [ref=e138]: إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ، فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ
              - generic [ref=e139]: الحلال والحرام واضحان والمشتبهات تُتقى.
            - generic [ref=e140]:
              - generic [ref=e141]:
                - term [ref=e142]: المصدر
                - definition [ref=e143]: متفق عليه — البخاري ومسلم
              - generic [ref=e144]:
                - term [ref=e145]: الفوائد
                - definition [ref=e146]: اجتناب الشبهات.
            - toolbar "إجراءات المحتوى" [ref=e147]:
              - button "نسخ" [ref=e148] [cursor=pointer]
              - button "مشاركة" [ref=e149] [cursor=pointer]
              - button "وضع القراءة" [ref=e150] [cursor=pointer]
              - link "إعدادات" [ref=e151] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e152] [cursor=pointer]
        - article [ref=e153]:
          - generic [ref=e156]: "7"
          - generic [ref=e157]:
            - generic [ref=e158]:
              - generic [ref=e159]: "الدِّينُ النَّصِيحَةُ، قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ، وَلِكِتَابِهِ، وَلِرَسُولِهِ، وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ"
              - generic [ref=e160]: الدين كله نصيحة لله ورسوله والمسلمين.
            - generic [ref=e161]:
              - generic [ref=e162]:
                - term [ref=e163]: المصدر
                - definition [ref=e164]: رواه مسلم
              - generic [ref=e165]:
                - term [ref=e166]: الفوائد
                - definition [ref=e167]: إخلاص النصح.
            - toolbar "إجراءات المحتوى" [ref=e168]:
              - button "نسخ" [ref=e169] [cursor=pointer]
              - button "مشاركة" [ref=e170] [cursor=pointer]
              - button "وضع القراءة" [ref=e171] [cursor=pointer]
              - link "إعدادات" [ref=e172] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e173] [cursor=pointer]
        - article [ref=e174]:
          - generic [ref=e177]: "8"
          - generic [ref=e178]:
            - generic [ref=e179]:
              - generic [ref=e180]: أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَيُقِيمُوا الصَّلَاةَ، وَيُؤْتُوا الزَّكَاةَ
              - generic [ref=e181]: بيان شهادة الإسلام وحفظ الدم والمال.
            - generic [ref=e182]:
              - generic [ref=e183]:
                - term [ref=e184]: المصدر
                - definition [ref=e185]: متفق عليه — البخاري ومسلم
              - generic [ref=e186]:
                - term [ref=e187]: الفوائد
                - definition [ref=e188]: معرفة حقوق الإسلام.
            - toolbar "إجراءات المحتوى" [ref=e189]:
              - button "نسخ" [ref=e190] [cursor=pointer]
              - button "مشاركة" [ref=e191] [cursor=pointer]
              - button "وضع القراءة" [ref=e192] [cursor=pointer]
              - link "إعدادات" [ref=e193] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e194] [cursor=pointer]
        - article [ref=e195]:
          - generic [ref=e198]: "9"
          - generic [ref=e199]:
            - generic [ref=e200]:
              - generic [ref=e201]: مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ
              - generic [ref=e202]: اجتناب النهي وإتيان الأمر بحسب الاستطاعة.
            - generic [ref=e203]:
              - generic [ref=e204]:
                - term [ref=e205]: المصدر
                - definition [ref=e206]: متفق عليه — البخاري ومسلم
              - generic [ref=e207]:
                - term [ref=e208]: الفوائد
                - definition [ref=e209]: عدم التشدد فيما لا طاقة به.
            - toolbar "إجراءات المحتوى" [ref=e210]:
              - button "نسخ" [ref=e211] [cursor=pointer]
              - button "مشاركة" [ref=e212] [cursor=pointer]
              - button "وضع القراءة" [ref=e213] [cursor=pointer]
              - link "إعدادات" [ref=e214] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e215] [cursor=pointer]
        - article [ref=e216]:
          - generic [ref=e219]: "10"
          - generic [ref=e220]:
            - generic [ref=e221]:
              - generic [ref=e222]: إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا
              - generic [ref=e223]: الله لا يقبل إلا الطيب من الأعمال والأموال.
            - generic [ref=e224]:
              - generic [ref=e225]:
                - term [ref=e226]: المصدر
                - definition [ref=e227]: رواه مسلم
              - generic [ref=e228]:
                - term [ref=e229]: الفوائد
                - definition [ref=e230]: تطهير الكسب والعبادة.
            - toolbar "إجراءات المحتوى" [ref=e231]:
              - button "نسخ" [ref=e232] [cursor=pointer]
              - button "مشاركة" [ref=e233] [cursor=pointer]
              - button "وضع القراءة" [ref=e234] [cursor=pointer]
              - link "إعدادات" [ref=e235] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e236] [cursor=pointer]
        - article [ref=e237]:
          - generic [ref=e240]: "11"
          - generic [ref=e241]:
            - generic [ref=e242]:
              - generic [ref=e243]: دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ
              - generic [ref=e244]: ترك الشك إلى اليقين.
            - generic [ref=e245]:
              - generic [ref=e246]:
                - term [ref=e247]: المصدر
                - definition [ref=e248]: رواه الترمذي — حسن صحيح
              - generic [ref=e249]:
                - term [ref=e250]: الفوائد
                - definition [ref=e251]: سكينة القلب.
            - toolbar "إجراءات المحتوى" [ref=e252]:
              - button "نسخ" [ref=e253] [cursor=pointer]
              - button "مشاركة" [ref=e254] [cursor=pointer]
              - button "وضع القراءة" [ref=e255] [cursor=pointer]
              - link "إعدادات" [ref=e256] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e257] [cursor=pointer]
        - article [ref=e258]:
          - generic [ref=e261]: "12"
          - generic [ref=e262]:
            - generic [ref=e263]:
              - generic [ref=e264]: مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ
              - generic [ref=e265]: من كمال الإسلام ترك ما لا يعنيه.
            - generic [ref=e266]:
              - generic [ref=e267]:
                - term [ref=e268]: المصدر
                - definition [ref=e269]: رواه الترمذي — حسن
              - generic [ref=e270]:
                - term [ref=e271]: الفوائد
                - definition [ref=e272]: توفير الوقت وسلامة اللسان.
            - toolbar "إجراءات المحتوى" [ref=e273]:
              - button "نسخ" [ref=e274] [cursor=pointer]
              - button "مشاركة" [ref=e275] [cursor=pointer]
              - button "وضع القراءة" [ref=e276] [cursor=pointer]
              - link "إعدادات" [ref=e277] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e278] [cursor=pointer]
        - article [ref=e279]:
          - generic [ref=e282]: "13"
          - generic [ref=e283]:
            - generic [ref=e284]:
              - generic [ref=e285]: لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ
              - generic [ref=e286]: كمال الإيمان محبة الخير للغير.
            - generic [ref=e287]:
              - generic [ref=e288]:
                - term [ref=e289]: المصدر
                - definition [ref=e290]: متفق عليه — البخاري ومسلم
              - generic [ref=e291]:
                - term [ref=e292]: الفوائد
                - definition [ref=e293]: الإخلاص والتعاون.
            - toolbar "إجراءات المحتوى" [ref=e294]:
              - button "نسخ" [ref=e295] [cursor=pointer]
              - button "مشاركة" [ref=e296] [cursor=pointer]
              - button "وضع القراءة" [ref=e297] [cursor=pointer]
              - link "إعدادات" [ref=e298] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e299] [cursor=pointer]
        - article [ref=e300]:
          - generic [ref=e303]: "14"
          - generic [ref=e304]:
            - generic [ref=e305]:
              - generic [ref=e306]: "لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ إِلَّا بِإِحْدَى ثَلَاثٍ: الثَّيِّبُ الزَّانِي، وَالنَّفْسُ بِالنَّفْسِ، وَالتَّارِكُ لِدِينِهِ الْمُفَارِقُ لِلْجَمَاعَةِ"
              - generic [ref=e307]: تحريم إراقة دم المسلم.
            - generic [ref=e308]:
              - generic [ref=e309]:
                - term [ref=e310]: المصدر
                - definition [ref=e311]: متفق عليه — البخاري ومسلم
              - generic [ref=e312]:
                - term [ref=e313]: الفوائد
                - definition [ref=e314]: صيانة الدماء.
            - toolbar "إجراءات المحتوى" [ref=e315]:
              - button "نسخ" [ref=e316] [cursor=pointer]
              - button "مشاركة" [ref=e317] [cursor=pointer]
              - button "وضع القراءة" [ref=e318] [cursor=pointer]
              - link "إعدادات" [ref=e319] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e320] [cursor=pointer]
        - article [ref=e321]:
          - generic [ref=e324]: "15"
          - generic [ref=e325]:
            - generic [ref=e326]:
              - generic [ref=e327]: مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ضَيْفَهُ
              - generic [ref=e328]: الإيمان يقتضي حسن الكلام وإكرام الجار والضيف.
            - generic [ref=e329]:
              - generic [ref=e330]:
                - term [ref=e331]: المصدر
                - definition [ref=e332]: متفق عليه — البخاري ومسلم
              - generic [ref=e333]:
                - term [ref=e334]: الفوائد
                - definition [ref=e335]: حسن الجوار.
            - toolbar "إجراءات المحتوى" [ref=e336]:
              - button "نسخ" [ref=e337] [cursor=pointer]
              - button "مشاركة" [ref=e338] [cursor=pointer]
              - button "وضع القراءة" [ref=e339] [cursor=pointer]
              - link "إعدادات" [ref=e340] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e341] [cursor=pointer]
        - article [ref=e342]:
          - generic [ref=e345]: "16"
          - generic [ref=e346]:
            - generic [ref=e347]:
              - generic [ref=e348]: لَا تَغْضَبْ
              - generic [ref=e349]: الوصية بكظم الغضب.
            - generic [ref=e350]:
              - generic [ref=e351]:
                - term [ref=e352]: المصدر
                - definition [ref=e353]: رواه البخاري
              - generic [ref=e354]:
                - term [ref=e355]: الفوائد
                - definition [ref=e356]: حفظ العلاقات والأخلاق.
            - toolbar "إجراءات المحتوى" [ref=e357]:
              - button "نسخ" [ref=e358] [cursor=pointer]
              - button "مشاركة" [ref=e359] [cursor=pointer]
              - button "وضع القراءة" [ref=e360] [cursor=pointer]
              - link "إعدادات" [ref=e361] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e362] [cursor=pointer]
        - article [ref=e363]:
          - generic [ref=e366]: "17"
          - generic [ref=e367]:
            - generic [ref=e368]:
              - generic [ref=e369]: إِنَّ اللَّهَ كَتَبَ الْإِحْسَانَ عَلَى كُلِّ شَيْءٍ، فَإِذَا قَتَلْتُمْ فَأَحْسِنُوا الْقِتْلَةَ، وَإِذَا ذَبَحْتُمْ فَأَحْسِنُوا الذِّبْحَةَ
              - generic [ref=e370]: الإحسان مطلوب في كل عمل.
            - generic [ref=e371]:
              - generic [ref=e372]:
                - term [ref=e373]: المصدر
                - definition [ref=e374]: رواه مسلم
              - generic [ref=e375]:
                - term [ref=e376]: الفوائد
                - definition [ref=e377]: الرفق وإتقان العمل.
            - toolbar "إجراءات المحتوى" [ref=e378]:
              - button "نسخ" [ref=e379] [cursor=pointer]
              - button "مشاركة" [ref=e380] [cursor=pointer]
              - button "وضع القراءة" [ref=e381] [cursor=pointer]
              - link "إعدادات" [ref=e382] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e383] [cursor=pointer]
        - article [ref=e384]:
          - generic [ref=e387]: "18"
          - generic [ref=e388]:
            - generic [ref=e389]:
              - generic [ref=e390]: اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ
              - generic [ref=e391]: تقوى الله ومحو السيئات وحسن الخلق.
            - generic [ref=e392]:
              - generic [ref=e393]:
                - term [ref=e394]: المصدر
                - definition [ref=e395]: رواه الترمذي — حسن صحيح
              - generic [ref=e396]:
                - term [ref=e397]: الفوائد
                - definition [ref=e398]: استمرار التوبة.
            - toolbar "إجراءات المحتوى" [ref=e399]:
              - button "نسخ" [ref=e400] [cursor=pointer]
              - button "مشاركة" [ref=e401] [cursor=pointer]
              - button "وضع القراءة" [ref=e402] [cursor=pointer]
              - link "إعدادات" [ref=e403] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e404] [cursor=pointer]
        - article [ref=e405]:
          - generic [ref=e408]: "19"
          - generic [ref=e409]:
            - generic [ref=e410]:
              - generic [ref=e411]: احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ
              - generic [ref=e412]: مراقبة الله سبب لحفظه للعبد.
            - generic [ref=e413]:
              - generic [ref=e414]:
                - term [ref=e415]: المصدر
                - definition [ref=e416]: رواه الترمذي — حسن صحيح
              - generic [ref=e417]:
                - term [ref=e418]: الفوائد
                - definition [ref=e419]: التوكل والدعاء.
            - toolbar "إجراءات المحتوى" [ref=e420]:
              - button "نسخ" [ref=e421] [cursor=pointer]
              - button "مشاركة" [ref=e422] [cursor=pointer]
              - button "وضع القراءة" [ref=e423] [cursor=pointer]
              - link "إعدادات" [ref=e424] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e425] [cursor=pointer]
        - article [ref=e426]:
          - generic [ref=e429]: "20"
          - generic [ref=e430]:
            - generic [ref=e431]:
              - generic [ref=e432]: إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ
              - generic [ref=e433]: فقدان الحياء يفضي إلى المعاصي.
            - generic [ref=e434]:
              - generic [ref=e435]:
                - term [ref=e436]: المصدر
                - definition [ref=e437]: رواه البخاري
              - generic [ref=e438]:
                - term [ref=e439]: الفوائد
                - definition [ref=e440]: حفظ الحياء.
            - toolbar "إجراءات المحتوى" [ref=e441]:
              - button "نسخ" [ref=e442] [cursor=pointer]
              - button "مشاركة" [ref=e443] [cursor=pointer]
              - button "وضع القراءة" [ref=e444] [cursor=pointer]
              - link "إعدادات" [ref=e445] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e446] [cursor=pointer]
        - article [ref=e447]:
          - generic [ref=e450]: "21"
          - generic [ref=e451]:
            - generic [ref=e452]:
              - generic [ref=e453]: "قُلْ: آمَنْتُ بِاللَّهِ ثُمَّ اسْتَقِمْ"
              - generic [ref=e454]: الاستقامة على الإيمان.
            - generic [ref=e455]:
              - generic [ref=e456]:
                - term [ref=e457]: المصدر
                - definition [ref=e458]: رواه مسلم
              - generic [ref=e459]:
                - term [ref=e460]: الفوائد
                - definition [ref=e461]: الثبات على الدين.
            - toolbar "إجراءات المحتوى" [ref=e462]:
              - button "نسخ" [ref=e463] [cursor=pointer]
              - button "مشاركة" [ref=e464] [cursor=pointer]
              - button "وضع القراءة" [ref=e465] [cursor=pointer]
              - link "إعدادات" [ref=e466] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e467] [cursor=pointer]
        - article [ref=e468]:
          - generic [ref=e471]: "22"
          - generic [ref=e472]:
            - generic [ref=e473]:
              - generic [ref=e474]: "أَرَأَيْتَ إِنْ صَلَّيْتَ الْمَكْتُوبَاتِ، وَصُمْتَ رَمَضَانَ، وَأَحْلَلْتَ الْحَلَالَ، وَحَرَّمْتَ الْحَرَامَ، وَلَمْ تَزِدْ عَلَى ذَلِكَ شَيْئًا أَأَدْخُلُ الْجَنَّةَ؟ قَالَ: نَعَمْ"
              - generic [ref=e475]: الالتزام بالفرائض يدخل الجنة.
            - generic [ref=e476]:
              - generic [ref=e477]:
                - term [ref=e478]: المصدر
                - definition [ref=e479]: رواه مسلم
              - generic [ref=e480]:
                - term [ref=e481]: الفوائد
                - definition [ref=e482]: الحرص على الفرائض.
            - toolbar "إجراءات المحتوى" [ref=e483]:
              - button "نسخ" [ref=e484] [cursor=pointer]
              - button "مشاركة" [ref=e485] [cursor=pointer]
              - button "وضع القراءة" [ref=e486] [cursor=pointer]
              - link "إعدادات" [ref=e487] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e488] [cursor=pointer]
        - article [ref=e489]:
          - generic [ref=e492]: "23"
          - generic [ref=e493]:
            - generic [ref=e494]:
              - generic [ref=e495]: الطَّهُورُ شَطْرُ الْإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ مَا بَيْنَ السَّمَاءِ وَالْأَرْضِ، وَالصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالْقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ
              - generic [ref=e496]: فضل الطهارة والذكر والصلاة والصدقة.
            - generic [ref=e497]:
              - generic [ref=e498]:
                - term [ref=e499]: المصدر
                - definition [ref=e500]: رواه مسلم
              - generic [ref=e501]:
                - term [ref=e502]: الفوائد
                - definition [ref=e503]: الاهتمام بالطهارة والعبادة.
            - toolbar "إجراءات المحتوى" [ref=e504]:
              - button "نسخ" [ref=e505] [cursor=pointer]
              - button "مشاركة" [ref=e506] [cursor=pointer]
              - button "وضع القراءة" [ref=e507] [cursor=pointer]
              - link "إعدادات" [ref=e508] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e509] [cursor=pointer]
        - article [ref=e510]:
          - generic [ref=e513]: "24"
          - generic [ref=e514]:
            - generic [ref=e515]:
              - generic [ref=e516]: "يَا عِبَادِي: إِنِّي حَرَّمْتُ الظُّلْمَ عَلَى نَفْسِي وَجَعَلْتُهُ بَيْنَكُمْ مُحَرَّمًا؛ فَلَا تَظَالَمُوا"
              - generic [ref=e517]: تحريم الظلم بين العباد.
            - generic [ref=e518]:
              - generic [ref=e519]:
                - term [ref=e520]: المصدر
                - definition [ref=e521]: رواه مسلم
              - generic [ref=e522]:
                - term [ref=e523]: الفوائد
                - definition [ref=e524]: عدم الظلم والبغي.
            - toolbar "إجراءات المحتوى" [ref=e525]:
              - button "نسخ" [ref=e526] [cursor=pointer]
              - button "مشاركة" [ref=e527] [cursor=pointer]
              - button "وضع القراءة" [ref=e528] [cursor=pointer]
              - link "إعدادات" [ref=e529] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e530] [cursor=pointer]
        - article [ref=e531]:
          - generic [ref=e534]: "25"
          - generic [ref=e535]:
            - generic [ref=e536]:
              - generic [ref=e537]: إِنَّ بِكُلِّ تَسْبِيحَةٍ صَدَقَةً، وَكُلِّ تَكْبِيرَةٍ صَدَقَةً، وَكُلِّ تَحْمِيدَةٍ صَدَقَةً، وَكُلِّ تَهْلِيلَةٍ صَدَقَةً، وَأَمْرٌ بِمَعْرُوفٍ صَدَقَةٌ، وَنَهْيٌ عَنْ مُنْكَرٍ صَدَقَةٌ
              - generic [ref=e538]: الذكر والمعروف صدقة.
            - generic [ref=e539]:
              - generic [ref=e540]:
                - term [ref=e541]: المصدر
                - definition [ref=e542]: رواه مسلم
              - generic [ref=e543]:
                - term [ref=e544]: الفوائد
                - definition [ref=e545]: كثرة الذكر والإحسان.
            - toolbar "إجراءات المحتوى" [ref=e546]:
              - button "نسخ" [ref=e547] [cursor=pointer]
              - button "مشاركة" [ref=e548] [cursor=pointer]
              - button "وضع القراءة" [ref=e549] [cursor=pointer]
              - link "إعدادات" [ref=e550] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e551] [cursor=pointer]
        - article [ref=e552]:
          - generic [ref=e555]: "26"
          - generic [ref=e556]:
            - generic [ref=e557]:
              - generic [ref=e558]: "كُلُّ سُلَامَى مِنْ النَّاسِ عَلَيْهِ صَدَقَةٌ، كُلَّ يَوْمٍ تَطْلُعُ فِيهِ الشَّمْسُ: تَعْدِلُ بَيْنَ اثْنَيْنِ صَدَقَةٌ، وَتُعِينُ الرَّجُلَ فِي دَابَّتِهِ صَدَقَةٌ، وَالْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ"
              - generic [ref=e559]: الصدقة في كل يوم بأعمال يسيرة.
            - generic [ref=e560]:
              - generic [ref=e561]:
                - term [ref=e562]: المصدر
                - definition [ref=e563]: متفق عليه — البخاري ومسلم
              - generic [ref=e564]:
                - term [ref=e565]: الفوائد
                - definition [ref=e566]: الإحسان اليومي.
            - toolbar "إجراءات المحتوى" [ref=e567]:
              - button "نسخ" [ref=e568] [cursor=pointer]
              - button "مشاركة" [ref=e569] [cursor=pointer]
              - button "وضع القراءة" [ref=e570] [cursor=pointer]
              - link "إعدادات" [ref=e571] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e572] [cursor=pointer]
        - article [ref=e573]:
          - generic [ref=e576]: "27"
          - generic [ref=e577]:
            - generic [ref=e578]:
              - generic [ref=e579]: الْبِرُّ حُسْنُ الْخُلُقِ، وَالْإِثْمُ مَا حَاكَ فِي صَدْرِكَ وَكَرِهْتَ أَنْ يَطَّلِعَ عَلَيْهِ النَّاسُ
              - generic [ref=e580]: البِرّ حسن الخُلُق والإثم ما حاك في الصدر.
            - generic [ref=e581]:
              - generic [ref=e582]:
                - term [ref=e583]: المصدر
                - definition [ref=e584]: رواه مسلم
              - generic [ref=e585]:
                - term [ref=e586]: الفوائد
                - definition [ref=e587]: حسن الخُلُق ومراجعة القلب.
            - toolbar "إجراءات المحتوى" [ref=e588]:
              - button "نسخ" [ref=e589] [cursor=pointer]
              - button "مشاركة" [ref=e590] [cursor=pointer]
              - button "وضع القراءة" [ref=e591] [cursor=pointer]
              - link "إعدادات" [ref=e592] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e593] [cursor=pointer]
        - article [ref=e594]:
          - generic [ref=e597]: "28"
          - generic [ref=e598]:
            - generic [ref=e599]:
              - generic [ref=e600]: أُوصِيكُمْ بِتَقْوَى اللَّهِ، وَالسَّمْعِ وَالطَّاعَةِ وَإِنْ تَأَمَّرَ عَلَيْكُمْ عَبْدٌ، فَعَلَيْكُمْ بِسُنَّتِي وَسُنَّةِ الْخُلَفَاءِ الرَّاشِدِينَ، عَضُّوا عَلَيْهَا بِالنَّوَاجِذِ، وَإِيَّاكُمْ وَمُحْدَثَاتِ الْأُمُورِ؛ فَإِنَّ كُلَّ بِدْعَةٍ ضَلَالَةٌ
              - generic [ref=e601]: التمسك بالسنة واجتناب البدع.
            - generic [ref=e602]:
              - generic [ref=e603]:
                - term [ref=e604]: المصدر
                - definition [ref=e605]: رواه أبو داود والترمذي — حسن صحيح
              - generic [ref=e606]:
                - term [ref=e607]: الفوائد
                - definition [ref=e608]: الوحدة على السنة.
            - toolbar "إجراءات المحتوى" [ref=e609]:
              - button "نسخ" [ref=e610] [cursor=pointer]
              - button "مشاركة" [ref=e611] [cursor=pointer]
              - button "وضع القراءة" [ref=e612] [cursor=pointer]
              - link "إعدادات" [ref=e613] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e614] [cursor=pointer]
        - article [ref=e615]:
          - generic [ref=e618]: "29"
          - generic [ref=e619]:
            - generic [ref=e620]:
              - generic [ref=e621]: تَعْبُدُ اللَّهَ لَا تُشْرِكْ بِهِ شَيْئًا، وَتُقِيمُ الصَّلَاةَ، وَتُؤْتِي الزَّكَاةَ، وَتَصُومُ رَمَضَانَ، وَتَحُجُّ الْبَيْتَ. الصَّوْمُ جُنَّةٌ، وَالصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ، وَصَلَاةُ الرَّجُلِ فِي جَوْفِ اللَّيْلِ
              - generic [ref=e622]: "الفرائض وأبواب الخير: صوم وصدقة وقيام."
            - generic [ref=e623]:
              - generic [ref=e624]:
                - term [ref=e625]: المصدر
                - definition [ref=e626]: رواه الترمذي — حسن صحيح
              - generic [ref=e627]:
                - term [ref=e628]: الفوائد
                - definition [ref=e629]: الحرص على العبادات.
            - toolbar "إجراءات المحتوى" [ref=e630]:
              - button "نسخ" [ref=e631] [cursor=pointer]
              - button "مشاركة" [ref=e632] [cursor=pointer]
              - button "وضع القراءة" [ref=e633] [cursor=pointer]
              - link "إعدادات" [ref=e634] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e635] [cursor=pointer]
        - article [ref=e636]:
          - generic [ref=e639]: "30"
          - generic [ref=e640]:
            - generic [ref=e641]:
              - generic [ref=e642]: إِنَّ اللَّهَ تَعَالَى فَرَضَ فَرَائِضَ فَلَا تُضَيِّعُوهَا، وَحَدَّ حُدُودًا فَلَا تَعْتَدُوهَا، وَحَرَّمَ أَشْيَاءَ فَلَا تَنْتَهِكُوهَا، وَسَكَتَ عَنْ أَشْيَاءَ رَحْمَةً لَكُمْ غَيْرَ نِسْيَانٍ فَلَا تَبْحَثُوا عَنْهَا
              - generic [ref=e643]: الالتزام بالفرائض والحدود.
            - generic [ref=e644]:
              - generic [ref=e645]:
                - term [ref=e646]: المصدر
                - definition [ref=e647]: رواه الدارقطني — حسن
              - generic [ref=e648]:
                - term [ref=e649]: الفوائد
                - definition [ref=e650]: عدم التشدد في المسكوت عنه.
            - toolbar "إجراءات المحتوى" [ref=e651]:
              - button "نسخ" [ref=e652] [cursor=pointer]
              - button "مشاركة" [ref=e653] [cursor=pointer]
              - button "وضع القراءة" [ref=e654] [cursor=pointer]
              - link "إعدادات" [ref=e655] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e656] [cursor=pointer]
        - article [ref=e657]:
          - generic [ref=e660]: "31"
          - generic [ref=e661]:
            - generic [ref=e662]:
              - generic [ref=e663]: ازْهَدْ فِي الدُّنْيَا يُحِبُّكَ اللَّهُ، وَازْهَدْ فِيمَا عِنْدَ النَّاسِ يُحِبُّكَ النَّاسُ
              - generic [ref=e664]: الزهد يجلب محبة الله والناس.
            - generic [ref=e665]:
              - generic [ref=e666]:
                - term [ref=e667]: المصدر
                - definition [ref=e668]: رواه ابن ماجه — حسن
              - generic [ref=e669]:
                - term [ref=e670]: الفوائد
                - definition [ref=e671]: عدم التعلق بالدنيا.
            - toolbar "إجراءات المحتوى" [ref=e672]:
              - button "نسخ" [ref=e673] [cursor=pointer]
              - button "مشاركة" [ref=e674] [cursor=pointer]
              - button "وضع القراءة" [ref=e675] [cursor=pointer]
              - link "إعدادات" [ref=e676] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e677] [cursor=pointer]
        - article [ref=e678]:
          - generic [ref=e681]: "32"
          - generic [ref=e682]:
            - generic [ref=e683]:
              - generic [ref=e684]: لَا ضَرَرَ وَلَا ضِرَارَ
              - generic [ref=e685]: منع الضرر عن النفس والغير.
            - generic [ref=e686]:
              - generic [ref=e687]:
                - term [ref=e688]: المصدر
                - definition [ref=e689]: رواه ابن ماجه — حسن
              - generic [ref=e690]:
                - term [ref=e691]: الفوائد
                - definition [ref=e692]: مراعاة حقوق الناس.
            - toolbar "إجراءات المحتوى" [ref=e693]:
              - button "نسخ" [ref=e694] [cursor=pointer]
              - button "مشاركة" [ref=e695] [cursor=pointer]
              - button "وضع القراءة" [ref=e696] [cursor=pointer]
              - link "إعدادات" [ref=e697] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e698] [cursor=pointer]
        - article [ref=e699]:
          - generic [ref=e702]: "33"
          - generic [ref=e703]:
            - generic [ref=e704]:
              - generic [ref=e705]: لَكِنَّ الْبَيِّنَةَ عَلَى الْمُدَّعِي، وَالْيَمِينَ عَلَى مَنْ أَنْكَرَ
              - generic [ref=e706]: الدعوى تحتاج بينة والأنكار يحلف.
            - generic [ref=e707]:
              - generic [ref=e708]:
                - term [ref=e709]: المصدر
                - definition [ref=e710]: رواه البيهقي — حسن
              - generic [ref=e711]:
                - term [ref=e712]: الفوائد
                - definition [ref=e713]: عدالة في المنازعات.
            - toolbar "إجراءات المحتوى" [ref=e714]:
              - button "نسخ" [ref=e715] [cursor=pointer]
              - button "مشاركة" [ref=e716] [cursor=pointer]
              - button "وضع القراءة" [ref=e717] [cursor=pointer]
              - link "إعدادات" [ref=e718] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e719] [cursor=pointer]
        - article [ref=e720]:
          - generic [ref=e723]: "34"
          - generic [ref=e724]:
            - generic [ref=e725]:
              - generic [ref=e726]: مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ، وَذَلِكَ أَضْعَفُ الْإِيمَانِ
              - generic [ref=e727]: مراتب تغيير المنكر.
            - generic [ref=e728]:
              - generic [ref=e729]:
                - term [ref=e730]: المصدر
                - definition [ref=e731]: رواه مسلم
              - generic [ref=e732]:
                - term [ref=e733]: الفوائد
                - definition [ref=e734]: النهي عن المنكر بحسب الاستطاعة.
            - toolbar "إجراءات المحتوى" [ref=e735]:
              - button "نسخ" [ref=e736] [cursor=pointer]
              - button "مشاركة" [ref=e737] [cursor=pointer]
              - button "وضع القراءة" [ref=e738] [cursor=pointer]
              - link "إعدادات" [ref=e739] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e740] [cursor=pointer]
        - article [ref=e741]:
          - generic [ref=e744]: "35"
          - generic [ref=e745]:
            - generic [ref=e746]:
              - generic [ref=e747]: لَا تَحَاسَدُوا، وَلَا تَنَاجَشُوا، وَلَا تَبَاغَضُوا، وَكُونُوا عِبَادَ اللَّهِ إخْوَانًا، الْمُسْلِمُ أَخُو الْمُسْلِمِ لَا يَظْلِمُهُ وَلَا يَخْذُلُهُ
              - generic [ref=e748]: تحريم الحسد والبغض بين المسلمين.
            - generic [ref=e749]:
              - generic [ref=e750]:
                - term [ref=e751]: المصدر
                - definition [ref=e752]: رواه مسلم
              - generic [ref=e753]:
                - term [ref=e754]: الفوائد
                - definition [ref=e755]: الأخوة الإسلامية.
            - toolbar "إجراءات المحتوى" [ref=e756]:
              - button "نسخ" [ref=e757] [cursor=pointer]
              - button "مشاركة" [ref=e758] [cursor=pointer]
              - button "وضع القراءة" [ref=e759] [cursor=pointer]
              - link "إعدادات" [ref=e760] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e761] [cursor=pointer]
        - article [ref=e762]:
          - generic [ref=e765]: "36"
          - generic [ref=e766]:
            - generic [ref=e767]:
              - generic [ref=e768]: مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ، وَمَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللَّهُ عَلَيْهِ
              - generic [ref=e769]: نفع المؤمن ينفع صاحبه يوم القيامة.
            - generic [ref=e770]:
              - generic [ref=e771]:
                - term [ref=e772]: المصدر
                - definition [ref=e773]: رواه مسلم
              - generic [ref=e774]:
                - term [ref=e775]: الفوائد
                - definition [ref=e776]: مساعدة المسلمين.
            - toolbar "إجراءات المحتوى" [ref=e777]:
              - button "نسخ" [ref=e778] [cursor=pointer]
              - button "مشاركة" [ref=e779] [cursor=pointer]
              - button "وضع القراءة" [ref=e780] [cursor=pointer]
              - link "إعدادات" [ref=e781] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e782] [cursor=pointer]
        - article [ref=e783]:
          - generic [ref=e786]: "37"
          - generic [ref=e787]:
            - generic [ref=e788]:
              - generic [ref=e789]: مَنْ هَمَّ بِحَسَنَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللَّهُ عِنْدَهُ حَسَنَةً كَامِلَةً، وَإِنْ هَمَّ بِهَا فَعَمِلَهَا كَتَبَهَا عَشْرَ حَسَنَاتٍ، وَإِنْ هَمَّ بِسَيِّئَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا حَسَنَةً، وَإِنْ عَمِلَهَا كَتَبَهَا سَيِّئَةً وَاحِدَةً
              - generic [ref=e790]: فضل الهم بالخير ورفع الحرج عن الهم بالشر.
            - generic [ref=e791]:
              - generic [ref=e792]:
                - term [ref=e793]: المصدر
                - definition [ref=e794]: متفق عليه — البخاري ومسلم
              - generic [ref=e795]:
                - term [ref=e796]: الفوائد
                - definition [ref=e797]: الإكثار من النوايا الطيبة.
            - toolbar "إجراءات المحتوى" [ref=e798]:
              - button "نسخ" [ref=e799] [cursor=pointer]
              - button "مشاركة" [ref=e800] [cursor=pointer]
              - button "وضع القراءة" [ref=e801] [cursor=pointer]
              - link "إعدادات" [ref=e802] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e803] [cursor=pointer]
        - article [ref=e804]:
          - generic [ref=e807]: "38"
          - generic [ref=e808]:
            - generic [ref=e809]:
              - generic [ref=e810]: مَنْ عَادَى لِي وَلِيًّا فَقَدْ آذَنْتُهُ بِالْحَرْبِ، وَمَا تَقَرَّبَ إِلَيَّ عَبْدِي بِشَيْءٍ أَحَبَّ إِلَيَّ مِمَّا افْتَرَضْتُهُ عَلَيْهِ، وَلَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ
              - generic [ref=e811]: النوافل تقرب العبد من الله.
            - generic [ref=e812]:
              - generic [ref=e813]:
                - term [ref=e814]: المصدر
                - definition [ref=e815]: رواه البخاري
              - generic [ref=e816]:
                - term [ref=e817]: الفوائد
                - definition [ref=e818]: الإكثار من النوافل.
            - toolbar "إجراءات المحتوى" [ref=e819]:
              - button "نسخ" [ref=e820] [cursor=pointer]
              - button "مشاركة" [ref=e821] [cursor=pointer]
              - button "وضع القراءة" [ref=e822] [cursor=pointer]
              - link "إعدادات" [ref=e823] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e824] [cursor=pointer]
        - article [ref=e825]:
          - generic [ref=e828]: "39"
          - generic [ref=e829]:
            - generic [ref=e830]:
              - generic [ref=e831]: إِنَّ اللَّهَ تَجَاوَزَ لِي عَنْ أُمَّتِي الْخَطَأَ وَالنِّسْيَانَ وَمَا اسْتُكْرِهُوا عَلَيْهِ
              - generic [ref=e832]: رفع الحرج عن الأمة في الخطأ والنسيان والإكراه.
            - generic [ref=e833]:
              - generic [ref=e834]:
                - term [ref=e835]: المصدر
                - definition [ref=e836]: رواه ابن ماجه — حسن
              - generic [ref=e837]:
                - term [ref=e838]: الفوائد
                - definition [ref=e839]: الطمأنينة وعدم التشدد.
            - toolbar "إجراءات المحتوى" [ref=e840]:
              - button "نسخ" [ref=e841] [cursor=pointer]
              - button "مشاركة" [ref=e842] [cursor=pointer]
              - button "وضع القراءة" [ref=e843] [cursor=pointer]
              - link "إعدادات" [ref=e844] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e845] [cursor=pointer]
        - article [ref=e846]:
          - generic [ref=e849]: "40"
          - generic [ref=e850]:
            - generic [ref=e851]:
              - generic [ref=e852]: كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ. إِذَا أَمْسَيْتَ فَلَا تَنْتَظِرِ الصَّبَاحَ، وَإِذَا أَصْبَحْتَ فَلَا تَنْتَظِرِ الْمَسَاءَ، وَخُذْ مِنْ صِحَّتِكَ لِمَرَضِكَ، وَمِنْ حَيَاتِكَ لِمَوْتِكَ
              - generic [ref=e853]: الزهد والاستعداد للآخرة.
            - generic [ref=e854]:
              - generic [ref=e855]:
                - term [ref=e856]: المصدر
                - definition [ref=e857]: رواه البخاري
              - generic [ref=e858]:
                - term [ref=e859]: الفوائد
                - definition [ref=e860]: عدم الغرور بالدنيا.
            - toolbar "إجراءات المحتوى" [ref=e861]:
              - button "نسخ" [ref=e862] [cursor=pointer]
              - button "مشاركة" [ref=e863] [cursor=pointer]
              - button "وضع القراءة" [ref=e864] [cursor=pointer]
              - link "إعدادات" [ref=e865] [cursor=pointer]:
                - /url: /settings
            - button "تفعيل وضع القراءة للبطاقة" [ref=e866] [cursor=pointer]
  - contentinfo "تذييل موقع المجلس العلمي" [ref=e867]:
    - generic [ref=e868]:
      - generic [ref=e869]:
        - img [ref=e870]
        - img [ref=e873]
        - generic [ref=e874]:
          - strong [ref=e875]: المجلس العلمي
          - paragraph [ref=e876]: تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.
          - paragraph [ref=e877]:
            - link "yalabdullmohsen1@gmail.com" [ref=e878] [cursor=pointer]:
              - /url: mailto:yalabdullmohsen1@gmail.com
      - generic [ref=e879]:
        - generic [ref=e880]:
          - paragraph [ref=e881]: المحتوى
          - navigation [ref=e882]:
            - link "الدروس" [ref=e883] [cursor=pointer]:
              - /url: /lessons
            - link "الفوائد" [ref=e884] [cursor=pointer]:
              - /url: /fawaid
            - link "الأحاديث" [ref=e885] [cursor=pointer]:
              - /url: /hadith
            - link "القصص" [ref=e886] [cursor=pointer]:
              - /url: /stories
            - link "الأسئلة" [ref=e887] [cursor=pointer]:
              - /url: /qa
        - generic [ref=e888]:
          - paragraph [ref=e889]: العبادة
          - navigation [ref=e890]:
            - link "القرآن" [ref=e891] [cursor=pointer]:
              - /url: /quran
            - link "الأذكار" [ref=e892] [cursor=pointer]:
              - /url: /adhkar
            - link "مواقيت الصلاة" [ref=e893] [cursor=pointer]:
              - /url: /prayer-times
            - link "التسابيح" [ref=e894] [cursor=pointer]:
              - /url: /tasbih
        - generic [ref=e895]:
          - paragraph [ref=e896]: التطبيق
          - navigation [ref=e897]:
            - link "من نحن" [ref=e898] [cursor=pointer]:
              - /url: /about
            - link "تواصل معنا" [ref=e899] [cursor=pointer]:
              - /url: /contact
            - link "مميزات قيد التطوير" [ref=e900] [cursor=pointer]:
              - /url: /features-in-progress
            - link "الخصوصية" [ref=e901] [cursor=pointer]:
              - /url: /privacy
            - link "الشروط" [ref=e902] [cursor=pointer]:
              - /url: /terms
      - paragraph [ref=e903]: © 2026 المجلس العلمي
  - navigation "التنقل السفلي" [ref=e904]:
    - link "الرئيسية" [ref=e905] [cursor=pointer]:
      - /url: /
      - img [ref=e907]
      - generic [ref=e910]: الرئيسية
    - link "الدروس" [ref=e911] [cursor=pointer]:
      - /url: /lessons
      - img [ref=e913]
      - generic [ref=e916]: الدروس
    - 'link "الصلاة القادمة: العصر 3:27 م" [ref=e917] [cursor=pointer]':
      - /url: /prayer-times
      - generic [ref=e918]:
        - img [ref=e919]
        - generic: 3:27 م
      - generic [ref=e924]: الصلاة
    - link "القرآن" [ref=e925] [cursor=pointer]:
      - /url: /quran
      - img [ref=e927]
      - generic [ref=e929]: القرآن
    - button "قائمة التطبيق" [ref=e930] [cursor=pointer]:
      - img [ref=e932]
      - generic [ref=e937]: المزيد
```

# Test source

```ts
  1   | /**
  2   |  * 00-public-routes.spec.ts
  3   |  *
  4   |  * يتحقق من أن جميع المسارات في PUBLIC_NAV_ITEMS:
  5   |  *   1. تفتح بدون تسجيل دخول (لا إعادة توجيه إلى /login أو /admin)
  6   |  *   2. تعرض محتوى حقيقياً (ليست صفحة فارغة أو "غير مصرح")
  7   |  *   3. لا تستخدم AdminLazyRoute (فحص ثابت في الكود)
  8   |  *
  9   |  * إذا فشل أي اختبار → صفحة عامة مخفية → يجب الإصلاح قبل الـ Commit.
  10  |  */
  11  | import { test, expect } from "@playwright/test";
  12  | 
  13  | // نسخة من PUBLIC_NAV_ITEMS بدون استيراد وقت التشغيل
  14  | // يجب أن تتطابق مع src/lib/navigation.ts > PUBLIC_NAV_ITEMS
  15  | const PUBLIC_ROUTES: Array<{ href: string; label: string }> = [
  16  |   { href: "/",               label: "الرئيسية" },
  17  |   { href: "/lessons",        label: "الدروس" },
  18  |   { href: "/annual-courses", label: "الدورات العلمية" },
  19  |   { href: "/library",        label: "المكتبة" },
  20  |   { href: "/hadith",         label: "الأحاديث" },
  21  |   { href: "/fawaid",         label: "الفوائد" },
  22  |   { href: "/stories",        label: "القصص الإسلامية" },
  23  |   { href: "/miracles",       label: "المعجزات" },
  24  |   { href: "/qa",             label: "الأسئلة" },
  25  |   { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
  26  |   { href: "/updates",        label: "المستجدات" },
  27  |   { href: "/fiqh",                 label: "الفقه الإسلامي" },
  28  |   { href: "/fiqh-council",        label: "المجمع الفقهي" },
  29  |   { href: "/fatwa",               label: "الفتاوى" },
  30  |   { href: "/rulings",             label: "الأحكام الشرعية" },
  31  |   { href: "/seerah",              label: "السيرة النبوية" },
  32  |   { href: "/scholarly-research",  label: "الباحث الشرعي" },
  33  |   { href: "/universities",        label: "دليل الجامعات" },
  34  |   { href: "/learning-path",       label: "خارطة طالب العلم" },
  35  |   { href: "/quran",          label: "القرآن" },
  36  |   { href: "/quran-radio",    label: "إذاعة القرآن" },
  37  |   { href: "/adhkar",         label: "الأذكار" },
  38  |   { href: "/tasbih",         label: "التسبيح" },
  39  |   { href: "/prayer-times",   label: "مواقيت الصلاة" },
  40  |   { href: "/muezzins",       label: "مكتبة المؤذنين" },
  41  |   { href: "/qibla",          label: "القبلة" },
  42  |   { href: "/occasions",      label: "المناسبات" },
  43  |   { href: "/calendar",       label: "التقويم" },
  44  |   { href: "/quiz",           label: "المسابقات" },
  45  |   { href: "/prophets",       label: "قصص الأنبياء" },
  46  |   { href: "/search",         label: "البحث" },
  47  |   { href: "/settings",       label: "الإعدادات" },
  48  |   { href: "/about",          label: "عن المنصة" },
  49  | ];
  50  | 
  51  | // مسارات الاختصار التي يجب أن تُعيد التوجيه بدلاً من الفشل
  52  | const REDIRECT_ROUTES: Array<{ href: string; redirectsTo: string }> = [
  53  |   { href: "/mushaf",   redirectsTo: "/quran" },
  54  |   { href: "/research", redirectsTo: "/fiqh-council/research" },
  55  | ];
  56  | 
  57  | // نصوص تدل على حظر الوصول
  58  | const ACCESS_DENIED_TEXTS = [
  59  |   "غير مصرح",
  60  |   "تسجيل الدخول",
  61  |   "يرجى تسجيل الدخول",
  62  |   "Unauthorized",
  63  |   "Access denied",
  64  | ];
  65  | 
  66  | test.describe("Public Routes — المسارات العامة", () => {
  67  |   test.describe.configure({ mode: "serial" });
  68  | 
  69  |   // ── 1. فحص كل صفحة عامة بدون تسجيل دخول ─────────────────────────────
  70  |   for (const route of PUBLIC_ROUTES) {
  71  |     test(`[عام] ${route.href} — ${route.label}`, async ({ page }) => {
  72  |       await page.goto(route.href, { waitUntil: "load" });
> 73  |       await page.waitForTimeout(800);
      |                  ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  74  | 
  75  |       // يجب ألا تُحوَّل إلى /login
  76  |       const finalUrl = page.url();
  77  |       expect(
  78  |         finalUrl,
  79  |         `${route.href} أعاد التوجيه إلى صفحة تسجيل الدخول`,
  80  |       ).not.toContain("/login");
  81  | 
  82  |       // يجب ألا يظهر نص "غير مصرح" أو ما شابهه
  83  |       const body = await page.locator("body").innerText();
  84  |       for (const denied of ACCESS_DENIED_TEXTS) {
  85  |         // نستثني الرابط العادي للدخول في navbar (يظهر للجميع)
  86  |         const occurrences = (body.match(new RegExp(denied, "g")) ?? []).length;
  87  |         const isOnlyNavLink = denied === "تسجيل الدخول" && occurrences <= 2;
  88  |         if (!isOnlyNavLink) {
  89  |           expect(
  90  |             body,
  91  |             `${route.href} يُظهر "${denied}" — قد يكون محجوباً`,
  92  |           ).not.toContain(denied);
  93  |         }
  94  |       }
  95  | 
  96  |       // يجب أن يحتوي على محتوى حقيقي
  97  |       expect(
  98  |         body.length,
  99  |         `${route.href} يبدو فارغاً — تحقق من مشكلة في التحميل`,
  100 |       ).toBeGreaterThan(30);
  101 |     });
  102 |   }
  103 | 
  104 |   // ── 2. فحص مسارات الاختصار (redirects) ──────────────────────────────
  105 |   for (const route of REDIRECT_ROUTES) {
  106 |     test(`[اختصار] ${route.href} → ${route.redirectsTo}`, async ({ page }) => {
  107 |       await page.goto(route.href, { waitUntil: "load" });
  108 |       await page.waitForTimeout(500);
  109 | 
  110 |       const finalUrl = page.url();
  111 |       expect(
  112 |         finalUrl,
  113 |         `${route.href} يجب أن يُعيد التوجيه إلى ${route.redirectsTo}`,
  114 |       ).toContain(route.redirectsTo);
  115 | 
  116 |       // يجب ألا تُحوَّل إلى /login
  117 |       expect(finalUrl).not.toContain("/login");
  118 |     });
  119 |   }
  120 | 
  121 |   // ── 3. فحص ثابت: أي مسار عام لا يستخدم AdminLazyRoute ──────────────
  122 |   test("فحص ثابت: المسارات العامة لا تستخدم AdminLazyRoute في App.tsx", async () => {
  123 |     const { readFileSync } = await import("fs");
  124 |     const { resolve, dirname } = await import("path");
  125 | 
  126 |     const testDir = dirname(new URL(import.meta.url).pathname);
  127 |     const appPath = resolve(testDir, "../src/App.tsx");
  128 |     const appContent = readFileSync(appPath, "utf-8");
  129 | 
  130 |     // استخرج جميع مسارات AdminLazyRoute
  131 |     const adminRoutePattern = /<Route path="([^"]+)">\s*<AdminLazyRoute/g;
  132 |     const adminPaths: string[] = [];
  133 |     let match: RegExpExecArray | null;
  134 |     while ((match = adminRoutePattern.exec(appContent)) !== null) {
  135 |       adminPaths.push(match[1]);
  136 |     }
  137 | 
  138 |     // تحقق أن لا أياً من PUBLIC_ROUTES في قائمة AdminLazyRoute
  139 |     for (const route of PUBLIC_ROUTES) {
  140 |       const isAdminLocked = adminPaths.some(
  141 |         (adminPath) =>
  142 |           adminPath === route.href ||
  143 |           route.href.startsWith(adminPath.replace("*", "")),
  144 |       );
  145 |       expect(
  146 |         isAdminLocked,
  147 |         `المسار العام "${route.href}" مقيّد بـ AdminLazyRoute — يجب نقله إلى SafeLazyRoute`,
  148 |       ).toBe(false);
  149 |     }
  150 |   });
  151 | 
  152 |   // ── 4. تحقق من وجود PUBLIC_NAV_ITEMS في navigation.ts ────────────────
  153 |   test("فحص ثابت: PUBLIC_NAV_ITEMS مُعرَّفة في navigation.ts", async () => {
  154 |     const { readFileSync } = await import("fs");
  155 |     const { resolve, dirname } = await import("path");
  156 | 
  157 |     const testDir = dirname(new URL(import.meta.url).pathname);
  158 |     const navPath = resolve(testDir, "../src/lib/navigation.ts");
  159 |     const navContent = readFileSync(navPath, "utf-8");
  160 | 
  161 |     expect(
  162 |       navContent,
  163 |       "PUBLIC_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
  164 |     ).toContain("export const PUBLIC_NAV_ITEMS");
  165 | 
  166 |     expect(
  167 |       navContent,
  168 |       "PRIMARY_NAV_ITEMS غير موجودة في src/lib/navigation.ts",
  169 |     ).toContain("export const PRIMARY_NAV_ITEMS");
  170 |   });
  171 | });
  172 | 
```