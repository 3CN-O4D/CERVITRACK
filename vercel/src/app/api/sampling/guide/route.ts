import { NextResponse } from 'next/server';

const guide = [
  {
    step: 1,
    title: 'Prepare',
    description: 'Avoid sexual intercourse, douching, or using vaginal medications for 48 hours before your test.',
    icon: 'clipboard',
    duration: '48 hours before',
  },
  {
    step: 2,
    title: 'Visit a Facility',
    description: 'Visit any of our partner health facilities. The procedure takes about 10-15 minutes.',
    icon: 'hospital',
    duration: '10-15 min',
  },
  {
    step: 3,
    title: 'Sample Collection',
    description: 'A health worker will collect a sample from your cervix using a small brush or spatula.',
    icon: 'flask',
    duration: '2-3 min',
  },
  {
    step: 4,
    title: 'Lab Analysis',
    description: 'Your sample is sent to a laboratory for analysis. Results are typically ready within 2 weeks.',
    icon: 'microscope',
    duration: '1-2 weeks',
  },
  {
    step: 5,
    title: 'Get Results',
    description: 'Receive your results through the app. Our team will contact you if follow-up is needed.',
    icon: 'file-text',
    duration: 'Instant',
  },
];

export async function GET() {
  return NextResponse.json(guide, { status: 200 });
}
