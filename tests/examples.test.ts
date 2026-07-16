import { describe, it, expect } from 'vitest';
import { assignHybridization } from '../src/hybridization';
import { parseMolBlock } from '../src/mol-parser';
import { EXAMPLES } from '../src/data/examples';

interface AtomExpectation {
  element: string;
  hybridization: string;
  /** Expected sigma lone pairs after all adjustments (ohOverride, conjugation) */
  lonePairs: number;
  /** Whether a π orbital should be rendered */
  hasPi: boolean;
}

interface ExampleExpectations {
  name: string;
  atoms: AtomExpectation[];
}

// For each example molecule, define the expected per-atom orbital classification.
// These reflect what our pipeline should produce from the stored 3D coordinates.
const EXPECTATIONS: ExampleExpectations[] = [
  {
    name: 'Methane (CH₄)',
    atoms: [
      { element: 'C', hybridization: 'sp³', lonePairs: 0, hasPi: false },
    ],
  },
  {
    name: 'Ethene (C₂H₄)',
    atoms: [
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Ethyne (C₂H₂)',
    atoms: [
      { element: 'C', hybridization: 'sp', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Benzene (C₆H₆)',
    atoms: [
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Pyridine (C₅H₅N)',
    atoms: [
      { element: 'N', hybridization: 'sp²', lonePairs: 1, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Pyrrole (C₄H₅N)',
    atoms: [
      { element: 'N', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Imidazole (C₃H₄N₂)',
    atoms: [
      { element: 'N', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'N', hybridization: 'sp²', lonePairs: 1, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
  {
    name: 'Nitrogen (N₂)',
    atoms: [
      { element: 'N', hybridization: 'sp', lonePairs: 1, hasPi: true },
      { element: 'N', hybridization: 'sp', lonePairs: 1, hasPi: true },
    ],
  },
  {
    name: 'Oxygen (O₂)',
    atoms: [
      { element: 'O', hybridization: 'sp²', lonePairs: 2, hasPi: true },
      { element: 'O', hybridization: 'sp²', lonePairs: 2, hasPi: true },
    ],
  },
  {
    name: 'Water (H₂O)',
    atoms: [
      { element: 'O', hybridization: 'sp³', lonePairs: 2, hasPi: false },
    ],
  },
  {
    name: 'Phenol (C₆H₅OH)',
    atoms: [
      { element: 'O', hybridization: 'sp²', lonePairs: 1, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
      { element: 'C', hybridization: 'sp²', lonePairs: 0, hasPi: true },
    ],
  },
];

const VALENCE: Record<string, number> = {
  H: 1, He: 0, Li: 1, Be: 2, B: 3,
  C: 4, N: 5, O: 6, F: 7,
  Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7,
  K: 1, Ca: 2, Ga: 3, Ge: 4, As: 5, Se: 6, Br: 7,
  Rb: 1, Sr: 2, In: 3, Sn: 4, Sb: 5, Te: 6, I: 7,
};

function vecAngle(a: [number, number, number], b: [number, number, number]): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const la = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2);
  const lb = Math.sqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2);
  if (la < 1e-8 || lb < 1e-8) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / (la * lb))));
}

/** Compute per-atom orbital info matching the pipeline logic in renderOrbitals */
function classifyAtoms(mol: string): Array<{ element: string; hybridization: string; lonePairs: number; hasPi: boolean }> {
  const molecule = parseMolBlock(mol);
  const n = molecule.atoms.length;

  // Build adjacency and piCount
  const adj: number[][] = Array.from({ length: n }, () => []);
  const piCount: number[] = new Array(n).fill(0);
  for (const bond of molecule.bonds) {
    adj[bond.atom1Index].push(bond.atom2Index);
    adj[bond.atom2Index].push(bond.atom1Index);
    piCount[bond.atom1Index] += Math.max(0, bond.order - 1);
    piCount[bond.atom2Index] += Math.max(0, bond.order - 1);
  }

  const result: Array<{ element: string; hybridization: string; lonePairs: number; hasPi: boolean }> = [];

  for (let i = 0; i < n; i++) {
    const atom = molecule.atoms[i];
    const neighbors = adj[i];
    const neighborVectors: [number, number, number][] = neighbors.map((ni) => {
      const n = molecule.atoms[ni];
      return [n.x - atom.x, n.y - atom.y, n.z - atom.z];
    });

    // Determine hybridization
    const hyb = neighborVectors.length >= 2
      ? assignHybridization(atom.element, neighborVectors, piCount[i])
      : (() => {
        // Fallback matching assignBySteric in renderOrbitals
        const steric = Math.min(4, Math.max(2, neighbors.length + Math.round(Math.max(0, (VALENCE[atom.element] || 4) - neighbors.length - piCount[i]) / 2)));
        return { hybridization: steric === 2 ? 'sp' as const : steric === 3 ? 'sp2' as const : 'sp3' as const, geometry: 'tetrahedral' as const, bondAngles: [] as number[] };
      })();

    const stericNumber = hyb.hybridization === 'sp' ? 2
      : hyb.hybridization === 'sp2' ? 3 : 4;
    const sigmaBonds = neighbors.length;
    let lonePairs = Math.max(0, stericNumber - sigmaBonds);

    // ohOverride — same logic as renderOrbitals
    const ohOverride = hyb.hybridization === 'sp2' && sigmaBonds === 2 && piCount[i] === 0 && atom.element === 'O';
    if (ohOverride) lonePairs = 2;

    // Conjugation detection
    const PI_CONJ_SOURCES = new Set(['C', 'N', 'O']);
    const piNeighborCount = neighbors.filter((ni) => {
      if (!PI_CONJ_SOURCES.has(molecule.atoms[ni].element)) return false;
      const sharedPi = molecule.bonds
        .filter((b) => (b.atom1Index === i && b.atom2Index === ni) || (b.atom1Index === ni && b.atom2Index === i))
        .reduce((s, b) => s + Math.max(0, b.order - 1), 0);
      return (piCount[ni] - sharedPi) > 0;
    }).length;
    const conjugated = lonePairs > 0 && piNeighborCount > 0 && piCount[i] === 0;
    if (conjugated) lonePairs -= 1;

    // π orbital presence
    const hasPi = piCount[i] > 0 || conjugated || (hyb.hybridization === 'sp2' && !ohOverride && piCount[i] === 0)
      || (hyb.hybridization === 'sp' && neighborVectors.length >= 1);

    // Effective hybridization for label
    const effectiveHyb = conjugated && hyb.hybridization === 'sp3' ? 'sp²'
      : ohOverride ? 'sp³'
      : hyb.hybridization === 'sp2' ? 'sp²'
      : hyb.hybridization === 'sp3' ? 'sp³'
      : hyb.hybridization === 'sp' ? 'sp'
      : hyb.hybridization;

    result.push({ element: atom.element, hybridization: effectiveHyb, lonePairs, hasPi });
  }

  return result;
}

describe('Example orbital classifications', () => {
  for (const ex of EXPECTATIONS) {
    it(ex.name, () => {
      const example = EXAMPLES.find((e) => e.name === ex.name);
      if (!example) { expect.fail(`Example not found: ${ex.name}`); return; }

      const result = classifyAtoms(example.mol).filter((a) => a.element !== 'H');

      for (let i = 0; i < ex.atoms.length; i++) {
        const expected = ex.atoms[i];
        const actual = result[i];
        if (!actual) { expect.fail(`Atom ${i} not found in result`); return; }

        expect(actual.element).toBe(expected.element);
        expect(actual.hybridization).toBe(expected.hybridization);
        expect(actual.lonePairs).toBe(expected.lonePairs);
        expect(actual.hasPi).toBe(expected.hasPi);
      }
    });
  }
});
