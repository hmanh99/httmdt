import asyncio
from decimal import Decimal
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import AsyncSessionLocal
from app.models.catalog import Brand, Category, Product, ProductImage, ProductVariant
from app.models.order import Coupon
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
    CouponCreate,
    ProductCreate,
    ProductImageCreate,
    ProductVariantCreate,
)
from app.services.auth_service import AuthService


SAMPLE_BRANDS = [
    {
        "name": "Nike",
        "description": "Innovative footwear, athletic apparel, and cutting-edge sportswear designed for athletes worldwide.",
        "logo_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.nike.com",
    },
    {
        "name": "Jordan",
        "description": "The iconic legacy of Michael Jordan, defining basketball heritage and global sneaker culture.",
        "logo_url": "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.nike.com/jordan",
    },
    {
        "name": "Adidas",
        "description": "Through sports, we have the power to change lives. Timeless street silhouettes and elite performance running.",
        "logo_url": "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.adidas.com",
    },
    {
        "name": "New Balance",
        "description": "Craftsmanship and heritage since 1906. Premium lifestyle runners and unmatched arch-support comfort.",
        "logo_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.newbalance.com",
    },
    {
        "name": "Asics",
        "description": "Anima Sana In Corpore Sano — sound mind in a sound body. Japanese technical footwear engineering.",
        "logo_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.asics.com",
    },
    {
        "name": "Salomon",
        "description": "Born in the French Alps. Trail-running mastery, technical outdoor silhouettes, and gorpcore luxury.",
        "logo_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=200&auto=format&fit=crop&q=80",
        "website": "https://www.salomon.com",
    },
]

SAMPLE_CATEGORIES = [
    {
        "name": "Lifestyle & Classics",
        "description": "Timeless streetwear, court-inspired retros, and daily elevated sneakers.",
        "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
        "display_order": 1,
    },
    {
        "name": "Performance Running",
        "description": "Engineered foam, carbon plates, and breathable uppers built to conquer miles.",
        "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
        "display_order": 2,
    },
    {
        "name": "Basketball",
        "description": "Court-tested traction, responsive cushioning, and historic hardwood silhouettes.",
        "image_url": "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&auto=format&fit=crop&q=80",
        "display_order": 3,
    },
    {
        "name": "Trail & Outdoor",
        "description": "Contagrip outsoles, Quicklace systems, and weather-resistant outdoor protection.",
        "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop&q=80",
        "display_order": 4,
    },
    {
        "name": "Skateboarding",
        "description": "Reinforced toe caps, vulcanized cupsole construction, and Zoom Air sockliners.",
        "image_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
        "display_order": 5,
    },
]

SAMPLE_COUPONS = [
    {
        "code": "WELCOME10",
        "discount_type": "percentage",
        "discount_value": Decimal("10.00"),
        "min_order_amount": Decimal("50.00"),
        "max_discount_amount": Decimal("30.00"),
        "max_uses": 500,
        "is_active": True,
    },
    {
        "code": "STRIDE20",
        "discount_type": "percentage",
        "discount_value": Decimal("20.00"),
        "min_order_amount": Decimal("100.00"),
        "max_discount_amount": Decimal("60.00"),
        "max_uses": 200,
        "is_active": True,
    },
    {
        "code": "FREESHIP",
        "discount_type": "fixed",
        "discount_value": Decimal("15.00"),
        "min_order_amount": Decimal("75.00"),
        "max_uses": 1000,
        "is_active": True,
    },
]

# 30 Curated Iconic Shoes
SAMPLE_SHOES = [
    # 1
    {
        "name": "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
        "brand": "Jordan",
        "category": "Basketball",
        "gender": "men",
        "base_price": Decimal("180.00"),
        "is_featured": True,
        "short_description": "The quintessential basketball silhouette returning in vintage Chicago detailing.",
        "description": "Reimagined from the 1985 classic, the Air Jordan 1 Chicago Lost & Found features cracked leather accents, muslin-tinted tongues, and authentic vintage shoebox packaging recalling dusty mom-and-pop stockrooms.",
        "color_name": "Varsity Red / Black / Sail",
        "color_hex": "#c91d2e",
        "images": [
            "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 2
    {
        "name": "Nike Air Force 1 '07 Low",
        "brand": "Nike",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("115.00"),
        "is_featured": True,
        "short_description": "The radiant legend with crisp leather overlays and encapsulated Nike Air cushioning.",
        "description": "The radiance lives on in the Nike Air Force 1 '07. Crossing hardwood comfort with off-court flair, this hoops original pairs crisp leather with bold accents for nothing-but-net style.",
        "color_name": "Triple White",
        "color_hex": "#ffffff",
        "images": [
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 3
    {
        "name": "Nike Dunk Low Retro 'Panda'",
        "brand": "Nike",
        "category": "Skateboarding",
        "gender": "unisex",
        "base_price": Decimal("115.00"),
        "is_featured": True,
        "short_description": "Iconic monochrome blocking with a padded, low-cut collar for all-day comfort.",
        "description": "Created for the hardwood but taken to the streets, the '80s b-ball icon returns with perfectly shined overlays and classic two-tone color blocking that coordinates effortlessly with any outfit.",
        "color_name": "Black / White",
        "color_hex": "#111111",
        "images": [
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 4
    {
        "name": "Nike ZoomX Vaporfly Next% 3",
        "brand": "Nike",
        "category": "Performance Running",
        "gender": "men",
        "base_price": Decimal("260.00"),
        "is_featured": True,
        "short_description": "Elite marathon racing shoe featuring full-length carbon fiber Flyplate and ZoomX foam.",
        "description": "Catch 'em if you can. The Nike Vaporfly 3 is made for chasers, racers, and elevated pacers who can't turn down the thrill of the pursuit. Packed with responsive ZoomX foam and a rigid carbon Flyplate.",
        "color_name": "Electric Volt / Hyper Crimson",
        "color_hex": "#ccff00",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 5
    {
        "name": "Nike Pegasus 41 Road Running",
        "brand": "Nike",
        "category": "Performance Running",
        "gender": "unisex",
        "base_price": Decimal("140.00"),
        "is_featured": False,
        "short_description": "Responsive daily road running workhorse powered by dual Air Zoom units and ReactX foam.",
        "description": "Responsive cushioning in the Pegasus provides an energized ride for everyday road running. Experience lighter-weight energy return with dual Air Zoom units and an all-new ReactX foam midsole.",
        "color_name": "Pure Platinum / Glacier Blue",
        "color_hex": "#d3d3d3",
        "images": [
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 6
    {
        "name": "Air Jordan 4 Retro 'Bred Reimagined'",
        "brand": "Jordan",
        "category": "Basketball",
        "gender": "men",
        "base_price": Decimal("215.00"),
        "is_featured": True,
        "short_description": "Tinker Hatfield's 1989 masterpiece elevated with rich supple black leather uppers.",
        "description": "Celebrating the 35th anniversary of the AJ4, the Bred Reimagined swaps out traditional nubuck for a sumptuous full-grain black leather upper, complemented by Cement Grey and Fire Red hits.",
        "color_name": "Black / Fire Red / Cement Grey",
        "color_hex": "#1a1a1a",
        "images": [
            "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 7
    {
        "name": "Air Jordan 3 Retro 'White Cement Reimagined'",
        "brand": "Jordan",
        "category": "Basketball",
        "gender": "men",
        "base_price": Decimal("210.00"),
        "is_featured": False,
        "short_description": "Historic elephant print trim, pre-yellowed midsoles, and original Nike Air heel branding.",
        "description": "Built to the exact specifications of the 1988 original, the AJ3 White Cement Reimagined showcases aged vintage midsole tones, signature elephant print mudguards, and iconic visible heel Air.",
        "color_name": "White / Cement Grey / Fire Red",
        "color_hex": "#ededed",
        "images": [
            "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 8
    {
        "name": "Air Jordan 11 Retro 'Gratitude'",
        "brand": "Jordan",
        "category": "Basketball",
        "gender": "unisex",
        "base_price": Decimal("230.00"),
        "is_featured": False,
        "short_description": "Patent leather elegance with metallic gold Jumpman hardware on premium leather.",
        "description": "The Air Jordan 11 Gratitude pays homage to Michael Jordan's winning legacy and his dedicated fans worldwide. Lustrous black patent leather encircles an exquisite tumbled leather upper.",
        "color_name": "White / Metallic Gold / Black",
        "color_hex": "#f5f5f0",
        "images": [
            "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 9
    {
        "name": "Adidas Samba OG 'Cloud White / Core Black'",
        "brand": "Adidas",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("100.00"),
        "is_featured": True,
        "short_description": "The legendary indoor soccer shoe transformed into the world's most sought-after street silhouette.",
        "description": "Born on the pitch in 1950, the Samba is a timeless icon of street style. Featuring a soft leather upper, suede T-toe overlay, and signature gum rubber cupsole.",
        "color_name": "Cloud White / Core Black / Gum",
        "color_hex": "#f8f9fa",
        "images": [
            "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 10
    {
        "name": "Adidas Gazelle Indoor 'Collegiate Green'",
        "brand": "Adidas",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("120.00"),
        "is_featured": False,
        "short_description": "Rich velvet suede with translucent gum sole wrapping up around the toe.",
        "description": "Originally launched in the '70s for indoor training, the Gazelle Indoor has evolved into an essential everyday statement piece with plush collegiate green suede and contrasting serrated 3-Stripes.",
        "color_name": "Collegiate Green / Lucid Pink",
        "color_hex": "#1b4d3e",
        "images": [
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 11
    {
        "name": "Adidas Ultraboost Light Running",
        "brand": "Adidas",
        "category": "Performance Running",
        "gender": "women",
        "base_price": Decimal("190.00"),
        "is_featured": False,
        "short_description": "Lightest Boost foam ever with 30% lighter material and incredible energy return.",
        "description": "Experience epic energy with the Ultraboost Light, our lightest Ultraboost ever. The magic lies in the Light BOOST midsole, a new generation of adidas BOOST designed for effortless stride transition.",
        "color_name": "Core Black / Cloud White",
        "color_hex": "#222222",
        "images": [
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 12
    {
        "name": "Adidas Adizero Adios Pro 3",
        "brand": "Adidas",
        "category": "Performance Running",
        "gender": "unisex",
        "base_price": Decimal("250.00"),
        "is_featured": False,
        "short_description": "Record-breaking road racing shoe with carbon-infused EnergyRods 2.0.",
        "description": "The ultimate marathon racing shoe. Two layers of resilient Lightstrike Pro foam cushion every footstrike, while carbon-infused ENERGYRODS 2.0 provide lightweight stiffness for explosive propulsion.",
        "color_name": "Solar Red / Wonder Blue",
        "color_hex": "#ff3838",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 13
    {
        "name": "Adidas Campus 00s 'Core Black'",
        "brand": "Adidas",
        "category": "Skateboarding",
        "gender": "unisex",
        "base_price": Decimal("110.00"),
        "is_featured": False,
        "short_description": "Chunky early 2000s skate proportions with fat laces and puffy tongue.",
        "description": "The Campus 00s updates the classic '80s Campus silhouette with exaggerated skate-inspired padding, oversized 3-Stripes, and chunky flat cotton laces.",
        "color_name": "Core Black / Off White",
        "color_hex": "#1a1a1a",
        "images": [
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 14
    {
        "name": "New Balance 550 'White Green'",
        "brand": "New Balance",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("110.00"),
        "is_featured": True,
        "short_description": "Clean, vintage low-top basketball tribute from the 1989 archives.",
        "description": "The original 550 debuted in 1989 and left its mark on basketball courts from coast to coast. Having returned from the vault, it offers crisp leather construction and heritage collegiate styling.",
        "color_name": "Sea Salt / Pine Green",
        "color_hex": "#1e4620",
        "images": [
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 15
    {
        "name": "New Balance 990v6 Made in USA 'Castlerock Grey'",
        "brand": "New Balance",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("200.00"),
        "is_featured": True,
        "short_description": "The pinnacle of American craftsmanship featuring FuelCell foam cushioning.",
        "description": "Representing over four decades of Made in USA heritage, the 990v6 streamlines the silhouette with flowing pigskin suede and mesh panelling, backed by responsive FuelCell midsole technology.",
        "color_name": "Grey / Castlerock",
        "color_hex": "#888888",
        "images": [
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 16
    {
        "name": "New Balance 2002R 'Protection Pack Rain Cloud'",
        "brand": "New Balance",
        "category": "Lifestyle & Classics",
        "gender": "men",
        "base_price": Decimal("160.00"),
        "is_featured": False,
        "short_description": "Deconstructed jagged-edge suede overlays paired with N-ergy shock absorption.",
        "description": "A breakout modern classic. The 2002R Protection Pack features raw cut, jagged suede paneling on top of an ABZORB midsole and N-ergy outsole for ultimate cushion and head-turning streetwear aesthetic.",
        "color_name": "Rain Cloud / Magnet",
        "color_hex": "#6b7280",
        "images": [
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 17
    {
        "name": "New Balance 1906R 'Silver Metallic / Blue'",
        "brand": "New Balance",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("155.00"),
        "is_featured": False,
        "short_description": "Technical Y2K runner equipped with N-ergy cushioning and Stability Web arch support.",
        "description": "Named after the year New Balance was founded, the 1906R reimagines 2000s tech-runners with breathable open mesh, metallic synthetic overlays, and an N-lock lacing cage.",
        "color_name": "Silver Metallic / Team Royal",
        "color_hex": "#c0c0c0",
        "images": [
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 18
    {
        "name": "New Balance Fresh Foam X 1080v13",
        "brand": "New Balance",
        "category": "Performance Running",
        "gender": "women",
        "base_price": Decimal("165.00"),
        "is_featured": False,
        "short_description": "Maximalist luxury cushion running shoe with breathable engineered mesh.",
        "description": "If New Balance only made one running shoe, it would be the Fresh Foam X 1080. Delivering premium comfort with smooth transitions and an ultra-soft Fresh Foam X midsole experience.",
        "color_name": "Starlight / Marine Blue",
        "color_hex": "#4a69bd",
        "images": [
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 19
    {
        "name": "Asics Gel-Kayano 14 'Metallic Plum'",
        "brand": "Asics",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("150.00"),
        "is_featured": True,
        "short_description": "The late 2000s aesthetic runner that defined the retro-technical footwear movement.",
        "description": "Conveying a new perception to the retro running shape, the GEL-KAYANO 14 resurfaces with its late 2000s aesthetic. Featuring metallic synthetic leather and original GEL technology cushioning inserts.",
        "color_name": "Cream / Plum / Pure Silver",
        "color_hex": "#843b62",
        "images": [
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 20
    {
        "name": "Asics Gel-NYC 'Cream Oyster Grey'",
        "brand": "Asics",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("130.00"),
        "is_featured": False,
        "short_description": "Collaging GEL-NIMBUS 3, GEL-MC PLUS V, and modern GEL-CUMULUS 16 tooling.",
        "description": "The GEL-NYC shoe sources inspiration from heritage and modern performance running styles. Upper construction references the GEL-NIMBUS 3 from the early 2000s blended with various embellishments from the MC-PLUS V.",
        "color_name": "Cream / Oyster Grey",
        "color_hex": "#dedede",
        "images": [
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 21
    {
        "name": "Asics GT-2160 'White Pure Silver'",
        "brand": "Asics",
        "category": "Lifestyle & Classics",
        "gender": "women",
        "base_price": Decimal("120.00"),
        "is_featured": False,
        "short_description": "A tribute to the technical design language from the GT-2000 series in the early 2010s.",
        "description": "The GT-2160 sneaker pays homage to the technical design language of the GT-2000 series. Retaining the key features of the iconic trainer, like segmented midsole structure and GEL inserts.",
        "color_name": "White / Pure Silver / Shamrock Green",
        "color_hex": "#f1f2f6",
        "images": [
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 22
    {
        "name": "Asics Novablast 4 'Centennial Blue'",
        "brand": "Asics",
        "category": "Performance Running",
        "gender": "men",
        "base_price": Decimal("140.00"),
        "is_featured": False,
        "short_description": "Geometric trampoline-inspired outsole geometry with bouncy FF BLAST PLUS ECO foam.",
        "description": "The NOVABLAST 4 running shoe features a new midsole and outsole geometry that helps produce an energized ride. A tongue wing construction helps improve fit while reducing tongue movement.",
        "color_name": "Centennial Blue / Pale Mint",
        "color_hex": "#2e86de",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 23
    {
        "name": "Salomon XT-6 Mindful 3 'Vanilla Ice'",
        "brand": "Salomon",
        "category": "Trail & Outdoor",
        "gender": "unisex",
        "base_price": Decimal("200.00"),
        "is_featured": True,
        "short_description": "The ultimate trail silhouette favored by ultra-runners and high-fashion runways alike.",
        "description": "Originally launched in 2013, the XT-6 is the preferred footwear of world-class ultra-distance athletes. Now revamped with recycled textile uppers, Agile Chassis System (ACS), and Mud Contagrip.",
        "color_name": "Vanilla Ice / Almond Milk / Grape",
        "color_hex": "#f3eee7",
        "images": [
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 24
    {
        "name": "Salomon ACS Pro Advanced 'Metal Ghost'",
        "brand": "Salomon",
        "category": "Trail & Outdoor",
        "gender": "unisex",
        "base_price": Decimal("220.00"),
        "is_featured": False,
        "short_description": "Futuristic technical runner with Kurim cage envelope and dual-density EVA midsole.",
        "description": "An archetypal technical trail shoe modernized with functional stride-stabilizing Agile Chassis System. Robust Kurim structure on the upper provides a steady envelope of support.",
        "color_name": "Metal / Ghost Gray / Black",
        "color_hex": "#7f8c8d",
        "images": [
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 25
    {
        "name": "Salomon Speedcross 6 'Black Phantom'",
        "brand": "Salomon",
        "category": "Trail & Outdoor",
        "gender": "men",
        "base_price": Decimal("145.00"),
        "is_featured": False,
        "short_description": "Aggressive chevron lug grip engineered specifically for muddy and loose terrain.",
        "description": "SPEEDCROSS 6 needs no introductions. Staying true to its legendary trail roots, this version is lighter with an even more powerful, grippy connection to the ground and faster mud evacuation.",
        "color_name": "Black / Phantom",
        "color_hex": "#1e272e",
        "images": [
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 26
    {
        "name": "Nike SB Dunk Low Pro 'Chlorophyll'",
        "brand": "Nike",
        "category": "Skateboarding",
        "gender": "men",
        "base_price": Decimal("125.00"),
        "is_featured": False,
        "short_description": "Air Trainer 1 tribute rendered on the premier skateboarding chassis with Zoom Air.",
        "description": "The Nike SB Dunk Low Pro delivers iconic Dunk style in a low-cut silhouette. A Zoom Air unit in the heel and a padded tongue provide the ultimate comfort built for heavy skate sessions.",
        "color_name": "Medium Grey / Chlorophyll / White",
        "color_hex": "#2ed573",
        "images": [
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 27
    {
        "name": "Nike Air Max Plus OG 'Sunset'",
        "brand": "Nike",
        "category": "Lifestyle & Classics",
        "gender": "men",
        "base_price": Decimal("185.00"),
        "is_featured": False,
        "short_description": "Tuned Air technology with palm tree-inspired TPU ribs and vibrant fiery sunset gradient.",
        "description": "Give your attitude an edge in the Nike Air Max Plus. Featuring prominent arch support inspired by a whale's tail and iconic plastic cage ribs nodding to tropical palm trees swaying in the wind.",
        "color_name": "Black / Pimento / Bright Ceramic",
        "color_hex": "#ff4757",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 28
    {
        "name": "Adidas Originals Stan Smith 'Fairway Green'",
        "brand": "Adidas",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("100.00"),
        "is_featured": False,
        "short_description": "Minimalist tennis royalty defined by perforated 3-Stripes and green heel tab.",
        "description": "Clean, crisp, and effortlessly versatile. Named after the two-time Grand Slam champion, the Stan Smith has graced courts and sidewalks for over 50 years with understated poise.",
        "color_name": "Cloud White / Fairway Green",
        "color_hex": "#27ae60",
        "images": [
            "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 29
    {
        "name": "New Balance 574 Core 'Heritage Navy'",
        "brand": "New Balance",
        "category": "Lifestyle & Classics",
        "gender": "unisex",
        "base_price": Decimal("90.00"),
        "is_featured": False,
        "short_description": "The unpretentious, versatile icon that became a worldwide staple.",
        "description": "Created in 1988 by combining two different NB models, the 574 was designed as an all-terrain hybrid before becoming the definitive ambassador of classic Boston footwear craft.",
        "color_name": "Navy / Castlerock / White",
        "color_hex": "#1b2a4a",
        "images": [
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=900&auto=format&fit=crop&q=80",
        ],
    },
    # 30
    {
        "name": "Nike SB Dunk Low Pro 'Wheat Mocha'",
        "brand": "Nike",
        "category": "Skateboarding",
        "gender": "unisex",
        "base_price": Decimal("125.00"),
        "is_featured": False,
        "short_description": "Buttery wheat suede uppers paired with a dark chocolate espresso midsole.",
        "description": "Channeling traditional workboot aesthetics into an elite skateboard build. Rich flaxen suede upper accented with mocha sidewalls and a gum traction cupsole.",
        "color_name": "Wheat / Dark Mocha",
        "color_hex": "#b77b47",
        "images": [
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80",
        ],
    },
]

STANDARD_SIZES = ["US 7.5", "US 8", "US 8.5", "US 9", "US 9.5", "US 10", "US 10.5", "US 11", "US 12"]


async def seed_database():
    print("Beginning database seed...")
    async with AsyncSessionLocal() as db:
        # 1. Initialize Roles & Superuser
        print("-> Seeding default roles & superuser...")
        await AuthService.init_default_roles_and_admin(db)

        # 2. Seed Brands
        print("-> Seeding brands...")
        brand_map = {}
        for b_data in SAMPLE_BRANDS:
            slug = b_data.get("slug") or b_data["name"].lower().replace(" ", "-")
            existing = await CatalogRepository.get_brand_by_slug(db, slug)
            if not existing:
                brand = await CatalogRepository.create_brand(db, BrandCreate(**b_data))
                brand_map[brand.name] = brand
            else:
                brand_map[existing.name] = existing

        # 3. Seed Categories
        print("-> Seeding categories...")
        cat_map = {}
        for c_data in SAMPLE_CATEGORIES:
            slug = c_data["name"].lower().replace(" & ", "-").replace(" ", "-")
            existing = await CatalogRepository.get_category_by_slug(db, slug)
            if not existing:
                cat = await CatalogRepository.create_category(db, CategoryCreate(**c_data))
                cat_map[cat.name] = cat
            else:
                cat_map[existing.name] = existing

        # 4. Seed Coupons
        print("-> Seeding promotional coupons...")
        for cp in SAMPLE_COUPONS:
            existing = await CatalogRepository.get_coupon_by_code(db, cp["code"])
            if not existing:
                await CatalogRepository.create_coupon(db, CouponCreate(**cp))

        # 5. Seed 30 Sample Shoes
        print("-> Seeding 30 sample shoe models...")
        for idx, shoe in enumerate(SAMPLE_SHOES, start=1):
            brand = brand_map.get(shoe["brand"])
            category = cat_map.get(shoe["category"])
            if not brand or not category:
                continue

            slug = shoe["name"].lower()
            slug = "".join(c if c.isalnum() or c in " -" else "" for c in slug).replace(" ", "-")

            existing = await CatalogRepository.get_product_by_slug(db, slug)
            if existing:
                continue

            # Generate variants for standard shoe sizes
            variants = []
            for s_idx, size in enumerate(STANDARD_SIZES):
                sku_code = f"{brand.name[:3].upper()}-{idx:03d}-{size.replace('US ', '').replace('.', '')}"
                # Realistic stock variation
                stock = 8 + ((idx + s_idx) * 3) % 25
                variants.append(
                    ProductVariantCreate(
                        sku=sku_code,
                        size=size,
                        color_name=shoe["color_name"],
                        color_hex=shoe["color_hex"],
                        price_override=None,
                        stock_quantity=stock,
                        is_active=True,
                    )
                )

            # Generate images
            images = [
                ProductImageCreate(
                    image_url=url,
                    alt_text=f"{shoe['name']} - view {i+1}",
                    is_primary=(i == 0),
                    display_order=i,
                )
                for i, url in enumerate(shoe["images"])
            ]

            product_in = ProductCreate(
                name=shoe["name"],
                slug=slug,
                brand_id=brand.id,
                category_id=category.id,
                description=shoe["description"],
                short_description=shoe["short_description"],
                gender=shoe["gender"],
                base_price=shoe["base_price"],
                is_featured=shoe["is_featured"],
                is_active=True,
                variants=variants,
                images=images,
            )

            await CatalogRepository.create_product(db, product_in)
            print(f"   [{idx}/30] Seeded: {shoe['name']}")

    print("Database seeding completed successfully! ~30 realistic sneakers and coupons ready.")


if __name__ == "__main__":
    asyncio.run(seed_database())
