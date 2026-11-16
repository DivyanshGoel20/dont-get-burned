// Things nobody in 1350 had ever heard of. Tier 1 is objects you can point at,
// tier 2 is modern habits and services, tier 3 is abstract ideas.

export interface Topic {
  id: string;
  title: string;
  hint: string;
  banned: string[];
  /** What counts as understanding it, for the judge. */
  essence: string;
  tier: 1 | 2 | 3;
}

type Row = [title: string, hint: string, banned: string, essence: string];

const TIER_1: Row[] = [
  ["The smartphone", "The thing in your pocket.", "phone, screen, call, electricity", "a small hand-held object that sends words and pictures to faraway people instantly"],
  ["The refrigerator", "A cupboard that is always winter.", "cold, ice, electricity, machine", "a cupboard that stays chilly all year so food stays fresh for days"],
  ["The airplane", "Two hundred people in a metal tube, above the clouds.", "fly, wings, engine, sky, bird", "a huge metal carriage that carries hundreds of ordinary people through the air to faraway lands in hours"],
  ["The motor car", "A horseless cart that goes faster than any horse.", "engine, drive, fuel, wheels", "a cart that moves by itself without a horse, much faster than one, which ordinary families own"],
  ["The light bulb", "A candle that never melts.", "electricity, switch, lamp, light", "a small glass thing that glows bright as daylight at the press of a finger, with no flame and no wax"],
  ["The flushing toilet", "Where it all goes, and why nobody minds.", "toilet, flush, pipe, sewer", "an indoor seat for doing your business where water sweeps everything away instantly, with no smell"],
  ["The potato", "A root from across the ocean that conquered the world.", "potato, chips, fries, vegetable", "a lumpy root vegetable from a land across the western sea that becomes the cheapest, most eaten food in Europe"],
  ["Chocolate", "A bitter bean that became the sweetest treat.", "chocolate, sugar, candy, cocoa", "a sweet brown treat made from a bitter bean from faraway lands that people crave and give as gifts"],
  ["Coffee", "A black drink people need before they can speak.", "coffee, caffeine, bean, cafe", "a hot bitter black drink from roasted beans that makes people alert, which nearly everyone drinks every morning"],
  ["The microwave oven", "Hot food in two minutes, with no fire.", "microwave, heat, oven, electricity", "a small box that heats food in moments without any fire or flame"],
  ["The escalator", "Stairs that climb themselves.", "escalator, moving, machine, electric", "a staircase whose steps move by themselves, carrying people up while they stand still"],
  ["The lift", "A little room that carries you up a tower.", "elevator, lift, button, machine", "a small room that rises and sinks inside a very tall building, carrying people between floors"],
  ["Sunscreen", "Grease you rub on so the sun can't burn you.", "sun, lotion, cream, burn", "an ointment people spread on their skin to stop the sun from burning it"],
  ["Spectacles you wear on your eyeballs", "Contact lenses: tiny glass discs that sit on the eye.", "contact, lens, glasses, eye", "tiny clear soft discs placed directly on the eyes that let poor-sighted people see perfectly"],
  ["Plastic", "A stuff that can become anything and never rots.", "plastic, bottle, synthetic, oil", "a cheap, light material that can be shaped into almost any object and lasts for centuries without rotting"],
  ["The bicycle", "A two-wheeled thing you balance on and push with your feet.", "bike, pedal, wheel, ride", "a light frame with two wheels in a line that a person balances on and drives forward with their own legs"],
  ["Chewing gum", "Something you chew for an hour and never swallow.", "gum, chew, candy, mint", "a sweet, rubbery morsel people chew for a long time for pleasure and then spit out instead of eating"],
  ["The umbrella", "A tiny roof you carry around.", "umbrella, rain, handle, fold", "a folding cloth roof on a stick that a person holds over their head to keep the rain off"],
  ["The alarm clock", "A thing that screams at you every morning, on purpose.", "clock, alarm, time, wake", "a small device that makes a loud noise at a chosen hour so a person wakes up, which people set themselves every night"],
  ["The vending machine", "A box that sells you food with no merchant inside.", "machine, coin, buy, snack", "a box where you put a coin in and food or drink comes out, with no seller anywhere"],
  ["The hot shower", "Rain that is warm, indoors, whenever you like.", "shower, water, hot, tap", "warm water that falls from the ceiling like rain, indoors, whenever you want, for washing every day"],
  ["Headphones", "Minstrels that play only inside your own ears.", "music, headphones, ears, speaker", "small things over the ears that play music only the wearer can hear, so people walk around listening to songs alone"],
  ["The photocopier", "A box that writes a whole book in a moment.", "copy, print, paper, machine", "a machine that makes a perfect copy of any page in an instant, without a scribe"],
  ["Ice cream", "Sweet frozen cream, eaten in summer.", "ice, cold, cream, frozen", "a sweet frozen cream treat people eat on hot summer days"],
  ["Fireworks show", "Colored thunder in the night sky, for fun.", "firework, explosion, gunpowder, rocket", "a show where colorful bursts of fire explode in the night sky to celebrate, and crowds gather to watch"],
];

const TIER_2: Row[] = [
  ["The selfie", "A picture of yourself, taken by yourself.", "camera, photo, picture, phone", "making a perfect lasting image of your own face, by yourself, mostly to show other people"],
  ["Wi-Fi", "Why everyone asks for the password.", "internet, signal, wireless, router, network", "something invisible in a house that lets hand-held devices send and receive messages, and needs a secret word"],
  ["Online dating", "Finding a spouse by judging faces with your thumb.", "app, phone, internet, match, swipe", "choosing a sweetheart from strangers by their pictures and a few words, with no matchmaker or family"],
  ["The influencer", "A job, apparently.", "famous, followers, video, internet, content", "a person who earns a living because many strangers watch them live their life and buy what they use"],
  ["Food delivery", "Dinner arrives at your door because you tapped something.", "delivery, order, app, restaurant", "ordering a cooked meal from a stranger's kitchen without leaving home and having a rider bring it to your door"],
  ["The gym", "People pay to lift heavy things that go nowhere.", "gym, exercise, workout, weights, fitness", "a building where people pay money to lift heavy things and run without going anywhere, for health and looks"],
  ["The weekend", "Two days a week when nobody works, and it isn't a holy day.", "weekend, saturday, sunday, holiday", "two days every week when most people do no work at all, just to rest and enjoy themselves"],
  ["Binge-watching", "Watching a whole tale in one night instead of sleeping.", "tv, television, show, series, episode", "watching a long story told in moving pictures, one part after another for hours, often all night"],
  ["The podcast", "Two strangers talking, which you listen to while washing up.", "podcast, audio, episode, listen, record", "recordings of people talking at length that others listen to later, alone, while doing chores"],
  ["The gender reveal party", "A feast to announce whether the unborn baby is a boy or a girl.", "party, baby, ultrasound, pink, blue", "a celebration where expectant parents reveal to guests whether their unborn child is a boy or a girl, often with colored smoke"],
  ["The package holiday", "Paying to go somewhere hot and do nothing for a week.", "holiday, vacation, hotel, tourist, beach", "ordinary people travelling to a faraway warm place purely for pleasure, to lie in the sun for a week"],
  ["Hotel reviews", "Strangers rating inns with little stars.", "review, stars, rating, hotel, online", "travellers publicly giving inns a score so that strangers far away can choose where to sleep"],
  ["The vegan", "A person who will eat no animal, no egg, no milk, no honey.", "vegan, vegetarian, meat, plant, diet", "someone who chooses never to eat or use anything from an animal, not even eggs, milk or honey, by belief"],
  ["The office job", "Sitting in a room all day moving words around for money.", "office, desk, computer, email, boss", "working all day indoors at a desk handling letters and figures, never touching soil or tools, for wages"],
  ["The traffic jam", "Thousands of horseless carts, all stuck at once.", "traffic, car, road, jam", "so many self-moving carts on one road that none can move, with everyone sitting angry and waiting"],
  ["Karaoke", "Singing badly in public on purpose.", "karaoke, microphone, song, sing", "ordinary people taking turns to sing well-known songs loudly to friends in public, usually badly, for fun"],
  ["The theme park", "Paying to be terrified on giant wooden and iron carts.", "ride, rollercoaster, park, thrill", "a place people pay to visit to be thrown about at frightening speeds on great machines, for fun"],
  ["The birthday party", "A feast for the day you were born, with fire on a cake.", "birthday, cake, candles, party", "celebrating the anniversary of someone's birth with a sweet cake topped with little candles they blow out"],
  ["The cinema", "A dark hall where pictures move and tell a story.", "movie, film, screen, cinema", "a dark room where crowds watch huge pictures that move and talk, telling a story"],
  ["The passport", "A little book that proves who you are to foreign kings.", "passport, border, travel, visa", "a small book with your likeness that every traveller must show to cross into another kingdom"],
  ["Online shopping", "Buying anything in the world without leaving your bed.", "online, internet, order, delivery, website", "choosing goods by looking at pictures, paying without coins, and having them carried to your door days later"],
  ["The video game", "Grown men playing pretend with little moving pictures.", "game, video, console, play", "people of all ages controlling little moving pictures in made-up worlds for hours, for fun or even as a job"],
  ["Daily bathing", "Washing your whole body every single day.", "shower, bath, soap, wash", "people washing their entire body with warm water and soap every day, and thinking it odd not to"],
  ["The blind date", "Your friends arrange for you to dine with a total stranger.", "date, dinner, romance, stranger", "two unmarried strangers meeting alone over a meal, arranged by friends, to see if they might fall in love"],
  ["Retirement", "When you're old, you stop working and the kingdom pays you.", "retire, pension, money, old", "old people stopping work entirely and being paid a living anyway, to rest for their remaining years"],
];

const TIER_3: Row[] = [
  ["Cryptocurrency", "Money that isn't there, but is.", "money, coin, internet, computer, digital", "wealth with no metal or paper at all, only a shared record everyone agrees on, whose worth swings wildly"],
  ["Germs", "Tiny invisible beasts that make you ill.", "germ, bacteria, virus, microscope, disease", "creatures far too small to see that live everywhere, cause sickness, and spread on unwashed hands"],
  ["The vaccine", "Making you a little bit sick on purpose so you never get very sick.", "vaccine, needle, injection, virus, immune", "giving someone a harmless taste of a disease on purpose so their body learns to fight off the real one"],
  ["The Earth goes round the Sun", "Everything you were taught about the heavens is backwards.", "orbit, planet, solar, sun", "the Earth is a ball that travels around the Sun once a year, rather than the Sun moving around the Earth"],
  ["Dinosaurs", "Giant lizards that ruled the world before any people.", "dinosaur, fossil, reptile, extinct", "enormous beasts that lived and died out long, long before any human existed, known only from their stone bones"],
  ["Evolution", "Your great-great-many-times-grandfather was a fish.", "evolution, darwin, species, ape", "living things slowly change over countless generations, so all creatures, including people, share ancient ancestors"],
  ["The stock market", "Owning a sliver of a business you've never seen.", "stock, share, market, invest, trade", "buying tiny pieces of faraway businesses and selling them to strangers when they're worth more"],
  ["Cloud storage", "Your letters are kept in the sky, somewhere.", "cloud, internet, data, server, upload", "keeping all your writings and pictures in a faraway place you'll never see, and reaching them from anywhere"],
  ["The AI chatbot", "A thing that talks like a person but isn't one.", "ai, robot, computer, artificial, chatbot", "a made thing with no body or soul that can hold a conversation and answer questions as if it were a learned person"],
  ["Time zones", "It's morning here and night somewhere else, at the same moment.", "time, zone, clock, hour", "because the world is round, it is noon in one land while it is midnight in another at the very same moment"],
  ["Daylight saving time", "Twice a year, everyone agrees to move the hours.", "clock, hour, daylight, summer", "a whole kingdom agreeing to shift every clock by one hour twice a year so evenings stay light"],
  ["Democracy", "Everyone chooses the king. Even the turnip farmers.", "vote, election, democracy, president", "ordinary people, rich or poor, choosing their own rulers by counting everyone's opinion, and replacing them later"],
  ["The Moon landing", "Men walked on the Moon and came back.", "rocket, space, astronaut, nasa", "people travelling all the way to the Moon in a vessel, walking on it, and returning home safely"],
  ["The credit card", "Buy anything now, pay for it later, with a little slab.", "card, credit, bank, money, debt", "a small flat token that lets you buy anything without coins, which a moneylender pays for and you repay later"],
  ["The subscription", "Paying every month forever for something you forgot about.", "subscription, monthly, pay, service", "paying a small fee again and again every month for a service, often long after you stopped using it"],
  ["The internet", "Every letter, book and gossip in the world, in one place, at once.", "internet, online, web, computer", "something that connects nearly everyone in the world so anyone can send messages and find any knowledge instantly"],
  ["Insurance", "Paying a stranger every year in case your house burns down.", "insurance, policy, premium, claim", "paying a company small regular sums so that if disaster strikes, they pay for your loss"],
  ["Anaesthesia", "Sleeping through having your leg cut off.", "anaesthetic, surgery, drug, sleep", "a medicine that puts a person into a deep sleep so surgeons can cut them open and they feel no pain at all"],
  ["The X-ray", "Seeing someone's bones without cutting them open.", "x-ray, scan, radiation, bones", "a way of making a picture of the bones inside a living body without opening it"],
  ["The Americas", "There are two whole continents across the western sea.", "america, columbus, continent, ocean", "beyond the western ocean lie two vast lands full of peoples, animals and foods unknown to Europe"],
  ["The meme", "A joke picture copied by millions of strangers.", "meme, internet, image, viral, funny", "a funny picture or phrase that strangers copy and change and pass along until millions have seen it"],
  ["The cookie consent banner", "Every page asks permission to remember you. Everyone clicks yes.", "cookie, website, privacy, accept, browser", "every place you visit asks if it may secretly keep notes on you, and everyone agrees without reading"],
  ["Electricity", "Lightning, tamed, living in the walls.", "electricity, power, energy, current, battery", "the power of lightning captured and carried through thin metal threads into every house to make things work"],
  ["The password", "A secret word you must forget and reset every month.", "password, login, account, secret", "a secret word you must give to use your own belongings, which you constantly forget and must change"],
  ["The universe is enormous", "The stars are suns, and there are more of them than grains of sand.", "galaxy, universe, star, planet, space", "every star is a sun like ours, unimaginably far away, and there are more of them than grains of sand on every beach"],
];

const slug = (s: string) => s.toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const build = (rows: Row[], tier: 1 | 2 | 3): Topic[] =>
  rows.map(([title, hint, banned, essence]) => ({
    id: slug(title),
    title,
    hint,
    banned: banned.split(",").map((w) => w.trim()),
    essence,
    tier,
  }));

export const TOPICS: Topic[] = [...build(TIER_1, 1), ...build(TIER_2, 2), ...build(TIER_3, 3)];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
