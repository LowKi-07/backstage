import { AppState, AuditEntry, Department, Expense, ExpenseStatus, User } from '../types';
import { toISODate } from '../utils/format';

export const STATE_VERSION = 1;

const DAY = 86400000;
const daysAgo = (n: number, hour = 11) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, 15, 0, 0);
  return d;
};

const users: User[] = [
  { id: 'p1', name: 'Ananya Rao', role: 'producer', title: 'Producer', phone: '+91 98450 11001', departmentIds: [] },
  { id: 'm1', name: 'Vikram Iyer', role: 'manager', title: 'Production Manager – Art & Costume', phone: '+91 98450 22001', departmentIds: ['art', 'costume'] },
  { id: 'm2', name: 'Meera Nair', role: 'manager', title: 'Unit Manager – Catering & Transport', phone: '+91 98450 22002', departmentIds: ['catering', 'transport'] },
  { id: 'm3', name: 'Rahul Menon', role: 'manager', title: 'Line Producer – Camera, Makeup & Locations', phone: '+91 98450 22003', departmentIds: ['camera', 'makeup', 'locations'] },
  { id: 'c1', name: 'Arjun Kumar', role: 'crew', title: 'Art Assistant', phone: '+91 90000 33001', departmentIds: ['art'] },
  { id: 'c2', name: 'Priya Shankar', role: 'crew', title: 'Costume Assistant', phone: '+91 90000 33002', departmentIds: ['costume'] },
  { id: 'c3', name: 'Karthik Raj', role: 'crew', title: 'Unit Driver', phone: '+91 90000 33003', departmentIds: ['transport'] },
  { id: 'c4', name: 'Divya Menon', role: 'crew', title: 'Catering Coordinator', phone: '+91 90000 33004', departmentIds: ['catering'] },
  { id: 'c5', name: 'Sameer Joshi', role: 'crew', title: 'Focus Puller', phone: '+91 90000 33005', departmentIds: ['camera'] },
  { id: 'c6', name: 'Nisha Pillai', role: 'crew', title: 'Makeup Artist', phone: '+91 90000 33006', departmentIds: ['makeup'] },
];

const departments: Department[] = [
  { id: 'art', name: 'Art', icon: 'color-palette-outline', budget: 6000000, managerId: 'm1' },
  { id: 'costume', name: 'Costume', icon: 'shirt-outline', budget: 3500000, managerId: 'm1' },
  { id: 'catering', name: 'Catering', icon: 'restaurant-outline', budget: 4000000, managerId: 'm2' },
  { id: 'transport', name: 'Transport', icon: 'car-outline', budget: 4500000, managerId: 'm2' },
  { id: 'camera', name: 'Camera & Lighting', icon: 'videocam-outline', budget: 9000000, managerId: 'm3' },
  { id: 'makeup', name: 'Makeup & Hair', icon: 'brush-outline', budget: 1500000, managerId: 'm3' },
  { id: 'locations', name: 'Locations', icon: 'location-outline', budget: 5500000, managerId: 'm3' },
];

type SeedRow = [
  id: string,
  userId: string,
  dept: string,
  amount: number,
  category: string,
  description: string,
  vendor: string | undefined,
  ago: number,
  status: ExpenseStatus,
];

// Pre-booked big-ticket spends (vendor advances etc.) plus daily crew expenses.
const rows: SeedRow[] = [
  ['e01', 'm1', 'art', 1850000, 'Props & Materials', 'Set construction – haveli interior (advance 1 of 2)', 'Sri Balaji Set Works', 28, 'paid'],
  ['e02', 'm3', 'camera', 2400000, 'Equipment Rental', 'ARRI Alexa 35 package – 30 day rental', 'Prime Focus Rentals', 27, 'paid'],
  ['e03', 'm3', 'locations', 1600000, 'Location Fees', 'Fort Kochi heritage bungalow – 12 days', 'Kochi Heritage Stays', 26, 'paid'],
  ['e04', 'm2', 'catering', 950000, 'Food & Catering', 'Unit catering contract – first fortnight', 'Annapoorna Caterers', 25, 'paid'],
  ['e05', 'm2', 'transport', 780000, 'Transport', 'Caravan + 6 Innova hire – first fortnight', 'Kerala Travels', 25, 'paid'],
  ['e06', 'm1', 'costume', 620000, 'Costume & Fabric', 'Period sarees & fabric procurement', 'Kanchi Silks', 22, 'paid'],
  ['e07', 'm3', 'makeup', 210000, 'Makeup Supplies', 'Prosthetics & SFX makeup kit', 'Mumbai FX Studio', 21, 'paid'],
  ['e08', 'c1', 'art', 4800, 'Props & Materials', 'Brass lamps and props from Jew Town market', 'Cochin Antiques', 18, 'paid'],
  ['e09', 'c3', 'transport', 6200, 'Fuel', 'Diesel – unit vehicle KL-07-BX-4411', 'IndianOil Ernakulam', 17, 'paid'],
  ['e10', 'c4', 'catering', 12500, 'Food & Catering', 'Extra breakfast for 80 junior artists', 'Hotel Saravana', 16, 'paid'],
  ['e11', 'c5', 'camera', 3400, 'Equipment Rental', 'Additional V-mount batteries (2 days)', 'Lens Hub Kochi', 15, 'paid'],
  ['e12', 'c2', 'costume', 8900, 'Costume & Fabric', 'Tailoring alterations – lead cast', 'Lakshmi Tailors', 14, 'approved'],
  ['e13', 'c6', 'makeup', 2750, 'Makeup Supplies', 'Setting spray, wipes, cotton', 'Nykaa Store', 12, 'paid'],
  ['e14', 'm3', 'locations', 1450000, 'Location Fees', 'Backwater houseboat + jetty permissions', 'Alleppey Boat Owners Assn', 11, 'approved'],
  ['e15', 'c3', 'transport', 5400, 'Fuel', 'Diesel – generator van', 'HP Petrol Pump Aluva', 10, 'approved'],
  ['e16', 'c1', 'art', 32000, 'Props & Materials', 'Antique furniture rental – 10 days', 'Mattancherry Antiques', 9, 'escalated'],
  ['e17', 'c4', 'catering', 7800, 'Food & Catering', 'Evening snacks & tea – night shoot', 'Ramu Tea Stall', 8, 'approved'],
  ['e18', 'c5', 'camera', 18500, 'Equipment Rental', 'Drone operator + DJI Inspire (1 day)', 'SkyEye Aerials', 7, 'approved'],
  ['e19', 'c2', 'costume', 1200, 'Miscellaneous', 'Safety pins, threads, buttons', undefined, 6, 'rejected'],
  ['e20', 'c6', 'makeup', 4100, 'Makeup Supplies', 'Wig styling products', 'Lakme Salon Supply', 5, 'approved'],
  ['e21', 'c3', 'transport', 1850, 'Transport', 'Toll + parking – Kochi to Alleppey', undefined, 4, 'submitted'],
  ['e22', 'c1', 'art', 2650, 'Printing & Stationery', 'Signage printing for market set', 'Speed Prints', 3, 'submitted'],
  ['e23', 'c4', 'catering', 46000, 'Food & Catering', 'Wedding sequence – lunch for 300 extras', 'Annapoorna Caterers', 3, 'submitted'],
  ['e24', 'c5', 'camera', 6800, 'Accommodation', 'Room for camera assistants – late wrap', 'Hotel Abad Plaza', 2, 'submitted'],
  ['e25', 'c2', 'costume', 3600, 'Costume & Fabric', 'Dry cleaning – 24 costumes', 'Fabricare Laundry', 1, 'submitted'],
  ['e26', 'c6', 'makeup', 950, 'Transport', 'Auto fare to pick up wig from salon', undefined, 1, 'submitted'],
  ['e27', 'c3', 'transport', 6600, 'Fuel', 'Diesel – unit vehicle KL-07-BX-4411', 'IndianOil Ernakulam', 0, 'submitted'],
];

function buildHistory(e: SeedRow, dept: Department, submittedAt: Date): AuditEntry[] {
  const [, userId, , , , , , , status] = e;
  const h: AuditEntry[] = [{ at: submittedAt.toISOString(), byUserId: userId, action: 'submitted' }];
  const t = (hours: number) => new Date(submittedAt.getTime() + hours * 3600000).toISOString();
  const selfSubmitted = userId === dept.managerId;
  if (status === 'escalated') {
    h.push({ at: t(5), byUserId: dept.managerId, action: 'escalated', note: 'Above ₹25K threshold – needs producer sign-off' });
  }
  if (status === 'rejected') {
    h.push({ at: t(4), byUserId: dept.managerId, action: 'rejected', note: 'Covered under petty cash already issued' });
  }
  if (status === 'approved' || status === 'paid') {
    if (selfSubmitted) {
      h.push({ at: t(3), byUserId: 'p1', action: 'approved', note: 'Approved as per budget sheet' });
    } else {
      h.push({ at: t(4), byUserId: dept.managerId, action: 'approved' });
    }
  }
  if (status === 'paid') {
    h.push({ at: t(30), byUserId: 'p1', action: 'paid', note: 'NEFT batch' });
  }
  return h;
}

export function createSeedState(): AppState {
  const start = daysAgo(30);
  const end = new Date(Date.now() + 60 * DAY);
  const expenses: Expense[] = rows.map((row) => {
    const [id, userId, deptId, amount, category, description, vendor, ago, status] = row;
    const dept = departments.find((d) => d.id === deptId)!;
    const at = daysAgo(ago, 9 + (amount % 9));
    return {
      id,
      userId,
      departmentId: deptId,
      amount,
      category,
      description,
      vendor,
      date: toISODate(at),
      status,
      createdAt: at.toISOString(),
      history: buildHistory(row, dept, at),
    };
  });

  return {
    version: STATE_VERSION,
    currentUserId: null,
    project: {
      id: 'proj1',
      name: 'Monsoon Diaries',
      kind: 'Feature Film',
      startDate: toISODate(start),
      endDate: toISODate(end),
      totalBudget: 45000000,
      escalationThreshold: 25000,
    },
    users,
    departments,
    expenses,
    budgetRequests: [
      {
        id: 'br1',
        departmentId: 'makeup',
        requestedBy: 'm3',
        amount: 250000,
        reason: 'Two additional prosthetic looks added for the climax after script revision.',
        status: 'pending',
        createdAt: daysAgo(2).toISOString(),
      },
      {
        id: 'br2',
        departmentId: 'transport',
        requestedBy: 'm2',
        amount: 400000,
        reason: 'Schedule extended by 6 days – vehicle hire and fuel.',
        status: 'approved',
        createdAt: daysAgo(12).toISOString(),
        decidedAt: daysAgo(11).toISOString(),
        decidedBy: 'p1',
        note: 'Approved from contingency.',
      },
    ],
  };
}
