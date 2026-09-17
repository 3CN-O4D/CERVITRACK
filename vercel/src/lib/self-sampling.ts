export const VIABILITY_DAYS = 25;

export const VIDEO_URL =
  'https://www.youtube.com/embed/njsHSnDGcDk?autoplay=0&modestbranding=1&rel=0';

export interface SamplingStep {
  number: number;
  title: string;
  instruction: string;
  doList: string[];
  dontList: string[];
  why: string;
  expected: string;
  normal: string;
}

export const STEPS: SamplingStep[] = [
  {
    number: 1,
    title: 'Wash Your Hands',
    instruction:
      'Wash your hands thoroughly with soap and warm water for at least 20 seconds, then dry them with a clean towel.',
    doList: ['Wash before and after handling the kit', 'Dry hands with a clean, single-use towel'],
    dontList: ['Do not use hand sanitiser in place of washing', 'Do not touch the swab tip after washing'],
    why: 'Clean hands stop germs and dirt contaminating the sample, which could cause an inconclusive result.',
    expected: 'It takes about 20 seconds — roughly the time to sing "Happy Birthday" twice.',
    normal: 'Slightly soapy or wet hands are fine; just make sure they are dry before touching the kit.',
  },
  {
    number: 2,
    title: 'Open the Kit',
    instruction:
      'Open the kit carefully without touching the swab tip. Remove the collection tube and swab and place them on a clean, dry surface.',
    doList: ['Place all components on a clean, dry surface', 'Hold the swab by the handle end only'],
    dontList: ['Do not touch the swab tip or the inside of the tube', 'Do not let the swab rest on any surface'],
    why: 'The swab tip and tube interior must stay sterile — touching them introduces contamination.',
    expected: 'You should see a swab, a collection tube with cap, a label, and a biohazard bag.',
    normal: 'A faint plastic smell when opening is harmless.',
  },
  {
    number: 3,
    title: 'Insert the Swab',
    instruction:
      'Stand with feet apart and knees slightly bent. Gently insert the swab into the vagina about 2-3 inches (5-7 cm), angling slightly toward your lower back.',
    doList: ['Relax your muscles and breathe deeply', 'Angle the swab gently toward your lower back'],
    dontList: ['Do not force the swab', 'Do not insert into the urethra or rectum'],
    why: 'Correct depth and angle allow the swab to reach the cells where HPV is detected.',
    expected: 'Mild pressure or a tickling sensation is normal.',
    normal: 'Light spotting is uncommon but not dangerous; it should stop on its own.',
  },
  {
    number: 4,
    title: 'Rotate the Swab',
    instruction:
      'Rotate the swab gently in a circular motion for 15-30 seconds, ensuring it contacts the vaginal walls.',
    doList: ['Count to 20 slowly while rotating', 'Keep the motion gentle and steady'],
    dontList: ['Do not scrub hard or move the swab in and out repeatedly'],
    why: 'Rotating collects enough cells for an accurate molecular test.',
    expected: 'You may feel slight friction as the swab turns.',
    normal: 'No pain is expected; stop if you feel sharp pain and contact your clinician.',
  },
  {
    number: 5,
    title: 'Place in the Collection Tube',
    instruction:
      'Withdraw the swab without touching anything else. Place the swab tip-first into the tube, then snap or cut the handle at the marked line so the tube can be sealed.',
    doList: ['Hold the tube steady on a flat surface', 'Make sure the swab tip is fully inside the tube'],
    dontList: ['Do not touch the swab tip on the tube rim', 'Do not spill the transport liquid'],
    why: 'The tube protects and preserves the sample until it reaches the lab.',
    expected: 'The swab should sit fully inside with the break line at the tube opening.',
    normal: 'A small amount of liquid on the tube threads is fine; wipe with the provided tissue.',
  },
  {
    number: 6,
    title: 'Seal and Label',
    instruction:
      'Tightly close the cap, write your patient code on the label, attach the label to the tube, then place the tube in the biohazard bag and seal it.',
    doList: ['Double-check your patient code is correct and legible', 'Seal the biohazard bag fully'],
    dontList: ['Do not write over the patient code', 'Do not leave the bag open or overfilled'],
    why: 'Correct labelling links the sample to you; sealing protects handlers and the sample.',
    expected: 'After sealing, the tube should not leak when held upside down.',
    normal: 'Minor condensation inside the bag is normal.',
  },
];

export const CHECKLIST_ITEMS = [
  { key: 'hands', label: 'I washed and dried my hands before and after sampling' },
  { key: 'sterile', label: 'I did not touch the swab tip or the inside of the tube' },
  { key: 'swab_tube', label: 'The swab was placed correctly in the collection tube' },
  { key: 'cap_sealed', label: 'The tube cap is sealed tightly — no leaks' },
  { key: 'no_spillage', label: 'There was no spillage during the process' },
  { key: 'labeled', label: 'The tube is labelled with my patient code' },
  { key: 'hazard_bag', label: 'The tube is inside the biohazard bag' },
  { key: 'bag_sealed', label: 'The biohazard bag is sealed properly' },
  { key: 'waste', label: 'I disposed of packaging safely and washed my hands again' },
];

export const FAQS = [
  {
    q: 'How long does self-sampling take?',
    a: 'The entire process takes about 5-10 minutes from opening the kit to sealing the tube.',
  },
  {
    q: 'Is self-sampling painful?',
    a: 'No, self-sampling is generally painless. You may feel mild pressure but it should not cause pain.',
  },
  {
    q: 'When will I get my results?',
    a: 'Your sample goes to a laboratory for a molecular test. Results are typically available within 2-4 weeks and appear in My Results once the lab releases them.',
  },
  {
    q: 'Can I do self-sampling during my period?',
    a: 'It is best to avoid self-sampling during menstruation. Wait until at least 3-5 days after your period has ended.',
  },
  {
    q: 'How accurate is self-sampling?',
    a: 'Self-collected samples tested in a laboratory have accuracy comparable to samples collected by a clinician, with 96-99% sensitivity for detecting high-risk HPV.',
  },
];
