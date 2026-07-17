import type { Molecule } from '../mol-parser';
import { vecNormalize, vecDot, crossProduct, findPerpendicular } from './vec3';

export function getPiDirectionFromNeighbor(
  atomIdx: number,
  adj: number[][],
  molecule: Molecule,
  piCount: number[],
  atomPos: [number, number, number],
): [number, number, number] | null {
  const piNeighbor = adj[atomIdx].find((ni) => piCount[ni] > 0);
  if (piNeighbor === undefined) return null;

  const otherBonds = adj[piNeighbor].filter((ni) => ni !== atomIdx);
  if (otherBonds.length >= 2) {
    const nb = molecule.atoms[piNeighbor];
    const s1 = molecule.atoms[otherBonds[0]];
    const s2 = molecule.atoms[otherBonds[1]];
    const v1: [number, number, number] = [s1.x - nb.x, s1.y - nb.y, s1.z - nb.z];
    const v2: [number, number, number] = [s2.x - nb.x, s2.y - nb.y, s2.z - nb.z];
    return vecNormalize(crossProduct(v1, v2));
  }

  if (otherBonds.length === 1) {
    const nb = molecule.atoms[piNeighbor];
    const s1 = molecule.atoms[otherBonds[0]];
    const v1: [number, number, number] = [s1.x - nb.x, s1.y - nb.y, s1.z - nb.z];
    const bd: [number, number, number] = [nb.x - atomPos[0], nb.y - atomPos[1], nb.z - atomPos[2]];
    return vecNormalize(crossProduct(v1, bd));
  }

  const nb = molecule.atoms[piNeighbor];
  const bd: [number, number, number] = [nb.x - atomPos[0], nb.y - atomPos[1], nb.z - atomPos[2]];
  return vecNormalize(findPerpendicular(bd));
}

export function computePiDirection(
  atomIdx: number,
  molecule: Molecule,
  adj: number[][],
  piCount: number[],
  atomPos: [number, number, number],
  neighborVectors: [number, number, number][],
  hyb: { hybridization: string },
  conjugated: boolean,
): [number, number, number] | null {
  let piDirection: [number, number, number] | null = null;

  if (conjugated) {
    piDirection = getPiDirectionFromNeighbor(atomIdx, adj, molecule, piCount, atomPos);
  }

  if (!piDirection && hyb.hybridization === 'sp2' && neighborVectors.length === 1 && piCount[atomIdx] > 0) {
    piDirection = getPiDirectionFromNeighbor(atomIdx, adj, molecule, piCount, atomPos);
  }

  if (!piDirection && hyb.hybridization === 'sp2' && neighborVectors.length >= 2) {
    const nrm = vecNormalize(crossProduct(neighborVectors[0], neighborVectors[1]));
    if (nrm[0] !== 0 || nrm[1] !== 0 || nrm[2] !== 0) piDirection = nrm;
  }

  if (piDirection && neighborVectors.length > 0) {
    const ref = vecNormalize(neighborVectors[0]);
    const dot = vecDot(ref, piDirection);
    piDirection = vecNormalize([
      piDirection[0] - dot * ref[0],
      piDirection[1] - dot * ref[1],
      piDirection[2] - dot * ref[2],
    ]);
  }

  if (!piDirection && hyb.hybridization === 'sp' && neighborVectors.length >= 1) {
    piDirection = vecNormalize(findPerpendicular(neighborVectors[0]));
  }

  return piDirection;
}
