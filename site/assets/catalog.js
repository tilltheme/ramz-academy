// أكاديمية رمـز — the memos and their parts, in one place.
// Every page (home, memos, memo) builds its lists from this file, so a new memo or a new part is one entry
// here plus its folder: memos/<slug>/part-<n>/ (index.html to read, book.html, the PDF).
// A part without `read` is listed as not yet published. Paths are relative to the site root.
// Only facts the client gave: nothing here is invented.
window.CATALOG = {
  // the academy's links — leave '' to keep a button hidden; fill a URL and its button appears everywhere
  links: {
    social: '',      // «تابع آخر أخبارنا على منصات التواصل»
    community: '',   // «انضم إلى مجتمعاتنا»
    ramzNews: '',    // «تابع آخر أخبار رمـز»
    partner: ''      // «انضم إلى رمـز كشريك تقني»
  },
  memos: [
    {
      slug: 'automation-from-zero',
      kind: 'الدليل العملي',
      title: 'أتمتة الأعمال',
      titleHl: 'من الصفر',
      short: 'مذكرة الأتمتة',
      sub: 'من المهام المتكررة إلى <b>سير عمل ذكي</b> خطوة بخطوة',
      author: 'مهجه الصبحي',
      level: 'مستوى تأسيسي',
      cover: 'memos/automation-from-zero/cover.png',
      steps: [['اكتشف', 'المهام القابلة للأتمتة'], ['صمّم', 'سير العمل بكفاءة'], ['شغّل', 'نفّذ أول أتمتة لك']],
      about: [
        'تبدأ معك من نواة الفكرة، وتمضي بك إلى أمثلة واقعية وتمارين مصمّمة بدقّة، إلى أن تبني مشروعك، وترى إلى أي مدى يأخذك في ابتكار مسارك الخاص.',
        'جمعنا لك فيها <span class="hl">زبدة المعرفة من أول سطر إلى أول مشروع عملي.</span>'
      ],
      // three parts, two or three chapters each
      parts: [
        {
          n: 1, name: 'الجزء الأول',
          chapters: ['من المهمة المتكررة إلى الأتمتة'],
          pages: 18,
          read: 'memos/automation-from-zero/part-1/index.html',
          book: 'memos/automation-from-zero/part-1/book.html',
          pdf: 'memos/automation-from-zero/part-1/automation-from-zero-part-1.pdf'
        },
        { n: 2, name: 'الجزء الثاني' },
        { n: 3, name: 'الجزء الثالث' }
      ],
      // short lines, word for word from the memo: [the line, the part to colour, where in the memo]
      quotes: [
        ['مو كل مهمة تتكرر تحتاج أتمتة!', 'تحتاج أتمتة!', 'الفصل الأول'],
        ['ليس الهدف أتمتة كل شيء، بل أتمتة ما يستحق.', 'بل أتمتة ما يستحق.', 'الفصل الأول'],
        ['لا تنتظر أن تتغير الأشياء من حولك، كن أنت القطعة التي تبدأ التغيير.', 'كن أنت القطعة التي تبدأ التغيير.', 'عبارة الفصل الأول'],
        ['بدل أن تنفّذ الخطوات المتكررة بنفسك كل مرة، تُعدّ النظام لينفّذها عنك.', 'تُعدّ النظام لينفّذها عنك.', 'الفصل الأول'],
        ['هنا لا تكتفي بما تعلمته… بل اصنع طريقك وابتكر.', 'بل اصنع طريقك وابتكر.', 'دليل التعلّم']
      ]
    }
  ]
};
