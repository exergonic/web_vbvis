let RDKit: any = null;
let loading: Promise<void> | null = null;

async function loadRDKit(): Promise<void> {
  if (RDKit) return;
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/rdkit/RDKit_minimal.js';
    script.async = true;
    script.onload = () => {
      (window as any).initRDKitModule({ locateFile: () => '/rdkit/RDKit_minimal.wasm' })
        .then((mod: any) => {
          RDKit = mod;
          resolve();
        })
        .catch(reject);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return loading;
}

export async function generate3DFromSMILES(smiles: string): Promise<string | null> {
  try {
    await loadRDKit();

    // Step 1: create molecule from SMILES, add hydrogens
    const mol = RDKit.get_mol(smiles);
    if (!mol) return null;
    const molWithHsBlock: string = mol.add_hs();
    mol.delete();

    // Step 2: create molecule from the H-added Mol block
    const molWithHs = RDKit.get_mol(molWithHsBlock);
    if (!molWithHs) return null;

    try {
      // Step 3: generate 3D conformers via ETKDG
      molWithHs.generate_conformers();

      // Step 4: get SDF with 3D coordinates
      const sdf: string = molWithHs.get_sdf();
      if (sdf && (sdf.includes('V2000') || sdf.includes('V3000'))) {
        return sdf;
      }
      return null;
    } finally {
      molWithHs.delete();
    }
  } catch {
    return null;
  }
}
