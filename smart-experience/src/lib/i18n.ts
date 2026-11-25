import { useCtx } from './session'

const d = {
  craving: ["What's your craving today?", 'شو نفسك فيه اليوم؟'],
  viewMenu: ['View menu', 'عرض القائمة'],
  callStaff: ['Call staff', 'نادِ الموظف'], readyPay: ['Ready to pay', 'جاهز للدفع'],
  googleReview: ['Google review', 'تقييم جوجل'], feedback: ['Anonymous feedback', 'ملاحظات بدون اسم'],
  loyaltyCard: ['My loyalty card', 'بطاقة الولاء'], offers: ["Today's offers", 'عروض اليوم'],
  wifi: ['Connect to Wi-Fi', 'اتصل بالواي فاي'], whatsapp: ['WhatsApp us', 'راسلنا واتساب'], website: ['Official website', 'الموقع الرسمي'], call: ['Call', 'اتصال'],
  home: ['Home', 'الرئيسية'], menu: ['Menu', 'القائمة'],
  branch: ['Branch', 'الفرع'], chooseBranch: ['Which Tea Town are you at?', 'في أي فرع من تي تاون أنت؟'],
  offlineSaved: ['Menu saved for offline use', 'تم حفظ القائمة للاستخدام بدون إنترنت'], savingOffline: ['Saving menu for offline use…', 'جارٍ حفظ القائمة…'],
  offline: ['You are offline', 'أنت غير متصل'],
  notDelivered: ['You are offline, so this request could NOT be delivered. Please wave to a staff member, or try again once connected.', 'أنت غير متصل، لذلك لم يتم إرسال الطلب. لوّح للموظف أو حاول مرة أخرى بعد الاتصال.'],
  search: ['Search the menu', 'ابحث في القائمة'], all: ['All', 'الكل'],
  catalogue: ['Search menu', 'البحث في القائمة'], menuBook: ['Menu book', 'كتيب القائمة'], askPrice: ['Price at counter', 'السعر عند الكاشير'],
  vehicleColour: ['Car colour', 'لون السيارة'], vehicleModel: ['Car model / description', 'موديل أو وصف السيارة'], zoneRef: ['Zone or order ref (optional)', 'المنطقة أو رقم الطلب (اختياري)'],
  send: ['Send', 'إرسال'], sending: ['Sending…', 'جارٍ الإرسال…'],
  sent: ['Sent. Staff have been notified.', 'تم الإرسال. تم إبلاغ الموظفين.'], acked: ['A staff member is on the way.', 'الموظف في الطريق إليك.'], done: ['Completed. Thank you!', 'تم. شكراً لك!'],
  cancelReq: ['Cancel request', 'إلغاء الطلب'],
  fbTitle: ['Tell us privately', 'أخبرنا بشكل خاص'], fbSub: ['Anonymous. Goes only to Tea Town management.', 'بدون اسم. تصل فقط لإدارة تي تاون.'],
  overall: ['Overall rating', 'التقييم العام'], food: ['Food quality', 'جودة الطعام'], taste: ['Taste', 'الطعم'], waiting: ['Waiting time', 'وقت الانتظار'], staff: ['Staff service', 'خدمة الموظفين'], value: ['Value for money', 'القيمة مقابل السعر'],
  comment: ['Comment (optional)', 'تعليق (اختياري)'], submitFb: ['Send feedback', 'أرسل الملاحظات'], fbThanks: ['Thank you. Management has received your feedback.', 'شكراً. وصلت ملاحظاتك للإدارة.'],
  reviewTitle: ['Loved our food? Leave us a quick review.', 'عجبك أكلنا؟ اترك لنا تقييم سريع.'],
  joinTitle: ['Join Tea Town Rewards', 'انضم لمكافآت تي تاون'], join: ['Join free', 'انضم مجاناً'], stamps: ['Stamps', 'الطوابع'],
  showStaff: ['Show this code to staff after you pay', 'اعرض هذا الرمز للموظف بعد الدفع'], rewardReady: ['Reward ready! Show staff to redeem.', 'المكافأة جاهزة! اعرضها للموظف.'],
  noData: ['No mobile data? Connect to our Wi-Fi.', 'ما عندك إنترنت؟ اتصل بالواي فاي.'], openMenu: ['Open menu', 'افتح القائمة'], copy: ['Copy password', 'نسخ كلمة المرور'], copied: ['Copied', 'تم النسخ'],
  language: ['العربية', 'English'], noOffers: ['No offers today. Check back soon!', 'لا توجد عروض اليوم.'],
} as const
export type TKey = keyof typeof d
export const tr = (k: TKey, lang: 'en' | 'ar') => d[k][lang === 'ar' ? 1 : 0] || d[k][0]
export function useT() { const { lang } = useCtx(); return Object.assign((k: TKey) => tr(k, lang), { lang }) }
