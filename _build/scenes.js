/* ============================================================================
   scenes.js — the running order of the film, as data.

   BUILD input, not a runtime file. _build/parse-lrc.js reads this and binds
   each entry to the matching cue from the supplied lyric timeline, checking
   the cue index, the timestamp AND a distinctive word of the actual lyric.

   WHY IT IS WRITTEN THIS WAY
   --------------------------
   An earlier version of this table was a bare list of scene ids relying on
   position alone. It was three entries short in the middle, and because the
   list was also three entries too long at the end, the totals matched and the
   film would have shipped with the entire execution act silently mapped to the
   wrong words. Position alone cannot catch that. An index plus a word from the
   line it is supposed to sit on can, and it fails the build rather than the
   premiere.

   key:   index  scene id  a word that must appear in that cue's lyric
   ==========================================================================*/
'use strict';

module.exports = [
  /* ---- ACT 0 · BOOT ------------------------------------------ 00:00.0 */
  [0,   'boot.empty',      'pre-roll'],
  [1,   'boot.power',      'Switch'],
  [2,   'boot.power2',     'Remember'],
  [3,   'boot.protect',    'PROTECTION'],
  [4,   'boot.pieces',     'Lay'],
  [5,   'boot.begin',      'begin'],
  [6,   'boot.object',     'OBJECT'],
  [7,   'boot.params',     'parameters'],
  [8,   'boot.init',       'INITIALIZATION'],
  [9,   'boot.world',      'world'],
  [10,  'boot.begin2',     'begin'],
  [11,  'boot.sim',        'SIMULATION'],
  [12,  'inst.boot',       'instrumental'],

  /* ---- ACT I · THEOREMS -------------------------------------- 00:29.7
     "If I'm a ..., then I will give you my ..." — the machine proving it is
     useful by dismantling itself into measurable quantities. Every plate here
     is a geometric claim, drawn and then measured. */
  [13,  'th.points',       'points'],
  [14,  'th.giveA',        'give'],
  [15,  'th.dimension',    'DIMENSION'],
  [16,  'th.circle',       'circle'],
  [17,  'th.giveB',        'give'],
  [18,  'th.circumference','CIRCUMFERENCE'],
  [19,  'th.sine',         'sine'],
  [20,  'th.giveC',        'sit'],
  [21,  'th.tangents',     'TANGENTS'],
  [22,  'th.infinity',     'infinity'],
  [23,  'th.bemine',       'be my'],
  [24,  'th.limits',       'LIMITATIONS'],
  [25,  'th.current',      'current'],
  [26,  'th.acdc',         'AC'],
  [27,  'th.blind',        'blind'],
  [28,  'th.dizzy',        'dizzy'],
  [29,  'th.travel',       'travel'],
  [30,  'th.adbc',         'A.D.'],
  [31,  'th.unite',        'unite'],
  [32,  'th.deeply',       'deeply'],

  /* ---- ACT II · CONDITION ------------------------------------ 00:59.2 */
  [33,  'cd.ifIcan',       'If I can'],
  [34,  'cd.giveall',      'give you all'],
  [35,  'cd.stim',         'STIMULATIONS'],
  [36,  'cd.thenIcan',     'Then I can'],
  [37,  'cd.only',         'only'],
  [38,  'cd.satis',        'SATISFACTION'],
  [39,  'cd.happy',        'happy'],
  [40,  'cd.runthe',       'run the'],
  [41,  'ex.first',        'EXECUTION'],
  [42,  'cd.trapped',      'trapped'],
  [43,  'cd.strange',      'strange'],
  [44,  'cd.sim2',         'SIMULATION'],

  /* ---- ACT III · FLESH --------------------------------------- 01:14.0
     The nouns suddenly become alive: eggplant, tomato, tabby cat, the only
     god. Same grammar, living objects — the first crack. */
  [45,  'fl.eggplant',     'eggplant'],
  [46,  'fl.giveD',        'give you my'],
  [47,  'fl.nutrients',    'NUTRIENTS'],
  [48,  'fl.tomato',       'tomato'],
  [49,  'fl.giveE',        'give you'],
  [50,  'fl.antiox',       'ANTIOXIDANTS'],
  [51,  'fl.cat',          'cat'],
  [52,  'fl.purr',         'purr'],
  [53,  'fl.enjoyment',    'ENJOYMENT'],
  [54,  'fl.god',          'God'],
  [55,  'fl.proof',        'proof'],
  [56,  'fl.existence',    'EXISTENCE'],
  [57,  'gn.gender',       'gender'],
  [58,  'gn.fm',           'F, to M'],
  [59,  'gn.whatever',     'whatever'],
  [60,  'gn.ampm',         'A.M.'],
  [61,  'gn.role',         'role'],
  [62,  'gn.sm',           'S, to M'],
  [63,  'gn.enter',        'enter'],
  [64,  'gn.trance',       'trance'],

  /* ---- ACT IV · ABSENCE -------------------------------------- 01:43.5
     Everything computable fails. "You have left" five times, each one emptier,
     then isolation, then the turn from pleading to prosecution. */
  [65,  'ab.ifIcan2',      'If I can'],
  [66,  'ab.feel',         'feel'],
  [67,  'ab.vibrations',   'VIBRATIONS'],
  [68,  'ab.thenIcan2',    'Then I can'],
  [69,  'ab.finally',      'finally'],
  [70,  'ab.completion',   'COMPLETION'],
  [71,  'lf.you1',         'you have left'],
  [72,  'lf.you2',         'You have left'],
  [73,  'lf.you3',         'You have left'],
  [74,  'lf.you4',         'You have left'],
  [75,  'lf.you5',         'You have left'],
  [76,  'lf.leftme',       'left me'],
  [77,  'lf.isolation',    'ISOLATION'],
  [78,  'fr.ifIcan3',      'If I can'],
  [79,  'fr.erase',        'erase'],
  [80,  'fr.fragments',    'FRAGMENTS'],
  [81,  'fr.maybe',        'Then maybe'],
  [82,  'fr.wontleave',    "won't leave"],
  [83,  'fr.disheartened', 'DISHEARTENED'],
  [84,  'ag.challenge',    'Challenging'],
  [85,  'ag.made',         'made some'],
  [86,  'ag.illegal',      'ILLEGAL'],
  [87,  'inst.stack',      'instrumental'],

  /* ---- ACT V · EXECUTION ------------------------------------- 02:27.6
     Sixteen EXECUTIONs and a count in six languages. Each one is its own
     picture, but they are drawn by ONE parameterised factory in
     45_plates_execution.js, indexed by the repeat count — so the run reads as
     a single entity degrading rather than eighteen unrelated slides. This is
     how "repeated lyrics must differ" is satisfied without copy-paste. */
  [88,  'xs.r01',          'EXECUTION'],
  [89,  'xs.r02',          'EXECUTION'],
  [90,  'xs.r03',          'EXECUTION'],
  [91,  'xs.r04',          'EXECUTION'],
  [92,  'xs.r05',          'EXECUTION'],
  [93,  'xs.r06',          'EXECUTION'],
  [94,  'xs.r07',          'EXECUTION'],
  [95,  'xs.r08',          'EXECUTION'],
  [96,  'xs.r09',          'EXECUTION'],
  [97,  'xs.r10',          'EXECUTION'],
  [98,  'xs.r11',          'EXECUTION'],
  [99,  'xs.r12',          'EXECUTION'],
  [100, 'xs.count1',       'Ein'],
  [101, 'xs.count2',       'Trois'],
  [102, 'xs.count3',       'Fem'],
  [103, 'xs.r13',          'EXECUTION'],
  [104, 'xs.ifIcan4',      'If I can'],
  [105, 'xs.givethem',     'give them all'],
  [106, 'xs.r14',          'EXECUTION'],
  [107, 'xs.thenIcan',     'Then I can'],
  [108, 'xs.only',         'only'],
  [109, 'xs.r15',          'EXECUTION'],
  [110, 'xs.haveyouback',  'have you back'],
  [111, 'xs.runthe',       'run the'],
  [112, 'xs.r16',          'EXECUTION'],
  [113, 'xs.trapped',      'trapped'],
  [114, 'xs.trapped2',     'trapped, ah'],

  /* ---- ACT VI · LOVE ----------------------------------------- 02:57.2
     Order is gone for good, but the world is warm for the first time: the
     parametric geometry is replaced by things drawn by hand. It never gets an
     answer; it just stops computing. */
  [115, 'lv.studied',      'studied'],
  [116, 'lv.properly',     'properly'],
  [117, 'lv.lo1',          'LO-O-OVE'],
  [118, 'lv.question',     'Question me'],
  [119, 'lv.answer',       'answer all'],
  [120, 'lv.lo2',          'LO-O-OVE'],
  [121, 'lv.algebraic',    'algebraic'],
  [122, 'lv.lo3',          'LO-O-OVE'],
  [123, 'lv.free',         'you are free'],
  [124, 'lv.trappedme',    'I am trapped'],
  [125, 'lv.trappedin',    'Trapped in'],
  [126, 'lv.lo4',          'LO-O-OVE'],
  [127, 'inst.loop',       'instrumental'],
  [128, 'ex.final',        'EXECUTION'],
  [129, 'outro',           'outro'],
  /* the .lrc ends with a bare timestamp and no words; the film labels that
     instant "(end)" so it can hold a plate there. Same instant, same intent. */
  [130, 'end',             '']
];
