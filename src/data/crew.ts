// Crew directory for the manager's Projects › Crew tab: everyone on the unit, grouped by department,
// with the biodata shown on their detail page. Ids c1–c6 match the app's demo users (so their tasks
// and bills show up); the rest are directory-only.
export interface CrewProfile {
  id: string;
  name: string;
  title: string;
  dept: string;
  phone: string;
  email: string;
  city: string;
  joined: string;
  experience: string;
  languages: string;
  emergency: string;
  bank: string;
}

export const CREW_DEPARTMENTS = ['Camera', 'Editing', 'Art', 'Costume', 'Makeup & Hair', 'Catering', 'Transport', 'Sound'];

const p = (id: string, name: string, title: string, dept: string, city: string, joined: string, experience: string, languages: string, emergency: string, bank: string): CrewProfile => ({
  id,
  name,
  title,
  dept,
  phone: '',
  email: `${name.split(' ')[0].toLowerCase()}@crew.backstage.app`,
  city,
  joined,
  experience,
  languages,
  emergency,
  bank,
});

const ROSTER: CrewProfile[] = [
  p('c5', 'Sameer Joshi', 'Focus Puller', 'Camera', 'Mumbai', '12 Sep 2026', '9 years', 'Hindi, English, Marathi', 'Riya Joshi (spouse)', 'HDFC ••4410'),
  p('r1', 'Anand Krishnan', 'Camera Operator', 'Camera', 'Chennai', '10 Sep 2026', '12 years', 'Tamil, English', 'K. Lakshmi (mother)', 'ICICI ••2207'),
  p('r2', 'Fathima Rasheed', 'DIT', 'Camera', 'Kochi', '15 Sep 2026', '5 years', 'Malayalam, English', 'Rasheed P. (father)', 'SBI ••9031'),
  p('r3', 'Joel Mathew', 'Editor', 'Editing', 'Kochi', '20 Sep 2026', '8 years', 'Malayalam, English', 'Ann Mathew (sister)', 'Federal ••1180'),
  p('r4', 'Sneha Kulkarni', 'Assistant Editor', 'Editing', 'Pune', '1 Oct 2026', '3 years', 'Marathi, Hindi, English', 'Vivek K. (brother)', 'Axis ••5562'),
  p('c1', 'Arjun Kumar', 'Art Assistant', 'Art', 'Bengaluru', '5 Sep 2026', '4 years', 'Kannada, Tamil, English', 'Meena Kumar (mother)', 'HDFC ••7721'),
  p('r5', 'Ravi Shetty', 'Set Carpenter', 'Art', 'Udupi', '8 Sep 2026', '15 years', 'Tulu, Kannada', 'Shobha Shetty (spouse)', 'Canara ••3349'),
  p('c2', 'Priya Shankar', 'Costume Assistant', 'Costume', 'Chennai', '6 Sep 2026', '3 years', 'Tamil, English', 'Shankar R. (father)', 'ICICI ••6612'),
  p('c6', 'Nisha Pillai', 'Makeup Artist', 'Makeup & Hair', 'Kochi', '9 Sep 2026', '7 years', 'Malayalam, Hindi', 'Anil Pillai (spouse)', 'SBI ••4478'),
  p('c4', 'Divya Menon', 'Catering Coordinator', 'Catering', 'Thrissur', '2 Sep 2026', '6 years', 'Malayalam, English', 'Hari Menon (brother)', 'Federal ••2290'),
  p('r6', 'Anu Joseph', 'Cook', 'Catering', 'Kottayam', '3 Sep 2026', '10 years', 'Malayalam', 'Joseph T. (father)', 'SBI ••8803'),
  p('c3', 'Karthik Raj', 'Unit Driver', 'Transport', 'Kochi', '1 Sep 2026', '11 years', 'Malayalam, Tamil', 'Revathi Raj (spouse)', 'Canara ••1067'),
  p('r7', 'Sanjay P', 'Transport Captain', 'Transport', 'Aluva', '1 Sep 2026', '14 years', 'Malayalam, Hindi', 'Latha P. (spouse)', 'Axis ••7745'),
  p('r8', 'Imran Sheikh', 'Sound Recordist', 'Sound', 'Hyderabad', '14 Sep 2026', '9 years', 'Urdu, Telugu, English', 'Sana Sheikh (spouse)', 'HDFC ••3381'),
];

export const CREW_DIRECTORY: CrewProfile[] = ROSTER.map((c, i) => ({ ...c, phone: `+91 94470 ${String(21034 + i * 1373).slice(-5)}` }));

export const crewProfile = (id: string) => CREW_DIRECTORY.find((c) => c.id === id);
