import { NextResponse } from 'next/server';
import { openDb } from '@/../lib/db';

export async function GET() {
  try {
    const database = await openDb();
    
    // Total Counts
    const { totalHospitals } = await database.get('SELECT COUNT(*) as totalHospitals FROM hospitals');
    const { totalActivities } = await database.get('SELECT COUNT(*) as totalActivities FROM activities');
    const { totalDiscussions } = await database.get('SELECT COUNT(*) as totalDiscussions FROM discussions');

    // Activities by Person
    const activitiesData = await database.all('SELECT person, COUNT(*) as value FROM activities GROUP BY person');
    const activitiesByPerson = activitiesData.map((d: any) => ({
      name: d.person,
      value: d.value
    }));

    // Hospital Onboarding Stages
    const hospitals = await database.all('SELECT software_linkage, backend_setup, frontend_setup, training, certificate_of_compliance, subscribed_till, renewed FROM hospitals');
    
    const stageCounts: Record<string, number> = {
      'To do': 0,
      'In process': 0,
      'On hold due to technical error': 0,
      'On hold due to customer unresponsiveness': 0,
      'Completed': 0
    };

    let expiringSoonCount = 0;
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    hospitals.forEach((h: any) => {
      // Aggregate Stages
      const fields = ['software_linkage', 'backend_setup', 'frontend_setup', 'training', 'certificate_of_compliance'];
      fields.forEach(field => {
        const val = h[field];
        if (val && stageCounts[val] !== undefined) {
          stageCounts[val]++;
        }
      });

      // Renewals
      if (h.subscribed_till && h.renewed !== 'YES') {
        const subDate = new Date(h.subscribed_till);
        if (subDate <= twoWeeksFromNow) {
          expiringSoonCount++;
        }
      }
    });

    const hospitalStages = Object.keys(stageCounts).map(key => ({
      name: key,
      value: stageCounts[key]
    })).filter(s => s.value > 0);

    return NextResponse.json({
      totalHospitals,
      totalActivities,
      totalDiscussions,
      expiringSoonCount,
      activitiesByPerson,
      hospitalStages
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
