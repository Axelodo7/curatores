/*
  Capitulum II quiz. Wrap Latin in *asterisks* to set it in italics.
  `answer` is the index of the correct option. A chapter page loads one quiz
  data file, so this sets the same global as Capitulum I's.
*/
(function (root, data) {
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.CURATORES_QUIZ = data;
})(typeof self !== 'undefined' ? self : this, Object.freeze([
  {
    prompt: 'What does *mensa* mean?',
    options: ['Money', 'Daughter', 'Son', 'Table'],
    answer: 3,
    note: '*Mensa* is table. The word for money is *pecunia*.'
  },
  {
    prompt: 'Which word means money?',
    options: ['*Filia*', '*Mensa*', '*Pecunia*', '*Filius*'],
    answer: 2,
    note: '*Pecunia* is money, which is why money matters are called pecuniary.'
  },
  {
    prompt: 'What does *respondet* mean?',
    options: ['Asks', 'Beats', 'Hears', 'Answers'],
    answer: 3,
    note: '*Respondet* means answers, as in respond. Asks is *interrogat*.'
  },
  {
    prompt: 'What does *improbus* mean?',
    options: ['Wicked', 'Good', 'Large', 'Second'],
    answer: 0,
    note: '*Improbus* is the opposite of *probus*, good: disloyal, rude, morally unsound.'
  },
  {
    prompt: 'What number is *septem*?',
    options: ['Six', 'Seven', 'Eight', 'Nine'],
    answer: 1,
    note: '*Septem* is seven, VII. September was the seventh month of the early Roman year.'
  },
  {
    prompt: 'What does *cur* ask?',
    options: ['Why?', 'What?', 'Who?', 'Where?'],
    answer: 0,
    note: '*Cur* asks why. *Quid* asks what, and *quis* asks who.'
  },
  {
    prompt: 'A question that starts with *num* expects the answer…',
    options: ['Yes', 'No', 'Maybe', 'A number'],
    answer: 1,
    note: '*Num* expects no: *Num puer magnus plorat?* Surely the big boy isn’t crying?'
  },
  {
    prompt: 'A declension shows a noun’s case, its gender and its…',
    options: ['Tense', 'Number', 'Person', 'Mood'],
    answer: 1,
    note: 'Case, gender and number. Number tells you whether there is one or more than one.'
  },
  {
    prompt: 'What gender is *templum*, temple?',
    options: ['Masculine', 'Feminine', 'Neuter', 'It has none'],
    answer: 2,
    note: 'Second-declension nouns ending in -um, like *templum*, are always neuter.'
  },
  {
    prompt: 'In *Pater filiō pecuniam dat*, which word is in the dative?',
    options: ['*Pater*', '*Filiō*', '*Pecuniam*', '*Dat*'],
    answer: 1,
    note: '*Filiō* is dative: the son receives the money. *Pecuniam*, the money itself, is accusative.'
  },
  {
    prompt: 'Which form means “of the tables”?',
    options: ['*Mensae*', '*Mensās*', '*Mensārum*', '*Mensīs*'],
    answer: 2,
    note: '*Mensārum* is the genitive plural. First-declension nouns take -ārum there.'
  },
  {
    prompt: 'What does *fenestra* mean?',
    options: ['Door', 'Roof', 'Wall', 'Window'],
    answer: 3,
    note: '*Fenestra* is window, which is why architects call the arrangement of windows fenestration.'
  },
  {
    prompt: 'On an eye prescription, OD stands for *oculus dexter*. What is that?',
    options: ['The left eye', 'The right eye', 'Both eyes', 'The doctor’s orders'],
    answer: 1,
    note: '*Oculus dexter* is the right eye. *Sinister* is left and *uterque* is both.'
  },
  {
    prompt: 'What does *quid pro quo* mean?',
    options: ['This for that', 'For the good', 'To the man', 'For form'],
    answer: 0,
    note: '*Quid pro quo*, this for that: a trade between two parties.'
  },
  {
    prompt: 'In *Velociraptor*, what does *velox* mean?',
    options: ['Lizard', 'King', 'Thief', 'Swift'],
    answer: 3,
    note: '*Velox* means swift and *raptor* means thief: the swift thief.'
  }
]));
