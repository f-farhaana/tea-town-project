// AUTO-SYNCED from the public website by scripts/sync-shared.mjs. Edit the website file, not this copy.
/**
 * Tea Town menu data — single source for website, All Items, SEO and the future QR app.
 *
 * SOURCES
 *  - 'published-menu': item names from Tea Town's published menu PDF (etisalat.adverit.com/.../Menu-1.pdf).
 *  - 'owner-brief':    products named in the client briefing (Nov 2026) but not on the older published PDF.
 * Prices are intentionally null: the published PDF's prices could not be reliably matched to items.
 * Descriptions are general (derived from the product name) until the owner approves final copy.
 * Set lastVerified + fill price/description once the owner confirms.
 */
export type CategoryId =
  | 'burgers' | 'premium-burgers' | 'shawarma' | 'wraps' | 'sandwiches' | 'clubs' | 'pasta' | 'fries'
  | 'mashed-potato' | 'paratha' | 'combos' | 'grills' | 'starters' | 'chinese' | 'salads-soups'
  | 'tea' | 'juices' | 'shakes' | 'mocktails' | 'desserts' | 'meals'

export interface MenuItem {
  id: string
  name: string
  slug: string
  category: CategoryId
  description: string
  ingredients: string[]
  image: string | null
  price: number | null
  availability: 'available' | 'unknown'
  branchAvailability: ('al-jazzat' | 'al-tarfa')[]
  mostOrdered: boolean
  customerFavourite: boolean
  mostPopular: boolean
  isNew: boolean
  source: 'published-menu' | 'owner-brief'
  lastVerified: string | null
}

export interface Category {
  id: CategoryId
  name: string
  arabic?: string
  blurb: string
  /** generic description template; {name} is replaced */
  describe: (n: string) => string
}

export const categories: Category[] = [
  { id: 'burgers', name: 'Burgers', arabic: 'برجر', blurb: 'Stacked, saucy and made to order.', describe: (n) => `${n}, served in a soft bun the Tea Town way.` },
  { id: 'premium-burgers', name: 'Premium Burgers', arabic: 'برجر مميز', blurb: 'The heavyweights of the menu.', describe: (n) => `Our premium ${n.toLowerCase()}, built big for serious cravings.` },
  { id: 'shawarma', name: 'Shawarma', arabic: 'شاورما', blurb: 'Rolled hot, every hour of the day.', describe: (n) => `${n}, freshly carved and wrapped.` },
  { id: 'wraps', name: 'Wraps & Rolls', arabic: 'راب', blurb: 'Everything good, rolled up tight.', describe: (n) => `${n}, rolled fresh and easy to eat on the go.` },
  { id: 'sandwiches', name: 'Sandwiches & Croissants', arabic: 'ساندويتش', blurb: 'Breakfast favourites to late-night bites.', describe: (n) => `${n}, a quick Tea Town classic.` },
  { id: 'clubs', name: 'Club Sandwiches', arabic: 'كلوب', blurb: 'Layered high. Cut to share (or not).', describe: (n) => `${n}, layered and toasted club-style.` },
  { id: 'pasta', name: 'Pasta', arabic: 'باستا', blurb: 'New cravings just dropped.', describe: (n) => `${n}, a new addition to the Tea Town kitchen.` },
  { id: 'fries', name: 'Fries & Wedges', arabic: 'بطاطس', blurb: 'Loaded. Cheesy. Irresistible.', describe: (n) => `${n}, hot, crispy and generously loaded.` },
  { id: 'mashed-potato', name: 'Loaded Mashed Potato', arabic: 'بطاطس مهروسة', blurb: 'Comfort food, levelled up.', describe: (n) => `${n}, creamy mash loaded with toppings.` },
  { id: 'paratha', name: 'Paratha', arabic: 'براتا', blurb: 'Flaky, buttery, filled.', describe: (n) => `${n}, rolled in a flaky paratha.` },
  { id: 'combos', name: 'Combos', arabic: 'كومبو', blurb: 'Big taste. Real value.', describe: (n) => `${n}, a complete meal in one order.` },
  { id: 'grills', name: 'Grills', arabic: 'مشاوي', blurb: 'Charcoal smoke and fire.', describe: (n) => `${n}, straight off the grill.` },
  { id: 'starters', name: 'Starters', arabic: 'مقبلات', blurb: 'Something to start with.', describe: (n) => `${n}, perfect for sharing.` },
  { id: 'chinese', name: 'Chinese, Noodles & Rice', arabic: 'صيني', blurb: 'Wok-tossed favourites.', describe: (n) => `${n}, wok-tossed and served hot.` },
  { id: 'salads-soups', name: 'Salads & Soups', arabic: 'سلطات وشوربات', blurb: 'Fresh and warming.', describe: (n) => `${n}, freshly prepared.` },
  { id: 'tea', name: 'Karak, Tea & Hot Drinks', arabic: 'شاي كرك', blurb: 'The sip that started it all.', describe: (n) => `${n}, brewed hot, the way regulars like it.` },
  { id: 'juices', name: 'Fresh Juices', arabic: 'عصائر طازجة', blurb: 'Pressed fresh.', describe: (n) => `Fresh ${n.toLowerCase()} juice.` },
  { id: 'shakes', name: 'Shakes, Smoothies & Lassi', arabic: 'ميلك شيك', blurb: 'Thick, cold, loaded.', describe: (n) => `${n}, blended cold.` },
  { id: 'mocktails', name: 'Signature Mocktails & Mojitos', arabic: 'كوكتيل', blurb: 'Tea Town signatures in a cup.', describe: (n) => `${n}, a Tea Town signature drink.` },
  { id: 'desserts', name: 'Falooda & Cream', arabic: 'فالودة', blurb: 'Sweet endings.', describe: (n) => `${n}, a cold, sweet treat.` },
  { id: 'meals', name: 'Meal Deals', arabic: 'وجبات', blurb: 'Feed the whole car.', describe: (n) => `${n}, a ready-to-go bundle.` },
]

type Seed = string | { n: string; d?: string; ing?: string[]; img?: string; fav?: true; pop?: true; ord?: true; isNew?: true; src?: 'owner-brief' }

const seed: Record<CategoryId, Seed[]> = {
  burgers: ['Chicken Burger', 'Beef Burger', 'Khaleej Burger', 'Tandoori Burger', 'Vegetable Burger', 'Zinger Burger', 'Spicy Prawns Burger', 'Chicken Burger Crispy Supreme', 'Big Burger Chicken', 'Big Burger Beef', 'Coleslaw Chicken Burger', 'Grilled Beef Bacon Burger', 'Grilled Chicken Turkey Burger', 'Supreme Nachos Burger', 'Saucy & Juicy Burger'],
  'premium-burgers': [
    { n: 'Fresh Beef Burger', d: 'A juicy beef burger with melted cheese, fresh lettuce and creamy sauce in a soft golden bun.', ing: ['beef patty', 'cheese', 'lettuce', 'sauce', 'bun'], img: '/assets/products/signature-burger-packaging-600.webp', fav: true },
    'Fresh Chicken Burger', 'Beef Mushroom Burger', 'Chicken Breast Burger', 'Grilled Tandoori Burger', 'Pineapple Burger', 'Ruman Burger', 'Chicken Double Burger', 'Beef Double Burger',
  ],
  shawarma: [{ n: 'Shawarma', fav: true }, 'Shawarma Spicy', 'Shawarma Plate', 'Arabica', 'Harrak', 'Twin Stars', '2 x Arabica Gathering', 'Brioche Shawarma'],
  wraps: ['Shish Taouk Wrap', 'Chicken Wrap', 'Tikka Wrap', 'Zinger Wrap', 'Fillet Wrap', 'Nuggets Wrap', 'Bahariya Wrap', 'Hotdog Wrap', 'Egg Wrap', 'Fantasia Chicken', 'Fantasia Bahariya', 'Tortilla Chicken', 'Tortilla Bahariya', 'Zinger Twister Roll'],
  sandwiches: [{ n: 'Cheese Honey', fav: true }, 'Cheese', 'Egg Cheese', 'Egg Cheese Chips', 'Labneh Zaatar', 'Labneh Honey', 'Cheese Zaatar', 'Peanut Cheese', 'Lotus Cheese', 'Nutella Cheese', 'Cheese Hotdog', 'Croissant Cheese', 'Croissant Egg Cheese', 'Croissant Chicken', 'Croissant Nutella', 'Croissant Falafel', 'Pizzager Chicken', 'Pizzager Beef', 'Pizzager Prawns'],
  clubs: ['Tea Town Club', 'Zinger Club', 'Chicken Club', 'Beef Club', 'Falafel Club', 'Tandoori Club', 'Kebab Club Chicken', 'Kebab Club Beef', 'Mathafi Club', 'Arabic Club', 'Bahariya Club', 'Prawns Club', 'Emarat Club', 'Spanish Spicy Club', 'Italian Club', 'Chicken Fillet Club', 'Majlis Club', 'Family Special Club'],
  pasta: [{ n: 'Tea Town Special Pasta', isNew: true }, { n: 'Mozzarella Cheetos Pasta', isNew: true }, { n: 'Pink Sauce Pasta', isNew: true }, { n: 'Red Sauce Pasta', isNew: true }, { n: 'White Sauce Pasta', isNew: true }, { n: 'Prawns Pasta', isNew: true }, { n: 'Beef Spaghetti', isNew: true }],
  fries: [
    { n: 'Animal Fries', isNew: true, src: 'owner-brief' }, { n: 'Cheese Fries', isNew: true, src: 'owner-brief' }, { n: 'Loaded Fries', isNew: true, src: 'owner-brief', fav: true },
    'Special Fries', 'Saucy Fries', 'Saucy Fries & Beef', 'Saucy Fries & Chicken', 'Saucy Fries & Shrimps', 'Saucy Fries & Onion Rings', 'Creamy Cheese & Jalapeño Fries', 'Special Wedges', 'Saucy Wedges', 'Saucy Wedges & Chicken',
  ],
  'mashed-potato': [
    { n: 'Loaded Mashed Potato — Beef', isNew: true, src: 'owner-brief', ing: ['mashed potato', 'beef'] },
    { n: 'Loaded Mashed Potato — Chicken', isNew: true, src: 'owner-brief', ing: ['mashed potato', 'chicken'] },
  ],
  paratha: ['Chicken Paratha', 'Beef Paratha', 'Cheese Paratha', 'Egg Cheese Paratha', 'Cheese & Oman Chips Paratha', 'Falafel Paratha', 'Hotdog Paratha', 'Chilli Paratha', 'Francisco Paratha', 'Tikka Paratha Roll', 'Zinger Paratha Roll', 'Chicken 65 Paratha Roll'],
  combos: ['Tea Town Special Combo', 'Chicken Tikka Combo', 'Kebab Combo', 'Chicken Fillet Combo', 'Nuggets Combo', 'Jumbo Prawns Combo', 'Fresh Beef Steak Combo', 'Fresh Chicken Steak Combo', 'Fresh Mexican Spicy Combo', 'Spicy Breast Combo', 'Zinger Mathafi Combo', 'Tea Town Special Grilled Combo', 'Minced BBQ Beef Combo', 'Italian Combo', 'Spanish Combo'],
  grills: ['Mix Grill', 'Chicken Tikka', 'Chicken Kebab', 'Mutton Kebab', 'Mutton Tikka', 'Lamb Chops', 'Chicken Charcoal', 'Pepper Chicken Charcoal', 'Arayes', 'Hassan Mathar', 'Grill Tikka Sandwich', 'Grill Kebab Sandwich'],
  starters: ['Dynamite Chicken', 'Dynamite Shrimps', 'Dynamite Popcorn', 'BBQ Wings', 'Mozzarella Sticks', 'Chicken Lollipop', 'Nuggets Plate', 'Spring Roll', 'Fish Finger Roll'],
  chinese: ['Chicken Manchurian', 'Chilli Chicken', 'Chicken 65', 'Dragon Chicken', 'Garlic Chicken', 'Ginger Chicken', 'Chilli Beef', 'Chilli Fish', 'Prawns in Oyster Sauce', 'Schezwan Fried Rice', 'Chicken Fried Rice', 'Malaysian Fried Rice', 'Mix Fried Rice', 'Chicken Noodles', 'Schezwan Noodles', 'Mix Noodles'],
  'salads-soups': ['Caesar Breast Salad', 'Fattoush', 'Tabbouleh', 'Greek Salad', 'Russian Salad', 'Corn Salad', 'Garden Fresh Salad', 'Cream of Tomato Soup', 'Cream of Seafood Soup', 'Hot & Sour Soup', 'Sweet Corn Soup', 'Manchow Chicken Soup'],
  tea: [{ n: 'Karak Tea', fav: true }, 'Karak Saffron', 'Special Tea (Fresh Milk Saffron)', 'Kashmiri Tea', 'Habbat Al Hamra', 'Arabic Coffee', 'Turkish Coffee', 'Cappuccino', 'Nescafé', 'Fresh Milk', 'Boost', 'Horlicks'],
  juices: ['Avocado', 'Mango', 'Orange', 'Pomegranate', 'Strawberry', 'Watermelon', 'Pineapple', 'Lemon Mint', 'Kiwi', 'Carrot', 'Apple', 'Banana', 'Papaya', 'Sweet Melon'],
  shakes: ['Oreo Crush Milk', 'Lotus Crush Milk', 'Nutella Crush Milk', 'Kinder Crush Milk', 'Pistachio', 'Chocolate', 'Strawberry', 'Vanilla', 'Mango Banana Smoothie', 'Mixberry Smoothie', 'Blueberry Smoothie', 'Mango Lassi', 'Banana Lassi', 'Roob Mango', 'Roob Strawberry'],
  mocktails: ['Hafeethy', 'Burj Al Emarat', 'Burj Al Arab', 'Abbadi', 'Sitara', 'Splash', 'Romance Pink', 'Blooming Strawberry', 'Pistachio Lover', 'Cocktail Kuwaity', 'Passion Mojito', 'Green Mint Mojito', 'Blue Lagoon Mojito', 'Strawberry Mojito', 'Mango Bricks', 'Watermelon Bricks'],
  desserts: ['Tea Town Special Falooda', 'Mango Falooda', 'Falooda', 'Mix Fruit Cream', 'Strawberry Cream', 'Mango Cream'],
  meals: ['Jumbo Meal', 'Strips Meal', 'Super Family Meal', 'Family Meal', 'Dinner Meal', 'Snack Meal'],
}

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const catById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>

export const menu: MenuItem[] = categories.flatMap((c) =>
  seed[c.id].map((s) => {
    const o = typeof s === 'string' ? { n: s } : s
    const slug = slugify(`${o.n}${c.id === 'juices' ? '-juice' : ''}`)
    return {
      id: `${c.id}--${slug}`,
      name: o.n,
      slug,
      category: c.id,
      description: o.d ?? c.describe(o.n),
      ingredients: o.ing ?? [],
      image: o.img ?? null,
      price: null,
      availability: 'available',
      branchAvailability: ['al-jazzat', 'al-tarfa'],
      mostOrdered: !!o.ord,
      customerFavourite: !!o.fav,
      mostPopular: !!o.pop,
      isNew: !!o.isNew,
      source: o.src ?? 'published-menu',
      lastVerified: null,
    } satisfies MenuItem
  }),
)

export const byCategory = (id: CategoryId) => menu.filter((m) => m.category === id)

/** Featured Picks: editorial picks until mostOrdered is backed by POS / platform data. */
export const featuredPickIds = [
  'premium-burgers--fresh-beef-burger', 'fries--animal-fries', 'pasta--tea-town-special-pasta', 'mashed-potato--loaded-mashed-potato-beef',
  'clubs--tea-town-club', 'grills--mix-grill', 'shakes--lotus-crush-milk', 'mocktails--hafeethy',
]
export const discoverIds = [
  'combos--tea-town-special-combo', 'starters--dynamite-chicken', 'shawarma--arabica', 'wraps--shish-taouk-wrap', 'desserts--tea-town-special-falooda', 'tea--karak-saffron', 'juices--avocado-juice', 'paratha--chicken-paratha',
]
export const pick = (ids: string[]) => ids.map((id) => menu.find((m) => m.id === id)).filter(Boolean) as MenuItem[]
