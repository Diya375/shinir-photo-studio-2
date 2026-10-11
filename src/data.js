// ===== EDIT YOUR BUSINESS DETAILS HERE =====
export const BUSINESS = {
  name: 'Shinir Photo Studio',
  tagline: 'Capturing Moments. Crafting Memories.',
  phone: '+977-9845067626',
  whatsapp: '9779845067626', // digits only, with country code
  email: 'shinirphotostudio@gmail.com',
  address: 'synergy road, bharatpur 10, Nepal',
  hours: [['Sunday – Friday', '8:00 AM – 7:00 PM'], ['Saturday', 'By appointment']],
  social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/', youtube: 'https://youtube.com/' },
  mapEmbed: 'https://www.google.com/maps?q=Kathmandu,Nepal&output=embed', // replace with your studio's embed URL
  adminPassword: 'shinir@123', // change this!
}
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`
export const HERO_IMG = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=75'
export const ABOUT_IMG = U('photo-1554048612-b6a482bc67e5')
export const SERVICES = [
  { id: 1, icon: '🛂', title: 'Passport & Visa Photos', desc: 'Embassy-compliant sizes, ready in minutes.', price: 'From Rs. 300' },
  { id: 2, icon: '💍', title: 'Wedding & Event', desc: 'Full-day coverage with photo & video.', price: 'From Rs. 25,000' },
  { id: 3, icon: '🧑‍🎨', title: 'Portrait Photography', desc: 'Studio and outdoor portraits, individuals & families.', price: 'From Rs. 2,000' },
  { id: 4, icon: '✨', title: 'Photo Editing', desc: 'Retouching, color grading and Photoshop magic.', price: 'From Rs. 200' },
  { id: 5, icon: '✂️', title: 'Background Removal', desc: 'Clean cut-outs and background replacement.', price: 'From Rs. 100' },
  { id: 6, icon: '🕰️', title: 'Photo Restoration', desc: 'Repair torn, faded or damaged old photos.', price: 'From Rs. 500' },
  { id: 7, icon: '🖨️', title: 'Photo Printing', desc: 'Premium lab-quality prints in all sizes.', price: 'From Rs. 30' },
  { id: 8, icon: '🖼️', title: 'Photo Frames', desc: 'Wood, metal and acrylic frames, custom sizes.', price: 'From Rs. 400' },
  { id: 9, icon: '📖', title: 'Albums', desc: 'Hand-crafted wedding & family albums.', price: 'From Rs. 3,500' },
  { id: 10, icon: '🪪', title: 'ID Photos', desc: 'Citizenship, license, school and office ID.', price: 'From Rs. 200' },
  { id: 11, icon: '📄', title: 'Document Printing', desc: 'Print, photocopy, scan and lamination.', price: 'From Rs. 5' },
]
export const PACKAGES = [
  { id: 1, name: 'Basic', price: 'Rs. 3,000', featured: false, features: ['1-hour studio session', '10 edited photos', '2 outfit changes', 'Digital delivery'] },
  { id: 2, name: 'Premium', price: 'Rs. 8,000', featured: true, features: ['3-hour session', '40 edited photos', '5 printed 8×10 photos', 'Photo frame included', 'Digital delivery'] },
  { id: 3, name: 'Wedding Gold', price: 'Rs. 45,000', featured: false, features: ['Full-day coverage', 'Two photographers', '300+ edited photos', 'Premium 40-page album', 'Highlight video'] },
  { id: 4, name: 'Print Pack', price: 'Rs. 1,500', featured: false, features: ['20 photo prints (4×6)', '4 passport photos', 'Lamination', 'Same-day service'] },
]
export const GALLERY = [
  { id: 1, cat: 'Wedding', src: U('photo-1519741497674-611481863552') },
  { id: 2, cat: 'Wedding', src: U('photo-1511285560929-80b456fea0bc') },
  { id: 3, cat: 'Portrait', src: U('photo-1531746020798-e6953c6e8e04') },
  { id: 4, cat: 'Portrait', src: U('photo-1494790108377-be9c29b29330') },
  { id: 5, cat: 'Events', src: U('photo-1492684223066-81342ee5ff30') },
  { id: 6, cat: 'Events', src: U('photo-1511795409834-ef04bbd61622') },
  { id: 7, cat: 'Editing', src: U('photo-1542038784456-1ea8e935640e') },
  { id: 8, cat: 'Editing', src: U('photo-1452587925148-ce544e77e70d') },
]
