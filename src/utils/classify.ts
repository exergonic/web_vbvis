import type { Molecule } from '../mol-parser';
import { assignHybridization, assignBySteric } from '../hybridization';
import { VALENCE } from '../data/valence';
import { computePiDirection } from './pi';

export interface AtomClassification {
  element: string;
  hybridization: string;
  lonePairs: number;
  hasPi: boolean;
  piDirection: [number, number, number] | null;
}

export function classifyMolecule(molecule: Molecule): AtomClassification[] {
  const n = molecule.atoms.length;

  const adj: number[][] = Array.from({ length: n }, () => []);
  const piCount: number[] = new Array(n).fill(0);
  for (const bond of molecule.bonds) {
    adj[bond.atom1Index].push(bond.atom2Index);
    adj[bond.atom2Index].push(bond.atom1Index);
    piCount[bond.atom1Index] += Math.max(0, bond.order - 1);
    piCount[bond.atom2Index] += Math.max(0, bond.order - 1);
  }

  const result: AtomClassification[] = [];

  for (let i = 0; i < n; i++) {
    const atom = molecule.atoms[i];
    const neighbors = adj[i];
    const neighborVectors: [number, number, number][] = neighbors.map((ni) => {
      const n = molecule.atoms[ni];
      return [n.x - atom.x, n.y - atom.y, n.z - atom.z];
    });

    const hyb = neighborVectors.length >= 2
      ? assignHybridization(atom.element, neighborVectors, piCount[i])
      : assignBySteric(Math.min(4, Math.max(2, neighbors.length + Math.round(Math.max(0, (VALENCE[atom.element] || 4) - neighbors.length - piCount[i]) / 2))));

    const stericNumber = hyb.hybridization === 'sp' ? 2
      : hyb.hybridization === 'sp2' ? 3 : 4;
    const sigmaBonds = neighbors.length;
    let lonePairs = Math.max(0, stericNumber - sigmaBonds);

    const PI_CONJ_SOURCES = new Set(['C', 'N', 'O', 'S']);
    const piNeighborCount = neighbors.filter((ni) => {
      if (!PI_CONJ_SOURCES.has(molecule.atoms[ni].element)) return false;
      const sharedPi = molecule.bonds
        .filter((b) => (b.atom1Index === i && b.atom2Index === ni) || (b.atom1Index === ni && b.atom2Index === i))
        .reduce((s, b) => s + Math.max(0, b.order - 1), 0);
      return (piCount[ni] - sharedPi) > 0;
    }).length;

    const conjugated = lonePairs > 0 && piNeighborCount > 0 && piCount[i] === 0;
    if (conjugated && hyb.hybridization === 'sp3') lonePairs -= 1;

    const hasPi = piCount[i] > 0 || conjugated || (hyb.hybridization === 'sp2' && piCount[i] === 0)
      || (hyb.hybridization === 'sp' && neighborVectors.length >= 1);

    const atomPos: [number, number, number] = [atom.x, atom.y, atom.z];
    const piDirection = computePiDirection(i, molecule, adj, piCount, atomPos, neighborVectors, hyb, conjugated);

    const hybLabel = hyb.hybridization === 'sp2' ? 'sp²' : hyb.hybridization === 'sp3' ? 'sp³' : hyb.hybridization;
    const effectiveHyb = conjugated && hyb.hybridization === 'sp3' ? 'sp²' : hybLabel;

    result.push({ element: atom.element, hybridization: effectiveHyb, lonePairs, hasPi, piDirection });
  }

  return result;
}
