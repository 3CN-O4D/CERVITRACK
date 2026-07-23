import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, specialization, hospital, county, bio, years_experience } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'action must be approve or reject' }, { status: 400 });
    }

    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      if (specialization) updateData.specialization = specialization;
      if (hospital) updateData.hospital = hospital;
      if (county) updateData.county = county;
      if (bio) updateData.bio = bio;
      if (years_experience) updateData.years_experience = years_experience;
    }

    const { data, error } = await supabaseAdmin
      .from('providers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
