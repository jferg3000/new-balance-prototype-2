import { useEffect } from "react";
import { Link } from "react-router-dom";
import GlobalNavigation from "../components/GlobalNavigation";
import "../App.css";
import "./GlobalFootballPage.css";

/** Flattened Figma frame exports (91:3894). */
const assets = {
  hero: "/assets/football/hero.jpg",
  firmHero: "/assets/football/firm-hero.jpg",
  firmProducts: [
    "/assets/football/firm-p1.png",
    "/assets/football/firm-p2.png",
    "/assets/football/firm-p3.png",
  ] as const,
  indoorHero: "/assets/football/indoor-hero.jpg",
  indoorProducts: [
    "/assets/football/indoor-p1.png",
    "/assets/football/indoor-p2.png",
  ] as const,
  turfHero: "/assets/football/turf-hero.jpg",
  turfProduct: "/assets/football/turf-p1.png",
  siHero: "/assets/football/si-hero.jpg",
  siLayerBg: "/assets/football/si-layer-bg.jpg",
  siLayerProduct: "/assets/football/si-layer-product.jpg",
  intlHero: "/assets/football/intl-hero.jpg",
  apparelStrip: "/assets/football/apparel-strip.jpg",
  athlete: [
    "/assets/football/athlete-1.jpg",
    "/assets/football/athlete-2.jpg",
  ] as const,
  team: [
    "/assets/football/team-1.jpg",
    "/assets/football/team-2.jpg",
    "/assets/football/team-3.jpg",
    "/assets/football/team-4.jpg",
  ] as const,
};

type ProductCard = {
  name: string;
  desc: string;
  price: string;
  image: string;
};

function CardPlus() {
  return (
    <button type="button" className="gf-card__plus" aria-label="Quick add">
      <span className="gf-card__plus-mark" aria-hidden="true" />
    </button>
  );
}

function LayerPlus() {
  return (
    <span className="gf-layer__plus" aria-hidden="true">
      <span className="gf-layer__plus-mark" />
    </span>
  );
}

function ProductCardView({ product }: { product: ProductCard }) {
  return (
    <article className="gf-card">
      {/* Card = flattened product image + clickable + + HTML meta */}
      <div className="gf-card__tile">
        <img className="gf-card__img" src={product.image} alt="" />
        <CardPlus />
      </div>
      <div className="gf-card__meta">
        <p className="gf-card__name">{product.name}</p>
        <p className="gf-card__desc">{product.desc}</p>
        <p className="gf-card__price">{product.price}</p>
      </div>
    </article>
  );
}

const FIRM_PRODUCTS: ProductCard[] = [
  {
    name: "Tekela V5",
    desc: "Best for control and precision",
    price: "$94.99 - 224.99",
    image: assets.firmProducts[0],
  },
  {
    name: "442 V3",
    desc: "Best for heritage comfort",
    price: "$94.99 - 224.99",
    image: assets.firmProducts[1],
  },
  {
    name: "Furon V8",
    desc: "Best for explosive speed",
    price: "$94.99 - 224.99",
    image: assets.firmProducts[2],
  },
];

const INDOOR_PRODUCTS: ProductCard[] = [
  {
    name: "442 Pro IN V3",
    desc: "Best for modern performance",
    price: "$99.99",
    image: assets.indoorProducts[0],
  },
  {
    name: "442 Elite IN V3 First Edition",
    desc: "Best for classic indoor touch",
    price: "$129.99",
    image: assets.indoorProducts[1],
  },
];

const TURF_PRODUCT: ProductCard = {
  name: "442 Pro IN V3",
  desc: "Best for a reliable turf touch",
  price: "$99.99",
  image: assets.turfProduct,
};

/**
 * Global Football — static layout from Figma 91:3894.
 * Section order matches parent frame top→bottom. No interactions/motion.
 */
export default function GlobalFootballPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="gf">
      <GlobalNavigation variant="homepage" color="black" />

      <main className="gf__main">
        {/* 1 — Hero 91:3914 (h=782) */}
        <section className="gf-hero" aria-label="Global Football">
          <p className="gf-hero__label">Soccer</p>
          <div className="gf-hero__media">
            <img className="gf-hero__img" src={assets.hero} alt="" />
          </div>
          <h1 className="gf-hero__title">Play your game</h1>
        </section>

        {/* 2 — Filter & Sort 91:4063 */}
        <div className="gf-toolbar" aria-label="Filter and sort">
          <span className="gf-toolbar__label">Filter &amp; Sort</span>
          <div className="gf-toolbar__views" aria-hidden="true">
            <span className="gf-view gf-view--2" data-active="true" />
            <span className="gf-view gf-view--3" />
          </div>
        </div>

        {/* 3 — Firm ground cleats 91:3918 (h=1208) */}
        <section className="gf-cleats gf-cleats--firm" aria-label="Firm ground cleats">
          <div className="gf-cleats__rule" />
          <nav className="gf-tabs" aria-label="Cleat categories">
            <span className="gf-tabs__item gf-tabs__item--active">All</span>
            <span className="gf-tabs__item">Firm ground cleats</span>
            <span className="gf-tabs__item">Turf cleats</span>
            <span className="gf-tabs__item">Indoor cleats</span>
          </nav>
          <div className="gf-cleats__hero">
            <img className="gf-cleats__hero-img" src={assets.firmHero} alt="" />
          </div>
          <h2 className="gf-cleats__title">Firm ground cleats</h2>
          <div className="gf-cleats__grid">
            <ProductCardView product={FIRM_PRODUCTS[0]} />
            <ProductCardView product={FIRM_PRODUCTS[1]} />
            <ProductCardView product={FIRM_PRODUCTS[2]} />
          </div>
        </section>

        {/* 4 — Indoor cleats 91:3966 (h=873) */}
        <section className="gf-cleats gf-cleats--indoor" aria-label="Indoor cleats">
          <div className="gf-cleats__hero">
            <img className="gf-cleats__hero-img" src={assets.indoorHero} alt="" />
          </div>
          <h2 className="gf-cleats__title">Indoor cleats</h2>
          <div className="gf-cleats__grid gf-cleats__grid--two">
            {INDOOR_PRODUCTS.map((product) => (
              <ProductCardView key={product.name} product={product} />
            ))}
          </div>
        </section>

        {/* 5 — Turf cleats 91:3989 (h=873) */}
        <section className="gf-cleats gf-cleats--turf" aria-label="Turf cleats">
          <div className="gf-cleats__hero">
            <img className="gf-cleats__hero-img" src={assets.turfHero} alt="" />
          </div>
          <h2 className="gf-cleats__title">Turf cleats</h2>
          <div className="gf-cleats__grid gf-cleats__grid--one">
            <ProductCardView product={TURF_PRODUCT} />
          </div>
        </section>

        {/* 6 — SI Collection 91:4004 (h=1533) */}
        <section className="gf-si" aria-label="Stone Island x New Balance">
          <div className="gf-si__intro">
            <div className="gf-si__media">
              <img className="gf-si__img" src={assets.siHero} alt="" />
            </div>
            <h2 className="gf-si__title">Stone Island x New Balance</h2>
            <p className="gf-si__body">
              A modern take on football culture
              <br />
              through performance and innovation.
            </p>
            <Link className="gf-si__cta" to="/stone-island">
              Shop now
            </Link>
          </div>
          <div className="gf-layer" aria-label="Light and Fast">
            <img className="gf-layer__bg" src={assets.siLayerBg} alt="" />
            <p className="gf-layer__vert">Stone Island x New Balance</p>
            <div className="gf-layer__product">
              <img
                className="gf-layer__product-img"
                src={assets.siLayerProduct}
                alt=""
              />
              <LayerPlus />
            </div>
          </div>
        </section>

        {/* 7 — International Football Collection 91:4018 (h=1082) */}
        <section className="gf-intl" aria-label="The International Football Collection">
          <div className="gf-intl__intro">
            <div className="gf-intl__media">
              <img className="gf-intl__img" src={assets.intlHero} alt="" />
            </div>
            <h2 className="gf-intl__title">The International Football Collection</h2>
            <p className="gf-intl__body">
              Inspired by the global game, the International Football Collection
              celebrates football beyond matchday.
            </p>
            <span className="gf-intl__cta">Shop now</span>
          </div>
          <div className="gf-apparel">
            <div className="gf-apparel__frame">
              <img
                className="gf-apparel__img"
                src={assets.apparelStrip}
                alt=""
              />
            </div>
            <div className="gf-apparel__indicator" aria-hidden="true">
              <span className="gf-apparel__track" />
              <span className="gf-apparel__thumb" />
            </div>
          </div>
        </section>

        {/* 8 — Featured Athletes 91:4035 (h=810) */}
        <section className="gf-athletes" aria-label="Featured athletes">
          <h2 className="gf-athletes__title">Featured athletes</h2>
          <div className="gf-athletes__track">
            <article className="gf-athletes__card">
              <div className="gf-athletes__media">
                <img className="gf-athletes__img" src={assets.athlete[0]} alt="" />
              </div>
              <div className="gf-athletes__meta">
                <p className="gf-athletes__name">Tim Weah</p>
                <div className="gf-athletes__progress" aria-hidden="true">
                  <span className="gf-athletes__bar gf-athletes__bar--active" />
                  <span className="gf-athletes__bar" />
                </div>
              </div>
            </article>
            <article className="gf-athletes__card gf-athletes__card--peek" aria-hidden="true">
              <div className="gf-athletes__media">
                <img className="gf-athletes__img" src={assets.athlete[1]} alt="" />
              </div>
            </article>
          </div>
        </section>

        {/* 9 — Team 91:4056 (h=514) */}
        <section className="gf-team" aria-label="Teams">
          <div className="gf-team__grid">
            {assets.team.map((src) => (
              <div key={src} className="gf-team__cell">
                <img className="gf-team__img" src={src} alt="" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
