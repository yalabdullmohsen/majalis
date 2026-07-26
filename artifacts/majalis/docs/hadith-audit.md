# تدقيق النصوص النبوية — المرحلة 3

إجمالي المواضع المستخرجة (نسبة قول/متن): **493**

## التصنيف

| التصنيف | العدد |
|---|---:|
| complete_in_repo | 66 |
| incomplete | 210 |
| NEEDS_HUMAN | 217 |
| SUSPECT_TEXT | 0 |

## publication_gate = blocked

عدد المرشحين من التدقيق الآلي: **7** (كثير منها مناقشة لضعف الحديث لا استدلال به — تحتاج مراجعة بشرية قبل حجب واجهي).

| ملف | سطر | سبب مرشّح |
|---|---:|---|
| `src/lib/qa-seed.ts` | 3817 | NEEDS_HUMAN — "answer": "الجواب: (1) الإرسال: سقوط راوٍ من آخر السند دون تعمد الإيهام، كقول ال |
| `src/lib/qa-seed.ts` | 5018 | incomplete — "answer": "الجواب: الحديث الموضوع: ما اختُلق ونُسب كذباً للنبي ﷺ. وعلاماته: اعتر |
| `src/lib/qa-seed.ts` | 5031 | incomplete — "answer": "الجواب: الإسناد هو سلسلة الرواة الذين نقلوا الحديث من النبي ﷺ حتى وصل |
| `src/lib/quiz-seed.ts` | 554 | complete_in_repo — "answer": "سورة يس — وهذه تسمية مشتهرة على الألسنة، والحديث الوارد فيها «إن لكل  |
| `src/lib/quiz-seed.ts` | 7018 | NEEDS_HUMAN — {"id": "demo-quiz-1042", "section": "الحديث", "category": "مصطلح", "level": "صعب |
| `src/lib/fawaid-seed.ts` | 2604 | incomplete — text: "الغيبة أكلٌ للحم الأخ ميتاً كما في الحجرات، وعرّفها النبي ﷺ: «ذكرك أخاك ب |
| `src/lib/fawaid-seed.ts` | 3508 | incomplete — text: "فائدة رجالية: أقسام الرواة في كتب الجرح والتعديل — وضع العلماء درجات دقيق |

## القائمة المرصودة سابقاً (curriculum)

| المعرّف | الحالة | publication_gate | ملاحظة |
|---|---|---|---|
| curriculum-1 | عُزل المتن المشبوه سابقاً — مؤكَّد | `open` | لا لاتيني في متن الحديث؛ لم يُعد تصحيح متن |
| curriculum-4 | عُزل المتن المشبوه سابقاً — مؤكَّد | `open` | لا لاتيني في متن الحديث؛ لم يُعد تصحيح متن |
| curriculum-5 | عُزل المتن المشبوه سابقاً — مؤكَّد | `open` | لا لاتيني في متن الحديث؛ لم يُعد تصحيح متن |
| curriculum-10 | عُزل المتن المشبوه سابقاً — مؤكَّد | `open` | لا لاتيني في متن الحديث؛ لم يُعد تصحيح متن |

## عيّنة NEEDS_HUMAN (أول 40)

| ملف | سطر | الناقص | مقتطف |
|---|---:|---|---|
| `src/lib/qa-seed.ts` | 643 | work, number, grade, grader | "answer": "الجواب: السحور، وهو سنة مؤكدة لقوله ﷺ: (تسحّروا فإن في السحور بركة) — متفق عليه |
| `src/lib/qa-seed.ts` | 659 | work, number, grade, grader | "answer": "الجواب: الوقوف بعرفة، لقوله ﷺ: (الحج عرفة) — وهو ركن لا يصح الحج بدونه.", |
| `src/lib/qa-seed.ts` | 963 | work, number, grade, grader | "answer": "الجواب: جائز، والجهر ثابت بالسنة كما في حديث ابن عباس: (كان رفع الصوت بالذكر حي |
| `src/lib/qa-seed.ts` | 1219 | work, number, grade, grader | "answer": "الجواب: التوراة (موسى)، والإنجيل (عيسى)، والزبور (داود)، والقرآن الكريم (محمد ﷺ |
| `src/lib/qa-seed.ts` | 1474 | work, number, grade, grader | "question": "من الصحابي الذي قال عنه النبي ﷺ «مَن أراد أن ينظر إلى شهيد يمشي على وجه الأرض |
| `src/lib/qa-seed.ts` | 1570 | work, number, grade, grader | "question": "لمن قال النبي ﷺ «أنت مني وأنا منك»؟", |
| `src/lib/qa-seed.ts` | 1795 | work, number, grade, grader | "answer": "الجواب: الفاتحة كاملة ركن في كل ركعة لحديث «لا صلاة لمن لم يقرأ بفاتحة الكتاب». |
| `src/lib/qa-seed.ts` | 1811 | work, number, grade, grader | "answer": "الجواب: الأفضل للمرأة الصلاة في بيتها، لحديث «وبيوتهن خير لهن».", |
| `src/lib/qa-seed.ts` | 1891 | work, number, grade, grader | "answer": "الجواب: تُعرض الأعمال يوم الاثنين والخميس على الله، وقال ﷺ: «تُعرض الأعمال يوم  |
| `src/lib/qa-seed.ts` | 2051 | work, number, grade, grader | "answer": "الجواب: قال ﷺ: «الحج المبرور ليس له جزاء إلا الجنة».", |
| `src/lib/qa-seed.ts` | 3037 | work, number, grade, grader | "answer": "الجواب: العمرة جائزة في أشهر الحج بل هي أفضل لأن النبي ﷺ اعتمر في ذي القعدة مرا |
| `src/lib/qa-seed.ts` | 3232 | work, number, grade, grader | "answer": "الجواب: المساجد التي بُنيت على القبور أو أُدخل فيها قبر لا تجوز الصلاة فيها لنه |
| `src/lib/qa-seed.ts` | 3297 | work, number, grade, grader | "answer": "الجواب: الدَّين جائز في الإسلام وقد استدان النبي ﷺ. شروطه: 1) النية الصادقة على |
| `src/lib/qa-seed.ts` | 3336 | work, number, grade, grader | "answer": "الجواب: المسألة خلافية بين المذاهب الأربعة: (1) الحنفية والحنابلة: يشترطون المح |
| `src/lib/qa-seed.ts` | 3401 | work, number, grade, grader | "answer": "الجواب: اختلف الفقهاء في حكم صلاة الجماعة للرجل القادر على ثلاثة أقوال: (1) فرض |
| `src/lib/qa-seed.ts` | 3414 | work, number, grade, grader | "answer": "الجواب: أبو ذر الغفاري (جُندب بن جنادة) رضي الله عنه من كبار الصحابة وأولهم إسل |
| `src/lib/qa-seed.ts` | 3518 | work, number, grade, grader | "answer": "الجواب: أركان عقد الزواج هي: (1) الإيجاب من ولي المرأة أو من ينوب عنه. (2) القب |
| `src/lib/qa-seed.ts` | 3557 | work, number, grade, grader | "answer": "الجواب: (1) الفرض عند الجمهور: ما ثبت بدليل قطعي كالصلوات الخمس والحج، تاركه آث |
| `src/lib/qa-seed.ts` | 3713 | work, number, grade, grader | "answer": "الجواب: خصائص القرآن الكريم: (1) محفوظ بحفظ الله ﴿إِنَّا نَحْنُ نَزَّلْنَا الذِ |
| `src/lib/qa-seed.ts` | 3752 | work, number, grade, grader | "answer": "الجواب: (1) المرفوع: ما نُسب إلى النبي ﷺ قولاً أو فعلاً أو تقريراً أو صفة، سواء |
| `src/lib/qa-seed.ts` | 3778 | work, number, grade, grader | "answer": "الجواب: فضل صلاة الجماعة: قال ﷺ 'صلاة الجماعة تفضل صلاة الفذ بسبع وعشرين درجة'  |
| `src/lib/qa-seed.ts` | 3817 | work, number, grade, grader | "answer": "الجواب: (1) الإرسال: سقوط راوٍ من آخر السند دون تعمد الإيهام، كقول التابعي 'قال |
| `src/lib/qa-seed.ts` | 3882 | work, number, grade, grader | "answer": "الجواب: منهج أهل السنة: (1) الطاعة في المعروف. (2) الصبر على الجور مع عدم تأييد |
| `src/lib/qa-seed.ts` | 4077 | work, number, grade, grader | "answer": "الجواب: اختلف العلماء على ثلاثة أقوال: (1) الوجوب على المأموم وإن سمع قراءة الإ |
| `src/lib/qa-seed.ts` | 4155 | work, number, grade, grader | "answer": "الجواب: مرّ النبي ﷺ قبل الوحي بثلاث مراحل تهيئة: (1) الرؤيا الصادقة — كانت تأتي |
| `src/lib/qa-seed.ts` | 4168 | work, number, grade, grader | "answer": "الجواب: أبرز محطات الهجرة النبوية: (1) الخروج من مكة سراً ليلاً ومبيته ﷺ مع أبي |
| `src/lib/qa-seed.ts` | 4233 | work, number, grade, grader | "answer": "الجواب: كان النبي ﷺ نموذجاً للزوج والأب الكريم؛ قال ﷺ: «خيركم خيركم لأهله وأنا  |
| `src/lib/qa-seed.ts` | 4246 | work, number, grade, grader | "answer": "الجواب: تميّز النبي ﷺ بسمات قيادية وأخلاقية فريدة: (1) الرحمة والرفق — «ما بُعث |
| `src/lib/qa-seed.ts` | 4259 | work, number, grade, grader | "answer": "الجواب: من آخر وصايا النبي ﷺ قبيل وفاته ﷺ: (1) الصلاة الصلاة وما ملكت أيمانكم — |
| `src/lib/qa-seed.ts` | 4272 | work, number, grade, grader | "answer": "الجواب: الأحرف السبعة وردت في حديث النبي ﷺ: «إن هذا القرآن أُنزل على سبعة أحرف» |
| `src/lib/qa-seed.ts` | 4598 | work, number, grade, grader | "answer": "الجواب: يُستحب عند سماع الأذان: (1) متابعة المؤذن بترديد ما يقوله كلمة بكلمة. ( |
| `src/lib/qa-seed.ts` | 4651 | work, number, grade, grader | "answer": "الجواب: صيام ستة أيام من شوال بعد رمضان سنة مستحبة، وفضلها عظيم إذ قال ﷺ «من صا |
| `src/lib/qa-seed.ts` | 4677 | work, number, grade, grader | "answer": "الجواب: صيام يوم عرفة (التاسع من ذي الحجة) سنة مؤكدة لغير الحاج، وفضله أن النبي |
| `src/lib/qa-seed.ts` | 4690 | work, number, grade, grader | "answer": "الجواب: يستحب تأخير السحور إلى قُرب أذان الفجر، لقوله ﷺ «تسحّروا فإن في السحور  |
| `src/lib/qa-seed.ts` | 4939 | work, number, grade, grader | "answer": "الجواب: يُفرَّق بين أنواع العمل في البنوك الربوية: (1) العمل الذي يرتبط مباشرة  |
| `src/lib/qa-seed.ts` | 5044 | work, number, grade, grader | "answer": "الجواب: الجرح والتعديل علم يُبيَّن فيه أحوال رواة الحديث من حيث القبول والرد. ا |
| `src/lib/qa-seed.ts` | 5123 | work, number, grade, grader | "answer": "الجواب: يجب الإيمان بجميع الأنبياء جملةً دون تفريق بين نبيٍّ وآخر. والقرآن ذكر  |
| `src/lib/qa-seed.ts` | 5136 | work, number, grade, grader | "answer": "الجواب: اختُص النبي ﷺ بخصائص منها: (1) خاتم الأنبياء والمرسلين. (2) أُرسل للناس |
| `src/lib/quiz-seed.ts` | 570 | work, number, grade, grader | "question": "ما الحديث الذي يُعدّ من جوامع كلمه ﷺ ويبدأ بـ (إنما الأعمال)؟", |
| `src/lib/quiz-seed.ts` | 1514 | work, number, grade, grader | "question": "ما المدينة التي سُمِّيت «مدينة النبي» ﷺ، ووُعِد الصابر على شدّتها بشفاعته؟", |

## عيّنة incomplete (أول 40)

| ملف | سطر | الناقص | verified_from |
|---|---:|---|---|
| `src/lib/qa-seed.ts` | 1571 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 2738 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 2946 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 2959 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3050 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3128 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3167 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3180 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3193 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3206 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3271 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3300 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3375 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3440 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3453 | number, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3479 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3505 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3570 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3586 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3635 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3661 | number | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3830 | number | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3843 | number | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3960 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 3999 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4064 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4129 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4181 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4220 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4507 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4559 | number | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4716 | number, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 4992 | number | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 5018 | number, grader | `NEEDS_HUMAN` |
| `src/lib/qa-seed.ts` | 5031 | number, grader | `NEEDS_HUMAN` |
| `src/lib/quiz-seed.ts` | 627 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/quiz-seed.ts` | 1031 | grade, grader | `NEEDS_HUMAN` |
| `src/lib/quiz-seed.ts` | 1079 | number, grade, grader | `NEEDS_HUMAN` |
| `src/lib/quiz-seed.ts` | 1119 | number, grader | `NEEDS_HUMAN` |
| `src/lib/quiz-seed.ts` | 1136 | number, grade, grader | `NEEDS_HUMAN` |

## كاملة في المستودع (complete_in_repo)

العدد: **66** — `verified_from=repo:file:line`.

| ملف | سطر | verified_from |
|---|---:|---|
| `src/lib/qa-seed.ts` | 1155 | `repo:src/lib/qa-seed.ts:1155` |
| `src/lib/qa-seed.ts` | 2387 | `repo:src/lib/qa-seed.ts:2387` |
| `src/lib/qa-seed.ts` | 3144 | `repo:src/lib/qa-seed.ts:3144` |
| `src/lib/qa-seed.ts` | 3313 | `repo:src/lib/qa-seed.ts:3313` |
| `src/lib/qa-seed.ts` | 3427 | `repo:src/lib/qa-seed.ts:3427` |
| `src/lib/quiz-seed.ts` | 554 | `repo:src/lib/quiz-seed.ts:554` |
| `src/lib/quiz-seed.ts` | 635 | `repo:src/lib/quiz-seed.ts:635` |
| `src/lib/quiz-seed.ts` | 643 | `repo:src/lib/quiz-seed.ts:643` |
| `src/lib/quiz-seed.ts` | 853 | `repo:src/lib/quiz-seed.ts:853` |
| `src/lib/quiz-seed.ts` | 1483 | `repo:src/lib/quiz-seed.ts:1483` |
| `src/lib/quiz-seed.ts` | 1491 | `repo:src/lib/quiz-seed.ts:1491` |
| `src/lib/quiz-seed.ts` | 1540 | `repo:src/lib/quiz-seed.ts:1540` |
| `src/lib/quiz-seed.ts` | 2012 | `repo:src/lib/quiz-seed.ts:2012` |
| `src/lib/quiz-seed.ts` | 2988 | `repo:src/lib/quiz-seed.ts:2988` |
| `src/lib/quiz-seed.ts` | 3012 | `repo:src/lib/quiz-seed.ts:3012` |
| `src/lib/quiz-seed.ts` | 3164 | `repo:src/lib/quiz-seed.ts:3164` |
| `src/lib/quiz-seed.ts` | 3180 | `repo:src/lib/quiz-seed.ts:3180` |
| `src/lib/quiz-seed.ts` | 3188 | `repo:src/lib/quiz-seed.ts:3188` |
| `src/lib/quiz-seed.ts` | 3196 | `repo:src/lib/quiz-seed.ts:3196` |
| `src/lib/quiz-seed.ts` | 3252 | `repo:src/lib/quiz-seed.ts:3252` |
| `src/lib/quiz-seed.ts` | 4916 | `repo:src/lib/quiz-seed.ts:4916` |
| `src/lib/quiz-seed.ts` | 5220 | `repo:src/lib/quiz-seed.ts:5220` |
| `src/lib/quiz-seed.ts` | 5820 | `repo:src/lib/quiz-seed.ts:5820` |
| `src/lib/quiz-seed.ts` | 6028 | `repo:src/lib/quiz-seed.ts:6028` |
| `src/lib/quiz-seed.ts` | 6076 | `repo:src/lib/quiz-seed.ts:6076` |
| `src/lib/quiz-seed.ts` | 6684 | `repo:src/lib/quiz-seed.ts:6684` |
| `src/lib/quiz-seed.ts` | 6867 | `repo:src/lib/quiz-seed.ts:6867` |
| `src/lib/quiz-seed.ts` | 6914 | `repo:src/lib/quiz-seed.ts:6914` |
| `src/lib/quiz-seed.ts` | 6963 | `repo:src/lib/quiz-seed.ts:6963` |
| `src/lib/quiz-seed.ts` | 6966 | `repo:src/lib/quiz-seed.ts:6966` |
| `src/lib/quiz-seed.ts` | 6983 | `repo:src/lib/quiz-seed.ts:6983` |
| `src/lib/quiz-seed.ts` | 6984 | `repo:src/lib/quiz-seed.ts:6984` |
| `src/lib/quiz-seed.ts` | 6985 | `repo:src/lib/quiz-seed.ts:6985` |
| `src/lib/quiz-seed.ts` | 6986 | `repo:src/lib/quiz-seed.ts:6986` |
| `src/lib/quiz-seed.ts` | 6992 | `repo:src/lib/quiz-seed.ts:6992` |
| `src/lib/quiz-seed.ts` | 6993 | `repo:src/lib/quiz-seed.ts:6993` |
| `src/lib/quiz-seed.ts` | 6994 | `repo:src/lib/quiz-seed.ts:6994` |
| `src/lib/quiz-seed.ts` | 6996 | `repo:src/lib/quiz-seed.ts:6996` |
| `src/lib/quiz-seed.ts` | 7019 | `repo:src/lib/quiz-seed.ts:7019` |
| `src/lib/quiz-seed.ts` | 7059 | `repo:src/lib/quiz-seed.ts:7059` |
| `src/lib/quiz-seed.ts` | 7075 | `repo:src/lib/quiz-seed.ts:7075` |
| `src/lib/fawaid-seed.ts` | 982 | `repo:src/lib/fawaid-seed.ts:982` |
| `src/lib/fawaid-seed.ts` | 1916 | `repo:src/lib/fawaid-seed.ts:1916` |
| `src/lib/fawaid-seed.ts` | 2196 | `repo:src/lib/fawaid-seed.ts:2196` |
| `src/lib/fawaid-seed.ts` | 2460 | `repo:src/lib/fawaid-seed.ts:2460` |
| `src/lib/fawaid-seed.ts` | 3532 | `repo:src/lib/fawaid-seed.ts:3532` |
| `src/lib/fawaid-curated-seed.ts` | 74 | `repo:src/lib/fawaid-curated-seed.ts:74` |
| `src/lib/fawaid-curated-seed.ts` | 155 | `repo:src/lib/fawaid-curated-seed.ts:155` |
| `src/lib/fawaid-curated-seed.ts` | 164 | `repo:src/lib/fawaid-curated-seed.ts:164` |
| `src/lib/fawaid-curated-seed.ts` | 175 | `repo:src/lib/fawaid-curated-seed.ts:175` |
| `src/lib/fawaid-curated-seed.ts` | 213 | `repo:src/lib/fawaid-curated-seed.ts:213` |
| `src/lib/fawaid-curated-seed.ts` | 271 | `repo:src/lib/fawaid-curated-seed.ts:271` |
| `src/lib/fawaid-curated-seed.ts` | 314 | `repo:src/lib/fawaid-curated-seed.ts:314` |
| `src/lib/fawaid-curated-seed.ts` | 315 | `repo:src/lib/fawaid-curated-seed.ts:315` |
| `src/lib/islamic-stories-seed.ts` | 555 | `repo:src/lib/islamic-stories-seed.ts:555` |
| `src/lib/islamic-stories-seed.ts` | 1158 | `repo:src/lib/islamic-stories-seed.ts:1158` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 3257 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:3257` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 3586 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:3586` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 7877 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:7877` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 7878 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:7878` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 10032 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:10032` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 10039 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:10039` |
| `src/lib/rulings-encyclopedia-seed.generated.ts` | 10048 | `repo:src/lib/rulings-encyclopedia-seed.generated.ts:10048` |
| `src/lib/prophetic-medicine-seed.ts` | 175 | `repo:src/lib/prophetic-medicine-seed.ts:175` |
| `data/rulings-encyclopedia/curriculum-topics.json` | 1068 | `repo:data/rulings-encyclopedia/curriculum-topics.json:1068` |
| `data/rulings-encyclopedia/curriculum-topics.json` | 1069 | `repo:data/rulings-encyclopedia/curriculum-topics.json:1069` |

## SUSPECT_TEXT

لا مواضع SUSPECT_TEXT متبقية في نسبة الأحاديث بعد تنقية إنذارات اللاتيني الكاذبة (مفاتيح JSON / نقحرة علمية غير نبوية).
المواضع الأربعة المنهجية المرصودة سابقاً: **عُزلت في عمل سابق** — لا إعادة تصحيح.
