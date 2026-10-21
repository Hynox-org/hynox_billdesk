export interface BusinessTypeItem {
  id: string;
  name: string;
  description: string;
}

export const BUSINESS_TYPES: BusinessTypeItem[] = [
  {
    id: 'retail_shops',
    name: 'Retail shops',
    description: 'Quick counter billing for everyday products.',
  },
  {
    id: 'grocery_stores',
    name: 'Grocery stores',
    description: 'Bill multiple items and share receipts digitally.',
  },
  {
    id: 'tea_shops',
    name: 'Tea shops',
    description: 'Fast billing for small, frequent orders.',
  },
  {
    id: 'cafes_coffee_shops',
    name: 'Cafés & coffee shops',
    description: 'Keep the counter moving during busy hours.',
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    description: 'Simple bills with applicable taxes and totals.',
  },
  {
    id: 'bakeries',
    name: 'Bakeries',
    description: 'Bill fresh items without a printer queue.',
  },
  {
    id: 'food_trucks',
    name: 'Food trucks',
    description: 'Mobile billing that travels with you.',
  },
  {
    id: 'salons_beauty',
    name: 'Salons & beauty',
    description: 'Bill services and share receipts with clients.',
  },
  {
    id: 'boutiques_clothing',
    name: 'Boutiques & clothing',
    description: 'Clean digital bills for every purchase.',
  },
  {
    id: 'electronics_mobile',
    name: 'Electronics & mobile',
    description: 'Keep purchase records easy to retrieve.',
  },
  {
    id: 'wholesale_businesses',
    name: 'Wholesale businesses',
    description: 'Organized records for larger orders.',
  },
  {
    id: 'small_service_businesses',
    name: 'Small service businesses',
    description: 'Bill on the spot after the job is done.',
  },
];

export const DEFAULT_BUSINESS_TYPE = 'Retail shops';

export function getBusinessTypeDescription(name?: string): string {
  if (!name) return 'Quick counter billing for everyday products.';
  const found = BUSINESS_TYPES.find(
    (b) => b.name.toLowerCase() === name.toLowerCase() || b.id === name.toLowerCase()
  );
  return found ? found.description : 'Digital billing and instant WhatsApp receipts.';
}
