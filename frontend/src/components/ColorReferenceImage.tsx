import { ExternalLink } from 'lucide-react';

type Props = {
  targetName: string | null;
  show: boolean;
};

const NASA_ORION_IMAGE = 'https://science.nasa.gov/asset/hubble/hubbles-sharpest-view-of-the-orion-nebula/';

export default function ColorReferenceImage({ targetName, show }: Props) {
  if (!show || !targetName || !/orion|m42/i.test(targetName)) return null;

  return (
    <article className="color-reference-card" aria-label="Hubble visible-light color reference for Orion">
      <a href={NASA_ORION_IMAGE} target="_blank" rel="noreferrer" className="color-reference-image-link" aria-label="Open NASA's Hubble Orion image">
        <img
          src="/images/orion-hubble-visible.jpg"
          alt="Hubble color composite of the Orion Nebula, showing stars and pink, blue, and dark dust structures"
          className="color-reference-image"
          loading="lazy"
        />
        <span className="color-reference-image-tag">HUBBLE · VISIBLE-LIGHT COLOR</span>
      </a>
      <div className="color-reference-copy">
        <div className="color-reference-kicker">A familiar color view</div>
        <h2>Orion Nebula in color</h2>
        <p>This NASA/ESA Hubble composite combines visible-light filters to show Orion’s stars, glowing gas, and dust. It’s a separate telescope image; the cards below are SPHEREx infrared observations.</p>
        <p className="color-reference-credit">NASA, ESA, M. Robberto (STScI/ESA), and the Hubble Orion Treasury Project Team</p>
        <a className="color-reference-source" href={NASA_ORION_IMAGE} target="_blank" rel="noreferrer">
          View image and details at NASA <ExternalLink size={15} />
        </a>
      </div>
    </article>
  );
}
