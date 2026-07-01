/**
 * قائمة مشايخ الكويت المتحقَّق منهم من موقع drosq8.com
 * المصدر: drosq8.com — موقع دروس الكويت
 */

export type KuwaitSheikh = {
  id: string;
  name: string;
  specialty: string;
  drosq8Url: string;
  twitterHandle?: string;
};

export const KUWAIT_SHEIKHS: KuwaitSheikh[] = [
  {
    id: "salem-altuwail",
    name: "سالم بن سعد الطويل",
    specialty: "إمام ومتحدث معتمد — وزارة الأوقاف الكويتية",
    drosq8Url: "https://drosq8.com/cat/223",
  },
  {
    id: "fahad-altuwail",
    name: "فهد بن سالم الطويل",
    specialty: "داعية — دروس في العقيدة والفقه",
    drosq8Url: "https://drosq8.com/cat/id/484",
  },
  {
    id: "mohammed-taheri",
    name: "محمد هشام طاهري",
    specialty: "داعية — دروس في الكويت",
    drosq8Url: "https://drosq8.com/cat/id/221",
  },
  {
    id: "abdullah-alubaid",
    name: "عبدالله بن صالح العبيد",
    specialty: "داعية — دروس في العلوم الشرعية",
    drosq8Url: "https://drosq8.com/cat/1549",
  },
  {
    id: "nayef-alajmi",
    name: "نايف العجمي",
    specialty: "دكتور وعالم ديني كويتي",
    drosq8Url: "https://drosq8.com",
    twitterHandle: "Dralajmey",
  },
  {
    id: "adel-alanjari",
    name: "عادل العنجري",
    specialty: "داعية كويتي",
    drosq8Url: "https://drosq8.com",
    twitterHandle: "alanjerim",
  },
];
