export interface Example {
  name: string;
  mol: string;
  smiles: string;
}

const HEADER = 'JME 2024-04-29\n\n';

export const EXAMPLES: Example[] = [
  {
    name: 'Methane (CH₄)',
    smiles: 'C',
    mol: HEADER + `  1  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
M  END
`,
  },
  {
    name: 'Ethene (C₂H₄)',
    smiles: 'C=C',
    mol: HEADER + `  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3375    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
M  END
`,
  },
  {
    name: 'Ethyne (C₂H₂)',
    smiles: 'C#C',
    mol: HEADER + `  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2033    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  3  0  0  0  0
M  END
`,
  },
  {
    name: 'Water (H₂O)',
    smiles: 'O',
    mol: HEADER + `  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.9000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
`,
  },
];
