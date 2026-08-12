-- بيانات أولية حقيقية مستخرجة من نموذجك الحالي
-- شغّلها بعد 01_schema.sql

-- المشايخ (من قسم التسميع)
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الشيخ ناصر العنزي', 'إجازة متصلة السند برواية حفص عن عاصم', array['تصحيح التلاوة والتجويد للمبتدئين'], 'العاصمة', 12, true);
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الشيخ بدر الرشيدي', 'إجازة بالقراءات العشر الصغرى', array['متابعة الحفظ المنتظم لكبار وصغار'], 'حولي', 18, true);
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الداعية منى الفضلي', 'إجازة متصلة السند برواية حفص عن عاصم', array['تسميع النساء والأطفال'], 'الفروانية', 10, true);
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الشيخ فهد العجمي', 'إجازة برواية حفص وقالون', array['تصحيح التلاوة لكبار السن والمبتدئين'], 'الجهراء', 15, true);
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الشيخ سالم الخالدي', 'إجازة بالقراءات السبع', array['تأهيل الحفظة للمسابقات القرآنية'], 'الأحمدي', 20, true);
insert into sheikhs (name, ijazah, specialties, city, years_experience, is_verified) values ('الداعية عائشة المري', 'إجازة متصلة السند برواية حفص عن عاصم', array['تسميع نسائي بمتابعة أسبوعية'], 'مبارك الكبير', 8, true);

-- الفوائد الأولية (معتمدة)
insert into fawaid (text, status) values ('تبسمك في وجه أخيك صدقة، وكلمة طيبة تقولها لمن حولك قد تكون أثقل في الميزان مما تظن.', 'approved');
insert into fawaid (text, status) values ('الإخلاص هو سر قبول الأعمال؛ فالعمل القليل بإخلاص خير من الكثير الذي يخالطه الرياء.', 'approved');
insert into fawaid (text, status) values ('من أعظم أبواب الشكر: أن ترى نعمة الله عليك في أصغر التفاصيل، لا فقط في الأحداث الكبيرة.', 'approved');
insert into fawaid (text, status) values ('بر الوالدين لا يتوقف عند سن معينة؛ فكلما تقدما في العمر ازدادت حاجتهما لرفقك وحسن معاملتك.', 'approved');
insert into fawaid (text, status) values ('أحب الأعمال إلى الله أدومها وإن قل، فاحرص على عمل صالح تواظب عليه ولو كان يسيرًا.', 'approved');
insert into fawaid (text, status) values ('حفظ اللسان من أعظم أسباب السلامة؛ فكثير من الخصومات سببها كلمة لم يكن هناك داعٍ لقولها.', 'approved');