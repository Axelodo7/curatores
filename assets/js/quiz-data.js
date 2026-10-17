/*
  Capitulum I quiz. Wrap Latin in *asterisks* to set it in italics.
  `answer` is the index of the correct option.
*/
(function (root, data) {
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.CURATORES_QUIZ = data;
})(typeof self !== 'undefined' ? self : this, Object.freeze([
  {
    prompt: 'What does *puella* mean?',
    options: ['Mother', 'Girl', 'Boy', 'Father'],
    answer: 1,
    note: '*Puella* means girl. The word for boy is *puer*.'
  },
  {
    prompt: 'What does *pater* mean?',
    options: ['Brother', 'Mother', 'Father', 'Boy'],
    answer: 2,
    note: '*Pater* is father, as in paternal. Mother is *mater*.'
  },
  {
    prompt: 'Which word means happy?',
    options: ['*Iratus*', '*Laetus*', '*Tristis*', '*Puer*'],
    answer: 1,
    note: '*Laetus* is happy. *Iratus* is angry and *tristis* is sad.'
  },
  {
    prompt: 'When would you say *Valete!*?',
    options: ['Greeting one person', 'Greeting a group', 'Saying goodbye to one person', 'Saying goodbye to a group'],
    answer: 3,
    note: '*Vale* says goodbye to one person; *valete* says it to more than one.'
  },
  {
    prompt: 'What does *videt* mean?',
    options: ['Hears', 'Sleeps', 'Comes', 'Sees'],
    answer: 3,
    note: '*Videt* means sees. The English word video comes from the same verb.'
  },
  {
    prompt: 'Which verb means laughs?',
    options: ['*Plorat*', '*Discedit*', '*Ridet*', '*Pulsat*'],
    answer: 2,
    note: '*Ridet* means laughs, as in ridiculous. *Plorat* means cries.'
  },
  {
    prompt: 'Which case marks the subject of a sentence?',
    options: ['Nominative', 'Accusative', 'Genitive', 'Dative'],
    answer: 0,
    note: 'The nominative names the subject: *Puella ridet*, the girl laughs.'
  },
  {
    prompt: 'Which case shows possession?',
    options: ['Ablative', 'Vocative', 'Genitive', 'Accusative'],
    answer: 2,
    note: 'The genitive shows possession: *mater puellae*, the girl’s mother.'
  },
  {
    prompt: 'In *Pater puellam videt*, why does *puella* end in -am?',
    options: ['It is the subject', 'It is the direct object', 'It shows possession', 'Someone is speaking to her'],
    answer: 1,
    note: 'The -am ending marks the accusative, the direct object: the father sees the girl.'
  },
  {
    prompt: 'Which case do you use to speak directly to someone?',
    options: ['Locative', 'Dative', 'Nominative', 'Vocative'],
    answer: 3,
    note: 'The vocative is for direct address: *Salve, puella!*'
  },
  {
    prompt: '*Oculus* gives English the word ocular. What does *oculus* mean?',
    options: ['Ear', 'Hand', 'Eye', 'Arm'],
    answer: 2,
    note: '*Oculus* is eye, which is why binoculars are for both eyes.'
  },
  {
    prompt: 'What does *cerebrum* mean?',
    options: ['Heart', 'Bone', 'Lung', 'Brain'],
    answer: 3,
    note: '*Cerebrum* is brain, as in cerebral.'
  },
  {
    prompt: 'A subpoena orders someone to appear in court. What does *sub poena* mean?',
    options: ['In good faith', 'For the good', 'Under penalty', 'From the fact'],
    answer: 2,
    note: '*Sub poena* means under penalty: ignore the order and you face one.'
  },
  {
    prompt: 'A lawyer working *pro bono* is working…',
    options: ['For free', 'For a fee', 'Under oath', 'Out of court'],
    answer: 0,
    note: '*Pro bono* means for the good: legal work done without charge.'
  },
  {
    prompt: 'In *Tyrannosaurus rex*, what does *rex* mean?',
    options: ['Lizard', 'King', 'Tyrant', 'Tooth'],
    answer: 1,
    note: '*Rex* is Latin for king. Tyrannosaurus is Greek for tyrant lizard.'
  }
]));
