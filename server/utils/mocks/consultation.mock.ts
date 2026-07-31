export const mockConsultationNotice: ConsultationNoticeResponse = {
  items: [
    'مشاوره تنها جنبه راهنمایی دارد و جایگزین تشخیص پزشکی نیست.',
    'لطفاً پیش از مشاوره، سوابق حساسیت پوستی خود را آماده کنید.',
    'پاسخ تیم مشاوره حداکثر تا ۲۴ ساعت آینده ارسال می‌شود.',
    'اطلاعات شما صرفاً برای ارائه مشاوره دقیق‌تر استفاده خواهد شد.',
  ],
}

export const mockConsultationQuestions: ConsultationQuestionsResponse = {
  items: [
    { id: 'q1', label: 'نوع پوست شما چیست؟', required: true },
    { id: 'q2', label: 'آیا سابقه حساسیت پوستی دارید؟', required: true },
    { id: 'q3', label: 'در حال حاضر از چه محصولاتی استفاده می‌کنید؟', required: false },
    { id: 'q4', label: ' سابقه بیماری های زمینه خود را به طور خلاصه ذکر کنید. ', required: false },
  ],
}